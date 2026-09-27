import assert from 'node:assert/strict';
import { test } from 'node:test';
import { canUseOwnerTestPrint } from './owner-test.js';

test('owner test prints are limited to pickup, five sheets and available credits', () => {
  const user = { id: 'CUS-OWNER-TEST', ownerTestPrintsLeft: 3 };
  const order = { pages: 2, copies: 2, deliveryZone: 'pickup' };
  assert.equal(canUseOwnerTestPrint(user, order), true);
  assert.equal(canUseOwnerTestPrint({ ...user, ownerTestPrintsLeft: 0 }, order), false);
  assert.equal(canUseOwnerTestPrint({ ...user, id: 'CUS-OTHER' }, order), false);
  assert.equal(canUseOwnerTestPrint(user, { ...order, copies: 3 }), false);
  assert.equal(canUseOwnerTestPrint(user, { ...order, deliveryZone: 'vapi' }), false);
});
