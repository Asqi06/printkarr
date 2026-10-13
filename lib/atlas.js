import fs from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { GridFSBucket, MongoClient } from 'mongodb';
import { orderFile } from './files.js';

export const atlasEnabled = !!process.env.MONGODB_URI;
let client;
let states;
let files;
let bucket;
let version = 0;
let queued = [];
let flushing;
let refreshing;
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
  await closeAtlas();
  queued = []; failed = null; remoteFiles = new Map();
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
  const snapshot = JSON.parse(json);
  // Keep the latest unsent snapshot, preserving a write that is already in flight.
  if (queued.length > (flushing ? 1 : 0)) queued[queued.length - 1] = snapshot;
  else queued.push(snapshot);
}

async function syncFiles(cleanup = true, protectedFiles = new Set()) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  const local = new Map();
  for (const name of fs.readdirSync(uploadsDir)) {
    if (name.startsWith('.') || name.endsWith('.tmp')) continue;
    // Multer's unfinished uploads have bare random names; keep only legacy names already referenced by records.
    if (/^[a-f0-9]{32}$/.test(name) && !fs.readFileSync(dataFile,'utf8').includes(name)) continue;
    const full = path.join(uploadsDir, name);
    let stat;
    try { stat = fs.statSync(full); } catch (error) { if (error.code === 'ENOENT') continue; throw error; }
    if (stat.isFile()) local.set(name, { full, size: stat.size, mtimeMs: Math.round(stat.mtimeMs) });
  }
  for (const [name, item] of local) {
    const old = remoteFiles.get(name);
    if (old && old.size === item.size && Math.abs(old.mtimeMs - item.mtimeMs) <= 1) continue;
    const stream = bucket.openUploadStream(name, { metadata: { mtimeMs: item.mtimeMs } });
    try { await pipeline(fs.createReadStream(item.full), stream); }
    catch (error) { await stream.abort().catch(()=>{}); if (error.code === 'ENOENT') continue; throw error; }
    remoteFiles.set(name, { id: stream.id, size: item.size, mtimeMs: item.mtimeMs });
  }
  if (!cleanup) return;
  // Only clean known files and older revisions; another instance may have just uploaded a new file.
  for (const old of await files.find({}, { projection: { _id: 1, filename: 1 } }).toArray()) {
    const current = remoteFiles.get(old.filename);
    if (!current || protectedFiles.has(old.filename) && !local.has(old.filename) || String(old._id) > String(current.id) || (local.has(old.filename) && String(old._id) === String(current.id))) continue;
    await bucket.delete(old._id);
  }
  for (const name of remoteFiles.keys()) if (!local.has(name) && !protectedFiles.has(name)) remoteFiles.delete(name);
}

export async function flushAtlas(filesChanged = false) {
  if (!atlasEnabled) return;
  if (failed) throw failed;
  if (flushing) {
    await flushing;
    if (queued.length || filesChanged) return flushAtlas(filesChanged);
    return;
  }
  if (!queued.length && !filesChanged) return;
  flushing = (async () => {
    const saved = await states.findOne({ _id: 'main' });
    if (saved?.version !== version) {
      if (!queued.length) return; // A read-only stale instance has nothing to publish.
      throw Object.assign(new Error('Atlas version conflict; refusing to overwrite newer customer data.'), { code: 'ATLAS_VERSION_CONFLICT' });
    }
    let committed = saved.data;
    while (queued.length) {
      const data = queued[0];
      await syncFiles(false);
      // A stale Render instance must fail instead of replacing newer orders or prices.
      const result = await states.updateOne({ _id: 'main', version }, { $set: { data }, $inc: { version: 1 } });
      if (result.matchedCount !== 1) throw Object.assign(new Error('Atlas version conflict; refusing to overwrite newer customer data.'), { code: 'ATLAS_VERSION_CONFLICT' });
      version++;
      queued.shift();
      committed = data;
    }
    // Upload before publishing records; remove superseded bytes only after the corresponding state is durable.
    await syncFiles(true, activeFiles(committed));
  })();
  try { await flushing; }
  catch (error) { failed = error; throw error; }
  finally { flushing = null; }
}

function activeFiles(data = {}) {
  return new Set([
    ...(data.drafts || []).map(d=>d.stored).filter(Boolean),
    ...(data.orders || []).filter(o=>o.id && !['DELIVERED','REFUNDED','CANCELLED'].includes(o.status)).map(o=>orderFile(o.id,o.fileExt)),
    ...(data.products || []).filter(p=>p.image?.startsWith('/product-images/')).map(p=>path.basename(p.image))
  ]);
}

export async function refreshAtlas() {
  if (!atlasEnabled) return;
  if (refreshing) return refreshing;
  refreshing = refreshRemote();
  try { await refreshing; } finally { refreshing = null; }
}

async function refreshRemote() {
  if (queued.length || flushing) await flushAtlas();
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
