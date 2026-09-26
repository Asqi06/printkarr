// First-order offers and the LIT Sarigam kiosk milestone.
const money = (n) => Math.round(n * 100) / 100;
const live = (o) => o.status !== 'CANCELLED' && o.status !== 'REFUNDED';

export function firstOffers(db, user, device, { pages, copies, printType, rate, zone, deliveryFee, subtotal, packDiscount = 0 }) {
  const phone = String(user.phone || '').replace(/\D/g, '');
  // ponytail: browser tokens and unverified phone numbers limit casual repeat claims;
  // add payment-instrument or SMS verification before expanding beyond the campus pilot.
  const previous = device && (db.orders || []).filter((o) => live(o) && (
    o.customerId === user.id || o.offerDevice === device ||
    (phone && String((db.users || []).find((u) => u.id === o.customerId)?.phone || '').replace(/\D/g, '') === phone)
  ));
  if (!previous) return { print: 0, delivery: 0 };
  const print = !previous.length && printType === 'bw' && !packDiscount
    ? money(Math.min(5, pages * copies) * rate)
    : 0;
  const delivery = zone !== 'pickup' && !previous.some((o) => o.deliveryZone !== 'pickup')
    ? deliveryFee
    : 0;
  return { print: Math.min(subtotal, print), delivery };
}

export const CAMPUS_GOAL = 500;
export const CAMPUS_CREDIT = 10;
export function campusProgress(db) {
  const startedAt = db.campusMilestone?.startedAt;
  const ids = new Set((db.orders || [])
    .filter((o) => startedAt && o.createdAt >= startedAt && o.status === 'DELIVERED' && o.paymentStatus === 'paid'
      && o.deliveryZone === 'pickup' && o.total > 0 && o.campus === 'LIT Sarigam')
    .map((o) => o.customerId));
  return { count: ids.size, ids: [...ids], goal: CAMPUS_GOAL, unlocked: !!db.campusMilestone?.unlockedAt };
}

export function awardCampusMilestone(db) {
  const progress = campusProgress(db);
  if (progress.unlocked || progress.count < CAMPUS_GOAL) return 0;
  const at = new Date().toISOString();
  db.campusMilestone ||= {};
  db.wallets ||= [];
  db.walletTx ||= [];
  db.notifications ||= [];
  for (const customerId of progress.ids) {
    let wallet = db.wallets.find((w) => w.customerId === customerId);
    if (!wallet) { wallet = { customerId, balance: 0 }; db.wallets.push(wallet); }
    wallet.balance = money(wallet.balance + CAMPUS_CREDIT);
    db.walletTx.push({ id: `WTX-campus-${customerId}`, customerId, amount: CAMPUS_CREDIT, kind: 'credit', source: 'campus-milestone', label: 'LIT Sarigam 500 prints milestone', at });
    db.notifications.push({ id: `NT-campus-${customerId}`, customerId, orderId: null, text: `LIT Sarigam reached 500 paid kiosk printers. ₹${CAMPUS_CREDIT} print credit is in your wallet.`, at, read: false });
  }
  db.campusMilestone.unlockedAt = at;
  return progress.ids.length;
}
