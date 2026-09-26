import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PACKS, BOOKING_FEE, packById, coverFor, deductSides, dueOf, leftOf, usableOf, newSub } from './packs.js';

test('packs match the college bundle spec', () => {
  const s = packById('S'), m = packById('M'), l = packById('L');
  assert.equal(s.price, 329);
  assert.deepEqual([s.bw, s.color, s.files], [130, 10, 2]);
  assert.equal(s.market, 470);
  assert.deepEqual([m.bw, m.color, m.files, m.price, m.market], [250, 15, 4, 499, 800]);
  assert.deepEqual([l.bw, l.color, l.files, l.price, l.market], [400, 20, 5, 725, 1000]);
  assert.deepEqual([s.save, m.save, l.save], [30, 120, 200]);
  assert.equal(BOOKING_FEE, 199);
});

test('booking unlocks quota, installments clear due, usage tracks left/used', () => {
  const db = { packSubs: [] };
  const sub = newSub(packById('S'), 'CUS1', BOOKING_FEE);
  db.packSubs.push(sub);
  assert.equal(usableOf(sub), true);
  assert.equal(dueOf(sub), 329 - 199);
  // 24-page order covered by B&W quota
  assert.equal(coverFor(db, 'CUS1', 'bw', 24)?.id, sub.id);
  assert.equal(coverFor(db, 'CUS1', 'color', 11), null); // only 10 color
  deductSides(sub, 'bw', 24);
  assert.deepEqual([sub.bwUsed, leftOf(sub).bw], [24, 106]);
  sub.paidTotal += dueOf(sub);
  assert.equal(dueOf(sub), 0);
});

test('quota stays locked before ₹199 and picks oldest usable sub', () => {
  const db = { packSubs: [] };
  const thin = newSub(packById('S'), 'CUS1', 50);
  const full = newSub(packById('M'), 'CUS1', 499);
  db.packSubs.push(thin, full);
  assert.equal(usableOf(thin), false);
  assert.equal(coverFor(db, 'CUS1', 'bw', 10)?.packId, 'M');
});
