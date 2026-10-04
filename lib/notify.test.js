import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import crypto from 'node:crypto';
import express from 'express';
import { blankDb } from './db.js';
import { addNotification, notifyAdmins, scheduleCustomerNotes, runNotificationJobs } from './notify.js';
import { applyTopup, topupTerms } from './campus.js';
import { installNotificationRoutes } from './notify_routes.js';

const now = Date.parse('2026-10-04T10:00:00Z'), hour = 3600e3, day = 24 * hour;
function fixture() {
  const db = blankDb();
  db.users = [{ id: 'C', role: 'customer', name: 'Ani', email: 'ani@example.test', lastLoginAt: new Date(now - 2 * hour).toISOString(), notificationPrefs: { email: true } }, { id: 'A', role: 'admin', name: 'Admin' }];
  return db;
}
function worker(db, extra = {}) {
  let stored = structuredClone(db);
  return { options: { now, readDb: () => structuredClone(stored), writeDb: (value) => { stored = structuredClone(value); }, persist: async () => {}, configured: () => true, send: async () => ({ ok: true }), ...extra }, get db() { return stored; }, change(fn) { fn(stored); } };
}

test('reminders respect delay, one-week cooldown, active customers and opt-in email', () => {
  const db = fixture();
  assert.equal(scheduleCustomerNotes(db, now - 1.5 * hour), 0);
  assert.equal(scheduleCustomerNotes(db, now), 1);
  assert.equal(db.notifications[0].kind, 'reminder');
  assert.match(db.notifications[0].text, /₹49 wallet top-up \+ ₹10 bonus/);
  assert.equal(db.notifications[0].email.status, 'pending');
  assert.equal(scheduleCustomerNotes(db, now), 0);
  db.users[0].lastLoginAt = new Date(now + hour).toISOString();
  assert.equal(scheduleCustomerNotes(db, now + 2 * hour), 0);
  assert.equal(scheduleCustomerNotes(db, now + 8 * day), 1);
  const off = fixture(); off.users[0].notificationPrefs.offers = false;
  assert.equal(scheduleCustomerNotes(off, now), 0);
  delete off.users[0].notificationPrefs;
  assert.equal(scheduleCustomerNotes(off, now), 1); assert.equal(off.notifications[0].email, undefined);
  const old = fixture(); old.users[0].lastLoginAt = new Date(now - 31 * day).toISOString();
  assert.equal(scheduleCustomerNotes(old, now), 0);
  const demo = fixture(); demo.users[0].email = 'customer@demo.printkarr.in';
  scheduleCustomerNotes(demo, now); assert.equal(demo.notifications[0].email, undefined);
});

test('paid orders and shared baskets stop no-order reminders; unpaid baskets do not', () => {
  for (const table of ['orders', 'purchases']) {
    const db = fixture();
    db.settings.notifications = { walletOffers: false };
    db[table].push({ customerId: 'C', paymentStatus: 'paid', paidAt: new Date(now - hour).toISOString() });
    assert.equal(scheduleCustomerNotes(db, now), 0);
    db[table][0].paymentStatus = 'pending';
    assert.equal(scheduleCustomerNotes(db, now), 1);
  }
  const db = fixture(); db.walletTx.push({ customerId: 'C', kind: 'credit', source: 'topup', amount: 49 });
  scheduleCustomerNotes(db, now); assert.doesNotMatch(db.notifications[0].text, /First Wallet Offer/);
});

test('all successful logins share the session hook; paid order alerts deduplicate; top-up replay emits nothing', () => {
  let db = fixture();
  const auth = readFileSync(new URL('./auth.js', import.meta.url), 'utf8');
  const scope = { crypto, loadDb: () => db, saveDb: (value) => { db = value; }, notifyAdmins };
  runInNewContext(auth.slice(auth.indexOf('export function createSession'), auth.indexOf('export function getSessionUser')).replace('export ', ''), scope);
  const token = scope.createSession('C');
  assert.ok(db.users[0].lastLoginAt); assert.equal(db.notifications[0].kind, 'login');
  assert.ok(!JSON.stringify(db.notifications).includes(token));
  scope.createSession('A'); assert.equal(db.notifications.length, 1);
  const source = readFileSync(new URL('./notify.js', import.meta.url), 'utf8');
  const state = { ...scope, addNotification };
  runInNewContext(source.slice(source.indexOf('export function notifyState')).replace('export ', ''), state);
  const order = { id: 'PK1', customerId: 'C', status: 'CONFIRMED', total: 49 };
  state.notifyState(order); state.notifyState({ ...order, status: 'PRINT_QUEUE' });
  assert.equal(db.notifications.filter((n) => n.kind === 'order').length, 1);
  assert.equal(db.notifications.filter((n) => n.customerId === 'C').length, 2);
  applyTopup(db, 'C', topupTerms(db, 'C', 49), 'Paid', 'pay-one');
  const length = db.notifications.length;
  assert.throws(() => applyTopup(db, 'C', topupTerms(db, 'C', 99), 'Replay', 'pay-one'), /already credited/);
  assert.equal(db.notifications.length, length);
  assert.equal(db.notifications.filter((n) => n.kind === 'wallet' && n.customerId === 'A').length, 1);
});

test('email queue persists before delivery, includes unsubscribe, survives concurrent edits, and never repeats sent mail', async () => {
  let sends = 0, w;
  w = worker(fixture(), { send: async (to, mail) => {
    sends++;
    assert.equal(w.db.notifications[0].email.status, 'sending');
    assert.equal(to, 'ani@example.test'); assert.match(mail.html, /unsubscribe\/[a-f0-9]{48}/);
    w.change((db) => { db.orders.push({ id: 'concurrent-order' }); db.users[0].name = 'Updated while sending'; });
    return { ok: true };
  } });
  await runNotificationJobs(w.options); await runNotificationJobs(w.options);
  assert.equal(sends, 1); assert.equal(w.db.notifications[0].email.status, 'sent');
  assert.equal(w.db.orders[0].id, 'concurrent-order'); assert.equal(w.db.users[0].name, 'Updated while sending');
});

test('pending emails recheck unsubscribe, payments, switches, and current offer terms', async () => {
  for (const change of [db => { db.users[0].notificationPrefs.email = false; }, db => { db.orders.push({ customerId: 'C', paymentStatus: 'paid', paidAt: new Date(now).toISOString() }); }, db => { db.settings.notifications = { email: false }; }, db => { db.settings.campaign.wallets[0].enabled = false; }, db => { db.settings.campaign.wallets[0].bonus = 500; }]) {
    const db = fixture(); scheduleCustomerNotes(db, now); change(db);
    let sends = 0;
    const w = worker(db, { send: async () => { sends++; return { ok: true }; } });
    await runNotificationJobs(w.options);
    assert.equal(sends, 0); assert.equal(w.db.notifications[0].email.status, 'cancelled');
  }
});

test('provider failures retry on schedule, unconfigured email stays queued, interrupted send is not duplicated', async () => {
  let sends = 0;
  const w = worker(fixture(), { send: async () => { sends++; throw new Error('Provider unavailable'); } });
  await runNotificationJobs(w.options); await runNotificationJobs(w.options);
  assert.equal(sends, 1);
  await runNotificationJobs({ ...w.options, now: now + hour });
  await runNotificationJobs({ ...w.options, now: now + 2 * hour });
  assert.equal(sends, 3); assert.equal(w.db.notifications[0].email.status, 'failed');
  const unconfigured = worker(fixture(), { configured: () => false });
  await runNotificationJobs(unconfigured.options); assert.equal(unconfigured.db.notifications[0].email.status, 'pending');
  unconfigured.change((db) => { db.notifications[0].email.status = 'sending'; db.notifications[0].email.startedAt = new Date(now - hour).toISOString(); });
  await runNotificationJobs(unconfigured.options); assert.equal(unconfigured.db.notifications[0].email.status, 'unknown');
});

test('HTTP inbox/read endpoints enforce recipient and role, preferences validate, unsubscribe GET has no side effects', async () => {
  const db = fixture(); scheduleCustomerNotes(db, now);
  addNotification(db, { customerId: 'A', kind: 'login', text: 'Admin-only activity', key: 'private' });
  const app = express(); app.use(express.json()); app.use(express.urlencoded({ extended: false }));
  const currentUser = req => db.users.find((u) => u.id === req.get('x-test-user'));
  installNotificationRoutes(app, { loadDb: () => db, saveDb() {}, currentUser, siteOrigin: (_req, _res, next) => next(), requireRole: role => (req, res, next) => { req.user = currentUser(req); if (req.user?.role !== role) return res.sendStatus(403); next(); } });
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const request = (path, user, body) => fetch(base + path, { method: body ? 'POST' : 'GET', headers: { 'x-test-user': user || '', 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) });
  try {
    assert.equal((await request('/api/notifications')).status, 401);
    const response = await request('/api/notifications', 'C'), data = await response.json();
    assert.match(response.headers.get('cache-control'), /no-store/); assert.equal(data.notes.length, 1); assert.equal(data.notes[0].key, undefined); assert.equal(data.notes[0].email, undefined);
    await request('/api/notifications/read', 'C', { id: db.notifications[1].id }); assert.equal(db.notifications[1].read, false);
    await request('/api/notifications/read', 'C', { all: true }); assert.equal(db.notifications[0].read, true); assert.equal(db.notifications[1].read, false);
    assert.equal((await request('/admin/notifications', 'C')).status, 403);
    assert.equal((await request('/admin/notifications/settings', 'A', { delayHours: 'NaN' })).status, 400);
    assert.match(await (await request('/admin/notifications', 'A')).text(), /Enable sound/);
    const url = `/notifications/unsubscribe/${db.users[0].notificationUnsubscribe}`;
    assert.equal((await request(url)).status, 200); assert.equal(db.users[0].notificationPrefs.email, true);
    await request(url, '', {}); assert.equal(db.users[0].notificationPrefs.email, false);
    assert.equal((await request('/notifications/unsubscribe/bad')).status, 404);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
