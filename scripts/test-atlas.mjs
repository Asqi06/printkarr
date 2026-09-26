import 'dotenv/config';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { MongoClient } from 'mongodb';
import { blankDb } from '../lib/db.js';

if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is missing.');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = fs.mkdtempSync(path.join(root, '.atlas-smoke-'));
const dbName = `printkarr_smoke_${crypto.randomBytes(4).toString('hex')}`;
const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
let child;
let connected = false;

async function port() {
  const server = net.createServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const number = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return number;
}

async function start(number) {
  let output = '';
  child = spawn(process.execPath, ['server.mjs'], {
    cwd: dir,
    env: {
      ...process.env, NODE_ENV: 'production', MONGODB_DB: dbName,
      PORT: String(number), ADMIN_EMAIL: 'smoke@example.test',
      ADMIN_PASSWORD: 'smoke-password-123', DEMO_LOGIN: 'off',
      GOOGLE_CLIENT_ID: '', GOOGLE_CLIENT_SECRET: ''
    },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  child.stdout.on('data', (chunk) => { output += chunk; });
  child.stderr.on('data', (chunk) => { output += chunk; });
  const url = `http://127.0.0.1:${number}`;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (child.exitCode !== null) throw new Error(`Server exited early: ${output.slice(-1500)}`);
    try {
      const response = await fetch(`${url}/api/ready`);
      if (response.ok) return url;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Server did not become ready: ${output.slice(-1500)}`);
}

async function stop() {
  if (!child || child.exitCode !== null) return;
  const exiting = new Promise((resolve) => child.once('exit', resolve));
  child.kill();
  await exiting;
  child = null;
}

try {
  fs.cpSync(path.join(root, 'lib'), path.join(dir, 'lib'), { recursive: true });
  fs.cpSync(path.join(root, 'public'), path.join(dir, 'public'), { recursive: true });
  fs.copyFileSync(path.join(root, 'server.mjs'), path.join(dir, 'server.mjs'));
  fs.writeFileSync(path.join(dir, 'package.json'), '{"type":"module"}');
  fs.mkdirSync(path.join(dir, 'data', 'uploads'), { recursive: true });
  await client.connect();
  connected = true;
  const db = client.db(dbName);
  await db.collection('state').insertOne({ _id: 'main', version: 0, data: blankDb() });
  const number = await port();
  let url = await start(number);
  const login = await fetch(`${url}/admin/login`, {
    method: 'POST', redirect: 'manual',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ email: 'smoke@example.test', password: 'smoke-password-123' })
  });
  assert.equal(login.status, 302);
  const cookie = login.headers.get('set-cookie')?.split(';')[0];
  assert.ok(cookie);
  const price = await fetch(`${url}/admin/pricing`, {
    method: 'POST', redirect: 'manual',
    headers: { Cookie: cookie, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ bw: '7' })
  });
  assert.equal(price.status, 302);
  assert.equal((await db.collection('state').findOne({ _id: 'main' })).data.pricing.bw, 7);
  await db.collection('state').updateOne({ _id: 'main' }, { $set: { 'data.pricing.bw': 8 }, $inc: { version: 1 } });
  assert.equal((await fetch(`${url}/admin/pricing`, { headers: { Cookie: cookie } })).status, 200);
  assert.equal(JSON.parse(fs.readFileSync(path.join(dir, 'data', 'db.json'), 'utf8')).pricing.bw, 8);
  fs.writeFileSync(path.join(dir, 'data', 'uploads', 'smoke.pdf'), '%PDF-1.4\n%%EOF');
  assert.equal((await fetch(`${url}/api/ready`)).status, 200);
  assert.equal(await db.collection('uploads.files').countDocuments({ filename: 'smoke.pdf' }), 1);
  await stop();
  fs.rmSync(path.join(dir, 'data', 'db.json'));
  fs.rmSync(path.join(dir, 'data', 'uploads', 'smoke.pdf'));
  url = await start(number);
  const ready = await (await fetch(`${url}/api/ready`)).json();
  assert.equal(ready.users, 1);
  assert.equal(ready.volume.provider, 'mongodb-atlas');
  assert.equal(fs.existsSync(path.join(dir, 'data', 'uploads', 'smoke.pdf')), true);
  assert.equal((await db.collection('state').findOne({ _id: 'main' })).data.pricing.bw, 8);
  console.log('Atlas smoke test passed: admin, price and PDF survive an empty local restart.');
} finally {
  await stop();
  if (connected) await client.db(dbName).dropDatabase();
  await client.close();
  if (dir.startsWith(root + path.sep) && path.basename(dir).startsWith('.atlas-smoke-')) fs.rmSync(dir, { recursive: true, force: true });
}
