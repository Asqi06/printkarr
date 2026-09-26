// File janitor (V0 §16): delete print files of terminal orders older than
// FILE_RETENTION_MINUTES (default 15). Pure module — unit-testable.
import fs from 'node:fs';
import path from 'node:path';
import { loadDb } from './db.js';
import { orderFile } from './files.js';

const TERMINAL_FILE_STATES = ['DELIVERED', 'REFUNDED', 'CANCELLED'];

export function janitor(rootDir, minutes) {
  const m = Math.max(
    1,
    Number(minutes ?? process.env.FILE_RETENTION_MINUTES) ||
      Number(process.env.FILE_RETENTION_HOURS) * 60 ||
      15
  );
  const cutoff = Date.now() - m * 60e3;
  const db = loadDb();
  let swept = 0;
  for (const o of db.orders) {
    if (!TERMINAL_FILE_STATES.includes(o.status)) continue;
    if (Date.parse(o.updatedAt) > cutoff) continue;
    const p = path.join(rootDir, 'data', 'uploads', orderFile(o.id, o.fileExt));
    if (fs.existsSync(p)) {
      try { fs.unlinkSync(p); swept++; } catch {}
    }
  }
  return swept;
}
