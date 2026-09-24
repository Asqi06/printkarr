import assert from 'node:assert/strict';
import { deliveryFeeFor, deliveryPoint } from '../lib/pricing.js';

const pricing = { delivery: { sarigam: 15, bhilad: 30 } };
const vapi = { lat: 20.389722, lng: 72.889945 };
const daman = { lat: 20.398424, lng: 72.89082 };

assert.equal(deliveryFeeFor(pricing, 'vapi', vapi).fee, 10);
assert.equal(deliveryFeeFor(pricing, 'vapi', { lat: 20.375, lng: 72.89 }).fee, 15);
assert.equal(deliveryFeeFor(pricing, 'daman', daman).fee, 20);
assert.equal(deliveryFeeFor(pricing, 'vapi', daman).fee, 20, 'Area label cannot reduce the Dabhel fee');
assert.equal(deliveryFeeFor(pricing, 'daman', vapi).fee, 10, 'The pinned Chala point sets the local fee');
assert.equal(deliveryFeeFor(pricing, 'daman', { lat: 20.45, lng: 72.89 }).fee, 30);
assert.equal(deliveryFeeFor(pricing, 'daman', { lat: 20.5, lng: 72.89 }).fee, 45);
assert.equal(deliveryFeeFor(pricing, 'daman', { lat: 20.55, lng: 72.89 }).fee, 60);
assert.equal(deliveryFeeFor(pricing, 'vapi', { lat: 20.39, lng: 73.08 }).fee, 60);
assert.equal(deliveryFeeFor(pricing, 'pickup', null).fee, 0);
assert.equal(deliveryFeeFor({ delivery: { sarigam: 100 } }, 'sarigam', { lat: 20.27801, lng: 72.84171 }).fee, 60);
assert.equal(deliveryPoint('20.389722', '72.889945').lat, vapi.lat);
assert.equal(deliveryPoint('20.389722', '0'), null);
assert.throws(() => deliveryFeeFor(pricing, 'sarigam', vapi));
assert.throws(() => deliveryFeeFor(pricing, 'vapi', null));
assert.throws(() => deliveryFeeFor(pricing, 'vapi', { lat: 'oops', lng: 72.89 }));
console.log('Delivery pricing checks passed.');
