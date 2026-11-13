import { campaignConfig } from './campus.js';
// First-order offers.
const money = (n) => Math.round(n * 100) / 100;
const live = (o) => o.status !== 'CANCELLED' && o.status !== 'REFUNDED';

export function firstOffers(db, user, device, { pages, bwPages, copies, printType, rate, zone, deliveryFee, subtotal, packDiscount = 0 }) {
  const phone = String(user.phone || '').replace(/\D/g, '');
  // ponytail: browser tokens and unverified phone numbers limit casual repeat claims;
  // add payment-instrument or SMS verification before expanding beyond the campus pilot.
  const previous = device && (db.orders || []).filter((o) => live(o) && (
    o.customerId === user.id || o.offerDevice === device ||
    (phone && String((db.users || []).find((u) => u.id === o.customerId)?.phone || '').replace(/\D/g, '') === phone)
  ));
  if (!previous) return { print: 0, delivery: 0 };
  const cfg = campaignConfig(db).firstPrint;
  const print = cfg.enabled && !previous.length && ['bw', 'mixed'].includes(printType) && !packDiscount ? money(Math.min(cfg.pages, (printType === 'mixed' ? bwPages : pages) * copies) * rate) : 0;
  const delivery = 0; // First-wallet delivery benefit is applied only by campus batch pricing.
  return { print: Math.min(subtotal, print), delivery };
}

