import crypto from 'node:crypto';
import { creditWallet, campaignConfig } from './campus.js';

// New referral rewards are print credit. Existing cash balances and payouts
// remain in their legacy ledger so earned money is never reclassified.

export function getConfig(db) {
  const d = {
    enabled: true,
    friendOff: 20,
    friendMinOrder: 0,
    minTopup: 99,
    rulesVersion: 2,
    milestones: [
      { n: 3, bonus: 50 },
      { n: 5, bonus: 100 }
    ],
    minWithdrawal: 50,
    monthlyCap: 500
  };
  const old = db.referralConfig;
  if (old && !old.rulesVersion) {
    if (old.friendMinOrder === 79) old.friendMinOrder = 0;
    if (old.referrerCredit === 20) old.referrerCredit = 25;
    if (JSON.stringify(old.milestones) === JSON.stringify([{ n: 3, bonus: 10 }, { n: 5, bonus: 25 }, { n: 10, bonus: 75 }])) old.milestones = d.milestones;
  }
  db.referralConfig = { ...d, ...(old || {}) };
  db.referralConfig.referrerCredit ??= db.referralConfig.referrerCash ?? 25;
  if (!Array.isArray(db.referralConfig.milestones)) {
    db.referralConfig.milestones = d.milestones;
  }
  return db.referralConfig;
}

const CODE_ALPHA = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export function genCode(db) {
  const used = new Set(
    db.users.map((u) => u.referralCode).concat((db.referrals || []).map((r) => r.code), (db.coupons || []).map((c) => c.code))
  );
  let code;
  do { code = Array.from({ length: 6 }, () => CODE_ALPHA[crypto.randomInt(CODE_ALPHA.length)]).join(''); } while (used.has(code));
  return code;
}

export function codeFor(db, user) {
  if (!user.referralCode) {
    user.referralCode = genCode(db);
    user.referralMilestones ||= [];
  }
  return user.referralCode;
}

export function findReferrer(db, code) {
  const c = String(code || '').trim().toUpperCase();
  if (!c) return null;
  return db.users.find((u) => u.referralCode === c) || null;
}

export function firstOrder(db, customerId) {
  return !db.orders.some((o) => o.customerId === customerId && o.status !== 'CANCELLED');
}

// Link once before the first paid order; eligibility is checked after both required activities.
export function validateReferral(db, user, code, qualifyingAmount) {
  const cfg = getConfig(db);
  if (!cfg.enabled) return { ok: false, error: 'Referrals are paused right now.' };
  const referrer = findReferrer(db, code);
  if (!referrer) return { ok: false, error: 'Unknown referral code.' };
  if (referrer.id === user.id) return { ok: false, error: "You can't refer yourself." };
  if ((db.referrals || []).some((r) => r.refereeId === user.id && r.status !== 'void')) return { ok: false, error: 'A referral is already linked to your account.' };
  if (db.orders.some((o) => o.customerId === user.id && o.paymentStatus === 'paid' && !['CANCELLED', 'REFUNDED'].includes(o.status))) return { ok: false, error: 'Link a referral before your first paid order.' };
  if (!Number.isFinite(Number(qualifyingAmount)) || Number(qualifyingAmount) < 0) return { ok: false, error: 'Invalid qualifying amount.' };
  return { ok: true, referrer };
}

export function createReferral(db, { referrerId, refereeId, orderId, code, friendDiscount, sourceKind, sourceId }) {
  db.referrals ||= [];
  const existing = (db.referrals || []).find((r) => r.refereeId === refereeId && r.status !== 'void');
  if (existing) return existing;
  const cfg = getConfig(db);
  const now = new Date().toISOString();
  const r = {
    id: 'REF-' + crypto.randomUUID(),
    referrerId, refereeId, orderId: orderId || null, code, friendDiscount,
    sourceKind: sourceKind || 'order', sourceId: sourceId || orderId || null,
    status: 'pending', createdAt: now, qualifiedAt: null,
    policy: 'topup-order', minTopup: cfg.minTopup, minOrder: cfg.friendMinOrder,
    friendCredit: cfg.friendOff, referrerCredit: cfg.referrerCredit, validityDays: campaignConfig(db).bonusValidityDays
  };
  db.referrals.push(r);
  return r;
}

export function voidPendingForOrder(db, orderId) {
  for (const r of (db.referrals || [])) {
    if (r.orderId === orderId && r.status === 'pending' && r.policy !== 'topup-order') r.status = 'void';
  }
}

export function cashWalletOf(db, customerId) {
  db.cashWallets ||= [];
  let w = db.cashWallets.find((x) => x.customerId === customerId);
  if (!w) { w = { customerId, balance: 0 }; db.cashWallets.push(w); }
  return w;
}

export function monthKey(at) {
  return new Date(at || Date.now()).toISOString().slice(0, 7);
}

export function monthEarned(db, customerId, at) {
  const k = monthKey(at);
  const legacy = (db.cashTx || [])
    .filter((t) => t.customerId === customerId && t.kind === 'credit' && monthKey(t.at) === k)
    .reduce((s, t) => s + t.amount, 0);
  const credit = (db.walletTx || [])
    .filter((t) => t.customerId === customerId && t.source === 'referral' && t.amount > 0 && monthKey(t.at) === k)
    .reduce((s, t) => s + t.amount, 0);
  return legacy + credit;
}

function creditPrint(db, customerId, amount, label, at, validityDays) {
  creditWallet(db, customerId, amount, label, { source: 'referral', at: Date.parse(at) || Date.now(), validityDays: validityDays ?? campaignConfig(db).bonusValidityDays });
  db.notifications ||= [];
  db.notifications.push({
    id: `NT-${Date.now()}${Math.floor(Math.random() * 1e4)}`,
    customerId, orderId: null, text: label, at: at || new Date().toISOString(), read: false
  });
}

// Called when an order reaches DELIVERED. Credits the base and any newly-hit
// milestone bonuses, all under the monthly cap. Idempotent per order.
export function qualifyForOrder(db, order) {
  const out = { credited: 0, bonuses: [], capped: false };
  if (!order || order.status !== 'DELIVERED' || order.paymentStatus !== 'paid') return out;
  if (!getConfig(db).enabled) return out;
  const ref = (db.referrals || []).find((r) => r.status === 'pending' && (r.policy === 'topup-order' ? r.refereeId === order.customerId : r.orderId === order.id));
  if (ref?.policy === 'topup-order') {
    const firstPaid = db.orders.filter((o) => o.customerId === order.customerId && o.paymentStatus === 'paid' && o.total > 0 && !['CANCELLED', 'REFUNDED'].includes(o.status))
      .sort((a, b) => (a.history?.find((h) => h.to === 'CONFIRMED')?.at || a.createdAt || '').localeCompare(b.history?.find((h) => h.to === 'CONFIRMED')?.at || b.createdAt || ''))[0];
    const toppedUp = (db.walletTx || []).some((t) => t.customerId === order.customerId && t.kind === 'credit' && (t.source === 'topup' || /top-up|added/i.test(t.label || '') && !/bonus/i.test(t.label || '')) && t.amount >= ref.minTopup);
    if (firstPaid?.id !== order.id || !toppedUp || order.total <= 0 || order.total < ref.minOrder) return out;
    ref.orderId = order.id;
    ref.completedAt = new Date().toISOString();
  }
  if (!ref) return out;
  return awardReferralCredit(db, ref, `order #${order.id} collected`);
}

// Shared print-credit award: monthly cap, base credit, milestone bonuses. Idempotent
// per referral (only pending records pay out).
export function awardReferralCredit(db, ref, contextLabel) {
  const out = { credited: 0, bonuses: [], capped: false };
  if (!ref || ref.status !== 'pending') return out;
  const cfg = getConfig(db);
  if (!cfg.enabled) return out;
  const now = new Date().toISOString();
  const room = () => Math.max(0, cfg.monthlyCap - monthEarned(db, ref.referrerId, now));
  if (ref.policy === 'topup-order' && !ref.completedAt) return out;
  if (room() <= 0) {
    if (ref.policy === 'topup-order' && ref.friendCredit > 0) creditPrint(db, ref.refereeId, ref.friendCredit, `Friend referral credit (₹${ref.friendCredit})`, now, ref.validityDays);
    ref.status = 'capped';
    return { ...out, capped: true };
  }
  if (ref.policy === 'topup-order' && ref.friendCredit > 0) creditPrint(db, ref.refereeId, ref.friendCredit, `Friend referral credit (₹${ref.friendCredit})`, now, ref.validityDays);
  const base = Math.min(ref.referrerCredit ?? cfg.referrerCredit, room());
  if (base > 0) creditPrint(db, ref.referrerId, base, `Referral print credit — ${contextLabel} (₹${base})`, now, ref.validityDays);
  out.credited = base;
  ref.status = 'qualified';
  ref.qualifiedAt = now;
  const referrer = db.users.find((u) => u.id === ref.referrerId);
  if (!referrer) return out;
  referrer.referralMilestones ||= [];
  const count = db.referrals.filter((r) => r.referrerId === ref.referrerId && r.status === 'qualified').length;
  for (const m of cfg.milestones) {
    if (count >= m.n && !referrer.referralMilestones.includes(m.n) && room() >= m.bonus) {
      creditPrint(db, ref.referrerId, m.bonus, `Referral milestone print credit — ${count} friends (+₹${m.bonus})`, now, ref.validityDays);
      referrer.referralMilestones.push(m.n);
      out.bonuses.push({ n: m.n, bonus: m.bonus });
    }
  }
  return out;
}

// Preserve legacy pending pack rewards; new referrals require a top-up and completed order.
export function qualifyForPack(db, sub) {
  if (!sub) return { credited: 0, bonuses: [], capped: false };
  const ref = (db.referrals || []).find((r) => r.sourceId === sub.id && r.status === 'pending');
  if (!ref) return { credited: 0, bonuses: [], capped: false };
  if (ref.policy === 'topup-order') return { credited: 0, bonuses: [], capped: false };
  return awardReferralCredit(db, ref, `pack ${sub.packName || sub.packId} secured`);
}

export function qualifyForTopup(db, txId, customerId) {
  const tx = (db.walletTx || []).find((t) => t.id === txId && t.customerId === customerId && t.source === 'topup');
  const ref = (db.referrals || []).find((r) => r.status === 'pending' && (r.policy === 'topup-order' ? !!tx && r.refereeId === customerId : r.sourceId === txId));
  if (!ref || ref.refereeId !== customerId) return { credited: 0, bonuses: [], capped: false };
  if (ref.policy === 'topup-order') {
    const order = db.orders.find((o) => o.customerId === customerId && o.status === 'DELIVERED' && o.paymentStatus === 'paid' && o.total > 0);
    return qualifyForOrder(db, order);
  }
  return awardReferralCredit(db, ref, 'wallet top-up');
}

// Discount off the chargeable printing amount (after pack + coupon).
export function referralDiscountFor(db, subtotal, packDiscount, couponDiscount) {
  const cfg = getConfig(db);
  if (cfg.rulesVersion === 2) return 0;
  return Math.min(cfg.friendOff, Math.max(0, Math.round((subtotal - packDiscount - couponDiscount) * 100) / 100));
}

export function validUpiId(v) {
  const s = String(v || '').trim();
  if (/^[6-9]\d{9}$/.test(s)) return s; // pay to mobile number
  if (/^[a-zA-Z0-9._-]{2,}@[a-zA-Z]{2,}$/.test(s) && s.length <= 60) return s;
  return null;
}
