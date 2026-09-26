import { test } from 'node:test';
import assert from 'node:assert/strict';
import { kioskLive, effectiveLive } from './kiosk.js';

const dbOff = { settings: { kiosk: { live: false } } };
const dbOn = { settings: { kiosk: { live: true } } };
const dbOld = { settings: {} };

test('toggle reads the kiosk flag, missing flag means demo', () => {
  assert.equal(kioskLive(dbOn), true);
  assert.equal(kioskLive(dbOff), false);
  assert.equal(kioskLive(dbOld), false);
  assert.equal(kioskLive({}), false);
});

test('live needs env or (toggle + gateway); toggle alone never pays fake-live', () => {
  assert.equal(effectiveLive({ envLive: true, gatewayOn: false, kioskLive: false }), true);
  assert.equal(effectiveLive({ envLive: false, gatewayOn: true, kioskLive: true }), true);
  assert.equal(effectiveLive({ envLive: false, gatewayOn: false, kioskLive: true }), false);
  assert.equal(effectiveLive({ envLive: false, gatewayOn: true, kioskLive: false }), false);
});
