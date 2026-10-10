// Shared browser/server pricing. Quantities count printed sides, including copies.
export const PROCESSING_CAP = 10;
export const COD_FEE = 10;
export const BULK_TIERS = [
  { through: 50, bw: 0, color: 0 },
  { through: 150, bw: 1/3, color: 0.25 },
  { through: 300, bw: 2/3, color: 0.5 },
  { through: Infinity, bw: 1, color: 1 }
];
const money = n => Math.round(n * 100) / 100;
export function processingFee(sides) {
  if (!Number.isSafeInteger(sides) || sides < 0) throw new Error('Invalid printed-side quantity.');
  return !sides ? 0 : sides <= 10 ? 2 : sides <= 30 ? 4 : sides <= 75 ? 6 : sides <= 150 ? 8 : PROCESSING_CAP;
}
export function collegeDeliveryFee(sides) {
  if (!Number.isSafeInteger(sides) || sides < 0) throw new Error('Invalid printed-side quantity.');
  return Math.max(0, 10 - Math.floor(sides / 30));
}
export function offerActive(offer, now = Date.now()) {
  const day = new Date(now + 330 * 60e3).toISOString().slice(0, 10);
  return !!offer.enabled && (!offer.startsOn || offer.startsOn <= day) && (!offer.endsOn || offer.endsOn >= day);
}
export function validateOfferDates(offer) {
  for (const date of [offer.startsOn, offer.endsOn]) if (date && (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date)) throw new Error('Enter valid offer dates.');
  if (offer.startsOn && offer.endsOn && offer.startsOn > offer.endsOn) throw new Error('Offer end date must follow its start date.');
}
export function validatePrintOffer(o) {
  validateOfferDates(o);
  if (!/^[a-z0-9-]{1,32}$/.test(o.id) || typeof o.name !== 'string' || !o.name.trim() || o.name.length > 120 || typeof o.enabled !== 'boolean' || !['bw','color'].includes(o.type) || !Number.isSafeInteger(o.sides) || o.sides < 1 || o.sides > 10000 || !Number.isFinite(o.price) || o.price < 0 || o.price > 10000 || Math.abs(o.price * 100 - Math.round(o.price * 100)) > 1e-6 || typeof o.repeat !== 'boolean') throw new Error('Enter a name, whole bundle quantity and valid bundle price.');
  return o;
}
export function printPricing(counts, pricing, student = false, basketSides = counts.bw + counts.color, basketCounts = counts) {
  const quantity = counts.bw + counts.color;
  if (![counts.bw, counts.color, basketSides].every(n => Number.isSafeInteger(n) && n >= 0) || basketSides < quantity) throw new Error('Invalid printed-side quantity.');
  const base = { bw: Number(student ? pricing.studentBw : pricing.bw), color: Number(student ? pricing.studentColor : pricing.color) };
  if (!Object.values(base).every(n => Number.isFinite(n) && n >= 0)) throw new Error('Print pricing is unavailable.');
  let before = 0, bw = 0, color = 0;
  for (const tier of BULK_TIERS) {
    const amount = Math.max(0, Math.min(basketSides, tier.through) - before);
    bw += amount * (base.bw - Math.max(0,base.bw-1.4)*tier.bw);
    color += amount * (base.color - Math.max(0,base.color-3)*tier.color);
    before = tier.through;
  }
  const rates = { bw: basketSides ? bw / basketSides : base.bw, color: basketSides ? color / basketSides : base.color };
  if (!['bw','color'].every(k => Number.isSafeInteger(basketCounts[k]) && basketCounts[k] >= counts[k]) || basketCounts.bw + basketCounts.color > basketSides) throw new Error('Invalid basket quantities.');
  for (const offer of (pricing.printOffers || []).filter(o => offerActive(o))) {
    const n = basketCounts[offer.type], bundles = offer.repeat ? Math.floor(n / offer.sides) : Number(n >= offer.sides);
    if (bundles) rates[offer.type] = Math.min(rates[offer.type], (bundles * offer.price + (n - bundles * offer.sides) * base[offer.type]) / n);
  }
  const subtotal = money(counts.bw * rates.bw + counts.color * rates.color);
  const regularSubtotal = money(counts.bw * base.bw + counts.color * base.color);
  return { subtotal, regularSubtotal, bulkDiscount: money(regularSubtotal - subtotal), printedSides: quantity,
    bwRate: rates.bw, colorRate: rates.color };
}
