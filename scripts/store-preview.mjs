// Local, in-memory shopping preview. No production data, emails, payments or printers.
import express from 'express';
import helmet from 'helmet';
import { blankDb } from '../lib/db.js';
import { DEMO_PRODUCTS, addPrint } from '../lib/store.js';
import { parseCookies } from '../lib/auth.js';
import { installStoreRoutes } from '../lib/store_routes.js';
import { layout } from '../lib/views.js';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

// Exercise the actual coupon policy shared by legacy print and basket checkouts.
const source = readFileSync(new URL('../server.mjs', import.meta.url), 'utf8');
export const couponPolicy = runInNewContext(source.slice(source.indexOf('function couponOrder('), source.indexOf('function couponOnce(')) + '\n({ couponOrder, validateCoupon });', { Date });

export function previewDb(real = false) {
  const db = blankDb();
  db.users = [{ id: 'preview-customer', role: 'customer', name: 'Sample customer', email: 'customer@example.test', phone: '9825011111' }, { id: 'preview-admin', role: 'admin', name: 'Sample shop owner', email: 'admin@example.test' }];
  db.products = structuredClone(DEMO_PRODUCTS).map((p) => ({ ...p, demo: !real }));
  db.addresses = [{ id: 'preview-address', customerId: 'preview-customer', name: 'Sample home', address: 'Demo address near Chala, Vapi', area: 'Vapi', pin: '396191', lat: 20.389722, lng: 72.889945 }];
  db.wallets = [{ customerId: 'preview-customer', balance: 1000 }];
  db.coupons = [{ code: 'DESK10', type: 'fixed', value: 10, minOrder: 10, active: true }];
  return db;
}

export function createStorePreview(seed = previewDb(), { preview = true, gateway = {}, fetchGateway } = {}) {
  let db = structuredClone(seed);
  const app = express(); app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
  app.use((_req, res, next) => { res.set('Referrer-Policy', 'strict-origin'); next(); });
  app.use(express.json()); app.use(express.urlencoded({ extended: false }));
  const loadDb = () => structuredClone(db), saveDb = (next) => { db = structuredClone(next); };
  const currentUser = (req) => { const role = parseCookies(req.headers.cookie).preview_role || 'customer'; return role === 'guest' ? null : db.users.find((u) => u.role === role); };
  const requireRole = (role) => (req, res, next) => { req.user = currentUser(req); if (!req.user) return res.redirect('/login'); if (req.user.role !== role) return res.sendStatus(403); next(); };
  const siteOrigin = runInNewContext(source.match(/function siteOrigin\(req, res, next\) \{[\s\S]*?\n\}/)[0] + '\nsiteOrigin;', { SITE: 'https://printkarr.in', URL });
  const restorePackQuota = (db, o) => { const sub = db.packSubs.find((s) => s.id === o.packSubId); if (sub && !o.packRestored) { sub[o.printType === 'color' ? 'colorUsed' : 'bwUsed'] -= o.pages * o.copies; o.packRestored = true; } };
  installStoreRoutes(app, { loadDb, saveDb, currentUser, requireRole, siteOrigin, validateCoupon: couponPolicy.validateCoupon, notifyState() {}, restorePackQuota, voidPendingForOrder() {}, qualifyForOrder() {}, gateway, preview, fetchGateway });
  app.get('/', (_req, res) => res.redirect('/stationery'));
  app.get('/preview/role/:role', (req, res) => { if (!['customer', 'admin', 'guest'].includes(req.params.role)) return res.sendStatus(404); res.cookie('preview_role', req.params.role, { httpOnly: true, sameSite: 'lax' }); res.redirect(req.params.role === 'admin' ? '/admin/catalogue' : '/stationery'); });
  app.get('/login', (_req, res) => { res.cookie('preview_role', 'customer', { httpOnly: true, sameSite: 'lax' }); res.redirect('/cart'); });
  app.get('/customer/orders/new', requireRole('customer'), (req, res) => res.send(layout({ user: req.user, title: 'Demo print', active: '/customer/orders/new', body: '<p class="eyebrow">LOCAL PREVIEW · NO PRINTER CONNECTED</p><h1 class="display">Add a sample <em>print.</em></h1><p>On the website, your normal PDF upload and print settings add a real document to the same cart. Here, use a fictional assignment to test the combined checkout.</p><form class="card" style="margin-top:24px" method="POST" action="/preview/print"><div class="field"><label for="pages">Sample pages at ₹2 each</label><input id="pages" name="pages" type="number" min="1" max="100" value="25" required></div><button class="btn loud" type="submit">Add demo assignment to cart →</button></form>' })));
  app.post('/preview/print', siteOrigin, requireRole('customer'), (req, res) => {
    const next = loadDb(), pages = Number(req.body.pages);
    if (!Number.isInteger(pages) || pages < 1 || pages > 100) return res.sendStatus(400);
    const id = `PK-DEMO-${next.orders.length + 1}`;
    next.orders.push({ id, customerId: req.user.id, status: 'CREATED', paymentStatus: 'pending', document: 'Demo assignment.pdf', pages, copies: 1, subtotal: pages * 2, total: pages * 2 + 15, sides: 'single', printType: 'bw', addressId: 'preview-address', deliveryZone: 'vapi', deliveryMode: 'express', deliveryFee: 15, history: [], createdAt: new Date().toISOString() });
    try { addPrint(next, req.user.id, id); saveDb(next); res.redirect('/cart'); } catch (error) { res.status(400).send(error.message); }
  });
  app.get(['/customer/profile', '/customer/wallet', '/customer/orders/:id', '/admin/orders/:id', '/contact'], (req, res) => res.send(layout({ user: currentUser(req) || db.users[0], title: 'Preview information', body: '<h1 class="display">This is a local <em>preview.</em></h1><p>The sample customer has an address and ₹1,000 of fictional wallet credit. Account management, real PDF uploads and printer operation use the existing website screens in production.</p><a class="btn loud" href="/cart">Back to cart →</a>' })));
  app.use(express.static('public', { index: false }));
  return { app, snapshot: () => structuredClone(db), reset: () => { db = structuredClone(seed); } };
}

if (process.argv[1]?.endsWith('store-preview.mjs')) {
  createStorePreview().app.listen(3131, '127.0.0.1', () => console.log('Interactive in-memory preview: http://127.0.0.1:3131/stationery\nShop owner: http://127.0.0.1:3131/preview/role/admin\nCustomer: http://127.0.0.1:3131/preview/role/customer'));
}
