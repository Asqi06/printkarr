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

test('link before first paid order, reject self/unknown/duplicate and paused referrals', () => {
  const db = testDb(), [a, b] = db.users;
  assert.match(validateReferral(db, b, 'ZZZZZZ', 99).error, /Unknown/);
  assert.match(validateReferral(db, b, b.referralCode, 99).error, /yourself/);
  assert.ok(validateReferral(db, b, a.referralCode, 49).ok, 'a referral can be linked before a qualifying top-up');
  db.walletTx.push({ customerId: 'B', source: 'topup', kind: 'credit', amount: 99 });
  assert.ok(validateReferral(db, b, a.referralCode, 99).ok);
  const ref = createReferral(db, { referrerId: 'A', refereeId: 'B', code: a.referralCode });
  assert.equal(createReferral(db, { referrerId: 'A', refereeId: 'B', code: a.referralCode }), ref);
  assert.match(validateReferral(db, b, a.referralCode, 99).error, /already linked/);
  const other = { id: 'C' };
  db.orders.push({ id: 'paid', customerId: 'C', paymentStatus: 'paid', status: 'PRINT_QUEUE' });
  assert.match(validateReferral(db, other, a.referralCode, 99).error, /first paid order/);
  getConfig(db).enabled = false;
  assert.match(validateReferral(db, b, a.referralCode, 99).error, /paused/);
});

function friend(db, id, amount = 99) {
  db.users.push({ id, role: 'customer' });
  const ref = createReferral(db, { referrerId: 'A', refereeId: id, code: db.users[0].referralCode, sourceKind: 'topup', sourceId: 'T-' + id });
  db.walletTx.push({ id: 'T-' + id, customerId: id, source: 'topup', kind: 'credit', amount });
  const order = { id: 'O-' + id, customerId: id, total: 10, status: 'PRINT_QUEUE', paymentStatus: 'paid', createdAt: new Date().toISOString() };
  db.orders.push(order);
  return { ref, order };
}

test('both rewards wait for a 99+ top-up and the first completed paid order, once', () => {
  const db = testDb(), { ref, order } = friend(db, 'C');
  assert.equal(referralDiscountFor(db, 100, 0, 0), 0);
  assert.equal(qualifyForTopup(db, 'T-C', 'C').credited, 0);
  assert.equal(qualifyForPack(db, { id: 'T-C' }).credited, 0);
  assert.equal(qualifyForOrder(db, order).credited, 0);
  order.status = 'DELIVERED'; order.paymentStatus = 'pending';
  assert.equal(qualifyForOrder(db, order).credited, 0);
  order.paymentStatus = 'paid';
  assert.equal(qualifyForOrder(db, order).credited, 25);
  assert.equal(db.wallets.find((w) => w.customerId === 'C').balance, 20);
  assert.equal(db.wallets.find((w) => w.customerId === 'A').balance, 25);
  assert.equal(ref.status, 'qualified');
  assert.equal(qualifyForOrder(db, order).credited, 0);
  assert.ok(db.walletTx.filter((t) => t.source === 'referral').every((t) => t.nonWithdrawable && t.expiresAt));
});

test('49 top-ups, free orders and second orders do not qualify; cancellation allows retry', () => {
  const db = testDb(), { ref, order } = friend(db, 'C', 49);
  order.status = 'DELIVERED';
  assert.equal(qualifyForOrder(db, order).credited, 0);
  db.walletTx[0].amount = 99;
  order.total = 0;
  assert.equal(qualifyForOrder(db, order).credited, 0);
  order.total = 10;
  const second = { ...order, id: 'second', createdAt: '2099-01-01' };
  db.orders.push(second);
  assert.equal(qualifyForOrder(db, second).credited, 0);
  order.status = 'CANCELLED';
  voidPendingForOrder(db, order.id);
  assert.equal(ref.status, 'pending');
  assert.equal(qualifyForOrder(db, second).credited, 25);
});

test('top-up after completion can finish a previously linked referral; refunds are not top-ups', () => {
  const db = testDb(), { order } = friend(db, 'C', 49);
  order.status = 'DELIVERED';
  db.referrals[0].sourceId = order.id;
  db.walletTx.push({ customerId: 'C', source: 'refund', kind: 'credit', amount: 199 });
  assert.equal(qualifyForOrder(db, order).credited, 0);
  db.walletTx.push({ id: 'later', customerId: 'C', source: 'topup', kind: 'credit', amount: 99 });
  assert.equal(qualifyForTopup(db, 'later', 'A').credited, 0);
  assert.equal(qualifyForTopup(db, 'later', 'C').credited, 25);
});

test('3 and 5 successful distinct friends earn 50 and 100 milestones once', () => {
  const db = testDb();
  for (let i = 1; i <= 5; i++) {
    const { order } = friend(db, 'C' + i);
    order.status = 'DELIVERED';
    const out = qualifyForOrder(db, order);
    assert.deepEqual(out.bonuses, i === 3 ? [{ n: 3, bonus: 50 }] : i === 5 ? [{ n: 5, bonus: 100 }] : []);
  }
  assert.equal(db.wallets.find((w) => w.customerId === 'A').balance, 25 * 5 + 50 + 100);
  getConfig(db).milestones = [];
  assert.deepEqual(getConfig(db).milestones, []);
});

test('configured amounts and cap apply; legacy cash is preserved', () => {
  const db = testDb();
  cashWalletOf(db, 'A').balance = 35;
  getConfig(db).monthlyCap = 30;
  const first = friend(db, 'C'); first.order.status = 'DELIVERED';
  assert.equal(qualifyForOrder(db, first.order).credited, 25);
  const second = friend(db, 'D'); second.order.status = 'DELIVERED';
  assert.equal(qualifyForOrder(db, second.order).credited, 5);
  const third = friend(db, 'E'); third.order.status = 'DELIVERED';
  assert.equal(qualifyForOrder(db, third.order).capped, true);
  assert.equal(db.wallets.find((w) => w.customerId === 'E').balance, 20);
  assert.equal(cashWalletOf(db, 'A').balance, 35);
  assert.equal(monthEarned(db, 'A'), 30);
});

test('legacy pending referrals are still honored without awarding friend twice', () => {
  const db = testDb();
  db.referrals.push({ id: 'old', referrerId: 'A', refereeId: 'B', orderId: 'old-order', status: 'pending' });
  assert.equal(qualifyForOrder(db, { id: 'old-order', status: 'DELIVERED', paymentStatus: 'paid' }).credited, 25);
  assert.equal(db.wallets.some((w) => w.customerId === 'B'), false);
});

test('UPI id validation accepts VPA and mobile, rejects junk', () => {
  assert.equal(validUpiId('asharma@okhdfc'), 'asharma@okhdfc');
  assert.equal(validUpiId('9825011111'), '9825011111');
  assert.equal(validUpiId('not an id!!'), null);
  assert.equal(validUpiId(''), null);
  assert.equal(validUpiId('a@b'), null);
});
