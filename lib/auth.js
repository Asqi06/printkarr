// Demo authentication — PRD §3. Mock credentials against the seeded DB.
// Sessions are random tokens in an httpOnly cookie, persisted in db.json
// so they survive restarts. Demo only: passwords stored plainly on purpose.
import crypto from 'node:crypto';
import { loadDb, saveDb } from './db.js';

export const COOKIE = 'pk_demo';
const MAX_AGE = 1000 * 60 * 60 * 24 * 30; // 30 days

export function demoLoginOn() {
  return process.env.DEMO_LOGIN !== 'off';
}

export function verifyCredentials(email, password) {
  const db = loadDb();
  const norm = String(email || '').trim().toLowerCase();
  if (!demoLoginOn() && norm.endsWith('@demo.printkarr.in')) return null;
  const user = db.users.find(
    (u) => u.email.toLowerCase() === norm && u.password === String(password || '')
  );
  if (!user) return null;
  const { password: _pw, ...safe } = user;
  return safe;
}

export function createSession(userId) {
  const db = loadDb();
  const token = crypto.randomBytes(24).toString('hex');
  db.sessions ||= [];
  db.sessions.push({ token, userId, createdAt: new Date().toISOString() });
  // cap stored sessions so the file can't grow forever
  if (db.sessions.length > 200) db.sessions = db.sessions.slice(-200);
  saveDb(db);
  return token;
}

export function getSessionUser(token) {
  if (!token) return null;
  const db = loadDb();
  const s = (db.sessions || []).find((x) => x.token === token);
  if (!s) return null;
  if (now() - Date.parse(s.createdAt) > MAX_AGE) return null;
  const user = db.users.find((u) => u.id === s.userId);
  if (!user) return null;
  const { password: _pw, ...safe } = user;
  return safe;
}

export function destroySession(token) {
  if (!token) return;
  const db = loadDb();
  db.sessions = (db.sessions || []).filter((x) => x.token !== token);
  saveDb(db);
}

export function parseCookies(header) {
  const out = {};
  for (const part of String(header || '').split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

function now() {
  return Date.now();
}
