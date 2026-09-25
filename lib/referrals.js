// Referral program: Give ₹10 (friend, first ₹79+ order), Get ₹20 real cash
// (referrer, after delivery) + milestones + manual UPI withdrawals.
// Cash lives in a separate ledger — never mixed with print wallet credit.

export function getConfig(db) {
  const d = {
    enabled: true,
    friendOff: 10,
    friendMinOrder: 79,
    referrerCash: 20,
    milestones: [
      { n: 3, bonus: 10 },
      { n: 5, bonus: 25 },
      { n: 10, bonus: 75 }
    ],
    minWithdrawal: 50,
    monthlyCap: 500
  };
  db.referralConfig = { ...d, ...(db.referralConfig || {}) };
  if (!Array.isArray(db.referralConfig.milestones) || !db.referralConfig.milestones.length) {
    db.referralConfig.milestones = d.milestones;
  }
  return db.referralConfig;
}

const CODE_ALPHA = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export function genCode(db) {
  const used = new Set(
    db.users.map((u) => u.referralCode).concat((db.referrals || []).map((r) => r.code))
  );
  for (let i = 0; i < 200; i++) {
    let c = '';
    for (let k = 0; k < 6; k++) c += CODE_ALPHA[Math.floor(Math.random() * CODE_ALPHA.length)];
    if (!used.has(c)) return c;
  }
  return 'R' + Date.now().toString(36).toUpperCase().slice(-5);
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

// Pure validation: friend must be first-timer, code not own, printing value ≥ min.
export function validateReferral(db, user, code, printSubtotal) {
  const cfg = getConfig(db);
  if (!cfg.enabled) return { ok: false, error: 'Referrals are paused right now.' };
  const referrer = findReferrer(db, code);
  if (!referrer) return { ok: false, error: 'Unknown referral code.' };
  if (referrer.id === user.id) return { ok: false, error: "You can't refer yourself." };
  if (!firstOrder(db, user.id)) return { ok: false, error: 'Referral codes work on your first order only.' };
  if ((Number(printSubtotal) || 0) < cfg.friendMinOrder) {
    return { ok: false, error: `Referral needs ₹${cfg.friendMinOrder}+ printing in one order.` };
  }
  return { ok: true, referrer };
}

export function createReferral(db, { referrerId, refereeId, orderId, code, friendDiscount }) {
  db.referrals ||= [];
  const now = new Date().toISOString();
  const r = {
    id: 'REF-' + Date.now().toString(36).toUpperCase(),
    referrerId, refereeId, orderId, code, friendDiscount,
    status: 'pending', createdAt: now, qualifiedAt: null
  };
  db.referrals.push(r);
  return r;
}

export function voidPendingForOrder(db, orderId) {
  for (const r of (db.referrals || [])) {
    if (r.orderId === orderId && r.status === 'pending') r.status = 'void';
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
  return (db.cashTx || [])
    .filter((t) => t.customerId === customerId && t.kind === 'credit' && monthKey(t.at) === k)
    .reduce((s, t) => s + t.amount, 0);
}

function creditCash(db, customerId, amount, label, at) {
  const w = cashWalletOf(db, customerId);
  w.balance = Math.round((w.balance + amount) * 100) / 100;
  db.cashTx ||= [];
  db.cashTx.push({ id: `CTX-${Date.now()}${Math.floor(Math.random() * 1e4)}`, customerId, amount, kind: 'credit', label, at: at || new Date().toISOString() });
  db.notifications ||= [];
  db.notifications.push({
    id: `NT-${Date.now()}${Math.floor(Math.random() * 1e4)}`,
    customerId, orderId: null, text: label, at: at || new Date().toISOString(), read: false
  });
}

// Called when an order reaches DELIVERED. Credits base cash + any newly-hit
// milestone bonuses, all under the monthly cap. Idempotent per order.
export function qualifyForOrder(db, order) {
  const out = { credited: 0, bonuses: [], capped: false };
  if (!order || order.status !== 'DELIVERED' || order.paymentStatus !== 'paid') return out;
  const cfg = getConfig(db);
  if (!cfg.enabled) return out;
  const ref = (db.referrals || []).find((r) => r.orderId === order.id && r.status === 'pending');
  if (!ref) return out;
  const now = new Date().toISOString();
  const room = () => Math.max(0, cfg.monthlyCap - monthEarned(db, ref.referrerId, now));
  if (room() <= 0) {
    ref.status = 'capped';
    return { ...out, capped: true };
  }
  const base = Math.min(cfg.referrerCash, room());
  creditCash(db, ref.referrerId, base, `Referral cash — order #${order.id} delivered (₹${base})`, now);
  out.credited = base;
  ref.status = 'qualified';
  ref.qualifiedAt = now;
  const referrer = db.users.find((u) => u.id === ref.referrerId);
  referrer.referralMilestones ||= [];
  const count = db.referrals.filter((r) => r.referrerId === ref.referrerId && r.status === 'qualified').length;
  for (const m of cfg.milestones) {
    if (count >= m.n && !referrer.referralMilestones.includes(m.n) && room() >= m.bonus) {
      creditCash(db, ref.referrerId, m.bonus, `Milestone bonus — ${count} referrals delivered (+₹${m.bonus})`, now);
      referrer.referralMilestones.push(m.n);
      out.bonuses.push({ n: m.n, bonus: m.bonus });
    }
  }
  return out;
}

// Discount off the chargeable printing amount (after pack + coupon).
export function referralDiscountFor(db, subtotal, packDiscount, couponDiscount) {
  const cfg = getConfig(db);
  return Math.min(cfg.friendOff, Math.max(0, Math.round((subtotal - packDiscount - couponDiscount) * 100) / 100));
}

export function validUpiId(v) {
  const s = String(v || '').trim();
  if (/^[6-9]\d{9}$/.test(s)) return s; // pay to mobile number
  if (/^[a-zA-Z0-9._-]{2,}@[a-zA-Z]{2,}$/.test(s) && s.length <= 60) return s;
  return null;
}
