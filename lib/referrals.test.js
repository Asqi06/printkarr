import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  getConfig, genCode, codeFor, validateReferral, referralDiscountFor,
  createReferral, voidPendingForOrder, cashWalletOf, monthEarned,
  qualifyForOrder, qualifyForPack, qualifyForTopup, validUpiId
} from './referrals.js';

function testDb() {
  const db = {
    users: [
      { id: 'A', role: 'customer', name: 'Asha' },
      { id: 'B', role: 'customer', name: 'Dev' }
    ],
    orders: [], referrals: [], cashWallets: [], cashTx: [], wallets: [], walletTx: [],
    payouts: [], notifications: [], referralConfig: null
  };
  codeFor(db, db.users[0]);
  codeFor(db, db.users[1]);
  return db;
}

test('codes are unique, uppercase, and stable per user', () => {
  const db = testDb();
  const a = codeFor(db, db.users[0]);
  assert.match(a, /^[A-Z2-9]{6}$/);
  assert.notEqual(a, codeFor(db, db.users[1]));
  assert.equal(codeFor(db, db.users[0]), a);
  assert.equal(genCode(db).length, 6);
});

test('validation gates: unknown, self, second order, min order', () => {
  const db = testDb();
  const [a, b] = db.users;
  assert.equal(validateReferral(db, b, 'ZZZZZZ', 100).ok, false); // unknown
  assert.match(validateReferral(db, b, 'ZZZZZZ', 100).error, /Unknown/);
  assert.match(validateReferral(db, b, b.referralCode, 100).error, /yourself/);
  assert.match(validateReferral(db, b, a.referralCode, 50).error, /₹79/);
  assert.ok(validateReferral(db, b, a.referralCode, 100).ok);
  db.orders.push({ id: 'PK-1', customerId: 'B', status: 'DELIVERED' });
  assert.match(validateReferral(db, b, a.referralCode, 100).error, /first purchase/);
  // cancelled first attempt does not burn eligibility
  db.orders[0].status = 'CANCELLED';
  assert.ok(validateReferral(db, b, a.referralCode, 100).ok);
});

test('packs and top-ups also count as first-paid-activity', () => {
  const db = testDb();
  const [a, b] = db.users;
  db.packSubs = [{ id: 'SUB-1', customerId: 'B' }];
  assert.match(validateReferral(db, b, a.referralCode, 329).error, /first purchase/);
  delete db.packSubs;
  db.walletTx = [{ id: 'W1', customerId: 'B', amount: 200, kind: 'credit', label: 'Added (demo)', at: new Date().toISOString() }];
  assert.match(validateReferral(db, b, a.referralCode, 100).error, /first purchase/);
  // refunds and cash payouts don't burn it
  db.walletTx = [{ id: 'W2', customerId: 'B', amount: 20, kind: 'credit', label: 'Refund #PK-1', at: new Date().toISOString() }];
  assert.ok(validateReferral(db, b, a.referralCode, 100).ok);
});

test('discount capped at chargeable printing amount', () => {
  const db = testDb();
  assert.equal(referralDiscountFor(db, 100, 0, 0), 20);
  assert.equal(referralDiscountFor(db, 6, 0, 0), 6);
  assert.equal(referralDiscountFor(db, 100, 100, 0), 0); // pack covers all
});

test('qualify credits the print wallet on collection only, voids on cancel', () => {
  const db = testDb();
  const [a, b] = db.users;
  createReferral(db, { referrerId: 'A', refereeId: 'B', orderId: 'PK-9', code: a.referralCode, friendDiscount: 10 });
  const order = { id: 'PK-9', customerId: 'B', status: 'PRINTING', paymentStatus: 'paid' };
  assert.deepEqual(qualifyForOrder(db, order), { credited: 0, bonuses: [], capped: false });
  assert.equal(db.referrals[0].status, 'pending');
  order.status = 'DELIVERED';
  const out = qualifyForOrder(db, order);
  assert.equal(out.credited, 20);
  assert.equal(db.referrals[0].status, 'qualified');
  assert.equal(db.wallets.find((w) => w.customerId === 'A').balance, 20);
  assert.equal(cashWalletOf(db, 'A').balance, 0);
  // idempotent — paying twice must not double-credit
  assert.equal(qualifyForOrder(db, order).credited, 0);
  assert.equal(db.wallets.find((w) => w.customerId === 'A').balance, 20);
  // unpaid delivery earns nothing
  createReferral(db, { referrerId: 'A', refereeId: 'B', orderId: 'PK-10', code: a.referralCode, friendDiscount: 10 });
  assert.equal(qualifyForOrder(db, { id: 'PK-10', customerId: 'B', status: 'DELIVERED', paymentStatus: 'pending' }).credited, 0);
  // cancel voids the pending referral so a retry can re-apply
  voidPendingForOrder(db, 'PK-10');
  assert.equal(db.referrals[1].status, 'void');
});

test('milestone bonuses fire once at 3/5/10 delivered', () => {
  const db = testDb();
  const mk = (i) => {
    createReferral(db, { referrerId: 'A', refereeId: 'B', orderId: 'PK-' + i, code: 'X', friendDiscount: 10 });
    return qualifyForOrder(db, { id: 'PK-' + i, customerId: 'B', status: 'DELIVERED', paymentStatus: 'paid' });
  };
  mk(1); mk(2);
  const third = mk(3);
  assert.deepEqual(third.bonuses, [{ n: 3, bonus: 10 }]);
  assert.equal(db.wallets.find((w) => w.customerId === 'A').balance, 20 * 3 + 10);
  mk(4);
  const fifth = mk(5);
  assert.deepEqual(fifth.bonuses, [{ n: 5, bonus: 25 }]);
  assert.deepEqual(db.users[0].referralMilestones.sort(), [3, 5]);
});

test('monthly cap blocks further credit', () => {
  const db = testDb();
  db.referralConfig = { ...getConfig(db), monthlyCap: 30 };
  const mk = (i) => {
    createReferral(db, { referrerId: 'A', refereeId: 'B', orderId: 'PK-' + i, code: 'X', friendDiscount: 10 });
    return qualifyForOrder(db, { id: 'PK-' + i, customerId: 'B', status: 'DELIVERED', paymentStatus: 'paid' });
  };
  assert.equal(mk(1).credited, 20);
  const second = mk(2); // only ₹10 room left
  assert.equal(second.credited, 10);
  assert.equal(monthEarned(db, 'A'), 30);
  const third = mk(3);
  assert.equal(third.capped, true);
  assert.equal(db.referrals[2].status, 'capped');
});

test('previous cash remains withdrawable while new rewards use print credit', () => {
  const db = testDb();
  cashWalletOf(db, 'A').balance = 35;
  db.cashTx.push({ customerId: 'A', amount: 35, kind: 'credit', at: new Date().toISOString() });
  createReferral(db, { referrerId: 'A', refereeId: 'B', orderId: 'PK-OLD', code: 'X', friendDiscount: 20 });
  assert.equal(qualifyForOrder(db, { id: 'PK-OLD', status: 'DELIVERED', paymentStatus: 'paid' }).credited, 20);
  assert.equal(cashWalletOf(db, 'A').balance, 35);
  assert.equal(db.wallets.find((w) => w.customerId === 'A').balance, 20);
  assert.equal(monthEarned(db, 'A'), 55);
});

test('UPI id validation accepts VPA and mobile, rejects junk', () => {
  assert.equal(validUpiId('asharma@okhdfc'), 'asharma@okhdfc');
  assert.equal(validUpiId('9825011111'), '9825011111');
  assert.equal(validUpiId('not an id!!'), null);
  assert.equal(validUpiId(''), null);
  assert.equal(validUpiId('a@b'), null);
});

test('pack and top-up referrals qualify on first payment', () => {
  const db = testDb();
  const sub = { id: 'SUB-9', customerId: 'B', packId: 'S', packName: 'Semester Pack S' };
  createReferral(db, { referrerId: 'A', refereeId: 'B', orderId: null, code: 'X', friendDiscount: 10, sourceKind: 'pack', sourceId: 'SUB-9' });
  const p = qualifyForPack(db, sub);
  assert.equal(p.credited, 20);
  assert.equal(db.referrals[0].status, 'qualified');
  assert.equal(p.credited && qualifyForPack(db, sub).credited, 0); // idempotent
  createReferral(db, { referrerId: 'A', refereeId: 'B', orderId: null, code: 'X', friendDiscount: 10, sourceKind: 'topup', sourceId: 'WTX-1' });
  const t = qualifyForTopup(db, 'WTX-1', 'B');
  assert.equal(t.credited, 20);
  assert.equal(db.wallets.find((w) => w.customerId === 'A').balance, 40);
  // wrong customer can't trigger someone else's referral
  createReferral(db, { referrerId: 'A', refereeId: 'B', orderId: null, code: 'X', friendDiscount: 10, sourceKind: 'topup', sourceId: 'WTX-2' });
  assert.equal(qualifyForTopup(db, 'WTX-2', 'A').credited, 0);
});
