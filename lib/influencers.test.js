import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { blankDb } from './db.js';
import { influencerStats } from './influencers.js';
import { couponsPage } from './views_admin.js';
import { cartFor, setQuantity, addPrint, cartQuote, createPurchase, confirmPurchase, cancelPurchase } from './store.js';
import { topupTerms, applyTopup } from './campus.js';
import { validateReferral, createReferral, qualifyForOrder, referralDiscountFor } from './referrals.js';

const source = readFileSync(new URL('../server.mjs', import.meta.url), 'utf8');
const policy = runInNewContext(source.slice(source.indexOf('function couponOrder('), source.indexOf('function couponOnce(')) + '\n({validateCoupon});');
const validate = policy.validateCoupon;
const selection = { addressId: 'home', deliverySlot: 'express' };
function dbForTest() {
  const db = blankDb();
  db.users = [{ id: 'C', role: 'customer', name: 'Customer', phone: '9825011111', email: 'customer@example.test' }, { id: 'A', role: 'admin', name: 'Admin' }];
  db.addresses = [{ id: 'home', customerId: 'C', address: 'Sample road', area: 'Vapi', lat: 20.389722, lng: 72.889945 }];
  db.wallets = [{ customerId: 'C', balance: 1000 }];
  db.products = [{ id: 'pen', name: 'Pen', price: 100, stock: 10, active: true, colors: [] }];
  db.coupons = [{ code: 'RIYA10', type: 'fixed', value: 10, minOrder: 10, active: true, influencer: '@riya' }];
  return db;
}
function print(db, id, code = null, discount = 0, subtotal = 50) {
  const o = { id, customerId: 'C', status: 'CREATED', paymentStatus: 'pending', subtotal, total: subtotal, pages: 25, copies: 1, printType: 'bw', document: 'Sample.pdf', history: [], couponCode: code, couponDiscount: discount, influencer: code ? '@riya' : null };
  db.orders.push(o); addPrint(db, 'C', id); return o;
}

test('admin creates influencer or regular coupons, rejects referral collisions and invalid inputs', () => {
  const db = dbForTest(), routes = new Map(); db.users[0].referralCode = 'FRIEND';
  runInNewContext(source.slice(source.indexOf("app.post('/admin/coupons',"), source.indexOf("app.post('/admin/coupons/toggle',")), {
    app: { post: (path, ...handlers) => routes.set(path, handlers.at(-1)) }, requireRole() {}, siteOrigin() {}, loadDb: () => db, saveDb() {}, oops: (_u, _p, text) => text
  });
  const create = (body) => {
    const res = { statusCode: 200, status(n) { this.statusCode = n; return this; }, send(text) { this.text = text; }, redirect(url) { this.url = url; } };
    routes.get('/admin/coupons')({ user: db.users[1], body: { code: 'NEW10', type: 'fixed', value: 10, minOrder: 0, expiry: '2099-12-31', influencer: ' @riya ', ...body } }, res); return res;
  };
  assert.equal(create({}).url, '/admin/coupons'); assert.equal(db.coupons.at(-1).influencer, '@riya');
  assert.equal(create({ code: 'REGULAR', influencer: '' }).url, '/admin/coupons'); assert.equal(db.coupons.at(-1).influencer, null);
  for (const body of [{ code: 'FRIEND' }, { code: 'new10' }, { code: 'X'.repeat(21) }, { code: 'CHECK', influencer: 'x'.repeat(81) }, { code: 'CHECK', expiry: '2099-02-30' }, { code: 'CHECK', value: 'Infinity' }, { code: 'CHECK', minOrder: -1 }]) assert.equal(create(body).statusCode, 400);
});

test('generated friend codes avoid coupons, users and prior referrals on every candidate', () => {
  const referralSource = readFileSync(new URL('./referrals.js', import.meta.url), 'utf8');
  let calls = 0;
  const scope = { crypto: { randomInt: () => Math.floor(calls++ / 6) }, CODE_ALPHA: 'ABCDEFGHJKMNPQRSTUVWXYZ23456789' };
  runInNewContext(referralSource.slice(referralSource.indexOf('export function genCode'), referralSource.indexOf('export function codeFor')).replace('export ', ''), scope);
  assert.equal(scope.genCode({ users: [{ referralCode: 'BBBBBB' }], referrals: [{ code: 'CCCCCC' }], coupons: [{ code: 'AAAAAA' }] }), 'DDDDDD');
});

test('basket attribution comes from coupon validation, stays frozen and counts a mixed checkout once', () => {
  const db = dbForTest(), cart = cartFor(db, 'C');
  print(db, 'PK1'); setQuantity(db, cart, 'pen', '', 1);
  const p = createPurchase(db, cart, 'C', { ...selection, coupon: ' riya10 ', influencer: 'spoofed' }, validate);
  assert.equal(p.influencer, '@riya'); assert.equal(p.couponDiscount, 10);
  assert.equal(influencerStats(db)[0].customers, 0, 'An unpaid checkout is not a conversion');
  db.coupons[0].influencer = '@renamed'; db.coupons[0].active = false;
  assert.equal(validate(db, p.couponCode, p.subtotal, 'C', p.id).influencer, '@riya');
  assert.equal(confirmPurchase(db, p, 'wallet', null, validate), true);
  assert.equal(confirmPurchase(db, p, 'wallet', null, validate), false);
  const row = influencerStats(db).find((r) => r.name === '@riya');
  assert.equal(row.customers, 1); assert.equal(row.newCustomers, 1); assert.equal(row.orders, 1); assert.equal(row.sales, p.total); assert.equal(row.discounts, 10);
  assert.equal(db.referrals.length, 0);
});

test('multiple print coupons in one shared basket deduplicate customers/checkouts and refunds remove conversions', () => {
  const db = dbForTest(), cart = cartFor(db, 'C');
  db.coupons.push({ ...db.coupons[0], code: 'RIYA20', value: 20, influencer: '@RIYA' });
  print(db, 'PK1', 'RIYA10', 10, 80); print(db, 'PK2', 'RIYA20', 20, 120);
  const p = createPurchase(db, cart, 'C', selection, validate); confirmPurchase(db, p, 'wallet', null, validate);
  let row = influencerStats(db)[0];
  assert.equal(row.customers, 1); assert.equal(row.newCustomers, 1); assert.equal(row.orders, 1); assert.equal(row.sales, 185); assert.equal(row.discounts, 30); assert.deepEqual(row.codes, ['RIYA10', 'RIYA20']);
  cancelPurchase(db, p, 'C', () => {}, () => {});
  row = influencerStats(db)[0]; assert.equal(row.customers, 0); assert.equal(row.orders, 0); assert.equal(row.sales, 0); assert.equal(row.discounts, 0); assert.equal(row.refunded, 1);
});

test('zero-discount print coupons cannot be stacked with a cart coupon', () => {
  const db = dbForTest(), cart = cartFor(db, 'C');
  print(db, 'FREE', 'RIYA10', 0); db.coupons.push({ ...db.coupons[0], code: 'CART10' });
  assert.throws(() => cartQuote(db, cart, 'C', { ...selection, coupon: 'CART10' }, validate), /print already has a coupon/);
  db.orders[0].couponCode = null; db.orders[0].couponDiscount = 10;
  assert.throws(() => cartQuote(db, cart, 'C', { ...selection, coupon: 'CART10' }, validate), /print already has a coupon/, 'Legacy discount-only records still block a second coupon');
});

test('returning customers, ordinary coupons, unpaid cancellations and demo payments have distinct counts', () => {
  const db = dbForTest();
  const order = { id: 'first', customerId: 'C', status: 'DELIVERED', paymentStatus: 'paid', total: 40, createdAt: '2026-01-01T00:00:00Z' };
  db.orders.push(order, { ...order, id: 'return', influencer: '@riya', couponCode: 'RIYA10', couponDiscount: 10, createdAt: '2026-02-01T00:00:00Z' }, { ...order, id: 'demo', customerId: 'D', influencer: '@riya', paymentStatus: 'demo' }, { ...order, id: 'unpaid-cancel', influencer: '@riya', status: 'CANCELLED', paymentStatus: 'pending' });
  const row = influencerStats(db)[0];
  assert.equal(row.customers, 1); assert.equal(row.newCustomers, 0); assert.equal(row.orders, 1); assert.equal(row.refunded, 0);
  db.users[0].referralCode = 'FRIEND'; assert.match(validate(db, 'friend', 100, 'other').error, /referral field/);
});

test('influencer discounts coexist with actual friend referral credit without creating influencer rewards', () => {
  const db = dbForTest(); db.users.push({ id: 'R', role: 'customer', referralCode: 'FRIEND' });
  assert.equal(validateReferral(db, db.users[0], 'FRIEND', 99).ok, true);
  const tx = applyTopup(db, 'C', topupTerms(db, 'C', 99), 'Paid top-up', 'test-payment');
  const ref = createReferral(db, { referrerId: 'R', refereeId: 'C', code: 'FRIEND', sourceKind: 'topup', sourceId: tx.id });
  const o = { id: 'PK1', customerId: 'C', status: 'DELIVERED', paymentStatus: 'paid', total: 90, couponCode: 'RIYA10', couponDiscount: 10, influencer: '@riya', createdAt: new Date().toISOString() }; db.orders.push(o);
  assert.equal(referralDiscountFor(db, 100, 0, 10), 0, 'Current friend reward is wallet credit, not another instant discount');
  assert.equal(qualifyForOrder(db, o).credited, 25); assert.equal(ref.status, 'qualified');
  assert.equal(db.walletTx.filter((t) => t.customerId === 'C' && t.source === 'referral').reduce((s, t) => s + t.amount, 0), 20);
  assert.equal(qualifyForOrder(db, o).credited, 0);
  assert.equal(influencerStats(db)[0].customers, 1); assert.equal(db.walletTx.some((t) => t.source === 'influencer'), false);
});

test('admin report escapes names/handles and displays conversion metrics', () => {
  const db = dbForTest(); db.coupons[0].influencer = '<script>alert(1)</script>';
  const html = couponsPage(db.users[1], db.coupons, influencerStats(db));
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/); assert.ok(!html.includes('<script>alert(1)</script>'));
  for (const label of ['Unique customers', 'New customers', 'Paid checkouts', 'Net sales', 'Cancelled / refunded', 'name="influencer"']) assert.ok(html.includes(label), label);
});
