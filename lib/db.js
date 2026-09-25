import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const DATA_FILE = path.join(__dirname, '..', 'data', 'db.json');

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
      order: { minTotal: 0, maxFileMb: 20, maxPages: 1000, radiusKm: 20 }
    }
  };
}

export function loadDb() {
  try {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    if (!fs.existsSync(DATA_FILE)) {
      const fresh = blankDb();
      fs.writeFileSync(DATA_FILE, JSON.stringify(fresh, null, 2));
      return fresh;
    }
    const db = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    const fresh = blankDb();
    for (const k of Object.keys(fresh)) db[k] ??= fresh[k];
    // Keep newer pricing defaults while preserving rates saved in older databases.
    db.pricing = { ...fresh.pricing, ...(db.pricing || {}) };
    db.pricing.delivery = { ...fresh.pricing.delivery, ...((db.pricing || {}).delivery || {}) };
    db.pricing.surcharges = { ...fresh.pricing.surcharges, ...((db.pricing || {}).surcharges || {}) };
    for (const key of ['lateNight', 'surge']) db.pricing.surcharges[key] = { ...fresh.pricing.surcharges[key], ...((db.pricing.surcharges || {})[key] || {}) };
    if (!Array.isArray(db.pricing.topupBonus)) db.pricing.topupBonus = fresh.pricing.topupBonus;
    return db;
  } catch {
    return blankDb();
  }
}

export function saveDb(db) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
}
