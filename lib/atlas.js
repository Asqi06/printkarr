import fs from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { GridFSBucket, MongoClient } from 'mongodb';

export const atlasEnabled = !!process.env.MONGODB_URI;
let client;
let states;
let files;
let bucket;
let version = 0;
let queued = [];
let flushing;
let failed;
let dataFile;
let uploadsDir;
let remoteFiles = new Map();

function writeLocal(data) {
  const temp = `${dataFile}.${process.pid}.tmp`;
  fs.mkdirSync(path.dirname(dataFile), { recursive: true });
  fs.writeFileSync(temp, JSON.stringify(data, null, 2));
  fs.renameSync(temp, dataFile);
}

async function restoreFiles() {
  // ponytail: restore every upload at boot; switch to on-demand streaming before moving beyond Atlas Free's 512 MB ceiling.
  fs.mkdirSync(uploadsDir, { recursive: true });
  const found = await files.find().sort({ uploadDate: -1 }).toArray();
  const next = new Map();
  for (const item of found) {
    if (path.basename(item.filename) !== item.filename || next.has(item.filename)) continue;
    const target = path.join(uploadsDir, item.filename);
    const temp = `${target}.${process.pid}.tmp`;
    await pipeline(bucket.openDownloadStream(item._id), fs.createWriteStream(temp));
    fs.renameSync(temp, target);
    const mtime = Number(item.metadata?.mtimeMs) || Date.now();
    fs.utimesSync(target, new Date(mtime), new Date(mtime));
    next.set(item.filename, { id: item._id, size: item.length, mtimeMs: Math.round(mtime) });
  }
  remoteFiles = next;
}

export async function initAtlas(file, uploadPath) {
  if (!atlasEnabled) return;
  dataFile = file;
  uploadsDir = uploadPath;
  client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000, writeConcern: { w: 'majority' } });
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || 'printkarr');
  states = db.collection('state');
  files = db.collection('uploads.files');
  bucket = new GridFSBucket(db, { bucketName: 'uploads' });
  const saved = await states.findOne({ _id: 'main' });
  if (!saved || !saved.data || !Number.isInteger(saved.version)) {
    throw new Error('Atlas database is empty or invalid. Initialize it explicitly before starting production.');
  }
  version = saved.version;
  writeLocal(saved.data);
  await restoreFiles();
}

export function queueAtlas(data) {
  if (!atlasEnabled) return;
  if (failed) throw failed;
  if (!states) throw new Error('Atlas is not initialized.');
  const json = JSON.stringify(data);
  // ponytail: one JSON document has MongoDB's 16 MB ceiling; split records into collections before approaching it.
  if (Buffer.byteLength(json) > 12 * 1024 * 1024) throw new Error('Database exceeds the safe Atlas document size.');
  queued.push(JSON.parse(json));
}

async function syncFiles() {
  fs.mkdirSync(uploadsDir, { recursive: true });
  const local = new Map();
  for (const name of fs.readdirSync(uploadsDir)) {
    if (name.startsWith('.') || name.endsWith('.tmp')) continue;
    const full = path.join(uploadsDir, name);
    const stat = fs.statSync(full);
    if (stat.isFile()) local.set(name, { full, size: stat.size, mtimeMs: Math.round(stat.mtimeMs) });
  }
  for (const [name, item] of local) {
    const old = remoteFiles.get(name);
    if (old && old.size === item.size && Math.abs(old.mtimeMs - item.mtimeMs) <= 1) continue;
    const stream = bucket.openUploadStream(name, { metadata: { mtimeMs: item.mtimeMs } });
    await pipeline(fs.createReadStream(item.full), stream);
    remoteFiles.set(name, { id: stream.id, size: item.size, mtimeMs: item.mtimeMs });
    if (old) await bucket.delete(old.id);
  }
  for (const [name, old] of remoteFiles) {
    if (local.has(name)) continue;
    await bucket.delete(old.id);
    remoteFiles.delete(name);
  }
}

export async function flushAtlas() {
  if (!atlasEnabled) return;
  if (failed) throw failed;
  if (flushing) {
    await flushing;
    if (queued.length) return flushAtlas();
    return;
  }
  flushing = (async () => {
    await syncFiles();
    while (queued.length) {
      const data = queued[0];
      // A stale Render instance must fail instead of replacing newer orders or prices.
      const result = await states.updateOne({ _id: 'main', version }, { $set: { data }, $inc: { version: 1 } });
      if (result.matchedCount !== 1) throw new Error('Atlas version conflict; refusing to overwrite newer customer data.');
      version++;
      queued.shift();
    }
  })();
  try { await flushing; }
  catch (error) { failed = error; throw error; }
  finally { flushing = null; }
}

export async function refreshAtlas() {
  if (!atlasEnabled) return;
  await flushAtlas();
  const observedVersion = version;
  const saved = await states.findOne({ _id: 'main' });
  if (!saved) throw new Error('Atlas database disappeared.');
  if (queued.length || version !== observedVersion) return;
  if (saved.version === version) return;
  if (saved.version < version) throw new Error('Atlas database version moved backwards.');
  version = saved.version;
  writeLocal(saved.data);
  await restoreFiles();
}

export async function closeAtlas() { if (client) await client.close(); }
