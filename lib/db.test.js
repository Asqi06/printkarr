import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { blankDb, hasDataMount, loadDb, saveDb } from './db.js';

test('production refuses missing or corrupt data instead of resetting records', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'printkarr-db-'));
  const file = path.join(dir, 'db.json');
  const previous = process.env.NODE_ENV;
  try {
    process.env.NODE_ENV = 'production';
    assert.throws(() => loadDb(file), /Database missing/);
    assert.equal(fs.existsSync(file), false);
    const db = blankDb();
    db.coupons.push({ code: 'KEEP' });
    db.pricing.bw = 7;
    saveDb(db, file);
    assert.equal(loadDb(file).coupons[0].code, 'KEEP');
    assert.equal(loadDb(file).pricing.bw, 7);
    assert.equal(fs.readdirSync(dir).length, 1);
    fs.writeFileSync(file, '{broken');
    assert.throws(() => loadDb(file), SyntaxError);
    assert.equal(fs.readFileSync(file, 'utf8'), '{broken');
  } finally {
    if (previous === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previous;
    if (fs.existsSync(file)) fs.unlinkSync(file);
    fs.rmdirSync(dir);
  }
});

test('Render data path must be a real mount', () => {
  const mounts = '1 0 0:1 / / rw - overlay overlay rw\n2 1 0:2 / /app/data rw - ext4 /dev/disk rw\n';
  assert.equal(hasDataMount(mounts, '/app/data'), true);
  assert.equal(hasDataMount(mounts, '/other/data'), false);
});
