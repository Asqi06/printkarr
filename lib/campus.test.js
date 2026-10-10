import { test } from 'node:test';
import assert from 'node:assert/strict';
import { blankDb } from './db.js';
import { campaignConfig, validateCampaign, walletOf, creditWallet, debitWallet, refundWallet, topupTerms, applyTopup, claimWalletFiles, fulfilWalletFiles, FILE_COLORS, deliveryPlan, batchPrice, settleWallets } from './campus.js';
import { consumeCollectToken, collectTokenFor } from './collect.js';
const DAY = 864e5;

test('149 wallet offer grants three files only after payment, accepts four colours and cannot duplicate or steal a claim', () => {
  const db = blankDb(), cfg = campaignConfig(db);
  cfg.wallets = cfg.wallets.filter((o) => o.id !== 'files'); // An existing saved campaign.
  assert.equal(campaignConfig(db).wallets.filter((o) => o.id === 'files').length, 1);
  assert.equal(campaignConfig(db).wallets.filter((o) => o.id === 'files').length, 1);
  const offer = cfg.wallets.find((o) => o.id === 'files');
  const terms = topupTerms(db, 'A', 149, 'files');
  assert.equal(terms.freeFiles, 3);
  assert.throws(() => claimWalletFiles(db, 'A', 'unpaid', 'orange'), /No free files/);
  offer.freeFiles = 6; // Pending payments retain the promised quantity.
  const tx = applyTopup(db, 'A', terms, 'Paid top-up', 'pay-files');
  assert.equal(walletOf(db, 'A').balance, 149);
  assert.deepEqual(tx.freeFiles, {quantity:3,color:null});
  assert.throws(() => applyTopup(db, 'A', terms, 'Replay', 'pay-files'), /already credited/);
  assert.equal(db.walletTx.filter((t) => t.freeFiles).length, 1);
  assert.throws(() => fulfilWalletFiles(db, 'A', tx.id, 'staff'), /choose a file colour/);
  for (const color of FILE_COLORS) assert.equal(claimWalletFiles(db, 'A', tx.id, color).color, color);
  for (const color of ['blue', '', null, ['red'], '<script>']) assert.throws(() => claimWalletFiles(db, 'A', tx.id, color), /Choose orange/);
  assert.throws(() => claimWalletFiles(db, 'B', tx.id, 'red'), /No free files/);
  assert.throws(() => fulfilWalletFiles(db, 'B', tx.id, 'staff'), /choose a file colour/);
  const gift = fulfilWalletFiles(db, 'A', tx.id, 'staff'), handedAt = gift.fulfilledAt;
  assert.equal(fulfilWalletFiles(db, 'A', tx.id, 'other-staff').fulfilledAt, handedAt);
  assert.equal(gift.fulfilledBy, 'staff');
  assert.throws(() => claimWalletFiles(db, 'A', tx.id, 'orange'), /already been handed over/);
  assert.equal(gift.quantity, 3);
  offer.freeFiles = 3;
  const second = applyTopup(db, 'A', topupTerms(db, 'A', 149), 'Another top-up', 'pay-files-two');
  assert.equal(second.freeFiles.quantity, 3);
  assert.equal(walletOf(db, 'A').balance, 298);
  offer.enabled = false;
  assert.equal(campaignConfig(db).wallets.find((o) => o.id === 'files').enabled, false);
  assert.throws(() => topupTerms(db, 'A', 149, 'files'), /unavailable/);
  assert.equal(topupTerms(db, 'A', 149).freeFiles, 0);
  for (const count of [-1, 1.5, 101, '3']) {
    offer.freeFiles = count; assert.throws(() => validateCampaign(cfg), /Invalid wallet offer/);
  }
});

test('all five offers credit their exact balances; first offer cannot repeat', () => {
  const db = blankDb();
  for (const [id, amount, balance] of [['first', 49, 59], ['trial', 99, 110], ['study', 199, 225], ['semester', 499, 575], ['power', 799, 950]]) {
    applyTopup(db, id, topupTerms(db, id, amount, id), 'Added');
    assert.equal(walletOf(db, id).balance, balance);
  }
  assert.equal(walletOf(db, 'first').freeFirstBatch, true);
  assert.throws(() => topupTerms(db, 'first', 49, 'first'), /already claimed/);
  assert.throws(() => topupTerms(db, 'new', 499, 'pass'), /unavailable/);
  for (const amount of [NaN, Infinity, -49, 0, 10001, 10.001]) assert.throws(() => topupTerms(db, 'new', amount));
  assert.equal(topupTerms(db, 'new', 10.29).amount, 10.29);
  assert.throws(() => topupTerms(db, 'new', 49, 'power'), /unavailable/);
});

test('gateway snapshots preserve bonuses, prevent payment reuse and first-offer replay', () => {
  const db = blankDb(), terms = topupTerms(db, 'new', 49, 'first');
  db.settings.campaign.wallets[0].bonus = 200;
  applyTopup(db, 'new', terms, 'Razorpay top-up', 'pay-one');
  assert.equal(walletOf(db, 'new').balance, 59);
  assert.throws(() => applyTopup(db, 'new', terms, 'Replay', 'pay-one'), /already credited/);
  applyTopup(db, 'new', terms, 'Second paid pending top-up', 'pay-two');
  assert.equal(walletOf(db, 'new').balance, 108, 'a second genuine payment returns principal but cannot repeat the first bonus');
});

test('bonus grants expire; purchased balance and non-expiring grants survive', () => {
  const db = blankDb(), now = Date.now();
  creditWallet(db, 'A', 100, 'Purchased', { source: 'topup', at: now });
  creditWallet(db, 'A', 20, 'Bonus', { validityDays: 1, at: now });
  creditWallet(db, 'A', 10, 'No expiry', { validityDays: 0, at: now });
  debitWallet(db, 'A', 5, 'Order', now);
  assert.equal(walletOf(db, 'A', now + DAY).balance, 110);
  assert.equal(walletOf(db, 'A', now + DAY).balance, 110);
  assert.throws(() => debitWallet(db, 'A', 111, 'Order', now + DAY), /Insufficient/);
});

test('refund restores the original grant expiry and cannot convert an expired bonus to purchased money', () => {
  const db = blankDb(), now = Date.now();
  creditWallet(db, 'A', 100, 'Purchased', { source: 'topup', at: now });
  const grant = creditWallet(db, 'A', 20, 'Bonus', { validityDays: 1, at: now });
  const tx = debitWallet(db, 'A', 30, 'Order', now);
  refundWallet(db, 'A', tx, 30, 'Refund', now + 1000);
  assert.equal(walletOf(db, 'A', now).balance, 120);
  assert.equal(grant.remaining, 20);
  refundWallet(db, 'A', tx, 30, 'Replay', now);
  assert.equal(walletOf(db, 'A', now).balance, 120);
  const next = debitWallet(db, 'A', 30, 'Order', now);
  refundWallet(db, 'A', next, 30, 'Refund', now + DAY);
  assert.equal(walletOf(db, 'A', now + DAY).balance, 100);
});

test('morning scheduling handles midnight, exact cutoff and India time', () => {
  const db = blankDb();
  const before = deliveryPlan(db, 'morning', 'lit', Date.parse('2026-10-01T00:59:59+05:30'));
  assert.equal(before.promisedBy, '2026-10-01T05:30:00.000Z');
  const after = deliveryPlan(db, 'morning', 'lit', Date.parse('2026-10-01T01:00:00+05:30'));
  assert.equal(after.promisedBy, '2026-10-02T05:30:00.000Z');
  const evening = deliveryPlan(db, 'morning', 'lit', Date.parse('2026-10-01T23:00:00+05:30'));
  assert.equal(evening.promisedBy, after.promisedBy);
  assert.throws(() => deliveryPlan(db, 'morning', 'unknown'));
  assert.throws(() => deliveryPlan(db, 'fake', 'lit'));
  db.settings.campaign.delivery.enabled = false;
  assert.throws(() => deliveryPlan(db, 'morning', 'lit'));
});

test('school delivery stays five rupees for first-wallet, pass and quantity benefits', () => {
  const db = blankDb(), batch = {deliveryMode:'batch',institutionDelivery:true};
  applyTopup(db,'A',topupTerms(db,'A',49,'first'),'Added');
  assert.deepEqual(batchPrice(db,'A',batch,10,15),{fee:5,firstBatchFree:false});
  db.orders.push({customerId:'A',firstBatchFree:true,status:'CREATED'});
  assert.equal(batchPrice(db,'A',batch,1000,0).fee,5);
  db.orders[0].status='CANCELLED';
  assert.equal(batchPrice(db,'A',batch,10,15).fee,5);
  assert.equal(batchPrice(db,'A',{...batch,deliveryMode:'express'},1000,25).fee,5);
  assert.equal(batchPrice(db,'other',{deliveryMode:'batch'},99,15).fee,0);
});

test('optional pass preserves its balance while school delivery stays flat', () => {
  const db = blankDb();
  db.settings.campaign.wallets.find((o) => o.id === 'pass').enabled = true;
  applyTopup(db, 'A', topupTerms(db, 'A', 499, 'pass'), 'Pass');
  assert.equal(walletOf(db, 'A').balance, 550);
  assert.equal(batchPrice(db, 'A', { deliveryMode: 'batch', institutionDelivery:true }, 1, 15).fee, 5);
  assert.equal(batchPrice(db, 'A', { deliveryMode: 'batch', institutionDelivery:true }, 1, 15, Date.now() + 91 * DAY).fee, 5);
  assert.equal(topupTerms(db, 'B', 499).offerId, 'semester');
});

test('late promises credit once, including restart catch-up; timely/unpaid/cancelled/late-paid orders earn nothing', () => {
  const db = blankDb(), at = Date.parse('2026-10-01T00:30:00+05:30');
  const plan = deliveryPlan(db, 'morning', 'lit', at);
  const order = { id: 'O1', customerId: 'A', ...plan, total: 10, status: 'PRINT_QUEUE', paymentStatus: 'paid', history: [{ to: 'CONFIRMED', at: new Date(at).toISOString() }] };
  db.orders.push(order);
  const deadline = Date.parse(plan.promisedBy);
  assert.equal(settleWallets(db, deadline), false);
  assert.equal(settleWallets(db, deadline + 1), true);
  assert.equal(walletOf(db, 'A', deadline + 1).balance, 20);
  assert.equal(settleWallets(db, deadline + 2), false);
  for (const [status, paymentStatus, paidAt, deliveredAt] of [
    ['DELIVERED', 'paid', at, deadline], ['CANCELLED', 'paid', at], ['PRINT_QUEUE', 'pending', at], ['PRINT_QUEUE', 'paid', Date.parse(plan.deliveryCutoffAt)]
  ]) {
    const fresh = blankDb();
    fresh.orders.push({ ...order, lateCreditedAt: null, status, paymentStatus, history: [{ to: 'CONFIRMED', at: new Date(paidAt).toISOString() }, ...(deliveredAt ? [{ to: 'DELIVERED', at: new Date(deliveredAt).toISOString() }] : [])] });
    assert.equal(settleWallets(fresh, deadline + DAY), false);
  }
  const late = blankDb();
  late.orders.push({ ...order, lateCreditedAt: null, status: 'DELIVERED', history: [...order.history, { to: 'DELIVERED', at: new Date(deadline + 1).toISOString() }] });
  assert.equal(settleWallets(late, deadline + DAY), true);
  const covered = blankDb();
  covered.orders.push({ ...order, total: 0, lateCreditedAt: null });
  assert.equal(settleWallets(covered, deadline + 1), true, 'fully covered paid orders retain their delivery guarantee');
});

test('admin validation rejects invalid configuration and accepts changed amounts, disabled offers and no expiry', () => {
  const cfg = campaignConfig(blankDb());
  cfg.bonusValidityDays = 0;
  cfg.wallets[0].amount = 59;
  cfg.wallets[0].bonus = 21;
  cfg.delivery.cutoff = '02:00';
  assert.equal(validateCampaign(cfg), cfg);
  for (const mutate of [
    (c) => c.wallets[0].amount = -1, (c) => c.wallets[0].enabled = 'yes',
    (c) => c.delivery.cutoff = '25:00', (c) => c.delivery.slots[0].end = '08:00',
    (c) => c.delivery.campuses[0].lat = 0, (c) => c.wallets.push(c.wallets[0])
  ]) { const bad = structuredClone(cfg); mutate(bad); assert.throws(() => validateCampaign(bad)); }
});

test('campus delivery cannot be marked collected through a kiosk QR', () => {
  const db = blankDb(), order = { id: 'O', status: 'READY_FOR_PICKUP', deliveryMode: 'batch', deliveryZone: 'sarigam' };
  const token = collectTokenFor(db, order.id);
  assert.equal(consumeCollectToken(db, token, order).error, 'not-pickup');
});

test('top-ups apply the flat tariff to unbound unpaid checkouts, preserving paid orders', () => {
  const db = blankDb();
  const first = { id: 'one', customerId: 'A', institutionDelivery:true, deliveryMode: 'batch', status: 'CREATED', subtotal: 10, total: 25, deliveryFee: 15, createdAt: '2026-10-01' };
  const next = { ...first, id: 'two', status: 'PAYMENT_PENDING', createdAt: '2026-10-02' };
  const paid = { ...first, id: 'paid', status: 'PRINT_QUEUE' };
  db.orders.push(first, next, paid);
  applyTopup(db, 'A', topupTerms(db, 'A', 49, 'first'), 'Added');
  assert.equal(first.total, 15);
  assert.equal(first.firstBatchFree, false);
  assert.equal(next.total, 15);
  assert.equal(paid.total, 25);
  db.settings.campaign.wallets.find((o) => o.id === 'pass').enabled = true;
  applyTopup(db, 'A', topupTerms(db, 'A', 499, 'pass'), 'Pass');
  assert.equal(next.total, 15);
  assert.equal(paid.total, 25);
});
