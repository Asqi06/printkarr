// Shared pricing — reads live config (admin-editable in Phase 4, §34).
// Nothing here is hardcoded: rates come from db.pricing.
import { loadDb } from './db.js';

export function rateFor(printType, student, pricing) {
  const p = pricing || loadDb().pricing;
  if (printType === 'color') return student ? p.studentColor : p.color;
  return student ? p.studentBw : p.bw;
}

// Effective page count from a range string like "1-12, 15-20".
// Returns { pages, valid, error }. Empty range = whole document.
export function rangePages(range, totalPages) {
  if (!range || !String(range).trim()) return { pages: totalPages, valid: true };
  const picked = new Set();
  for (const part of String(range).split(',')) {
    const t = part.trim();
    if (!t) continue;
    const m = t.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (!m) return { pages: 0, valid: false, error: `Can't read "${t}" — use 1-12, 15-20.` };
    let a = parseInt(m[1], 10);
    let b = m[2] ? parseInt(m[2], 10) : a;
    if (a < 1 || b < 1 || a > totalPages || b > totalPages) {
      return { pages: 0, valid: false, error: `Pages must be between 1 and ${totalPages}.` };
    }
    if (a > b) [a, b] = [b, a];
    for (let p = a; p <= b; p++) picked.add(p);
  }
  if (!picked.size) return { pages: 0, valid: false, error: 'Pick at least one page.' };
  return { pages: picked.size, valid: true };
}

export function activePrintJobs(db) {
  return db.orders.filter((o) => ['PRINT_QUEUE', 'PRINTING'].includes(o.status)).length;
}

export function surchargeFees(pricing, activeJobs = 0, at = new Date()) {
  const { lateNight = {}, surge = {} } = pricing.surcharges || {};
  const mins = (time) => {
    const match = String(time || '').match(/^(\d{2}):(\d{2})$/);
    return match ? Number(match[1]) * 60 + Number(match[2]) : null;
  };
  const start = mins(lateNight.start), end = mins(lateNight.end);
  const ist = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(at);
  const [hour, minute] = ist.split(':').map(Number);
  const now = hour * 60 + minute;
  const night = start != null && end != null && start !== end && (start < end ? now >= start && now < end : now >= start || now < end);
  const threshold = Number(surge.activeJobs) || 0;
  return {
    lateNightFee: night ? Number(lateNight.fee) || 0 : 0,
    surgeFee: threshold > 0 && activeJobs >= threshold ? Number(surge.fee) || 0 : 0
  };
}

const HUBS = {
  vapi: { lat: 20.389722, lng: 72.889945 }, // Chala, Vapi 396191
  daman: { lat: 20.398424, lng: 72.89082 }, // Dabhel Check Post
  sarigam: { lat: 20.27801, lng: 72.84171 },
  bhilad: { lat: 20.258333, lng: 72.883333 }
};

export function deliveryPoint(lat, lng) {
  const a = Number(lat), b = Number(lng);
  return Number.isFinite(a) && Number.isFinite(b) && a >= 20.1 && a <= 20.55 && b >= 72.7 && b <= 73.1
    ? { lat: a, lng: b } : null;
}

function kmBetween(a, b) {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function deliveryFeeFor(pricing, zone, point) {
  if (zone === 'pickup') return { fee: 0, km: 0, zone };
  const validPoint = deliveryPoint(point?.lat, point?.lng);
  if (!HUBS[zone] || !validPoint) throw new Error('Select a valid delivery point.');
  // The pin selects the Vapi/Daman tariff, so changing the area label cannot lower the fee.
  if (zone === 'vapi' || zone === 'daman') {
    zone = kmBetween(HUBS.daman, validPoint) + 0.25 < kmBetween(HUBS.vapi, validPoint) ? 'daman' : 'vapi';
  }
  const km = kmBetween(HUBS[zone], validPoint);
  if (km > 25) throw new Error('That delivery point is outside our local service area.');
  if (['sarigam', 'bhilad'].includes(zone)) {
    const other = zone === 'sarigam' ? 'bhilad' : 'sarigam';
    if (kmBetween(HUBS[other], validPoint) + 0.5 < km || km > 6) throw new Error('Choose the area that matches your delivery point.');
  }
  if (['vapi', 'daman'].includes(zone) && ['sarigam', 'bhilad'].some((other) => kmBetween(HUBS[other], validPoint) + 2 < km)) {
    throw new Error('Choose the area that matches your delivery point.');
  }
  // ponytail: straight-line bands can differ from road distance; use a routing service when exact trip pricing is needed.
  const fee = zone === 'vapi'
    ? km <= 1 ? 10 : 15 + Math.max(0, Math.ceil((km - 3) / 2)) * 5
    : zone === 'daman'
      ? 20 + Math.max(0, Math.ceil((km - 2) / 2)) * 5
      : Number(pricing.delivery[zone]) || 15;
  return { fee: Math.min(60, Math.max(0, fee)), km: Math.round(km * 10) / 10, zone };
}

export function quote({ pages, copies, printType, student, zone, point }) {
  const db = loadDb();
  const p = db.pricing;
  const rate = rateFor(printType, student, p);
  const subtotal = Math.round(pages * copies * rate * 100) / 100;
  const stdRate = printType === 'color' ? p.color : p.bw;
  const stdSubtotal = Math.round(pages * copies * stdRate * 100) / 100;
  const discount = Math.round((stdSubtotal - subtotal) * 100) / 100;
  const { fee: deliveryFee, km: deliveryKm, zone: deliveryZone } = deliveryFeeFor(p, zone, point);
  const extra = surchargeFees(p, activePrintJobs(db));
  const lateNightFee = zone === 'pickup' ? 0 : extra.lateNightFee;
  const surgeFee = extra.surgeFee;
  return {
    rate, subtotal,
    studentDiscount: student ? discount : 0,
    deliveryFee, deliveryKm, deliveryZone, lateNightFee, surgeFee,
    total: Math.round((subtotal + deliveryFee + lateNightFee + surgeFee) * 100) / 100
  };
}

// Wallet top-up ladder (conversion blueprint §4). Highest tier that fits.
export function bonusFor(amount, pricing) {
  const tiers = (pricing || loadDb().pricing).topupBonus || [];
  const hit = [...tiers].sort((a, b) => b.min - a.min).find((t) => amount >= t.min);
  if (!hit) return { bonus: 0, pct: 0, next: [...tiers].sort((a, b) => a.min - b.min).find((t) => amount < t.min) || null };
  return { bonus: Math.round(amount * (hit.pct / 100) * 100) / 100, pct: hit.pct, next: null };
}

// Demo progress for the dashboard card (§5).
const WEIGHT = {
  CREATED: 5, PAYMENT_PENDING: 12, CONFIRMED: 22, PRINT_QUEUE: 35,
  PRINTING: 55, PRINTED: 68, READY_FOR_PICKUP: 76,
  RIDER_ASSIGNED: 82, PICKED_UP: 88, OUT_FOR_DELIVERY: 94, DELIVERED: 100
};
export function progressOf(status) {
  return WEIGHT[status] ?? 0;
}
