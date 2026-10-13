import { campaignDefaults, campaignConfig } from './campus.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { atlasEnabled, queueAtlas } from './atlas.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const DATA_FILE = path.join(process.env.PRINTKARR_DATA_DIR || path.join(__dirname, '..', 'data'), 'db.json');
export const DATA_DIR = path.dirname(DATA_FILE);
let cache;
const snapshots = new WeakMap();
const stamp = file => { const s = fs.statSync(file, { bigint: true }); return `${s.ino}:${s.size}:${s.mtimeNs}:${s.ctimeNs}`; };

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
    reviews: [],
    orders: [],
    products: [],
    carts: [],
    purchases: [],
    partners: [],
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
      color: 4,
      studentBw: 2,
      studentColor: 4,
      delivery: { sarigam: 15, vapi: 15, bhilad: 30, daman: 20, pickup: 0 },
      surcharges: {
        lateNight: { start: '22:00', end: '06:00', fee: 0 },
        surge: { activeJobs: 0, fee: 0 }
      }
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
      kiosk: { live: false },
      campaign: campaignDefaults()
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
  const revision = stamp(file);
  // ponytail: one process caches one JSON snapshot; migrate to indexed collections before 12 MB or multiple web workers.
  if (file === DATA_FILE && cache?.revision === revision) {
    const db = structuredClone(cache.data); snapshots.set(db, {file,revision}); return db;
  }
  const db = JSON.parse(fs.readFileSync(file, 'utf8'));
  const fresh = blankDb();
  for (const k of Object.keys(fresh)) db[k] ??= fresh[k];
  // Keep newer pricing defaults while preserving rates saved in older databases.
  db.pricing = { ...fresh.pricing, ...(db.pricing || {}) };
  db.pricing.delivery = { ...fresh.pricing.delivery, ...((db.pricing || {}).delivery || {}) };
  db.pricing.surcharges = { ...fresh.pricing.surcharges, ...((db.pricing || {}).surcharges || {}) };
  for (const key of ['lateNight', 'surge']) db.pricing.surcharges[key] = { ...fresh.pricing.surcharges[key], ...((db.pricing.surcharges || {})[key] || {}) };
  db.settings ||= fresh.settings;
  db.settings.order = { ...fresh.settings.order, ...db.settings.order };
  db.settings.order.maxFileMb = Math.min(20, Math.max(1, Number(db.settings.order.maxFileMb) || 20));
  db.settings.kiosk = { live: false, ...((db.settings || {}).kiosk || {}) };
  campaignConfig(db);
  if (file === DATA_FILE) cache = { revision, data: structuredClone(db), json: JSON.stringify(db) };
  snapshots.set(db, { file, revision });
  return db;
}

export function saveDb(db, file = DATA_FILE) {
  const snapshot = snapshots.get(db);
  if (snapshot?.file === file && snapshot.revision !== stamp(file)) throw Object.assign(new Error('Your order changed while this request was running. Refresh and retry. No newer records were overwritten.'), { code: 'DB_STALE_WRITE', status: 409 });
  const json = JSON.stringify(db);
  if (file === DATA_FILE && cache?.json === json && cache.revision === stamp(file)) return;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temp = `${file}.${process.pid}.tmp`;
  try {
    fs.writeFileSync(temp, json);
    fs.renameSync(temp, file);
    const revision = stamp(file);
    snapshots.set(db, { file, revision });
    if (file === DATA_FILE) cache = { revision, data: structuredClone(db), json };
    if (file === DATA_FILE) queueAtlas(db);
  } catch (error) {
    try { fs.unlinkSync(temp); } catch {}
    throw error;
  }
}
