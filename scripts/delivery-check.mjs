import assert from 'node:assert/strict';
import { deliveryFeeFor, deliveryPoint } from '../lib/pricing.js';
import { blankDb } from '../lib/db.js';
import { campaignDefaults, deliveryPlan, batchPrice, walletOf } from '../lib/campus.js';
import { orderPage, phonePage } from '../lib/views_public.js';
import { optionsStep } from '../lib/views_order.js';
import { Script, runInNewContext } from 'node:vm';
import { readFileSync } from 'node:fs';
import crypto from 'node:crypto';
import { rangePages } from '../lib/pricing.js';
import { normPhone, normEmail } from '../lib/otp.js';
import { esc } from '../lib/views.js';

const pricing = { delivery: { sarigam: 15, bhilad: 30, vapi: 17, daman: 29 } };
const vapi = { lat: 20.389722, lng: 72.889945 };
const daman = { lat: 20.398424, lng: 72.89082 };
const lit = { lat: 20.27801, lng: 72.84171 };

assert.equal(deliveryFeeFor(pricing, 'vapi', vapi).fee, 17);
assert.equal(deliveryFeeFor(pricing, 'vapi', { lat: 20.375, lng: 72.89 }).fee, 17, 'Admin rate applies throughout the service area');
assert.equal(deliveryFeeFor(pricing, 'daman', daman).fee, 29);
assert.equal(deliveryFeeFor(pricing, 'vapi', daman).fee, 29, 'Area label cannot reduce the Dabhel fee');
assert.equal(deliveryFeeFor(pricing, 'daman', vapi).fee, 17, 'Pinned Chala destination uses the Vapi admin rate');
assert.equal(deliveryFeeFor({ delivery: { vapi: 0 } }, 'vapi', vapi).fee, 0, 'Zero is a valid admin rate');
assert.equal(deliveryFeeFor(pricing, 'pickup', null).fee, 0);
assert.equal(deliveryFeeFor(pricing, 'sarigam', lit, { campusId: 'lit', deliveryMode: 'batch' }).fee, 3);
assert.equal(deliveryFeeFor(pricing, 'sarigam', lit, { campusId: 'lit', deliveryMode: 'express' }).fee, 25);
assert.equal(deliveryFeeFor(pricing, 'sarigam', lit).fee, 15, 'Nearby addresses do not qualify for college delivery');
assert.equal(deliveryPoint('20.389722', '72.889945').lat, vapi.lat);
assert.equal(deliveryPoint('20.389722', '0'), null);
assert.throws(() => deliveryFeeFor(pricing, 'vapi', null));
assert.throws(() => deliveryFeeFor(pricing, 'daman', null));
assert.throws(() => deliveryFeeFor(pricing, 'vapi', { lat: 'oops', lng: 72.89 }));
assert.throws(() => deliveryFeeFor(pricing, 'sarigam', vapi));
assert.throws(() => deliveryFeeFor(pricing, 'vapi', vapi, { campusId: 'lit', deliveryMode: 'batch' }));
assert.throws(() => deliveryFeeFor({ delivery: { vapi: -1 } }, 'vapi', vapi));
assert.throws(() => deliveryFeeFor({ delivery: {} }, 'vapi', vapi));

const db = blankDb();
db.users.push({ id: 'A', phone: '+91 9825011111' }, { id: 'B', phone: '+91 9825011111' });
const morning = deliveryPlan(db, 'college', null, Date.parse('2026-10-01T00:30:00+05:30'));
assert.equal(morning.slotId, 'morning');
assert.equal(morning.campusId, 'lit');
assert.deepEqual(morning.campusPoint, lit);
const afternoon = deliveryPlan(db, 'college', null, Date.parse('2026-10-01T10:00:00+05:30'));
assert.equal(afternoon.slotId, 'afternoon', 'Pick the soonest batch without asking the customer');
const express = deliveryPlan(db, 'college-express');
assert.equal(express.deliveryMode, 'express');
assert.deepEqual(express.campusPoint, lit);
assert.deepEqual(batchPrice(db, 'A', morning, 10, 3), { fee: 0, firstBatchFree: true }, 'No wallet top-up needed');
db.orders.push({ customerId: 'A', campusId: 'lit', deliveryMode: 'batch', firstBatchFree: true, offerDevice: 'device', status: 'CREATED' });
assert.deepEqual(batchPrice(db, 'A', morning, 1000, 3), { fee: 3, firstBatchFree: false }, 'A large order still pays ₹3');
assert.equal(batchPrice(db, 'B', morning, 10, 3).fee, 3, 'Shared phone cannot claim the first delivery again');
assert.equal(batchPrice(db, 'C', { ...morning, offerDevice: 'device' }, 10, 3).fee, 3, 'Shared device cannot claim again');
walletOf(db, 'A').memberFreeBatch = true;
walletOf(db, 'A').memberUntil = new Date(Date.now() + 864e5).toISOString();
assert.equal(batchPrice(db, 'A', morning, 1000, 3).fee, 3, 'Wallet/pass benefits do not waive repeat LIT deliveries');
assert.equal(batchPrice(db, 'A', express, 1000, 25).fee, 25, 'Express always stays paid');
db.orders[0].status = 'CANCELLED';
assert.equal(batchPrice(db, 'A', morning, 10, 3).fee, 0, 'Cancellation releases the first delivery');
db.settings.campaign.delivery.enabled = false;
assert.throws(() => deliveryPlan(db, 'college'));
assert.throws(() => deliveryPlan(db, 'college-express'));

const campaign = campaignDefaults();
const user = { id: 'A', role: 'customer', name: 'Ani' };
const draft = { id: 'D', document: 'Notes.pdf', pages: 10, area: 'Sarigam', selections: morning };
for (const plan of [morning, express]) {
  const html = phonePage({ draft: { ...draft, selections: plan } });
  assert.doesNotMatch(html, /data-delivery-picker|name="address"|name="pin"|name="deliveryLat"/);
  assert.match(html, /No address, map or location proof needed/);
}
for (const area of ['Vapi', 'Daman']) {
  const html = phonePage({ draft: { ...draft, area, selections: deliveryPlan(db, 'express') } });
  assert.match(html, /data-delivery-picker/);
  assert.match(html, /name="address" required/);
  assert.match(html, /name="pin" required/);
}
for (const html of [orderPage({ draft, pricing, campaign }), optionsStep(user, draft, [], campaign, pricing)]) {
  assert.match(html, /name="deliverySlot" value="college"/);
  assert.match(html, /name="deliverySlot" value="college-express"/);
  assert.doesNotMatch(html, /<select[^>]+name="deliverySlot"|name="campusId"|Change settings or delivery area/);
  for (const [, script] of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) new Script(script);
}
// Exercise the real submission handlers against an in-memory database; no emails or files are written.
const source = readFileSync(new URL('../server.mjs', import.meta.url), 'utf8').replaceAll('\r\n', '\n');
function handler(route, store) {
  let result;
  const start = source.indexOf("app.post('" + route + "'");
  const end = source.indexOf('\napp.', start + 1);
  runInNewContext(source.match(/function zoneOf\(area\) \{[\s\S]*?\n\}/)[0] + '\n' + source.slice(start, end), {
    app: { post(...args) { result = args.at(-1); } }, requireRole() {}, otpLimiter: null,
    loadDb: () => store, saveDb() {}, deliveryPlan, campaignConfig: campaignDefaultsConfig,
    deliveryPoint, deliveryFeeFor, rangePages, normPhone, normEmail, esc, crypto,
    currentUser: () => null, parseCookies: () => ({ pk_guest: 'g' }),
    phonePage, orderPage, oops: (_user, _path, message) => message,
    requestEmailOtp: async () => ({ ok: true, demo: '123456' }), otpPage: () => 'verified-details'
  });
  return result;
}
function campaignDefaultsConfig(store) { return store.settings.campaign; }
const response = () => ({ code: 200, status(code) { this.code = code; return this; }, send(html) { this.html = html; }, redirect(url) { this.url = url; } });
for (const route of ['college', 'college-express', 'pickup']) {
  const store = blankDb();
  store.drafts = [{ ...draft, selections: null, customerId: user.id }];
  const res = response();
  handler('/customer/orders/new/confirm', store)({ user, body: { draft: draft.id, deliverySlot: route, nn_phone: '9825011111' } }, res);
  assert.equal(res.code, 200);
  assert.match(res.url, /summary/);
  assert.equal(store.addresses.length, 1);
  if (route !== 'pickup') assert.deepEqual(JSON.parse(JSON.stringify(store.drafts[0].selections.deliveryPoint)), lit);
}
for (const route of ['college', 'college-express', 'express']) {
  const store = blankDb(), plan = deliveryPlan(store, route);
  store.drafts = [{ ...draft, guest: 'g', selections: { ...plan, zone: route === 'express' ? 'vapi' : 'sarigam', area: route === 'express' ? 'Vapi' : 'Sarigam' } }];
  const req = { headers: {}, body: { draft: draft.id, name: 'Ani', email: 'ani@example.com', phone: '9825011111', address: 'House 1', pin: '396191' } };
  const submit = handler('/order/otp-request', store), res = response();
  await submit(req, res);
  assert.equal(res.code, route === 'express' ? 400 : 200, 'Only address delivery requires a customer pin');
  if (route !== 'express') assert.equal(store.drafts[0].contact.address, plan.campusAddress, 'College address is assigned by the server');
  else {
    req.body.deliveryLat = vapi.lat; req.body.deliveryLng = vapi.lng;
    const pinned = response(); await submit(req, pinned);
    assert.equal(pinned.html, 'verified-details');
    assert.deepEqual(store.drafts[0].contact.deliveryPoint, vapi);
  }
}
const store = blankDb();
const priceResponse = response();
handler('/admin/pricing', store)({ body: { dz_vapi: '12.50', dz_daman: '31' } }, priceResponse);
assert.equal(deliveryFeeFor(store.pricing, 'vapi', vapi).fee, 12.5);
assert.equal(deliveryFeeFor(store.pricing, 'daman', daman).fee, 31);
store.drafts = [{ ...draft, selections: null, customerId: user.id }];
const localRequest = { user, body: { draft: draft.id, deliverySlot: 'express', addressId: '__new', nn_phone: '9825011111', nn_address: 'House 1', nn_pin: '396191', nn_area: 'Vapi' } };
const noPin = response();
handler('/customer/orders/new/confirm', store)(localRequest, noPin);
assert.equal(noPin.code, 400);
localRequest.body.deliveryLat = vapi.lat; localRequest.body.deliveryLng = vapi.lng;
const withPin = response();
handler('/customer/orders/new/confirm', store)(localRequest, withPin);
assert.match(withPin.url, /summary/);
assert.equal(store.drafts[0].selections.zone, 'vapi');
console.log('Delivery pricing and submission checks passed.');
