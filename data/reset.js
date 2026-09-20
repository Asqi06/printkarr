// Clean-production reset. Wipes users, orders, wallets, uploads index —
// keeps NOTHING. Refuses to run without CONFIRM=RESET, and never runs
// against a database that already took real orders... actually it does
// exactly that, which is why the confirmation exists. Back up first.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { blankDb, saveDb, DATA_FILE } from '../lib/db.js';

if (process.env.CONFIRM !== 'RESET') {
  console.error('Refusing. Back up data/db.json, then re-run with CONFIRM=RESET.');
  process.exit(1);
}
saveDb(blankDb());
const up = path.join(path.dirname(DATA_FILE), 'uploads');
try {
  for (const f of fs.readdirSync(up)) {
    if (!f.startsWith('.')) fs.unlinkSync(path.join(up, f));
  }
} catch {}
console.log('Database is blank. Restart the server with ADMIN_EMAIL + ADMIN_PASSWORD set.');
