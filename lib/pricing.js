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

export function quote({ pages, copies, printType, student, zone, freeDelivery }) {
  const db = loadDb();
  const p = db.pricing;
  const rate = rateFor(printType, student, p);
  const subtotal = Math.round(pages * copies * rate * 100) / 100;
  const stdRate = printType === 'color' ? p.color : p.bw;
  const stdSubtotal = Math.round(pages * copies * stdRate * 100) / 100;
  const discount = Math.round((stdSubtotal - subtotal) * 100) / 100;
  const fee = p.delivery[zone] ?? 15;
  const firstFree = !!freeDelivery && p.firstDeliveryFree !== false;
  const deliveryFee = firstFree || subtotal >= p.freeAbove ? 0 : fee;
  return {
    rate, subtotal,
    studentDiscount: student ? discount : 0,
    deliveryFee, firstFree,
    total: Math.round((subtotal + deliveryFee) * 100) / 100
  };
}

// Wallet top-up ladder (conversion blueprint §4). Highest tier that fits.
export function bonusFor(amount, pricing) {
  const tiers = (pricing || loadDb().pricing).topupBonus || [];
  const hit = [...tiers].sort((a, b) => b.min - a.min).find((t) => amount >= t.min);
  if (!hit) return { bonus: 0, pct: 0, next: [...tiers].sort((a, b) => a.min - b.min).find((t) => amount < t.min) || null };
  return { bonus: Math.round(amount * (hit.pct / 100) * 100) / 100, pct: hit.pct, next: null };
}

// First order ever (excluding cancelled) → free delivery trial mechanic.
export function isFirstOrder(db, customerId) {
  return !db.orders.some((o) => o.customerId === customerId && o.status !== 'CANCELLED');
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
