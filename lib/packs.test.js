import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PACKS, BOOKING_FEE, packById, coverFor, deductSides, dueOf, leftOf, usableOf, newSub, ensurePackSubs } from './packs.js';

test('packs match the college bundle spec', () => {
  const s = packById('S'), m = packById('M'), l = packById('L');
  assert.equal(s.price, 329);
  assert.deepEqual([s.bw, s.color, s.files], [130, 30, 2]);
  assert.equal(s.market, 460);
  assert.deepEqual([m.bw, m.color, m.files, m.price, m.market], [250, 45, 4, 499, 825]);
  assert.deepEqual([l.bw, l.color, l.files, l.price, l.market], [400, 60, 5, 725, 1225]);
  assert.deepEqual([s.save, m.save, l.save], [131, 326, 500]);
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
  assert.equal(coverFor(db, 'CUS1', 'color', 60), sub); // 30 included + 30 using 90 B&W sides
  assert.equal(coverFor(db, 'CUS1', 'color', 74), null);
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


test('colour-heavy work uses included quota first, then B&W exchange without double spending', () => {
  const sub=newSub(packById('S'),'CUS1',199), db={packSubs:[sub],orders:[]};
  deductSides(sub,'color',60);
  assert.equal(sub.colorUsed,60); assert.equal(leftOf(sub).bw,40); assert.equal(leftOf(sub).color,0);
  assert.equal(coverFor(db,'CUS1','mixed',{bw:10,color:10}),sub);
  assert.equal(coverFor(db,'CUS1','mixed',{bw:11,color:10}),null);
  assert.throws(()=>deductSides(sub,'mixed',{bw:11,color:10}),/cannot cover/);
  assert.equal(sub.colorUsed,60); assert.equal(sub.bwUsed,0,'Rejected deduction does not consume quota');
  deductSides(sub,'mixed',{bw:10,color:10}); assert.equal(leftOf(sub).bw,0);
  assert.equal(coverFor(db,'CUS1','color',1),null);
  sub.colorUsed-=10;sub.bwUsed-=10;assert.equal(leftOf(sub).bw,40,'Refund returns the exchange and direct B&W use');
});

test('L covers 60 colour and 400 B&W together, while unpaid orders reserve exchanged quota', () => {
  const sub=newSub(packById('L'),'CUS1',199), db={packSubs:[sub],orders:[]};
  assert.equal(coverFor(db,'CUS1','mixed',{bw:400,color:60}),sub);
  db.orders.push({id:'pending',packSubId:sub.id,status:'CREATED',pages:160,printType:'color',copies:1});
  assert.equal(coverFor(db,'CUS1','bw',100),sub);
  assert.equal(coverFor(db,'CUS1','bw',101),null);
  db.orders[0].status='CANCELLED';assert.equal(coverFor(db,'CUS1','bw',400),sub);
});

test('existing standard packs upgrade once without resetting usage, payments or file claims', () => {
  for(const [id,bw,color] of [['S',130,10],['M',250,15],['L',400,20]]) {
    const sub={packId:id,bwTotal:bw,colorTotal:color,bwUsed:24,colorUsed:8,filesUsed:1,paidTotal:199};
    const db={packSubs:[sub]}; ensurePackSubs(db);ensurePackSubs(db);
    assert.equal(sub.colorTotal,packById(id).color);assert.equal(sub.colorSwapRate,3);
    assert.deepEqual([sub.bwUsed,sub.colorUsed,sub.filesUsed,sub.paidTotal],[24,8,1,199]);
  }
  const custom={packId:'S',bwTotal:10,colorTotal:2};ensurePackSubs({packSubs:[custom]});assert.equal(custom.colorTotal,2);
});
