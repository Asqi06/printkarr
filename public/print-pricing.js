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
export function printPricing(counts, pricing, student = false, basketSides = counts.bw + counts.color) {
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
  const subtotal = money(basketSides ? (counts.bw * bw + counts.color * color) / basketSides : 0);
  const regularSubtotal = money(counts.bw * base.bw + counts.color * base.color);
  return { subtotal, regularSubtotal, bulkDiscount: money(regularSubtotal - subtotal), printedSides: quantity,
    bwRate: basketSides ? bw / basketSides : base.bw, colorRate: basketSides ? color / basketSides : base.color };
}
