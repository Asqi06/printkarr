// Staff passwords use scrypt. Production never accepts demo credentials.
import crypto from 'node:crypto';
import { promisify } from 'node:util';
import { loadDb, saveDb } from './db.js';
import { notifyAdmins } from './notify.js';

export const COOKIE = 'pk_demo';
// Only basic customer GET pages can be restored after sign-in; never accept an external URL.
export function customerDestination(value) {
  return ['/customer', '/customer/wallet', '/customer/profile', '/customer/orders', '/customer/orders/new', '/customer/packs', '/customer/referrals', '/customer/addresses', '/cart', '/customer/purchases'].includes(value) ? value : '/customer';
}
const MAX_AGE = 1000 * 60 * 60 * 24 * 30; // 30 days
const scrypt = promisify(crypto.scrypt);

export function demoLoginOn() {
  return process.env.NODE_ENV !== 'production' && process.env.DEMO_LOGIN !== 'off';
}

export async function verifyCredentials(email, password) {
  const db = loadDb();
  const norm = String(email || '').trim().toLowerCase();
  if (!demoLoginOn() && norm.endsWith('@demo.printkarr.in')) return null;
  if (typeof password !== 'string' || !password || password.length > 200) return null;
  const user = db.users.find((u) => String(u.email || '').toLowerCase() === norm);
  if (!user) return null;
  if (user.passwordHash) {
    const [salt, value] = String(user.passwordHash).split(':');
    if (!/^[a-f0-9]{32}$/.test(salt || '') || !/^[a-f0-9]{128}$/.test(value || '')) return null;
    if (!crypto.timingSafeEqual(Buffer.from(value, 'hex'), await scrypt(password, salt, 64))) return null;
  } else if (!demoLoginOn() || user.password !== password) return null;
  const latest = loadDb().users.find(u => u.id === user.id);
  if (!latest || latest.passwordHash !== user.passwordHash || latest.password !== user.password || latest.role !== user.role) return null;
  const { password: _pw, passwordHash: _hash, ...safe } = user;
  return safe;
}

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  return salt + ':' + crypto.scryptSync(String(password), salt, 64).toString('hex');
}

export function passwordMatches(password, hash) {
  const [salt, value] = String(hash).split(':');
  if (!/^[a-f0-9]{32}$/.test(salt || '') || !/^[a-f0-9]{128}$/.test(value || '') || String(password || '').length > 200) return false;
  return crypto.timingSafeEqual(Buffer.from(value, 'hex'), crypto.scryptSync(String(password || ''), salt, 64));
}

export function createSession(userId) {
  const db = loadDb();
  const token = crypto.randomBytes(24).toString('hex');
  db.sessions ||= [];
  const now = Date.now();
  db.sessions = db.sessions.filter(s => Number.isFinite(Date.parse(s.createdAt)) && now - Date.parse(s.createdAt) < MAX_AGE);
  db.sessions.push({ token, userId, createdAt: new Date(now).toISOString() });
  const user = db.users.find((u) => u.id === userId);
  if (user?.role === 'customer') {
    user.lastLoginAt = new Date().toISOString();
    notifyAdmins(db, 'login', `${user.name || 'Customer'} signed in.`, `/admin/customers/${encodeURIComponent(user.id)}`, `login:${crypto.randomUUID()}`);
  }
  // Bound sessions per account without logging out unrelated customers.
  const old = db.sessions.filter(s => s.userId === userId).slice(0, -5);
  db.sessions = db.sessions.filter(s => !old.includes(s));
  saveDb(db);
  return token;
}

export function getSessionUser(token) {
  if (!token) return null;
  const db = loadDb();
  const s = (db.sessions || []).find((x) => x.token === token);
  if (!s) return null;
  if (!Number.isFinite(Date.parse(s.createdAt)) || now() - Date.parse(s.createdAt) > MAX_AGE) return null;
  const user = db.users.find((u) => u.id === s.userId);
  if (!user || !demoLoginOn() && String(user.email || '').endsWith('@demo.printkarr.in')) return null;
  const { password: _pw, passwordHash: _hash, ...safe } = user;
  return safe;
}

export function destroySession(token) {
  if (!token) return;
  const db = loadDb();
  db.sessions = (db.sessions || []).filter((x) => x.token !== token);
  saveDb(db);
}

export function parseCookies(header) {
  const out = Object.create(null);
  for (const part of String(header || '').split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    try { out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim()); } catch { /* Ignore malformed cookies. */ }
  }
  return out;
}

function now() {
  return Date.now();
}
