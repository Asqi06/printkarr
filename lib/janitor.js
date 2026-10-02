// Completed orders: configurable grace period. Abandoned drafts/uploads: 24 hours.
import fs from 'node:fs';
import path from 'node:path';
import { loadDb, saveDb } from './db.js';
import { orderFile } from './files.js';

const TERMINAL_FILE_STATES = ['DELIVERED', 'REFUNDED', 'CANCELLED'];

export function janitor(rootDir, minutes, dbFile) {
  const m = Math.max(1, Number(minutes ?? process.env.FILE_RETENTION_MINUTES) || Number(process.env.FILE_RETENTION_HOURS) * 60 || 15);
  const cutoff = Date.now() - m * 60e3;
  const abandonedCutoff = Date.now() - 864e5;
  const uploads = path.join(rootDir, 'data', 'uploads');
  const db = loadDb(dbFile);
  let swept = 0, changed = false;
  const keep = new Set();
  function remove(name) {
    if (!name || path.basename(name) !== name) return false;
    try { fs.unlinkSync(path.join(uploads, name)); swept++; return true; }
    catch (error) {
      if (error.code === 'ENOENT') return true;
      console.error(`File cleanup failed for ${name}: ${error.code || 'unknown error'}`);
      return false;
    }
  }
  for (const o of db.orders) {
    const name = orderFile(o.id, o.fileExt);
    const expired = TERMINAL_FILE_STATES.includes(o.status) && Date.parse(o.updatedAt) <= cutoff;
    if (!expired || !remove(name)) { keep.add(name); continue; }
    if (!o.fileDeletedAt) { o.fileDeletedAt = new Date().toISOString(); changed = true; }
  }
  db.drafts = (db.drafts || []).filter(d => {
    if (Date.parse(d.createdAt) <= abandonedCutoff && remove(d.stored)) { changed = true; return false; }
    if (d.stored) keep.add(d.stored);
    return true;
  });
  // Multer uploads and abandoned reordered drafts only; unknown files stay untouched.
  if (fs.existsSync(uploads)) for (const name of fs.readdirSync(uploads)) {
    if (keep.has(name) || !/^(?:[a-f0-9]{32}|D[a-z0-9]+\.(?:pdf|png|jpg))$/.test(name)) continue;
    const stat = fs.lstatSync(path.join(uploads, name));
    if (stat.isFile() && stat.mtimeMs <= abandonedCutoff) remove(name);
  }
  if (changed) saveDb(db, dbFile);
  return swept;
}
