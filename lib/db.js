import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { atlasEnabled, queueAtlas } from './atlas.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const DATA_FILE = path.join(__dirname, '..', 'data', 'db.json');
export const DATA_DIR = path.dirname(DATA_FILE);

export function hasDataMount(mountInfo, dir = DATA_DIR) {
  return mountInfo.split('\n').some((line) => line.split(' - ')[0].split(' ')[4] === dir);
}

export function assertPersistentStorage() {
  if (atlasEnabled) return;
  if (process.env.RENDER !== 'true' || process.env.NODE_ENV !== 'production') return;
  const mounts = fs.readFileSync('/proc/self/mountinfo', 'utf8');
  if (!hasDataMount(mounts)) {
    throw new Error(`Persistent storage is not configured. Set MONGODB_URI in Render Environment, or mount a persistent disk at ${DATA_DIR}. Refusing to write customer data to Render's temporary filesystem.`);
  }
}

export function blankDb() {
  return {
    users: [],
    orders: [],
    wallets: [],
    walletTx: [],
    addresses: [],
    printers: [],
    coupons: [],
    notifications: [],
    sessions: [],
    drafts: [],
    packSubs: [],
    referrals: [],
    cashWallets: [],
    cashTx: [],
    payouts: [],
    collectTokens: [],
    referralConfig: null,
    riderTx: [],
    locations: {},
    shareTokens: [],
    otps: [],
    pricing: {
      bw: 2,
      color: 5,
      studentBw: 2,
      studentColor: 4,
      delivery: { sarigam: 15, vapi: 15, bhilad: 30, daman: 20, pickup: 0 },
      surcharges: {
        lateNight: { start: '22:00', end: '06:00', fee: 0 },
        surge: { activeJobs: 0, fee: 0 }
      },
      topupBonus: [
        { min: 500, pct: 15 },
        { min: 250, pct: 10 },
        { min: 100, pct: 5 }
      ]
    },
    settings: {
      business: {
        name: 'Printkarr',
        phone: '+91 9016703180',
        email: 'hello@printkarr.in',
        address: 'Chala, Vapi, Gujarat 396191'
      },
      zones: ['Vapi', 'Sarigam', 'Bhilad', 'Daman', 'Kiosk pickup'],
      hours: 'Mon–Fri, 24 hours',
      order: { minTotal: 0, maxFileMb: 20, maxPages: 1000, radiusKm: 20 },
      kiosk: { live: false }
    }
  };
}

export function loadDb(file = DATA_FILE) {
  if (!fs.existsSync(file)) {
    if (process.env.NODE_ENV === 'production') throw new Error(`Database missing at ${file}; refusing to start empty.`);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const fresh = blankDb();
    saveDb(fresh, file);
    return fresh;
  }
  const db = JSON.parse(fs.readFileSync(file, 'utf8'));
  const fresh = blankDb();
  for (const k of Object.keys(fresh)) db[k] ??= fresh[k];
  // Keep newer pricing defaults while preserving rates saved in older databases.
  db.pricing = { ...fresh.pricing, ...(db.pricing || {}) };
  db.pricing.delivery = { ...fresh.pricing.delivery, ...((db.pricing || {}).delivery || {}) };
  db.pricing.surcharges = { ...fresh.pricing.surcharges, ...((db.pricing || {}).surcharges || {}) };
  for (const key of ['lateNight', 'surge']) db.pricing.surcharges[key] = { ...fresh.pricing.surcharges[key], ...((db.pricing.surcharges || {})[key] || {}) };
  if (!Array.isArray(db.pricing.topupBonus)) db.pricing.topupBonus = fresh.pricing.topupBonus;
  db.settings ||= fresh.settings;
  db.settings.kiosk = { live: false, ...((db.settings || {}).kiosk || {}) };
  return db;
}

export function saveDb(db, file = DATA_FILE) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temp = `${file}.${process.pid}.tmp`;
  try {
    fs.writeFileSync(temp, JSON.stringify(db, null, 2));
    fs.renameSync(temp, file);
    if (file === DATA_FILE) queueAtlas(db);
  } catch (error) {
    try { fs.unlinkSync(temp); } catch {}
    throw error;
  }
}
