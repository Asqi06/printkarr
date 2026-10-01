import crypto from 'node:crypto';

const money = (n) => Math.round(n * 100) / 100;
const DAY = 864e5;
const IST = 330 * 60e3;
export function campaignDefaults() {
  return {
    bonusValidityDays: 90, showPages: true, firstPrint: { enabled: true, pages: 5 },
    wallets: [
      { id: 'first', name: 'First Wallet Offer', amount: 49, bonus: 10, enabled: true, firstOnly: true, freeFirstBatch: true },
      { id: 'trial', name: 'Trial Wallet', amount: 99, bonus: 11, enabled: true },
      { id: 'study', name: 'Study Wallet', amount: 199, bonus: 26, enabled: true },
      { id: 'semester', name: 'Semester Wallet', amount: 499, bonus: 76, enabled: true },
      { id: 'power', name: 'Power Wallet', amount: 799, bonus: 151, enabled: true },
      { id: 'pass', name: 'Semester Pass', amount: 499, bonus: 51, enabled: false, memberDays: 90, freeBatch: true }
    ],
    delivery: {
      enabled: true, freeEnabled: true, freeMinOrder: 99, cutoff: '01:00', guaranteeEnabled: true, lateCredit: 20,
      slots: [
        { id: 'morning', name: 'Morning', start: '09:00', end: '11:00', cutoff: '01:00', enabled: true, guaranteed: true },
        { id: 'afternoon', name: 'Afternoon', start: '13:00', end: '15:00', cutoff: '11:00', enabled: true }
      ],
      campuses: [{ id: 'lit', name: 'LIT Sarigam', zone: 'sarigam', address: 'LIT Sarigam campus', pin: '396155', lat: 20.27801, lng: 72.84171, enabled: true }]
    }
  };
}
export function campaignConfig(db) {
  const defaults = campaignDefaults();
  db.settings ||= {};
  const cfg = db.settings.campaign ||= defaults;
  for (const key of ['bonusValidityDays', 'showPages', 'wallets', 'firstPrint']) cfg[key] ??= defaults[key];
  cfg.delivery = { ...defaults.delivery, ...cfg.delivery };
  return cfg;
}

// Expiring grants live in the existing ledger. Purchased/legacy balance never expires.
export function walletOf(db, customerId, now = Date.now()) {
  db.wallets ||= [];
  db.walletTx ||= [];
  let w = db.wallets.find((x) => x.customerId === customerId);
  if (!w) { w = { customerId, balance: 0 }; db.wallets.push(w); }
  for (const tx of db.walletTx.filter((t) => t.customerId === customerId && t.remaining > 0 && t.expiresAt && Date.parse(t.expiresAt) <= now)) {
    w.balance = money(w.balance - tx.remaining);
    db.walletTx.push({ id: crypto.randomUUID(), customerId, kind: 'debit', source: 'expiry', amount: -tx.remaining, label: `Expired: ${tx.label}`, at: new Date(now).toISOString() });
    tx.remaining = 0;
  }
  return w;
}
export function creditWallet(db, customerId, amount, label, { source = 'bonus', validityDays = campaignConfig(db).bonusValidityDays, at = Date.now(), ...extra } = {}) {
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('Invalid wallet credit.');
  const w = walletOf(db, customerId, at);
  w.balance = money(w.balance + amount);
  const tx = { id: crypto.randomUUID(), customerId, amount: money(amount), kind: 'credit', source, label, at: new Date(at).toISOString(), ...extra };
  if (source !== 'topup' && source !== 'refund') {
    tx.remaining = tx.amount;
    tx.nonWithdrawable = true;
    tx.expiresAt = validityDays > 0 ? new Date(at + validityDays * DAY).toISOString() : null;
  }
  db.walletTx.push(tx);
  return tx;
}
export function debitWallet(db, customerId, amount, label, now = Date.now()) {
  const w = walletOf(db, customerId, now);
  if (!Number.isFinite(amount) || amount < 0 || w.balance < amount) throw new Error('Insufficient wallet balance.');
  let left = amount;
  const grants = db.walletTx.filter((t) => t.customerId === customerId && t.remaining > 0)
    .sort((a, b) => (a.expiresAt || '9999').localeCompare(b.expiresAt || '9999'));
  const spent = [];
  for (const grant of grants) {
    const take = Math.min(left, grant.remaining);
    if (take <= 0) break;
    grant.remaining = money(grant.remaining - take);
    spent.push({ id: grant.id, amount: take });
    left = money(left - take);
  }
  w.balance = money(w.balance - amount);
  const tx = { id: crypto.randomUUID(), customerId, amount: -amount, kind: 'debit', label, spent, paidAmount: left, at: new Date(now).toISOString() };
  db.walletTx.push(tx);
  return tx.id;
}
export function refundWallet(db, customerId, txId, amount, label, now = Date.now()) {
  const tx = db.walletTx.find((t) => t.id === txId && t.customerId === customerId && t.kind === 'debit');
  if (tx?.refunded) return;
  const w = walletOf(db, customerId, now);
  let restored = tx ? tx.paidAmount : amount; // Legacy orders had no grant allocations.
  for (const part of tx?.spent || []) {
    const grant = db.walletTx.find((t) => t.id === part.id);
    if (grant && (!grant.expiresAt || Date.parse(grant.expiresAt) > now)) {
      grant.remaining = money(grant.remaining + part.amount);
      restored += part.amount;
    }
  }
  w.balance = money(w.balance + restored);
  if (tx) tx.refunded = true;
  db.walletTx.push({ id: crypto.randomUUID(), customerId, amount: money(restored), kind: 'credit', source: 'refund', label, at: new Date(now).toISOString() });
}
export function hasTopup(db, customerId) {
  return (db.walletTx || []).some((t) => t.customerId === customerId && t.kind === 'credit' && (t.source === 'topup' || /top-up|added/i.test(t.label || '') && !/bonus/i.test(t.label || '')));
}
export function topupTerms(db, customerId, input, offerId) {
  const amount = Number(input);
  if (!Number.isFinite(amount) || amount < 10 || amount > 10000 || Math.abs(amount * 100 - Math.round(amount * 100)) > 1e-6) throw new Error('Enter an amount between ₹10 and ₹10,000 (up to two decimals).');
  const cfg = campaignConfig(db);
  const offer = offerId ? cfg.wallets.find((o) => o.id === offerId) : cfg.wallets.find((o) => o.enabled && !o.memberDays && o.amount === amount && (!o.firstOnly || !hasTopup(db, customerId)));
  if (offerId && (!offer?.enabled || offer.amount !== amount)) throw new Error('That wallet offer is unavailable. Refresh and choose again.');
  if (offer?.firstOnly && (hasTopup(db, customerId) || (db.topups || []).some((t) => t.customerId === customerId && !t.used && t.terms?.firstOnly && Date.parse(t.at) > Date.now() - 30 * 60e3))) throw new Error('The first wallet offer is already claimed or awaiting payment.');
  return { amount, bonus: offer?.bonus || 0, offerId: offer?.id || null, name: offer?.name || 'Wallet top-up', firstOnly: !!offer?.firstOnly, freeFirstBatch: !!offer?.freeFirstBatch, memberDays: offer?.memberDays || 0, freeBatch: !!offer?.freeBatch, validityDays: cfg.bonusValidityDays };
}
export function applyTopup(db, customerId, terms, label, paymentId) {
  if (paymentId && db.walletTx.some((t) => t.paymentId === paymentId)) throw new Error('This payment was already credited.');
  const firstEligible = !terms.firstOnly || !hasTopup(db, customerId);
  const tx = creditWallet(db, customerId, terms.amount, label, { source: 'topup', paymentId, offerId: terms.offerId });
  if (terms.bonus && firstEligible) creditWallet(db, customerId, terms.bonus, `${terms.name} bonus`, { validityDays: terms.validityDays });
  const w = walletOf(db, customerId);
  if (terms.freeFirstBatch && firstEligible) w.freeFirstBatch = true;
  if (terms.memberDays && firstEligible) {
    w.memberUntil = new Date(Math.max(Date.now(), Date.parse(w.memberUntil) || 0) + terms.memberDays * DAY).toISOString();
    w.memberFreeBatch = terms.freeBatch;
  }
  // Customers can fund their wallet after reaching checkout; apply newly earned delivery benefits there too.
  for (const order of db.orders.filter((o) => o.customerId === customerId && o.deliveryMode === 'batch' && ['CREATED', 'PAYMENT_PENDING'].includes(o.status))
    .sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''))) {
    const priced = batchPrice(db, customerId, order, order.subtotal, order.deliveryFee);
    if (priced.fee < order.deliveryFee) {
      order.total = money(order.total - order.deliveryFee + priced.fee);
      order.deliveryFee = priced.fee;
      order.firstBatchFree ||= priced.firstBatchFree;
    }
  }
  return tx;
}

// All scheduling uses campus time, independent of the server's timezone.
export function deliveryPlan(db, slotId, campusId, at = Date.now()) {
  if (!slotId || slotId === 'express') return { deliveryMode: 'express', slot: 'Express delivery (paid)' };
  if (slotId === 'pickup') return { deliveryMode: 'pickup', slot: 'Kiosk pickup' };
  const cfg = campaignConfig(db).delivery;
  const slot = cfg.slots.find((s) => s.id === slotId && s.enabled);
  const campus = cfg.campuses.find((c) => c.id === campusId && c.enabled);
  if (!cfg.enabled || !slot || !campus) throw new Error('Choose an available campus and batch slot.');
  const cutoff = slot.guaranteed ? cfg.cutoff : slot.cutoff;
  const localDay = Math.floor((at + IST) / DAY) * DAY;
  const localTime = (time) => { const [h, m] = time.split(':').map(Number); return (h * 60 + m) * 60e3; };
  const day = localDay + (at + IST >= localDay + localTime(cutoff) ? DAY : 0);
  const start = day + localTime(slot.start) - IST, end = day + localTime(slot.end) - IST;
  return {
    deliveryMode: 'batch', campusId: campus.id, campus: campus.name, campusZone: campus.zone, campusAddress: campus.address, campusPin: campus.pin, campusPoint: { lat: campus.lat, lng: campus.lng },
    slotId: slot.id, slot: `${campus.name} · ${slot.name} · ${new Date(day).toISOString().slice(0, 10)} · ${slot.start}–${slot.end} IST`,
    deliveryStartAt: new Date(start).toISOString(), promisedBy: new Date(end).toISOString(),
    deliveryCutoffAt: new Date(day + localTime(cutoff) - IST).toISOString(),
    lateCredit: cfg.guaranteeEnabled && slot.guaranteed ? cfg.lateCredit : 0
  };
}
export function batchPrice(db, customerId, plan, subtotal, fee, now = Date.now()) {
  if (plan.deliveryMode !== 'batch') return { fee, firstBatchFree: false };
  const w = walletOf(db, customerId, now);
  const reserved = db.orders.some((o) => o.customerId === customerId && o.firstBatchFree && !['CANCELLED', 'REFUNDED'].includes(o.status));
  const firstBatchFree = !!w.freeFirstBatch && !reserved;
  const member = w.memberFreeBatch && Date.parse(w.memberUntil) > now;
  const cfg = campaignConfig(db).delivery;
  return { fee: firstBatchFree || member || cfg.freeEnabled && subtotal >= cfg.freeMinOrder ? 0 : fee, firstBatchFree };
}
export function settleWallets(db, now = Date.now()) {
  const before = db.walletTx.length;
  for (const w of db.wallets) walletOf(db, w.customerId, now);
  // ponytail: expiry scans are O(wallets × transactions) once per minute; index grants and deadlines when the campus pilot grows.
  for (const o of db.orders) {
    if (o.deliveryMode !== 'batch' || !o.lateCredit || o.lateCreditedAt || o.paymentStatus !== 'paid' || ['CANCELLED', 'REFUNDED'].includes(o.status)) continue;
    const deadline = Date.parse(o.promisedBy);
    const paidAt = Date.parse(o.history?.find((h) => h.to === 'CONFIRMED')?.at);
    const deliveredAt = Date.parse(o.history?.find((h) => h.to === 'DELIVERED')?.at);
    if (!Number.isFinite(deadline) || now <= deadline || !Number.isFinite(paidAt) || paidAt >= Date.parse(o.deliveryCutoffAt) || deliveredAt <= deadline) continue;
    creditWallet(db, o.customerId, o.lateCredit, `Missed delivery slot #${o.id}`, { source: 'late-delivery', at: now, validityDays: o.bonusValidityDays });
    o.lateCreditedAt = new Date(now).toISOString();
    db.notifications.push({ id: crypto.randomUUID(), customerId: o.customerId, orderId: o.id, text: `We missed your delivery slot. ₹${o.lateCredit} non-withdrawable wallet credit added.`, at: o.lateCreditedAt, read: false });
  }
  return db.walletTx.length !== before;
}

export function validateCampaign(cfg) {
  const num = (n, max = 10000) => typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= max;
  const text = (s) => typeof s === 'string' && s.trim().length > 0 && s.length <= 120;
  const time = (s) => typeof s === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
  const unique = (rows) => Array.isArray(rows) && rows.length <= 30 && rows.every((r) => /^[a-z0-9-]{1,32}$/.test(r.id) && text(r.name) && typeof r.enabled === 'boolean') && new Set(rows.map((r) => r.id)).size === rows.length;
  if (!cfg || !cfg.firstPrint || typeof cfg.firstPrint.enabled !== 'boolean' || !num(cfg.firstPrint.pages, 1000) || !Number.isInteger(cfg.firstPrint.pages) || !num(cfg.bonusValidityDays, 3650) || !Number.isInteger(cfg.bonusValidityDays) || typeof cfg.showPages !== 'boolean' || !unique(cfg.wallets)) throw new Error('Invalid wallet settings.');
  for (const o of cfg.wallets) if (!num(o.amount) || o.amount < 10 || !num(o.bonus) || Math.abs(o.amount * 100 - Math.round(o.amount * 100)) > 1e-6 || Math.abs(o.bonus * 100 - Math.round(o.bonus * 100)) > 1e-6 || o.memberDays != null && (!num(o.memberDays, 3650) || !Number.isInteger(o.memberDays)) || ['firstOnly', 'freeFirstBatch', 'freeBatch'].some((k) => o[k] != null && typeof o[k] !== 'boolean')) throw new Error('Invalid wallet offer.');
  const d = cfg.delivery;
  if (!d || typeof d.enabled !== 'boolean' || typeof d.freeEnabled !== 'boolean' || typeof d.guaranteeEnabled !== 'boolean' || !num(d.freeMinOrder) || !num(d.lateCredit) || !time(d.cutoff) || !unique(d.slots) || !unique(d.campuses)) throw new Error('Invalid delivery settings.');
  for (const s of d.slots) if (!time(s.start) || !time(s.end) || !time(s.cutoff) || s.start >= s.end || (s.guaranteed ? d.cutoff : s.cutoff) > s.start || s.guaranteed != null && typeof s.guaranteed !== 'boolean') throw new Error('Each slot needs a cutoff before its start and an end after its start.');
  for (const c of d.campuses) if (!['vapi', 'daman', 'sarigam', 'bhilad'].includes(c.zone) || !text(c.address) || !/^\d{6}$/.test(c.pin) || !num(c.lat, 20.55) || c.lat < 20.1 || !num(c.lng, 73.1) || c.lng < 72.7) throw new Error('Invalid campus address or delivery point.');
  return cfg;
}
