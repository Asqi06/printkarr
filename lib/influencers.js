import { money } from './store.js';

// Coupon attribution is a snapshot on the checkout, independent of friend referrals.
export function influencerStats(db) {
  const groups = new Map();
  function group(name) {
    const key = name.trim().toLowerCase();
    if (!groups.has(key)) groups.set(key, { name: name.trim(), codes: new Set(), customers: new Set(), newCustomers: new Set(), orders: new Set(), refunded: new Set(), sales: 0, discounts: 0 });
    return groups.get(key);
  }
  for (const c of db.coupons || []) if (c.influencer) group(c.influencer).codes.add(c.code);
  const purchases = db.purchases || [], orders = db.orders || [];
  const receipts = [...purchases, ...orders.filter((o) => !o.purchaseId)];
  const paid = (o) => o.paymentStatus === 'paid' && !['CANCELLED', 'REFUNDED'].includes(o.status) && !o.preview;
  const paidAt = (o) => o.paidAt || o.history?.find((h) => ['CONFIRMED', 'PAID'].includes(h.to))?.at || o.createdAt || '';
  const firstPaid = new Map();
  for (const o of receipts.filter(paid).sort((a, b) => paidAt(a).localeCompare(paidAt(b)) || a.id.localeCompare(b.id))) if (!firstPaid.has(o.customerId)) firstPaid.set(o.customerId, o.id);
  const prints = new Map(orders.map((o) => [o.id, o]));
  for (const receipt of receipts) {
    if (receipt.preview || receipt.paymentStatus === 'demo') continue;
    const attributed = receipt.influencer ? [receipt] : (receipt.printIds || []).map((id) => prints.get(id)).filter((o) => o?.customerId === receipt.customerId && o.influencer);
    for (const source of attributed) {
      const g = group(source.influencer);
      g.codes.add(source.couponCode);
      if (paid(receipt) && paid(source)) {
        g.customers.add(receipt.customerId); g.orders.add(receipt.id);
        if (firstPaid.get(receipt.customerId) === receipt.id) g.newCustomers.add(receipt.customerId);
        g.sales = money(g.sales + source.total); g.discounts = money(g.discounts + (source.couponDiscount || 0));
      } else if (receipt.paymentStatus === 'refunded' || source.paymentStatus === 'refunded' || ['CANCELLED', 'REFUNDED'].includes(receipt.status) || ['CANCELLED', 'REFUNDED'].includes(source.status)) {
        if (receipt.paidAt || receipt.paymentMethod || receipt.history?.some((h) => ['CONFIRMED', 'PAID'].includes(h.to))) g.refunded.add(receipt.id);
      }
    }
  }
  return [...groups.values()].map((g) => ({ ...g, codes: [...g.codes].filter(Boolean).sort(), customers: g.customers.size, newCustomers: g.newCustomers.size, orders: g.orders.size, refunded: g.refunded.size }))
    .sort((a, b) => b.customers - a.customers || a.name.localeCompare(b.name));
}
