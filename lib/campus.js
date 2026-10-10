import { offerActive, validateOfferDates } from '../public/print-pricing.js';
import crypto from 'node:crypto';
import { addNotification, notifyAdmins } from './notify.js';
import { LOCALITIES } from '../public/localities.js';

// Institution handover is at the main gate; home deliveries still need a street address.
export function institutionAddress(db, input, customerId) {
  const location = String(input.institutionLocation || '');
  if (location.startsWith('address:')) {
    const saved = db.addresses.find(a => customerId && a.customerId === customerId && a.id === location.slice(8) && a.institutionName);
    if (!saved) throw new Error('Choose your own saved school / college.');
    return { ...saved };
  }
  if (location.startsWith('campus:')) {
    const campus = campaignConfig(db).delivery.campuses.find(c => c.enabled && c.id === location.slice(7));
    if (!campus) throw new Error('Choose an available school / college.');
    return { institutionName: campus.name, address: campus.address, area: campus.zone, pin: campus.pin, lat: campus.lat, lng: campus.lng, locationAccuracy: 'device' };
  }
  const locality = LOCALITIES.find(l => location === 'locality:' + l.id && l.id !== 'vapi-other');
  if (!locality) throw new Error('Choose the school / college locality.');
  const name = schoolName(input.institutionName), landmark = String(input.schoolMeeting || '').trim().slice(0,100);
  return { institutionName: name, address: `${name}, ${locality.name}`, area: locality.zone, pin: '', landmark: landmark || 'Main gate', localityId: locality.id, lat: locality.lat, lng: locality.lng, locationAccuracy: 'locality' };
}


const money = (n) => Math.round(n * 100) / 100;
const DAY = 864e5;
const IST = 330 * 60e3;
export const FILE_COLORS = ['orange', 'green', 'red', 'yellow'];
export function campaignDefaults() {
  return {
    bonusValidityDays: 90, showPages: true, firstPrint: { enabled: true, pages: 5 },
    wallets: [
      { id: 'first', name: 'First Wallet Offer', amount: 49, bonus: 10, enabled: true, firstOnly: true, freeFirstBatch: true },
      { id: 'trial', name: 'Trial Wallet', amount: 99, bonus: 11, enabled: true },
      { id: 'files', name: 'Wallet + 3 Free Files', amount: 149, bonus: 0, freeFiles: 3, enabled: true },
      { id: 'study', name: 'Study Wallet', amount: 199, bonus: 26, enabled: true },
      { id: 'semester', name: 'Semester Wallet', amount: 499, bonus: 76, enabled: true },
      { id: 'power', name: 'Power Wallet', amount: 799, bonus: 151, enabled: true },
      { id: 'pass', name: 'Semester Pass', amount: 499, bonus: 51, enabled: false, memberDays: 90, freeBatch: true }
    ],
    delivery: {
      enabled: true, freeEnabled: true, freeMinOrder: 99, cutoff: '01:00', guaranteeEnabled: true, lateCredit: 20,
      local: { vapi: { enabled: true, fee: 10, radiusKm: 20 }, daman: { enabled: false, fee: 20, radiusKm: 3 } },
      pickup: { enabled: false, address: '' },
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
  // Existing saved campaigns also get the new offer; an explicitly disabled offer stays disabled.
  if (!cfg.wallets.some((o) => o.id === 'files')) cfg.wallets.splice(2, 0, defaults.wallets.find((o) => o.id === 'files'));
  cfg.delivery = { ...defaults.delivery, ...cfg.delivery };
  cfg.delivery.local = { ...defaults.delivery.local, ...cfg.delivery.local };
  // One-time rollout: existing admin settings can be changed again after migration.
  if (!cfg.delivery.addressDeliveryV2) {
    cfg.delivery.local.vapi = { enabled: true, fee: 10, radiusKm: 20 };
    cfg.delivery.pickup = { enabled: false, address: cfg.delivery.pickup?.address || '' };
    cfg.delivery.addressDeliveryV2 = true;
  }
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
export function adminWalletCredit(db, customerId, amount, label, adminId, requestId) {
  if (!db.users.some(u => u.id === customerId && u.role === 'customer')) throw new Error('Unknown customer.');
  if (!db.users.some(u => u.id === adminId && u.role === 'admin')) throw new Error('Administrator required.');
  if (!Number.isFinite(amount) || amount <= 0 || amount > 10000 || Math.abs(amount * 100 - Math.round(amount * 100)) > 1e-6 || typeof label !== 'string' || !label.trim() || label.length > 200 || !/^[a-zA-Z0-9-]{1,120}$/.test(requestId)) throw new Error('Enter a valid credit amount and reason.');
  const previous = db.walletTx.find(t => t.source === 'admin-credit' && t.requestId === requestId);
  if (previous) {
    if (previous.customerId !== customerId || previous.amount !== amount || previous.label !== label.trim()) throw new Error('This credit request has already been used.');
    return previous;
  }
  return creditWallet(db, customerId, amount, label.trim(), { source: 'admin-credit', validityDays: 0, adminId, requestId });
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
  return (db.walletTx || []).some((t) => t.customerId === customerId && t.kind === 'credit' && (t.source === 'topup' || !t.source && /top-up|added/i.test(t.label || '') && !/bonus/i.test(t.label || '')));
}
export function eligibleWalletOffers(db, customerId) {
  return campaignConfig(db).wallets.filter((o) => offerActive(o) && (!o.firstOnly || !customerId || !hasTopup(db, customerId)
    && !(db.topups || []).some((t) => t.customerId === customerId && !t.used && t.terms?.firstOnly && Date.parse(t.at) > Date.now() - 30 * 60e3)));
}
export function topupTerms(db, customerId, input, offerId) {
  const amount = Number(input);
  if (!Number.isFinite(amount) || amount < 10 || amount > 10000 || Math.abs(amount * 100 - Math.round(amount * 100)) > 1e-6) throw new Error('Enter an amount between ₹10 and ₹10,000 (up to two decimals).');
  const cfg = campaignConfig(db);
  const offer = offerId ? cfg.wallets.find((o) => o.id === offerId) : eligibleWalletOffers(db, customerId).filter(o=>!o.memberDays && o.amount===amount).sort((a,b)=>b.bonus-a.bonus)[0];
  if (offerId && (!offer || !offerActive(offer) || offer.amount !== amount)) throw new Error('That wallet offer is unavailable. Refresh and choose again.');
  if (offer?.firstOnly && (hasTopup(db, customerId) || (db.topups || []).some((t) => t.customerId === customerId && !t.used && t.terms?.firstOnly && Date.parse(t.at) > Date.now() - 30 * 60e3))) throw new Error('The first wallet offer is already claimed or awaiting payment.');
  return { amount, bonus: offer?.bonus || 0, freeFiles: offer?.freeFiles || 0, offerId: offer?.id || null, name: offer?.name || 'Wallet top-up', firstOnly: !!offer?.firstOnly, freeFirstBatch: !!offer?.freeFirstBatch, memberDays: offer?.memberDays || 0, freeBatch: !!offer?.freeBatch, validityDays: offer?.validityDays ?? cfg.bonusValidityDays };
}
export function applyTopup(db, customerId, terms, label, paymentId) {
  if (paymentId && db.walletTx.some((t) => t.paymentId === paymentId)) throw new Error('This payment was already credited.');
  const firstEligible = !terms.firstOnly || !hasTopup(db, customerId);
  const tx = creditWallet(db, customerId, terms.amount, label, { source: 'topup', paymentId, offerId: terms.offerId });
  if (terms.freeFiles && firstEligible) tx.freeFiles = { quantity: terms.freeFiles, color: null };
  if (terms.bonus && firstEligible) creditWallet(db, customerId, terms.bonus, `${terms.name} bonus`, { validityDays: terms.validityDays, topupId: tx.id });
  const w = walletOf(db, customerId);
  if (terms.freeFirstBatch && firstEligible) w.freeFirstBatch = true;
  if (terms.memberDays && firstEligible) {
    w.memberUntil = new Date(Math.max(Date.now(), Date.parse(w.memberUntil) || 0) + terms.memberDays * DAY).toISOString();
    w.memberFreeBatch = terms.freeBatch;
  }
  // Customers can fund their wallet after reaching checkout; apply newly earned delivery benefits there too.
  const pendingPurchases = (db.purchases || []).filter((p) => p.status === 'CREATED');
  const heldPrints = new Set(pendingPurchases.flatMap((p) => p.printIds));
  for (const order of [...db.orders.filter((o) => !heldPrints.has(o.id)), ...pendingPurchases.filter((p) => !p.gatewayOrderId && !p.gatewayCreating)]
    .filter((o) => o.customerId === customerId && o.deliveryMode === 'batch' && ['CREATED', 'PAYMENT_PENDING'].includes(o.status))
    .sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''))) {
    const priced = batchPrice(db, customerId, order, Array.isArray(order.printIds) ? 0 : order.subtotal, order.deliveryFee);
    if (priced.fee < order.deliveryFee) {
      order.total = money(order.total - order.deliveryFee + priced.fee);
      order.deliveryFee = priced.fee;
      order.firstBatchFree ||= priced.firstBatchFree;
    }
  }
  const customer = db.users?.find((u) => u.id === customerId);
  notifyAdmins(db, 'wallet', `${customer?.name || 'Customer'} added ₹${terms.amount} to their wallet.`, `/admin/customers/${encodeURIComponent(customerId)}`, `topup:${tx.id}`);
  addNotification(db, { customerId, orderId: null, kind: 'wallet', text: `₹${terms.amount} added to your wallet${terms.bonus && firstEligible ? ` + ₹${terms.bonus} bonus` : ''}.`, href: '/customer/wallet' });
  return tx;
}

export function claimWalletFiles(db, customerId, txId, color) {
  if (!FILE_COLORS.includes(color)) throw new Error('Choose orange, green, red or yellow.');
  const gift = db.walletTx.find((t) => t.id === txId && t.customerId === customerId && t.source === 'topup')?.freeFiles;
  if (!gift?.quantity) throw new Error('No free files for this top-up.');
  if (gift.fulfilledAt) throw new Error('These files have already been handed over.');
  gift.color = color;
  gift.requestedAt = new Date().toISOString();
  return gift;
}

export function fulfilWalletFiles(db, customerId, txId, staffId) {
  const gift = db.walletTx.find((t) => t.id === txId && t.customerId === customerId && t.source === 'topup')?.freeFiles;
  if (!gift?.quantity || !FILE_COLORS.includes(gift.color)) throw new Error('The customer must choose a file colour first.');
  gift.fulfilledAt ||= new Date().toISOString();
  gift.fulfilledBy ||= staffId;
  return gift;
}

export function deliveryChoice(plan) {
  return plan.institutionDelivery ? plan.deliveryMode === 'express' ? 'school-express' : plan.slotId || 'school' : plan.campusId === 'lit' ? plan.deliveryMode === 'batch' ? 'college' : 'college-express' : plan.deliveryMode === 'scheduled' ? plan.slotId : plan.deliveryMode === 'pickup' ? 'pickup' : 'express';
}

export function schoolName(value) {
  const name = String(value || '').trim();
  if (name.length < 2 || name.length > 120) throw new Error('Enter your school or college name (2–120 characters).');
  return name;
}

export function validateDestination(plan, value) {
  if (plan.institutionDelivery) plan.institutionName = schoolName(value);
  return plan;
}

// All scheduling uses campus time, independent of the server's timezone.
export function deliveryPlan(db, slotId, campusId, at = Date.now()) {
  if (slotId && typeof slotId === 'object') {
    const saved = slotId;
    return { ...deliveryPlan(db, deliveryChoice(saved), saved.campusId, at), preferredShopId: saved.preferredShopId, ...(saved.institutionDelivery ? { institutionName: saved.institutionName } : {}) };
  }
  if (slotId === 'school' || slotId === 'school-express' || String(slotId).startsWith('school-')) {
    const cfg = campaignConfig(db).delivery;
    if (!cfg.enabled) throw new Error('School and college delivery is unavailable.');
    if (slotId === 'school-express') return { institutionDelivery: true, deliveryMode: 'express', slotId, slot: 'School / College · Express · ₹25' };
    const choices = cfg.slots.filter(s => s.enabled && (slotId === 'school' || slotId === 'school-' + s.id)).map(s => {
      const local = { ...cfg.local.vapi, enabled: true };
      const plan = deliveryPlan({ ...db, settings: { ...db.settings, campaign: { ...campaignConfig(db), delivery: { ...cfg, local: { ...cfg.local, vapi: local } } } } }, 'local-vapi-' + s.id, null, at);
      return { institutionDelivery: true, deliveryMode: 'batch', slotId: 'school-' + s.id, slot: 'School / College · ' + plan.slot.replace('Vapi scheduled delivery · ', ''), deliveryStartAt: plan.deliveryStartAt, promisedBy: plan.promisedBy, deliveryCutoffAt: plan.deliveryCutoffAt };
    }).sort((a, b) => a.deliveryStartAt.localeCompare(b.deliveryStartAt));
    if (!choices.length) throw new Error('No school / college delivery windows are available.');
    return choices[0];
  }
  if (String(slotId).startsWith('local-')) {
    const [, zone, ...parts] = slotId.split('-');
    const cfg = campaignConfig(db).delivery, local = cfg.local[zone];
    const slot = cfg.slots.find((s) => s.id === parts.join('-') && s.enabled);
    if (!local?.enabled || !slot) throw new Error('That scheduled delivery is unavailable. Choose another option.');
    const localDay = Math.floor((at + IST) / DAY) * DAY;
    const time = (value) => { const [h, m] = value.split(':').map(Number); return (h * 60 + m) * 60e3; };
    const day = localDay + (at + IST >= localDay + time(slot.cutoff) ? DAY : 0);
    return {
      deliveryMode: 'scheduled', scheduledZone: zone, scheduledFee: local.fee, scheduledRadiusKm: local.radiusKm,
      slotId, slot: `${zone === 'vapi' ? 'Vapi' : 'Daman'} scheduled delivery · ${new Date(day).toISOString().slice(0, 10)} · ${slot.start}–${slot.end} IST`,
      deliveryStartAt: new Date(day + time(slot.start) - IST).toISOString(), promisedBy: new Date(day + time(slot.end) - IST).toISOString(),
      deliveryCutoffAt: new Date(day + time(slot.cutoff) - IST).toISOString()
    };
  }
  if (slotId === 'college' || slotId === 'college-express') {
    const cfg = campaignConfig(db).delivery;
    const campus = cfg.campuses.find((c) => c.id === 'lit' && c.enabled);
    if (!cfg.enabled || !campus) throw new Error('LIT College delivery is currently unavailable.');
    if (slotId === 'college-express') return {
      deliveryMode: 'express', campusId: campus.id, campus: campus.name, campusZone: campus.zone,
      campusAddress: campus.address, campusPin: campus.pin, campusPoint: { lat: campus.lat, lng: campus.lng },
      slot: 'LIT College · Emergency express'
    };
    const plans = cfg.slots.filter((s) => s.enabled).map((s) => deliveryPlan(db, s.id, campus.id, at));
    plans.sort((a, b) => a.deliveryStartAt.localeCompare(b.deliveryStartAt));
    if (!plans.length) throw new Error('LIT College delivery is currently unavailable.');
    return plans[0];
  }
  if (!slotId || slotId === 'express') return { deliveryMode: 'express', slot: 'Express delivery (paid)' };
  if (slotId === 'pickup') {
    throw new Error('Kiosks are in development. Choose delivery.');
  }
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
  if (plan.institutionDelivery) {
    const w = walletOf(db, customerId, now);
    const reserved = [...db.orders, ...(db.purchases || [])].some(o => o.customerId === customerId && o.firstBatchFree && !['CANCELLED', 'REFUNDED'].includes(o.status));
    const firstBatchFree = !!w.freeFirstBatch && !reserved;
    return { fee: firstBatchFree || w.memberFreeBatch && Date.parse(w.memberUntil) > now ? 0 : fee, firstBatchFree };
  }
  if (plan.campusId === 'lit') {
    const phone = String(db.users.find((u) => u.id === customerId)?.phone || '').replace(/\D/g, '');
    // ponytail: eligibility scans orders × users; index phone/device claims when campus volume grows.
    const previous = [...db.orders, ...(db.purchases || [])].some((o) => !['CANCELLED', 'REFUNDED'].includes(o.status)
      && (o.firstBatchFree || o.deliveryMode === 'batch' && (o.campusId === 'lit' || o.campus === 'LIT Sarigam'))
      && (o.customerId === customerId || plan.offerDevice && o.offerDevice === plan.offerDevice
        || phone && String(db.users.find((u) => u.id === o.customerId)?.phone || '').replace(/\D/g, '') === phone));
    return { fee: previous ? Math.min(3, fee) : 0, firstBatchFree: !previous };
  }
  const w = walletOf(db, customerId, now);
  const reserved = [...db.orders, ...(db.purchases || [])].some((o) => o.customerId === customerId && o.firstBatchFree && !['CANCELLED', 'REFUNDED'].includes(o.status));
  const firstBatchFree = !!w.freeFirstBatch && !reserved;
  const member = w.memberFreeBatch && Date.parse(w.memberUntil) > now;
  const cfg = campaignConfig(db).delivery;
  return { fee: firstBatchFree || member || cfg.freeEnabled && subtotal >= cfg.freeMinOrder ? 0 : fee, firstBatchFree };
}
export function settleWallets(db, now = Date.now()) {
  const before = db.walletTx.length;
  for (const w of db.wallets) walletOf(db, w.customerId, now);
  // ponytail: expiry scans are O(wallets × transactions) once per minute; index grants and deadlines when the campus pilot grows.
  for (const o of [...db.orders, ...(db.purchases || []).filter((p) => !p.printIds.length)]) {
    if (o.deliveryMode !== 'batch' || !o.lateCredit || o.lateCreditedAt || o.paymentStatus !== 'paid' || ['CANCELLED', 'REFUNDED'].includes(o.status)) continue;
    const deadline = Date.parse(o.promisedBy);
    const paidAt = Date.parse(o.history?.find((h) => ['CONFIRMED', 'PAID'].includes(h.to))?.at);
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
  for (const o of cfg.wallets) if (!num(o.amount) || o.amount < 10 || !num(o.bonus) || Math.abs(o.amount * 100 - Math.round(o.amount * 100)) > 1e-6 || Math.abs(o.bonus * 100 - Math.round(o.bonus * 100)) > 1e-6 || o.freeFiles != null && (!num(o.freeFiles, 100) || !Number.isInteger(o.freeFiles)) || o.memberDays != null && (!num(o.memberDays, 3650) || !Number.isInteger(o.memberDays)) || ['firstOnly', 'freeFirstBatch', 'freeBatch'].some((k) => o[k] != null && typeof o[k] !== 'boolean')) throw new Error('Invalid wallet offer.');
  for (const o of cfg.wallets) { validateOfferDates(o); if (o.validityDays != null && (!num(o.validityDays, 3650) || !Number.isInteger(o.validityDays))) throw new Error('Invalid bonus validity.'); }
  const d = cfg.delivery;
  if (!d || typeof d.enabled !== 'boolean' || typeof d.freeEnabled !== 'boolean' || typeof d.guaranteeEnabled !== 'boolean' || !num(d.freeMinOrder) || !num(d.lateCredit) || !time(d.cutoff) || !unique(d.slots) || !unique(d.campuses)) throw new Error('Invalid delivery settings.');
  if (d.local && (Object.keys(d.local).some((zone) => !['vapi', 'daman'].includes(zone)) || Object.values(d.local).some((o) => typeof o.enabled !== 'boolean' || !num(o.fee) || !num(o.radiusKm, 25) || o.radiusKm <= 0))) throw new Error('Scheduled delivery needs a valid fee and radius (up to 25 km).');
  if (d.pickup && (typeof d.pickup.enabled !== 'boolean' || typeof d.pickup.address !== 'string' || d.pickup.address.length > 200 || d.pickup.enabled && !d.pickup.address.trim())) throw new Error('Add a collection address before enabling pickup.');
  for (const s of d.slots) if (!time(s.start) || !time(s.end) || !time(s.cutoff) || s.start >= s.end || (s.guaranteed ? d.cutoff : s.cutoff) > s.start || s.guaranteed != null && typeof s.guaranteed !== 'boolean') throw new Error('Each slot needs a cutoff before its start and an end after its start.');
  for (const c of d.campuses) if (!['vapi', 'daman', 'sarigam', 'bhilad'].includes(c.zone) || !text(c.address) || !/^\d{6}$/.test(c.pin) || !num(c.lat, 20.55) || c.lat < 20.1 || !num(c.lng, 73.1) || c.lng < 72.7) throw new Error('Invalid campus address or delivery point.');
  return cfg;
}
