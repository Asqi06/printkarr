import 'dotenv/config';
import crypto from 'node:crypto';
import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { rateLimit } from 'express-rate-limit';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import multer from 'multer';
import { loadDb, saveDb } from './lib/db.js';
import { transition, canTransition, nextStates } from './lib/machine.js';
import { quote, rangePages } from './lib/pricing.js';
import { notifyState } from './lib/notify.js';
import { requestOtp, verifyOtp, normPhone } from './lib/otp.js';
import { bonusFor, isFirstOrder } from './lib/pricing.js';
import { janitor } from './lib/janitor.js';
import {
  COOKIE, verifyCredentials, createSession, getSessionUser,
  destroySession, parseCookies, demoLoginOn
} from './lib/auth.js';
import { layout, loginPage, loginOtpPage, staffLoginPage } from './lib/views.js';
import { customerDashboard, ordersList, orderDetail } from './lib/views_customer.js';
import { uploadStep, optionsStep, summaryStep, payStep, walletPage, profilePage } from './lib/views_order.js';
import { landing, orderPage, phonePage, otpPage } from './lib/views_public.js';
import QRCode from 'qrcode';
import { adminDashboard, orderQueue, adminOrderDetail, printQueuePage, customersPage, customerDetailAdmin, pricingPage, couponsPage, analyticsPage, settingsPage, classroomQr } from './lib/views_admin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = __dirname;
const PUBLIC = path.join(ROOT, 'public');
const PORT = process.env.PORT || 3000;
const HOME = { customer: '/customer', admin: '/admin' };

// Google sign-in (production). Set GOOGLE_CLIENT_ID/SECRET to enable;
// the button hides itself when keys are absent (local demo unaffected).
const GOOGLE = {
  id: process.env.GOOGLE_CLIENT_ID || '',
  secret: process.env.GOOGLE_CLIENT_SECRET || ''
};

// WhatsApp order forwarding needs NO api key — just your number in
// international format, digits only (e.g. 919876543210).
const OWNER_WA = (process.env.OWNER_WHATSAPP_NUMBER || '').replace(/\D/g, '');

// Razorpay (optional). Keys set → real checkout appears on the pay page;
// absent → simulated methods only. Never commit these.
const RAZORPAY = {
  id: process.env.RAZORPAY_KEY_ID || '',
  secret: process.env.RAZORPAY_KEY_SECRET || ''
};

// Live mode: production + real gateway keys. Only real money moves —
// Razorpay and cash on delivery. Simulated UPI/wallet top-ups are refused.
const LIVE_PAY = process.env.NODE_ENV === 'production' && !!(RAZORPAY.id && RAZORPAY.secret);

const oauthStates = new Map(); // state -> expiresAt (CSRF guard, 10 min)

function googleRedirectUri(req) {
  return `${req.protocol}://${req.get('host')}/auth/google/callback`;
}

const loginView = (err) => loginPage(err, !!GOOGLE.id, demoLoginOn());

// Live-map config — Leaflet + OpenStreetMap needs no API keys.
// Override tiles (e.g. Mapbox) or hub via env; no code change required.
const HUB = {
  lat: Number(process.env.HUB_LAT) || 20.2825,
  lng: Number(process.env.HUB_LNG) || 72.8349,
  label: 'Printkarr Hub · Sarigam'
};
const TILES = process.env.MAP_TILES_URL || 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
const TILE_ATTR = process.env.MAP_ATTRIBUTION || '© OpenStreetMap contributors © CARTO';
const TILES_FALLBACK = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTR_FALLBACK = '© OpenStreetMap contributors';

// Approximate drop area: deterministic pseudo-offset from the hub so the
// map shows *something* without a geocoding service. Labelled approximate.
function pseudoDrop(addr, seedStr) {
  const s = `${addr.address || ''}|${addr.area || ''}|${seedStr}`;
  let h = 0;
  for (const ch of s) h = ((h * 31 + ch.charCodeAt(0)) >>> 0);
  const ang = ((h % 360) * Math.PI) / 180;
  const km = 0.8 + (((h >> 9) % 42) / 10);
  const cosLat = Math.cos((HUB.lat * Math.PI) / 180);
  return {
    lat: +(HUB.lat + ((km * Math.cos(ang)) / 111)).toFixed(5),
    lng: +(HUB.lng + ((km * Math.sin(ang)) / (111 * cosLat))).toFixed(5),
    approxKm: +km.toFixed(1)
  };
}

// Time-boxed public PDF link for one order (7 days). Lets a wa.me message
// carry the actual file with zero login and zero WhatsApp API key.
function shareTokenFor(db, orderId) {
  db.shareTokens ||= [];
  const now = Date.now();
  db.shareTokens = db.shareTokens.filter((t) => Date.parse(t.expiresAt) > now);
  let tok = db.shareTokens.find((t) => t.orderId === orderId);
  if (!tok) {
    tok = {
      token: crypto.randomBytes(16).toString('hex'),
      orderId,
      expiresAt: new Date(now + 7 * 864e5).toISOString()
    };
    db.shareTokens.push(tok);
  }
  return tok.token;
}

function baseUrl(req) {
  return `${req.protocol}://${req.get('host')}`;
}

// Full order brief → wa.me chat with the owner. No API key involved.
function waForwardUrl(db, req, order) {
  if (!OWNER_WA) return null;
  const c = db.users.find((u) => u.id === order.customerId) || {};
  const a = db.addresses.find((x) => x.id === order.addressId) || {};
  const tok = shareTokenFor(db, order.id);
  const lines = [
    `New Printkarr order ${order.id}`,
    `- ${order.document} (${order.pages} pages x${order.copies})`,
    `- ${order.printType === 'bw' ? 'B&W' : 'Color'}, ${order.sides}, ${order.paper || 'A4'}${order.pageRange ? `, pages ${order.pageRange}` : ''}`,
    `- Customer: ${c.name || ''} ${c.phone || ''}`,
    `- Drop: ${[a.address, a.area, a.pin].filter(Boolean).join(', ') || order.slot || ''}`,
    `- Slot: ${order.slot || ''}`,
    `- Printing Rs.${order.subtotal}, Delivery Rs.${order.deliveryFee}${order.couponDiscount ? `, Coupon -Rs.${order.couponDiscount}` : ''}, Total Rs.${order.total} (${order.paymentStatus})`,
    `- PDF: ${baseUrl(req)}/share/${tok}`
  ];
  if (order.notes) lines.splice(4, 0, `- Note: ${order.notes}`);
  return `https://wa.me/${OWNER_WA}?text=${encodeURIComponent(lines.join('\n'))}`;
}

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1); // correct req.protocol/secure cookies behind Render/Railway/nginx
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'tiny'));

// Brute-force guard on the front door; generous API ceiling for normal use.
const loginLimiter = rateLimit({ windowMs: 60_000, max: 20, standardHeaders: 'draft-7', legacyHeaders: false });
const otpLimiter = rateLimit({ windowMs: 60_000, max: 10, standardHeaders: 'draft-7', legacyHeaders: false });
const apiLimiter = rateLimit({ windowMs: 60_000, max: 300, standardHeaders: 'draft-7', legacyHeaders: false });
app.use('/api/', apiLimiter);
app.use(express.json({ limit: '256kb' }));
app.use(express.urlencoded({ extended: false }));

// ---- Never serve internals: only public/ reaches the user ----
app.get(['/*.md', '/server.mjs', '/package.json', '/package-lock.json'], (_req, res) =>
  res.status(404).send('Not found')
);
app.get(['/data/*', '/lib/*'], (_req, res) => res.status(404).send('Not found'));

function currentUser(req) {
  return getSessionUser(parseCookies(req.headers.cookie)[COOKIE]);
}

const LOGIN_FOR = { customer: '/login', admin: '/admin/login' };
function requireRole(role) {
  return (req, res, next) => {
    const user = currentUser(req);
    if (!user) return res.redirect(LOGIN_FOR[role] || '/login');
    if (user.role !== role) {
      return res.status(403).send(
        layout({
          title: 'Forbidden', user, active: HOME[user.role],
          body: `<p class="eyebrow">403</p><h1 class="display" style="font-size:clamp(2rem,6vw,4rem)">Not your<br><em>counter.</em></h1><a class="btn solid" style="margin-top:18px" href="${HOME[user.role]}"><span>← Back to your dashboard</span></a>`
        })
      );
    }
    req.user = user;
    next();
  };
}

// ---- Auth (§3) ----
app.get('/login', (req, res) => {
  const user = currentUser(req);
  if (user) return res.redirect(HOME[user.role] || '/');
  res.send(loginView(null));
});

function sessionCookie(req, token) {
  const secure = req.protocol === 'https' ? '; Secure' : '';
  return `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${secure}`;
}

const isAdminEmail = (email) => {
  const norm = String(email||'').trim().toLowerCase();
  const envAdmin = String(process.env.ADMIN_EMAIL||'').trim().toLowerCase();
  return envAdmin && norm === envAdmin;
};
app.post('/login', loginLimiter, (req, res) => {
  const emailNorm = String(req.body.email||'').trim().toLowerCase();
  // If this email is the configured owner admin, force admin session (even if a customer copy exists)
  if (isAdminEmail(emailNorm)) {
    const db = loadDb();
    const admin = db.users.find(u => u.role === 'admin' && u.email.toLowerCase() === emailNorm);
    if (admin && admin.password === String(req.body.password||'')) {
      const token = createSession(admin.id);
      res.setHeader('Set-Cookie', sessionCookie(req, token));
      return res.redirect('/admin');
    }
  }
  const user = verifyCredentials(req.body.email, req.body.password);
  if (!user) {
    return res.status(401).send(loginView(demoLoginOn() ? 'No match in demo accounts — tap a role card above.' : 'No match — check your email and password.'));
  }
  // Admin emails always land as admin, regardless of which login form was used
  const target = user.role === 'admin' ? '/admin' : '/customer';
  const token = createSession(user.id);
  res.setHeader('Set-Cookie', sessionCookie(req, token));
  res.redirect(target);
});

function staffLogin(role) {
  const home = HOME[role];
  const mkPage = (err) => staffLoginPage(role, err, !!GOOGLE.id);
  return {
    show: (req, res) => {
      const user = currentUser(req);
      if (user) return res.redirect(HOME[user.role] || '/');
      res.send(mkPage(null));
    },
    run: (req, res) => {
      const user = verifyCredentials(req.body.email, req.body.password);
      if (!user || user.role !== role) return res.status(401).send(mkPage('No match — check your email and password.'));
      const token = createSession(user.id);
      res.setHeader('Set-Cookie', sessionCookie(req, token));
      res.redirect(home);
    }
  };
}
const adminLogin = staffLogin('admin');
app.get('/admin/login', adminLogin.show);
app.post('/admin/login', loginLimiter, adminLogin.run);



app.get('/auth/google', (req, res) => {
  if (!GOOGLE.id) return res.redirect('/login');
  const state = crypto.randomBytes(16).toString('hex');
  oauthStates.set(state, Date.now() + 10 * 60_000);
  res.setHeader('Set-Cookie', `g_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600${req.protocol === 'https' ? '; Secure' : ''}`);
  const params = new URLSearchParams({
    client_id: GOOGLE.id,
    redirect_uri: googleRedirectUri(req),
    response_type: 'code',
    scope: 'openid email profile',
    state,
    prompt: 'select_account'
  });
  res.redirect('https://accounts.google.com/o/oauth2/v2/auth?' + params.toString());
});

app.get('/auth/google/callback', async (req, res) => {
  const fail = () => res.status(401).send(loginView('Google could not verify you — try again or sign in with email.'));
  try {
    if (!GOOGLE.id || !GOOGLE.secret) return fail();
    const cookies = parseCookies(req.headers.cookie);
    const { code, state } = req.query;
    const exp = oauthStates.get(state);
    oauthStates.delete(state);
    if (!code || !state || !exp || exp < Date.now() || cookies.g_state !== state) return fail();
    const tok = await (await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code, client_id: GOOGLE.id, client_secret: GOOGLE.secret,
        redirect_uri: googleRedirectUri(req), grant_type: 'authorization_code'
      })
    })).json();
    if (!tok.access_token) return fail();
    const info = await (await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tok.access_token}` }
    })).json();
    const email = String(info.email || '').toLowerCase();
    if (!email || info.email_verified === false) return fail();
    const db = loadDb();
    if (isAdminEmail(email)) {
      let admin = db.users.find(u => u.role === 'admin' && u.email.toLowerCase() === email);
      if (!admin) {
        admin = { id: 'ADM-' + Date.now().toString(36), role: 'admin', name: String(info.name || email.split('@')[0]).slice(0,60), email, password: null, phone: '', student: false };
        db.users.push(admin); saveDb(db);
      }
      const token = createSession(admin.id);
      res.setHeader('Set-Cookie', sessionCookie(req, token));
      return res.redirect('/admin');
    }
    let user = db.users.find((u) => u.email.toLowerCase() === email);

    if (!user) {
      user = {
        id: 'CUS-g' + Date.now().toString(36), role: 'customer',
        name: String(info.name || email.split('@')[0]).slice(0, 60),
        email, password: null, phone: '', student: false
      };
      db.users.push(user);
      if (!db.wallets.some((w) => w.customerId === user.id)) db.wallets.push({ customerId: user.id, balance: 0 });
      saveDb(db);
    }
    const token = createSession(user.id);
    res.setHeader('Set-Cookie', sessionCookie(req, token));
    res.redirect(HOME[user.role] || '/');
  } catch { return fail(); }
});

app.post('/logout', (req, res) => {
  destroySession(parseCookies(req.headers.cookie)[COOKIE]);
  const secure = req.protocol === 'https' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`);
  res.redirect('/login');
});

// ---- Admin (§26–§37) ----
function validateCoupon(db, code, subtotal) {
  const c = (db.coupons || []).find((x) => x.code === String(code || '').trim().toUpperCase());
  if (!c) return { ok: false, error: 'Unknown code.' };
  if (!c.active) return { ok: false, error: 'Code disabled.' };
  if (c.expiry && c.expiry < new Date().toISOString().slice(0, 10)) return { ok: false, error: 'Code expired.' };
  if (subtotal < (c.minOrder || 0)) return { ok: false, error: `Needs ₹${c.minOrder}+ order.` };
  const discount = c.type === 'percent'
    ? Math.round((subtotal * c.value) / 100 * 100) / 100
    : Math.min(c.value, subtotal);
  return { ok: true, discount, code: c.code };
}

const FILTER_FN = {
  all: () => true,
  new: (o) => ['CREATED', 'PAYMENT_PENDING'].includes(o.status),
  printing: (o) => ['CONFIRMED', 'PRINT_QUEUE', 'PRINTING'].includes(o.status),
  ready: (o) => ['PRINTED', 'READY_FOR_PICKUP'].includes(o.status),
  completed: (o) => ['DELIVERED', 'REFUNDED'].includes(o.status),
  cancelled: (o) => ['CANCELLED', 'PAYMENT_FAILED', 'PRINT_FAILED', 'DELIVERY_FAILED'].includes(o.status)
};

function liveCounts(orders) {
  const inS = (...ss) => orders.filter((o) => ss.includes(o.status)).length;
  return {
    printing: inS('PRINTING'),
    ready: inS('PRINTED', 'READY_FOR_PICKUP'),
    delivered: inS('DELIVERED')
  };
}

app.get('/admin', requireRole('admin'), (req, res) => {
  const db = loadDb();
  const now = new Date().toISOString();
  const todays = db.orders.filter((o) => sameDay(o.createdAt, now));
  const counts = liveCounts(db.orders);
  res.send(adminDashboard(req.user, {
    today: todays.length,
    printing: counts.printing, ready: counts.ready,
    delivered: todays.filter((o) => o.status === 'DELIVERED').length,
    revenue: todays.filter((o) => o.paymentStatus === 'paid').reduce((s, o) => s + o.total, 0),
    pages: todays.reduce((s, o) => s + o.pages * o.copies, 0)
  }));
});

app.get('/admin/orders', requireRole('admin'), (req, res) => {
  const db = loadDb();
  const filter = FILTER_FN[req.query.filter] ? req.query.filter : 'all';
  const q = String(req.query.q || '').trim().toLowerCase();
  let rows = [...db.orders].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')).filter(FILTER_FN[filter]);
  if (q) {
    rows = rows.filter((o) => {
      const c = db.users.find((u) => u.id === o.customerId) || {};
      return o.id.toLowerCase().includes(q) || (c.name || '').toLowerCase().includes(q) || (c.email || '').toLowerCase().includes(q);
    });
  }
  res.send(orderQueue(req.user, {
    filter, q: req.query.q || '',
    rows: rows.map((o) => {
      const c = db.users.find((u) => u.id === o.customerId) || {};
      return { ...o, cname: c.name || '?' };
    })
  }));
});

app.get('/admin/orders/:id', requireRole('admin'), (req, res) => {
  const db = loadDb();
  const o = db.orders.find((x) => x.id === req.params.id);
  if (!o) return res.status(404).send(oops(req.user, '/admin/orders', 'Order <em>not found.</em>'));
  const c = db.users.find((u) => u.id === o.customerId) || {};
  const a = db.addresses.find((x) => x.id === o.addressId) || {};
  const waUrl = waForwardUrl(db, req, o);
  saveDb(db);
  res.send(adminOrderDetail(req.user, o, c, a, nextStates(o.status).filter(s => s !== 'RIDER_ASSIGNED'), waUrl, agentSeenAt));
});

app.post('/admin/orders/:id/transition', requireRole('admin'), (req, res) => {
  const db = loadDb();
  const o = db.orders.find((x) => x.id === req.params.id);
  if (!o) return res.status(404).send(oops(req.user, '/admin/orders', 'Order <em>not found.</em>'));
  const to = req.body.to;
  if (!canTransition(o.status, to) || to === 'RIDER_ASSIGNED') {
    return res.status(400).send(oops(req.user, `/admin/orders/${o.id}`, 'Illegal <em>move.</em>'));
  }
  try { transition(o, to, { by: req.user.id }); }
  catch { return res.status(400).send(oops(req.user, `/admin/orders/${o.id}`, 'Illegal <em>move.</em>')); }
  if (to === 'PRINTED') {
    const pr = db.printers[0];
    if (pr) {
      pr.paper = Math.max(5, pr.paper - Math.ceil((o.pages * o.copies) / 10));
      pr.ink = Math.max(5, pr.ink - (o.printType === 'color' ? 4 : 1));
      pr.currentJob = o.id;
    }
  }
  saveDb(db);
  notifyState(o);
  res.redirect(`/admin/orders/${o.id}`);
});

function safeOrderId(id) {
  const s = String(id || '').trim();
  if (!/^PK-\d{3,}$/.test(s)) return null;
  return s;
}
app.get('/admin/orders/:id/file', requireRole('admin'), (req, res) => {
  const safe = safeOrderId(req.params.id);
  if (!safe) return res.status(400).send(oops(req.user, '/admin/orders', 'Bad <em>ID.</em>'));
  const p = path.join(ROOT, 'data', 'uploads', `${safe}.pdf`);
  if (!fs.existsSync(p)) return res.status(404).send(oops(req.user, '/admin/orders', 'File <em>missing.</em>'));
  res.download(p, `${safe}.pdf`);
});

// §47 route map: printer status lives inside the print queue — canonical redirect.
app.get('/admin/printers', requireRole('admin'), (_req, res) => {
  res.redirect('/admin/print-queue');
});

app.get('/admin/qr', requireRole('admin'), (req, res) => {
  res.send(classroomQr(req.user, `${req.protocol}://${req.get('host')}/order`));
});

app.get('/admin/print-queue', requireRole('admin'), (req, res) => {
  const db = loadDb();
  const rank = { PRINTING: 0, PRINT_QUEUE: 1, CONFIRMED: 2 };
  const jobs = db.orders
    .filter((o) => ['CONFIRMED', 'PRINT_QUEUE', 'PRINTING'].includes(o.status))
    .sort((a, b) => (rank[a.status] - rank[b.status]) || (a.createdAt || '').localeCompare(b.createdAt || ''));
  const printer = db.printers[0] || { name: 'Epson L3250', online: true, ink: 80, paper: 70, currentJob: null };
  const oldest = db.orders.filter((o) => o.status === 'PRINTING').sort((a, b) => (a.updatedAt || '').localeCompare(b.updatedAt || ''))[0];
  printer.currentJob = oldest ? oldest.id : printer.currentJob;
  res.send(printQueuePage(req.user, jobs, printer));
});

app.get('/admin/customers', requireRole('admin'), (req, res) => {
  const db = loadDb();
  const rows = db.users.filter((u) => u.role === 'customer').map((c) => {
    const co = db.orders.filter((o) => o.customerId === c.id);
    const w = db.wallets.find((x) => x.customerId === c.id);
    return {
      id: c.id, name: c.name, count: co.length,
      spent: co.filter((o) => o.paymentStatus === 'paid').reduce((s, o) => s + o.total, 0),
      wallet: w ? w.balance : 0
    };
  });
  res.send(customersPage(req.user, rows));
});

app.get('/admin/customers/:id', requireRole('admin'), (req, res) => {
  const db = loadDb();
  const c = db.users.find((u) => u.id === req.params.id && u.role === 'customer');
  if (!c) return res.status(404).send(oops(req.user, '/admin/customers', 'Customer <em>unknown.</em>'));
  const orders = db.orders.filter((o) => o.customerId === c.id).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  const wallet = db.wallets.find((x) => x.customerId === c.id) || { balance: 0 };
  res.send(customerDetailAdmin(req.user, c, orders, wallet, db.addresses.filter((a) => a.customerId === c.id)));
});

app.get('/admin/pricing', requireRole('admin'), (req, res) => {
  res.send(pricingPage(req.user, loadDb().pricing));
});

app.post('/admin/pricing', requireRole('admin'), (req, res) => {
  const db = loadDb();
  const num = (v, fb) => {
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : fb;
  };
  const p = db.pricing;
  p.bw = num(req.body.bw, p.bw);
  p.color = num(req.body.color, p.color);
  p.studentBw = num(req.body.studentBw, p.studentBw);
  p.studentColor = num(req.body.studentColor, p.studentColor);
  for (const z of ['sarigam', 'campus', 'vapi', 'bhilad', 'pickup']) {
    p.delivery[z] = num(req.body['dz_' + z], p.delivery[z]);
  }
  p.freeAbove = num(req.body.freeAbove, p.freeAbove);
  saveDb(db);
  res.redirect('/admin/pricing');
});

app.get('/admin/coupons', requireRole('admin'), (req, res) => {
  res.send(couponsPage(req.user, loadDb().coupons || []));
});

app.post('/admin/coupons', requireRole('admin'), (req, res) => {
  const db = loadDb();
  const code = String(req.body.code || '').trim().toUpperCase().slice(0, 20);
  const value = Number(req.body.value);
  const type = req.body.type === 'fixed' ? 'fixed' : 'percent';
  if (!/^[A-Z0-9]{3,20}$/.test(code) || !(value > 0) || (db.coupons || []).some((c) => c.code === code)) {
    return res.status(400).send(oops(req.user, '/admin/coupons', 'Bad or duplicate <em>code.</em>'));
  }
  if (type === 'percent' && value > 100) return res.status(400).send(oops(req.user, '/admin/coupons', 'Percent must be <em>≤100.</em>'));
  if (type === 'fixed' && value > 500) return res.status(400).send(oops(req.user, '/admin/coupons', 'Fixed discount max <em>₹500.</em>'));
  db.coupons ||= [];
  db.coupons.push({
    code, type,
    value: Math.round(value * 100) / 100,
    minOrder: Math.max(0, Number(req.body.minOrder) || 0),
    expiry: req.body.expiry || '2099-12-31', active: true
  });
  saveDb(db);
  res.redirect('/admin/coupons');
});

app.post('/admin/coupons/toggle', requireRole('admin'), (req, res) => {
  const db = loadDb();
  const c = (db.coupons || []).find((x) => x.code === req.body.code);
  if (c) c.active = !c.active;
  saveDb(db);
  res.redirect('/admin/coupons');
});

app.get('/admin/analytics.csv', requireRole('admin'), (req, res) => {
  const db = loadDb();
  const header = 'orderId,customer,document,pages,copies,type,sides,status,total,createdAt\n';
  const rows = db.orders.map(o => {
    const c = db.users.find(u => u.id === o.customerId) || {};
    const escCsv = s => `"${String(s||'').replace(/"/g,'""')}"`;
    return [o.id, c.name||c.email||'', o.document, o.pages, o.copies, o.printType, o.sides, o.status, o.total, o.createdAt].map(escCsv).join(',');
  }).join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="printkarr-orders.csv"');
  res.send(header + rows);
});

app.get('/admin/analytics', requireRole('admin'), (req, res) => {
  const db = loadDb();
  const now = new Date().toISOString();
  const paid = db.orders.filter((o) => o.paymentStatus === 'paid');
  const inDay = (at) => sameDay(at, now);
  const orders = db.orders;
  const delivs = orders.filter((o) => o.status === 'DELIVERED');
  const avgMs = delivs.length ? delivs.reduce((s, o) => s + (Date.parse(o.updatedAt) - Date.parse(o.createdAt)), 0) / delivs.length : 0;
  const perCust = {};
  orders.forEach((o) => { perCust[o.customerId] = (perCust[o.customerId] || 0) + 1; });
  const pages = orders.filter((o) => !['CANCELLED'].includes(o.status)).reduce((s, o) => s + o.pages * o.copies, 0);
  res.send(analyticsPage(req.user, {
    salesToday: paid.filter((o) => inDay(o.createdAt)).reduce((s, o) => s + o.total, 0),
    salesWeek: paid.filter((o) => Date.parse(now) - Date.parse(o.createdAt) < 7 * 864e5).reduce((s, o) => s + o.total, 0),
    pages,
    bw: orders.filter((o) => o.printType === 'bw').reduce((s, o) => s + o.pages * o.copies, 0),
    color: orders.filter((o) => o.printType === 'color').reduce((s, o) => s + o.pages * o.copies, 0),
    done: orders.filter((o) => ['DELIVERED', 'REFUNDED'].includes(o.status)).length,
    cancelled: orders.filter((o) => o.status === 'CANCELLED').length,
    live: orders.filter((o) => !['DELIVERED', 'REFUNDED', 'CANCELLED'].includes(o.status)).length,
    total: orders.length,
    repeat: Object.values(perCust).filter((n) => n > 1).length,
    customers: Object.keys(perCust).length,
    avgHrs: Math.round((avgMs / 36e5) * 10) / 10
  }));
});

app.get('/admin/settings', requireRole('admin'), (req, res) => {
  const db = loadDb();
  const demos = db.users.filter((u) => u.email.toLowerCase().endsWith('@demo.printkarr.in'));
  res.send(settingsPage(req.user, db.settings, demos));
});

// Remove one demo account. Never yourself (no lockouts); orders are kept.
app.post('/admin/demos/remove', requireRole('admin'), (req, res) => {
  const db = loadDb();
  const d = db.users.find((u) => u.id === req.body.id && u.email.toLowerCase().endsWith('@demo.printkarr.in'));
  if (!d || d.id === req.user.id) {
    return res.status(400).send(oops(req.user, '/admin/settings', 'Can\'t remove <em>that one.</em>'));
  }
  db.users = db.users.filter((u) => u.id !== d.id);
  db.sessions = (db.sessions || []).filter((s) => s.userId !== d.id);
  saveDb(db);
  res.redirect('/admin/settings');
});

app.post('/admin/settings', requireRole('admin'), (req, res) => {
  const db = loadDb();
  const s = db.settings;
  s.business.name = String(req.body.name || s.business.name).slice(0, 60);
  s.business.phone = String(req.body.phone || '').slice(0, 20);
  s.business.email = String(req.body.email || '').slice(0, 80);
  s.business.address = String(req.body.address || '').slice(0, 200);
  s.hours = String(req.body.hours || s.hours).slice(0, 80);
  s.order.maxFileMb = Math.max(1, parseInt(req.body.maxFileMb, 10) || s.order.maxFileMb);
  s.order.maxPages = Math.max(1, parseInt(req.body.maxPages, 10) || s.order.maxPages);
  s.order.minTotal = Math.max(0, Number(req.body.minTotal) || 0);
  saveDb(db);
  res.redirect('/admin/settings');
});

// ---- Customer (§5–§19) ----
function maxUploadBytes() {
  const db = loadDb();
  return Math.max(1, db.settings?.order?.maxFileMb || 50) * 1024 * 1024;
}
const upload = multer({
  dest: 'data/uploads/',
  limits: { fileSize: 200 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!/\.pdf$/i.test(file.originalname)) return cb(new Error('Only PDF files for now — DOCX, JPG and PPTX come later.'));
    cb(null, true);
  }
});

function countPdfPages(buf) {
  const m = buf.toString('latin1').match(/\/Type\s*\/Page[^s]/g);
  return m ? m.length : 0;
}
function nextOrderId(db) {
  let max = 1023;
  for (const o of db.orders) {
    const m = /(\d+)/.exec(o.id || '');
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return 'PK-' + (max + 1);
}
function walletOf(db, customerId) {
  let w = db.wallets.find((x) => x.customerId === customerId);
  if (!w) { w = { customerId, balance: 0 }; db.wallets.push(w); }
  return w;
}
function zoneOf(area) {
  const a = String(area || '').toLowerCase();
  if (a.includes('vapi')) return 'vapi';
  if (a.includes('bhilad')) return 'bhilad';
  if (a.includes('pickup') || a.includes('classroom')) return 'pickup';
  return 'sarigam';
}
function custOrders(db, customerId) {
  return db.orders
    .filter((o) => o.customerId === customerId)
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
}
function oops(user, active, msg) {
  return layout({
    title: 'Hmm', user, active,
    body: `<p class="eyebrow rv">Couldn't do that</p>
      <h1 class="display rv" style="font-size:clamp(2rem,6vw,3.4rem)">${msg}</h1>
      <a class="btn solid rv" style="margin-top:18px" href="${active}"><span>← Back</span></a>`
  });
}
const ACTIVE = (o) => !['DELIVERED', 'REFUNDED', 'CANCELLED'].includes(o.status);

app.get('/customer', requireRole('customer'), (req, res) => {
  const db = loadDb();
  const mine = custOrders(db, req.user.id);
  const current = mine.find(ACTIVE) || mine[0] || null;
  const notes = (db.notifications || []).filter((n) => n.customerId === req.user.id).sort((a, b) => b.at.localeCompare(a.at));
  const lastDoc = mine.find((o) => !current || o.id !== current.id) || null;
  res.send(customerDashboard(req.user, { current, pricing: db.pricing, notes, lastDoc }));
});

app.get('/customer/orders', requireRole('customer'), (req, res) => {
  const db = loadDb();
  const tab = ['active', 'completed', 'cancelled'].includes(req.query.tab) ? req.query.tab : 'active';
  const mine = custOrders(db, req.user.id);
  const groups = {
    active: mine.filter((o) => ACTIVE(o)),
    completed: mine.filter((o) => ['DELIVERED', 'REFUNDED'].includes(o.status)),
    cancelled: mine.filter((o) => o.status === 'CANCELLED')
  };
  res.send(ordersList(req.user, {
    tab, counts: { active: groups.active.length, completed: groups.completed.length, cancelled: groups.cancelled.length },
    orders: groups[tab]
  }));
});

app.get('/customer/orders/new', requireRole('customer'), (req, res) => {
  if (req.query.draft) {
    const db = loadDb();
    const d = (db.drafts || []).find((x) => x.id === req.query.draft && x.customerId === req.user.id);
    if (!d) return res.status(404).send(oops(req.user, '/customer/orders', 'That draft <em>expired.</em>'));
    const addresses = db.addresses.filter((a) => a.customerId === req.user.id);
    return res.send(optionsStep(req.user, d, addresses));
  }
  res.send(uploadStep(req.user));
});

app.post('/customer/orders/new/upload', requireRole('customer'), upload.single('doc'), (req, res) => {
  if (!req.file) return res.status(400).send(oops(req.user, '/customer/orders/new', 'No file <em>arrived.</em>'));
  if (req.file.size > maxUploadBytes()) {
    try { fs.unlinkSync(req.file.path); } catch {}
    return res.status(400).send(oops(req.user, '/customer/orders/new', 'File too <em>heavy.</em>'));
  }
  let pages = 0;
  try {
    pages = countPdfPages(fs.readFileSync(req.file.path));
  } catch { pages = 0; }
  if (!pages) {
    try { fs.unlinkSync(req.file.path); } catch {}
    return res.status(400).send(oops(req.user, '/customer/orders/new', 'Empty or unreadable <em>PDF.</em>'));
  }
  if (pages > 1000) {
    try { fs.unlinkSync(req.file.path); } catch {}
    return res.status(400).send(oops(req.user, '/customer/orders/new', 'Over 1000 pages — <em>split it.</em>'));
  }
  const db = loadDb();
  db.drafts ||= [];
  const draft = {
    id: 'D' + Date.now().toString(36), customerId: req.user.id,
    document: req.file.originalname.slice(0, 120), stored: req.file.filename,
    pages, createdAt: new Date().toISOString()
  };
  db.drafts.push(draft);
  saveDb(db);
  res.redirect(`/customer/orders/new?draft=${draft.id}`);
});

app.post('/customer/orders/new/confirm', requireRole('customer'), (req, res) => {
  const db = loadDb();
  const d = (db.drafts || []).find((x) => x.id === req.body.draft && x.customerId === req.user.id);
  if (!d) return res.status(404).send(oops(req.user, '/customer/orders', 'That draft <em>expired.</em>'));
  const copies = Math.max(1, Math.min(200, parseInt(req.body.copies, 10) || 1));
  const printType = req.body.printType === 'color' ? 'color' : 'bw';
  const sides = req.body.sides === 'single' ? 'single' : 'double';
  const r = rangePages(req.body.range, d.pages);
  if (!r.valid) return res.status(400).send(oops(req.user, `/customer/orders/new?draft=${d.id}`, 'Page range <em>confused us.</em>'));
  let address;
  if (req.body.addressId === '__new') {
    if (!req.body.nn_address || !req.body.nn_phone || !req.body.nn_pin) {
      return res.status(400).send(oops(req.user, `/customer/orders/new?draft=${d.id}`, 'New address needs <em>address, phone, PIN.</em>'));
    }
    address = {
      id: 'ADR' + Date.now().toString(36), customerId: req.user.id,
      label: 'Home', name: req.body.nn_name || req.user.name, phone: req.body.nn_phone,
      address: req.body.nn_address, area: req.body.nn_area || 'Sarigam',
      landmark: req.body.nn_landmark || '', pin: req.body.nn_pin, isDefault: false
    };
    db.addresses.push(address);
  } else {
    address = db.addresses.find((a) => a.id === req.body.addressId && a.customerId === req.user.id);
    if (!address) return res.status(400).send(oops(req.user, `/customer/orders/new?draft=${d.id}`, 'Pick a <em>delivery address.</em>'));
  }
  const zone = zoneOf(address.area);
  const slotKind = ['ASAP', 'Today', 'Tomorrow', 'Schedule'].includes(req.body.slotKind) ? req.body.slotKind : 'Today';
  d.selections = {
    effPages: r.pages, range: (req.body.range || '').slice(0, 60) || null,
    copies, printType, sides,
    orientation: ['portrait', 'landscape'].includes(req.body.orientation) ? req.body.orientation : 'auto',
    binding: ['staple', 'spiral'].includes(req.body.binding) ? req.body.binding : 'none',
    notes: String(req.body.notes || '').slice(0, 300),
    addressId: address.id, zone,
    zoneLabel: { sarigam: 'Sarigam', vapi: 'Vapi', bhilad: 'Bhilad', pickup: 'Classroom pickup' }[zone],
    slot: slotKind === 'ASAP' ? 'ASAP' : `${slotKind}, ${req.body.slotTime || '6:30 PM'}`
  };
  saveDb(db);
  res.redirect(`/customer/orders/new/summary?draft=${d.id}`);
});

app.get('/customer/orders/new/summary', requireRole('customer'), (req, res) => {
  const db = loadDb();
  const d = (db.drafts || []).find((x) => x.id === req.query.draft && x.customerId === req.user.id);
  if (!d || !d.selections) return res.redirect('/customer/orders/new');
  const s = d.selections;
  const firstFree = db.pricing.firstDeliveryFree !== false && isFirstOrder(db, req.user.id);
  const q = quote({ pages: s.effPages, copies: s.copies, printType: s.printType, student: !!req.user.student, zone: s.zone, freeDelivery: firstFree });
  res.send(summaryStep(req.user, d, s, q));
});

app.post('/customer/orders/new/place', requireRole('customer'), (req, res) => {
  const db = loadDb();
  const di = (db.drafts || []).findIndex((x) => x.id === req.body.draft && x.customerId === req.user.id);
  if (di < 0 || !db.drafts[di].selections) return res.redirect('/customer/orders/new');
  const d = db.drafts[di];
  const s = d.selections;
  const firstFree = db.pricing.firstDeliveryFree !== false && isFirstOrder(db, req.user.id);
  const q = quote({ pages: s.effPages, copies: s.copies, printType: s.printType, student: !!req.user.student, zone: s.zone, freeDelivery: firstFree });
  const id = nextOrderId(db);
  let couponCode = null, couponDiscount = 0;
  if (req.body.coupon && String(req.body.coupon).trim()) {
    const vc = validateCoupon(db, req.body.coupon, q.subtotal);
    if (vc.ok) { couponCode = vc.code; couponDiscount = vc.discount; }
  }
  try { fs.renameSync(`data/uploads/${d.stored}`, `data/uploads/${id}.pdf`); } catch {}
  const order = {
    id, customerId: req.user.id, document: d.document, pages: s.effPages, copies: s.copies,
    printType: s.printType, sides: s.sides, paper: 'A4', orientation: s.orientation,
    binding: s.binding, notes: s.notes, pageRange: s.range,
    addressId: s.addressId, slot: s.slot,
    subtotal: q.subtotal, deliveryFee: q.deliveryFee, discount: q.studentDiscount,
    couponCode, couponDiscount, firstFree,
    total: Math.round((q.subtotal - couponDiscount + q.deliveryFee) * 100) / 100,
    paymentStatus: 'pending', paymentMethod: null,
    status: 'CREATED', history: [{ from: '—', to: 'CREATED', at: new Date().toISOString(), by: req.user.id, note: null }],
    riderId: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
  };
  db.orders.push(order);
  db.drafts.splice(di, 1);
  saveDb(db);
  res.redirect(`/customer/orders/${id}/pay`);
});

app.get('/customer/orders/:id/pay', requireRole('customer'), (req, res) => {
  const db = loadDb();
  const o = db.orders.find((x) => x.id === req.params.id && x.customerId === req.user.id);
  if (!o) return res.status(404).send(oops(req.user, '/customer/orders', 'Order <em>not found.</em>'));
  if (!['CREATED', 'PAYMENT_PENDING'].includes(o.status)) return res.redirect(`/customer/orders/${o.id}`);
  const w = walletOf(db, req.user.id);
  const waUrl = waForwardUrl(db, req, o);
  saveDb(db);
  const short = Math.round((o.total - w.balance) * 100) / 100;
  const top = !LIVE_PAY && short > 0 ? { short, bonus: bonusFor(short, db.pricing).bonus } : null;
  res.send(payStep({ ...req.user, walletBalance: w.balance }, o, { razorpay: !!(RAZORPAY.id && RAZORPAY.secret), waUrl, walletTopup: top, livePay: LIVE_PAY }));
});

app.post('/customer/orders/:id/pay', requireRole('customer'), (req, res) => {
  const db = loadDb();
  const o = db.orders.find((x) => x.id === req.params.id && x.customerId === req.user.id);
  if (!o) return res.status(404).send(oops(req.user, '/customer/orders', 'Order <em>not found.</em>'));
  if (!['CREATED', 'PAYMENT_PENDING'].includes(o.status)) return res.redirect(`/customer/orders/${o.id}`);
  let method = ['upi', 'wallet', 'wallet_topup'].includes(req.body.method) ? req.body.method : 'upi';
  if (LIVE_PAY && method !== 'wallet') {
    return res.status(400).send(oops(req.user, `/customer/orders/${o.id}/pay`, 'That method is <em>demo-only.</em>'));
  }
  if (method === 'wallet_topup') {
    // Merged top-up + pay: one tap covers the shortfall, bonus included.
    const w = walletOf(db, req.user.id);
    const short = Math.round((o.total - w.balance) * 100) / 100;
    if (short > 0) {
      const b = bonusFor(short, db.pricing);
      const now = new Date().toISOString();
      w.balance = Math.round((w.balance + short + b.bonus) * 100) / 100;
      db.walletTx.push({ id: `WTX-${Date.now()}`, customerId: req.user.id, amount: short, kind: 'credit', label: 'Top-up for order (demo)', at: now });
      if (b.bonus) db.walletTx.push({ id: `WTX-${Date.now()}b`, customerId: req.user.id, amount: b.bonus, kind: 'credit', label: `Top-up bonus +${b.pct}%`, at: now });
    }
    method = 'wallet';
  }
  if (o.status === 'CREATED') transition(o, 'PAYMENT_PENDING', { by: req.user.id });
  if (method === 'wallet') {
    const w = walletOf(db, req.user.id);
    if (w.balance < o.total) {
      saveDb(db);
      return res.status(402).send(oops(req.user, `/customer/orders/${o.id}/pay`, 'Wallet too <em>light.</em>'));
    }
    w.balance = Math.round((w.balance - o.total) * 100) / 100;
    db.walletTx.push({ id: `WTX-${Date.now()}`, customerId: req.user.id, amount: -o.total, kind: 'debit', label: `Order #${o.id}`, at: new Date().toISOString() });
    o.paymentStatus = 'paid';
  } else {
    o.paymentStatus = 'paid';
  }
  o.paymentMethod = method;
  transition(o, 'CONFIRMED', { by: req.user.id, note: `simulated ${method}` });
  // V0 pilot: a paid order goes straight to the print queue — no human click.
  // Order: both transitions, ONE save, then both pings. (A saveDb between the
  // notifies would clobber the first ping with a stale in-memory snapshot.)
  try { transition(o, 'PRINT_QUEUE', { by: 'system', note: 'auto-queued on payment' }); } catch {}
  saveDb(db);
  notifyState({ ...o, status: 'CONFIRMED' });
  if (o.status === 'PRINT_QUEUE') notifyState(o);
  res.redirect(`/customer/orders/${o.id}`);
});

app.get('/customer/orders/:id', requireRole('customer'), (req, res) => {
  const db = loadDb();
  const o = db.orders.find((x) => x.id === req.params.id && x.customerId === req.user.id);
  if (!o) return res.status(404).send(oops(req.user, '/customer/orders', 'Order <em>not found.</em>'));
  const waUrl = waForwardUrl(db, req, o);
  saveDb(db);
  res.send(orderDetail(req.user, o, null, waUrl));
});

// Kiosk live status for polling (no rider)
app.get('/api/orders/:id/status', (req, res) => {
  const user = currentUser(req);
  if (!user) return res.status(401).json({ error: 'Not signed in.' });
  const db = loadDb();
  const o = db.orders.find(x => x.id === req.params.id);
  if (!o || (o.customerId !== user.id && user.role !== 'admin')) return res.status(404).json({ error: 'Not found.' });
  const friendly = { CREATED:'Draft', PAYMENT_PENDING:'Awaiting payment', CONFIRMED:'Confirmed', PRINT_QUEUE:'In print queue', PRINTING:'Printing', PRINTED:'Printed', READY_FOR_PICKUP:'Ready for pickup', DELIVERED:'Collected', CANCELLED:'Cancelled', PRINT_FAILED:'Print failed' }[o.status] || o.status;
  res.json({ status: o.status, friendly, updatedAt: o.updatedAt });
});

app.post('/customer/orders/:id/reorder', requireRole('customer'), (req, res) => {
  const db = loadDb();
  const src = db.orders.find((x) => x.id === req.params.id && x.customerId === req.user.id);
  if (!src) return res.status(404).send(oops(req.user, '/customer/orders', 'Order <em>not found.</em>'));
  const id = nextOrderId(db);
  try { fs.copyFileSync(`data/uploads/${src.id}.pdf`, `data/uploads/${id}.pdf`); } catch {}
  const now = new Date().toISOString();
  db.orders.push({
    id, customerId: src.customerId, document: src.document, pages: src.pages, copies: src.copies,
    printType: src.printType, sides: src.sides, paper: src.paper || 'A4', orientation: src.orientation || 'auto',
    binding: src.binding || 'none', notes: src.notes || '', pageRange: src.pageRange || null,
    addressId: src.addressId, slot: src.slot,
    subtotal: src.subtotal, deliveryFee: src.deliveryFee, discount: src.discount, total: src.total,
    paymentStatus: 'pending', paymentMethod: null,
    status: 'CREATED', history: [{ from: '—', to: 'CREATED', at: now, by: req.user.id, note: `reorder of ${src.id}` }],
    riderId: null, createdAt: now, updatedAt: now
  });
  saveDb(db);
  res.redirect(`/customer/orders/${id}/pay`);
});

app.post('/customer/orders/:id/cancel', requireRole('customer'), (req, res) => {
  const db = loadDb();
  const o = db.orders.find((x) => x.id === req.params.id && x.customerId === req.user.id);
  if (!o) return res.status(404).send(oops(req.user, '/customer/orders', 'Order <em>not found.</em>'));
  try {
    transition(o, 'CANCELLED', { by: req.user.id });
  } catch {
    return res.redirect(`/customer/orders/${o.id}`);
  }
  if (o.paymentStatus === 'paid' && o.paymentMethod === 'wallet') {
    const w = walletOf(db, req.user.id);
    w.balance = Math.round((w.balance + o.total) * 100) / 100;
    db.walletTx.push({ id: `WTX-${Date.now()}`, customerId: req.user.id, amount: o.total, kind: 'credit', label: `Refund #${o.id}`, at: new Date().toISOString() });
  }
  o.paymentStatus = 'refunded';
  saveDb(db);
  notifyState(o);
  res.redirect(`/customer/orders/${o.id}`);
});

// §47 route map: addresses live inside profile — canonical redirect.
app.get('/customer/addresses', requireRole('customer'), (_req, res) => {
  res.redirect('/customer/profile#addresses');
});

app.get('/customer/wallet', requireRole('customer'), (req, res) => {
  const db = loadDb();
  const w = walletOf(db, req.user.id);
  const tx = (db.walletTx || []).filter((t) => t.customerId === req.user.id).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 20);
  res.send(walletPage(req.user, w, tx, db.pricing, { livePay: LIVE_PAY, razorpay: !!(RAZORPAY.id && RAZORPAY.secret) }));
});

app.post('/customer/wallet/add', requireRole('customer'), (req, res) => {
  if (LIVE_PAY) return res.status(400).send(oops(req.user, '/customer/wallet', 'Demo top-ups are <em>off</em> in live mode.'));
  const db = loadDb();
  const amount = Math.max(10, Math.min(10000, Math.round(Number(req.body.amount) || 0)));
  if (!amount) return res.redirect('/customer/wallet');
  const w = walletOf(db, req.user.id);
  const b = bonusFor(amount, db.pricing);
  const now = new Date().toISOString();
  w.balance = Math.round((w.balance + amount + b.bonus) * 100) / 100;
  db.walletTx.push({ id: `WTX-${Date.now()}`, customerId: req.user.id, amount, kind: 'credit', label: 'Added (demo)', at: now });
  if (b.bonus) db.walletTx.push({ id: `WTX-${Date.now()}b`, customerId: req.user.id, amount: b.bonus, kind: 'credit', label: `Top-up bonus +${b.pct}%`, at: now });
  saveDb(db);
  res.redirect('/customer/wallet');
});

app.get('/customer/profile', requireRole('customer'), (req, res) => {
  const db = loadDb();
  const addresses = db.addresses.filter((a) => a.customerId === req.user.id);
  const notes = (db.notifications || []).filter((n) => n.customerId === req.user.id).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 20);
  res.send(profilePage(req.user, addresses, notes));
});

app.post('/customer/addresses/add', requireRole('customer'), (req, res) => {
  const db = loadDb();
  if (!req.body.address || !req.body.phone || !req.body.pin) return res.redirect('/customer/profile#addresses');
  db.addresses.push({
    id: 'ADR' + Date.now().toString(36), customerId: req.user.id,
    label: req.body.label || 'Home', name: req.user.name, phone: String(req.body.phone).slice(0, 20),
    address: String(req.body.address).slice(0, 200), area: req.body.area || 'Sarigam',
    landmark: String(req.body.landmark || '').slice(0, 100), pin: String(req.body.pin).slice(0, 10),
    isDefault: !db.addresses.some((a) => a.customerId === req.user.id)
  });
  saveDb(db);
  res.redirect('/customer/profile#addresses');
});

app.post('/customer/addresses/default', requireRole('customer'), (req, res) => {
  const db = loadDb();
  const mine = db.addresses.filter((a) => a.customerId === req.user.id);
  if (!mine.some((a) => a.id === req.body.id)) return res.redirect('/customer/profile#addresses');
  mine.forEach((a) => { a.isDefault = a.id === req.body.id; });
  saveDb(db);
  res.redirect('/customer/profile#addresses');
});

const sameDay = (a, b) => new Date(a).toDateString() === new Date(b).toDateString();

// ---- Public guest funnel: price before identity, OTP at the end ----
function guestToken(req, res) {
  const c = parseCookies(req.headers.cookie).pk_guest;
  if (c) return c;
  const t = 'G' + crypto.randomBytes(12).toString('hex');
  const secure = req.protocol === 'https' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `pk_guest=${t}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${secure}`);
  return t;
}
function guestDraft(db, req) {
  const t = parseCookies(req.headers.cookie).pk_guest;
  if (!t) return null;
  return (db.drafts || []).find((x) => x.id === req.query.draft && x.guest === t) || null;
}

app.get('/order', (req, res) => {
  if (currentUser(req)) return res.redirect('/customer/orders/new');
  const db = loadDb();
  const d = req.query.draft ? guestDraft(db, req) : null;
  if (req.query.draft && !d) return res.redirect('/order');
  res.send(orderPage({ draft: d, pricing: db.pricing, error: null, maxMb: db.settings.order.maxFileMb }));
});

app.post('/order/upload', upload.single('doc'), (req, res) => {
  if (currentUser(req)) return res.redirect('/customer/orders/new');
  if (!req.file) return res.send(orderPage({ draft: null, pricing: loadDb().pricing, error: 'No file arrived — try again.', maxMb: loadDb().settings.order.maxFileMb }));
  if (req.file.size > maxUploadBytes()) {
    try { fs.unlinkSync(req.file.path); } catch {}
    return res.send(orderPage({ draft: null, pricing: loadDb().pricing, error: 'File too heavy for the pilot (see limit on this page).', maxMb: loadDb().settings.order.maxFileMb }));
  }
  let pages = 0;
  try { pages = countPdfPages(fs.readFileSync(req.file.path)); } catch { pages = 0; }
  if (!pages || pages > 1000) {
    try { fs.unlinkSync(req.file.path); } catch {}
    return res.send(orderPage({ draft: null, pricing: loadDb().pricing, error: 'That PDF has no readable pages (or over 1000).', maxMb: loadDb().settings.order.maxFileMb }));
  }
  const db = loadDb();
  db.drafts ||= [];
  db.drafts = db.drafts.filter((x) => Date.now() - Date.parse(x.createdAt) < 864e5);
  const t = guestToken(req, res);
  const draft = {
    id: 'D' + Date.now().toString(36), guest: t, customerId: null,
    document: req.file.originalname.slice(0, 120), stored: req.file.filename,
    pages, createdAt: new Date().toISOString()
  };
  db.drafts.push(draft);
  saveDb(db);
  res.redirect(`/order?draft=${draft.id}`);
});

app.post('/order/options', (req, res) => {
  if (currentUser(req)) return res.redirect('/customer/orders/new');
  const db = loadDb();
  const d = (db.drafts || []).find((x) => x.id === req.body.draft && x.guest === parseCookies(req.headers.cookie).pk_guest);
  if (!d) return res.redirect('/order');
  const copies = Math.max(1, Math.min(200, parseInt(req.body.copies, 10) || 1));
  const printType = req.body.printType === 'color' ? 'color' : 'bw';
  const sides = req.body.sides === 'single' ? 'single' : 'double';
  const r = rangePages(req.body.range, d.pages);
  if (!r.valid) return res.send(orderPage({ draft: d, pricing: db.pricing, error: 'Page range confused us — try 1-12.', maxMb: db.settings.order.maxFileMb }));
  const area = ['Sarigam', 'Vapi', 'Bhilad', 'Pickup'].includes(req.body.area) ? req.body.area : 'Sarigam';
  const slot = req.body.slot === 'Evening' ? 'Today, 7:00 PM' : req.body.slot === 'Morning' ? 'Tomorrow, 9:00 AM' : 'ASAP';
  d.selections = {
    effPages: r.pages, range: (req.body.range || '').slice(0, 60) || null,
    copies, printType, sides, orientation: 'auto', binding: 'none', notes: '',
    area, zone: zoneOf(area), zoneLabel: area, slot
  };
  saveDb(db);
  res.redirect(`/order/phone?draft=${d.id}`);
});

app.get('/order/phone', (req, res) => {
  if (currentUser(req)) return res.redirect('/customer/orders/new');
  const db = loadDb();
  const d = guestDraft(db, req);
  if (!d || !d.selections) return res.redirect('/order');
  // carry the guest cookie (area preselect) — no-op read, keeps flow honest
  res.send(phonePage({ draft: { ...d, area: d.selections.area }, error: null }));
});

app.post('/order/otp-request', otpLimiter, async (req, res) => {
  if (currentUser(req)) return res.redirect('/customer/orders/new');
  const db = loadDb();
  const list = db.drafts || [];
  const d = list.find((x) => x.id === (req.body.draft || req.query.draft) && x.guest === parseCookies(req.headers.cookie).pk_guest);
  if (!d || !d.selections) return res.redirect('/order');
  if (!req.body.resend) {
    const phone = normPhone(req.body.phone);
    if (!req.body.name || !phone || !req.body.address || !req.body.pin) {
      return res.send(phonePage({ draft: { ...d, area: d.selections.area }, error: 'Name, valid 10-digit phone, address and PIN — that is all.' }));
    }
    d.contact = {
      name: String(req.body.name).slice(0, 60), phone,
      address: String(req.body.address).slice(0, 200),
      landmark: String(req.body.landmark || '').slice(0, 100),
      pin: String(req.body.pin).slice(0, 10)
    };
    saveDb(db);
  }
  const phone = d.contact.phone;
  const otp = await requestOtp(phone);
  if (!otp.ok) return res.send(phonePage({ draft: { ...d, area: d.selections.area }, error: otp.error }));
  res.send(otpPage({ draft: d, phone: '+91 ' + phone, demoCode: otp.demo, error: null }));
});

app.post('/order/otp-verify', otpLimiter, (req, res) => {
  if (currentUser(req)) return res.redirect('/customer/orders/new');
  const db = loadDb();
  const di = (db.drafts || []).findIndex((x) => x.id === req.body.draft && x.guest === parseCookies(req.headers.cookie).pk_guest);
  if (di < 0 || !db.drafts[di].selections || !db.drafts[di].contact) return res.redirect('/order');
  const d = db.drafts[di];
  const v = verifyOtp(d.contact.phone, req.body.code);
  if (!v.ok) return res.send(otpPage({ draft: d, phone: '+91 ' + d.contact.phone, demoCode: null, error: v.error }));
  // Action becomes identity: find by phone or create the account.
  let user = db.users.find((u) => (u.phone || '').replace(/\D/g, '').slice(-10) === d.contact.phone);
  if (!user) {
    user = {
      id: 'CUS-' + Date.now().toString(36), role: 'customer', name: d.contact.name,
      email: `ph${d.contact.phone}@guest.printkarr.in`, password: null,
      phone: '+91 ' + d.contact.phone, student: false
    };
    db.users.push(user);
    db.wallets.push({ customerId: user.id, balance: 0 });
  }
  const s = d.selections;
  const address = {
    id: 'ADR' + Date.now().toString(36), customerId: user.id, label: 'Home',
    name: d.contact.name, phone: '+91 ' + d.contact.phone, address: d.contact.address,
    area: s.area, landmark: d.contact.landmark, pin: d.contact.pin, isDefault: true
  };
  db.addresses.push(address);
  const firstFree = db.pricing.firstDeliveryFree !== false && isFirstOrder(db, user.id);
  const q = quote({ pages: s.effPages, copies: s.copies, printType: s.printType, student: !!user.student, zone: s.zone, freeDelivery: firstFree });
  const id = nextOrderId(db);
  try { fs.renameSync(`data/uploads/${d.stored}`, `data/uploads/${id}.pdf`); } catch {}
  db.orders.push({
    id, customerId: user.id, document: d.document, pages: s.effPages, copies: s.copies,
    printType: s.printType, sides: s.sides, paper: 'A4', orientation: 'auto',
    binding: 'none', notes: '', pageRange: s.range,
    addressId: address.id, slot: s.slot,
    subtotal: q.subtotal, deliveryFee: q.deliveryFee, discount: q.studentDiscount,
    couponCode: null, couponDiscount: 0, firstFree,
    total: q.total,
    paymentStatus: 'pending', paymentMethod: null,
    status: 'CREATED', history: [{ from: '—', to: 'CREATED', at: new Date().toISOString(), by: user.id, note: 'guest otp order' }],
    riderId: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
  });
  db.drafts.splice(di, 1);
  saveDb(db);
  const token = createSession(user.id);
  const secure = req.protocol === 'https' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${secure}`);
  res.redirect(`/customer/orders/${id}/pay`);
});

// Upload errors (too big, wrong type) get a designed page, not a stack trace.
app.use((err, req, res, _next) => {
  if (!err || !/multer|Only PDF|File too large/i.test(err.message)) throw err;
  const user = currentUser(req);
  if (!user) {
    // Guest funnel: show the public order page error, not a login redirect
    const isGuestOrder = req.path === '/order/upload';
    if (isGuestOrder) return res.status(400).send(orderPage({ draft: null, pricing: loadDb().pricing, error: 'That file won\'t print — PDF only, check size.', maxMb: loadDb().settings.order.maxFileMb }));
    return res.redirect('/login');
  }
  res.status(400).send(oops(user, '/customer/orders/new', 'That file <em>won\'t print.</em>'));
});

// ---- API ----
app.get('/api/health', (_req, res) =>
  res.json({ ok: true, app: 'printkarr', mode: 'demo', time: new Date().toISOString() })
);

app.get('/api/me', (req, res) => {
  const user = currentUser(req);
  if (!user) return res.status(401).json({ error: 'Not signed in.' });
  res.json({ user });
});

app.get('/api/config', (_req, res) => {
  const db = loadDb();
  res.json({
    pricing: db.pricing,
    zones: db.settings.zones,
    hours: db.settings.hours,
    mode: process.env.NODE_ENV === 'production' ? 'live' : 'demo',
    map: { tiles: TILES, attribution: TILE_ATTR, tilesFallback: TILES_FALLBACK, attributionFallback: TILE_ATTR_FALLBACK, hub: HUB }
  });
});

// ---- Print agent API (V0 classroom pilot: laptop polls, prints, reports) ----
const AGENT_TOKEN = process.env.AGENT_TOKEN || '';
let agentSeenAt = 0; // last successful agent poll (in-memory; pilot ops hint)
function agentAuth(req, res, next) {
  if (!AGENT_TOKEN) return res.status(503).json({ error: 'Print agent not configured (AGENT_TOKEN).' });
  const got = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const a = crypto.createHash('sha256').update(got).digest();
  const b = crypto.createHash('sha256').update(AGENT_TOKEN).digest();
  if (!got || !crypto.timingSafeEqual(a, b)) return res.status(401).json({ error: 'Bad agent token.' });
  agentSeenAt = Date.now();
  next();
}
const agentJob = (o) => ({
  id: o.id, document: o.document, pages: o.pages, copies: o.copies,
  printType: o.printType, sides: o.sides, paper: o.paper || 'A4',
  pageRange: o.pageRange || null, status: o.status
});

app.get('/api/agent/next', agentAuth, (_req, res) => {
  const db = loadDb();
  const job = db.orders
    .filter((o) => o.status === 'PRINT_QUEUE')
    .sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''))[0];
  if (!job) return res.status(204).end();
  res.json({ order: agentJob(job) });
});

app.get('/api/agent/file/:id', agentAuth, (req, res) => {
  const safe = safeOrderId(req.params.id);
  if (!safe) return res.status(400).json({ error: 'Bad ID.' });
  const db = loadDb();
  const o = db.orders.find((x) => x.id === safe);
  if (!o || !['PRINT_QUEUE', 'PRINTING'].includes(o.status)) {
    return res.status(404).json({ error: 'Not printable right now.' });
  }
  const p = path.join(ROOT, 'data', 'uploads', `${safe}.pdf`);
  if (!fs.existsSync(p)) return res.status(404).json({ error: 'File missing.' });
  res.setHeader('Content-Type', 'application/pdf');
  res.sendFile(p);
});

function agentStep(to, note) {
  return (req, res) => {
    const safe = safeOrderId(req.params.id);
    if (!safe) return res.status(400).json({ error: 'Bad ID.' });
    const db = loadDb();
    const o = db.orders.find((x) => x.id === safe);
    if (!o) return res.status(404).json({ error: 'Unknown order.' });
    try {
      transition(o, to, { by: 'agent', note: note || req.body.note || null });
    } catch {
      return res.status(409).json({ error: `Cannot move to ${to} from ${o.status}.` });
    }
    saveDb(db);
    notifyState(o);
    res.json({ ok: true, order: agentJob(o) });
  };
}
app.post('/api/agent/:id/started', agentAuth, agentStep('PRINTING', 'agent picked up'));
app.post('/api/agent/:id/done', agentAuth, agentStep('PRINTED', 'agent finished'));
app.post('/api/agent/:id/failed', agentAuth, (req, res) => {
  const safe = safeOrderId(req.params.id);
  if (!safe) return res.status(400).json({ error: 'Bad ID.' });
  const db = loadDb();
  const o = db.orders.find((x) => x.id === safe);
  if (!o) return res.status(404).json({ error: 'Unknown order.' });
  if (!['PRINT_QUEUE', 'PRINTING'].includes(o.status)) {
    return res.status(409).json({ error: `Cannot fail from ${o.status}.` });
  }
  try {
    transition(o, 'PRINT_FAILED', { by: 'agent', note: String(req.body.error || 'print failed').slice(0, 200) });
  } catch {
    return res.status(409).json({ error: `Cannot fail from ${o.status}.` });
  }
  saveDb(db);
  notifyState(o);
  res.json({ ok: true, order: agentJob(o) });
});

// Classroom QR (V0 §11): always encodes THIS server's /order URL, so the
// printed QR works wherever the laptop sits (LAN IP included).
const qrCache = new Map();
app.get('/qr.png', async (req, res) => {
  const url = `${req.protocol}://${req.get('host')}/order`;
  try {
    if (!qrCache.has(url)) {
      qrCache.set(url, await QRCode.toBuffer(url, { width: 640, margin: 2 }));
      if (qrCache.size > 20) qrCache.clear();
    }
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(qrCache.get(url));
  } catch {
    res.status(500).send('QR unavailable.');
  }
});

// File janitor (V0 §16): every 5 minutes, delete PDFs of terminal orders
// older than FILE_RETENTION_MINUTES (default 15). Order records and
// history stay — only the document files are wiped.
setInterval(() => janitor(ROOT), 300e3).unref();

function safeToken(t) {
  return /^[a-f0-9]{32}$/.test(String(t || '')) ? String(t) : null;
}
// Public, expiring PDF link for one order. No login — the token IS the key.
app.get('/share/:token', (req, res) => {
  const tok = safeToken(req.params.token);
  if (!tok) return res.status(400).send('Bad link.');
  const db = loadDb();
  const t = (db.shareTokens || []).find((x) => x.token === tok);
  if (!t || Date.parse(t.expiresAt) < Date.now()) {
    return res.status(410).send('This link has expired. Ask the shop for a fresh one.');
  }
  const safe = safeOrderId(t.orderId);
  if (!safe) return res.status(410).send('Bad link.');
  const p = path.join(ROOT, 'data', 'uploads', `${safe}.pdf`);
  if (!fs.existsSync(p)) return res.status(404).send('File not found.');
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${safe}.pdf"`);
  res.sendFile(p);
});

app.get('/api/agent/health', (_req, res) => {
  const db = loadDb();
  const queueDepth = db.orders.filter(o => ['PRINT_QUEUE','PRINTING'].includes(o.status)).length;
  res.json({ ok: true, agentSeenAt: agentSeenAt || null, queueDepth, secondsSinceSeen: agentSeenAt ? Math.round((Date.now()-agentSeenAt)/1000) : null });
});

// Readiness probe for production debugging: counts + capability flags,
// no secrets, no personal data.
app.get('/api/ready', (_req, res) => {
  const db = loadDb();
  let uploadsWritable = false;
  try {
    fs.mkdirSync(path.join(ROOT, 'data', 'uploads'), { recursive: true });
    const probe = path.join(ROOT, 'data', 'uploads', '.probe');
    fs.writeFileSync(probe, 'ok');
    fs.unlinkSync(probe);
    uploadsWritable = true;
  } catch { uploadsWritable = false; }
  res.json({
    ok: true,
    users: db.users.length,
    orders: db.orders.length,
    uploadsWritable,
    capabilities: {
      razorpay: !!(RAZORPAY.id && RAZORPAY.secret),
      whatsappForward: !!OWNER_WA,
      google: !!GOOGLE.id
    },
    kiosk: { queueDepth: db.orders.filter(o=>['PRINT_QUEUE','PRINTING'].includes(o.status)).length, agentSeenAt: agentSeenAt||null }
  });
});

// Razorpay: create a gateway order for a payable customer order.
app.post('/api/razorpay/order', apiLimiter, async (req, res) => {
  const user = currentUser(req);
  if (!user) return res.status(401).json({ error: 'Not signed in.' });
  if (!(RAZORPAY.id && RAZORPAY.secret)) return res.status(503).json({ error: 'Online payment not configured.' });
  const db = loadDb();
  const o = db.orders.find((x) => x.id === req.body.orderId && x.customerId === user.id);
  if (!o || !['CREATED', 'PAYMENT_PENDING'].includes(o.status)) {
    return res.status(400).json({ error: 'Order cannot be paid.' });
  }
  try {
    const r = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + Buffer.from(`${RAZORPAY.id}:${RAZORPAY.secret}`).toString('base64')
      },
      body: JSON.stringify({
        amount: Math.round(o.total * 100),
        currency: 'INR',
        receipt: o.id,
        notes: { orderId: o.id, customer: user.email }
      })
    });
    const d = await r.json();
    if (!r.ok || !d.id) return res.status(502).json({ error: 'Gateway refused the order.' });
    res.json({ keyId: RAZORPAY.id, rzpOrderId: d.id, amount: d.amount, orderId: o.id });
  } catch {
    res.status(502).json({ error: 'Gateway unreachable. Try again or pick another method.' });
  }
});

// Real wallet top-up via Razorpay: pending record first (amount stays
// server-side so the verify step can never be told a bigger number).
app.post('/api/wallet/topup-order', apiLimiter, async (req, res) => {
  const user = currentUser(req);
  if (!user || user.role !== 'customer') return res.status(401).json({ error: 'Not signed in.' });
  if (!(RAZORPAY.id && RAZORPAY.secret)) return res.status(503).json({ error: 'Online payment not configured.' });
  const amount = Math.max(10, Math.min(10000, Math.round(Number(req.body.amount) || 0)));
  if (!amount) return res.status(400).json({ error: 'Enter an amount between ₹10 and ₹10,000.' });
  try {
    const r = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + Buffer.from(`${RAZORPAY.id}:${RAZORPAY.secret}`).toString('base64')
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100),
        currency: 'INR',
        receipt: `wallet-${user.id}-${Date.now()}`,
        notes: { customer: user.id, kind: 'wallet-topup' }
      })
    });
    const d = await r.json();
    if (!r.ok || !d.id) return res.status(502).json({ error: 'Gateway refused the order.' });
    const db = loadDb();
    db.topups ||= [];
    db.topups.push({ rzpOrderId: d.id, customerId: user.id, amount, used: false, at: new Date().toISOString() });
    saveDb(db);
    res.json({ keyId: RAZORPAY.id, rzpOrderId: d.id, amount: d.amount });
  } catch {
    res.status(502).json({ error: 'Gateway unreachable. Try again.' });
  }
});

app.post('/customer/wallet/topup-verify', requireRole('customer'), (req, res) => {
  if (!(RAZORPAY.id && RAZORPAY.secret)) {
    return res.status(503).send(oops(req.user, '/customer/wallet', 'Online payment <em>not configured.</em>'));
  }
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).send(oops(req.user, '/customer/wallet', 'Payment proof <em>incomplete.</em>'));
  }
  const expect = crypto.createHmac('sha256', RAZORPAY.secret).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex');
  if (expect !== razorpay_signature) {
    return res.status(400).send(oops(req.user, '/customer/wallet', 'Payment signature <em>mismatch.</em>'));
  }
  const db = loadDb();
  const pending = (db.topups || []).find((t) => t.rzpOrderId === razorpay_order_id && t.customerId === req.user.id && !t.used);
  if (!pending) {
    return res.status(400).send(oops(req.user, '/customer/wallet', 'Unknown or reused <em>top-up.</em>'));
  }
  pending.used = true;
  const b = bonusFor(pending.amount, db.pricing);
  const w = walletOf(db, req.user.id);
  const now = new Date().toISOString();
  w.balance = Math.round((w.balance + pending.amount + b.bonus) * 100) / 100;
  db.walletTx.push({ id: `WTX-${Date.now()}`, customerId: req.user.id, amount: pending.amount, kind: 'credit', label: `Top-up via Razorpay (${razorpay_payment_id.slice(0, 14)})`, at: now });
  if (b.bonus) db.walletTx.push({ id: `WTX-${Date.now()}b`, customerId: req.user.id, amount: b.bonus, kind: 'credit', label: `Top-up bonus +${b.pct}%`, at: now });
  saveDb(db);
  res.redirect('/customer/wallet');
});

// Razorpay: verify signature, then confirm exactly like a normal payment.
app.post('/customer/orders/:id/razorpay-verify', requireRole('customer'), (req, res) => {
  if (!(RAZORPAY.id && RAZORPAY.secret)) {
    return res.status(503).send(oops(req.user, '/customer/orders', 'Online payment <em>not configured.</em>'));
  }
  const db = loadDb();
  const o = db.orders.find((x) => x.id === req.params.id && x.customerId === req.user.id);
  if (!o || !['CREATED', 'PAYMENT_PENDING'].includes(o.status)) return res.redirect(`/customer/orders/${req.params.id}`);
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).send(oops(req.user, `/customer/orders/${o.id}/pay`, 'Payment proof <em>incomplete.</em>'));
  }
  const expect = crypto.createHmac('sha256', RAZORPAY.secret).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex');
  if (expect !== razorpay_signature) {
    return res.status(400).send(oops(req.user, `/customer/orders/${o.id}/pay`, 'Payment signature <em>mismatch.</em>'));
  }
  if (o.status === 'CREATED') transition(o, 'PAYMENT_PENDING', { by: req.user.id });
  o.paymentStatus = 'paid';
  o.paymentMethod = 'razorpay';
  transition(o, 'CONFIRMED', { by: req.user.id, note: `razorpay ${razorpay_payment_id}` });
  // V0 pilot: a paid order goes straight to the print queue — no human click.
  // (Both transitions first, one save, then both pings — see note above.)
  try { transition(o, 'PRINT_QUEUE', { by: 'system', note: 'auto-queued on payment' }); } catch {}
  saveDb(db);
  notifyState({ ...o, status: 'CONFIRMED' });
  if (o.status === 'PRINT_QUEUE') notifyState(o);
  res.redirect(`/customer/orders/${o.id}`);
});

// Kiosk pickup — no rider tracking. Orders are collected at the counter.

// Product root: signed in → role home; strangers get the conversion
// landing (one CTA, live stats), never a login wall.
app.get('/', (req, res) => {
  const user = currentUser(req);
  if (user) return res.redirect(HOME[user.role] || '/login');
  const db = loadDb();
  const weekAgo = Date.now() - 7 * 864e5;
  const pagesWeek = db.orders
    .filter((o) => Date.parse(o.createdAt) >= weekAgo && o.status !== 'CANCELLED')
    .reduce((s, o) => s + o.pages * o.copies, 0);
  const queueDepth = db.orders.filter((o) => ['PRINT_QUEUE', 'PRINTING'].includes(o.status)).length;
  res.send(landing({ pagesWeek, pricing: db.pricing, queueDepth }));
});

// ---- Static (production surface = public/ only) ----
app.use(express.static(PUBLIC, { maxAge: '1h', extensions: ['html'] }));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(PUBLIC, 'index.html'));
});

// Production bootstrap: on a fresh volume (no users yet), create the owner
// admin from env so the live app never needs the demo credentials.
function storageCheck() {
  // Prove the database AND uploads are writable at boot. If either fails,
  // every save silently breaks — the classic "nothing works in production".
  try {
    const db = loadDb();
    saveDb(db);
    const up = path.join(ROOT, 'data', 'uploads');
    fs.mkdirSync(up, { recursive: true });
    const probe = path.join(up, '.probe');
    fs.writeFileSync(probe, 'ok');
    fs.unlinkSync(probe);
    return { ok: true, users: db.users.length, orders: db.orders.length };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

function bootstrap() {
  const store = storageCheck();
  if (!store.ok) {
    console.error(`⚠ STORAGE FAILURE: ${store.error}`);
    console.error('⚠ Fix the /app/data volume (writable persistent disk), then restart. Nothing that saves will work until then.');
  } else {
    console.log(`Storage OK — ${store.users} users, ${store.orders} orders.`);
  }
  const db = loadDb();
  if (db.users.length === 0) {
    if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
      db.users.push({
        id: 'ADM-OWNER', role: 'admin', name: 'Owner',
        email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD,
        phone: '', online: true
      });
      saveDb(db);
      console.log(`Bootstrapped owner admin ${process.env.ADMIN_EMAIL}`);
    } else {
      console.warn('⚠ No users and no ADMIN_EMAIL/ADMIN_PASSWORD — nobody can log in. Set the env vars and restart.');
    }
  }
  if (process.env.NODE_ENV === 'production') {
    const weak = db.users.find((u) => u.email === 'admin@demo.printkarr.in' && u.password === 'admin123');
    if (weak) {
      console.warn('⚠ PRODUCTION WARNING: default demo admin credentials are live. Change or remove them before sharing the URL.');
    }
    if (!OWNER_WA) console.warn('⚠ OWNER_WHATSAPP_NUMBER not set — WhatsApp order forwarding is hidden.');
    if (!(RAZORPAY.id && RAZORPAY.secret)) console.warn('⚠ RAZORPAY_KEY_ID/SECRET not set — only simulated payments offered.');
    if (!GOOGLE.id) console.warn('⚠ GOOGLE_CLIENT_ID not set — no Google sign-in button.');
  }
}
bootstrap();

app.listen(PORT, () =>
  console.log(`Printkarr (${process.env.NODE_ENV === 'production' ? 'production' : 'demo'}) live on port ${PORT}`)
);
