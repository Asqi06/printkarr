// OTP auth — action-before-identity (conversion blueprint §2).
// Guest funnel verifies by EMAIL: 6-digit code sent to the address the
// customer typed. Phone OTP below is legacy (no SMS provider was ever
// configured) and no longer used by the order flow — kept for reference.
import crypto from 'node:crypto';
import { loadDb, saveDb } from './db.js';
import { sendOtpEmail, emailConfigured } from './email.js';

const TTL = 10 * 60_000;
const MAX_TRY = 5;

export function normPhone(p) {
  const d = String(p || '').replace(/\D/g, '');
  const m = d.length === 12 && d.startsWith('91') ? d.slice(2) : d;
  return /^[6-9]\d{9}$/.test(m) ? m : null;
}

export function normEmail(e) {
  const v = String(e || '').trim().toLowerCase();
  if (v.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return null;
  return v;
}

function ehash(email, code) {
  return crypto.createHash('sha256').update(`em:${email}:${code}:${process.env.OTP_PEPPER || 'printkarr-demo'}`).digest('hex');
}

function hash(phone, code) {
  return crypto.createHash('sha256').update(`${phone}:${code}:${process.env.OTP_PEPPER || 'printkarr-demo'}`).digest('hex');
}

// Returns { ok, mailed, demo, error }. mailed=true means the code really
// left the building. demo is set ONLY when no mailer is configured (or the
// send failed) so the funnel stays testable — callers must label it honestly.
export async function requestEmailOtp(email) {
  const db = loadDb();
  db.emailOtps ||= [];
  const now = Date.now();
  db.emailOtps = db.emailOtps.filter((o) => o.expires > now);
  const recent = db.emailOtps.filter((o) => o.email === email && now - o.created < 60_000).length;
  if (recent >= 3) return { ok: false, error: 'Too many codes — wait a minute.' };
  const code = String(crypto.randomInt(100000, 1000000));
  db.emailOtps = db.emailOtps.filter((o) => o.email !== email);
  db.emailOtps.push({ email, hash: ehash(email, code), created: now, expires: now + TTL, tries: 0 });
  saveDb(db);
  if (emailConfigured()) {
    // Belt and braces: even with transport timeouts, never leave the HTTP
    // request hanging — worst case the user gets the code on-screen.
    const send = sendOtpEmail(email, code);
    const cap = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Email is taking too long — use the code below instead.')), 25000));
    try {
      const r = await Promise.race([send, cap]);
      if (r.ok) return { ok: true, mailed: true, demo: null };
      return { ok: true, mailed: false, demo: code, error: r.error };
    } catch (e) {
      send.catch(() => {}); // let the slow send die quietly in the background
      return { ok: true, mailed: false, demo: code, error: e && e.message ? e.message : 'Email timed out — use the code below instead.' };
    }
  }
  return { ok: true, mailed: false, demo: code, error: null };
}

export function verifyEmailOtp(email, code) {
  const db = loadDb();
  const now = Date.now();
  const rec = (db.emailOtps || []).find((o) => o.email === email);
  if (!rec || rec.expires < now) return { ok: false, error: 'Code expired — get a new one.' };
  if (rec.tries >= MAX_TRY) return { ok: false, error: 'Too many tries — get a new code.' };
  rec.tries += 1;
  if (rec.hash !== ehash(email, String(code || '').trim())) {
    saveDb(db);
    return { ok: false, error: 'Wrong code — check and retry.' };
  }
  db.emailOtps = db.emailOtps.filter((o) => o.email !== email);
  saveDb(db);
  return { ok: true };
}

// Later: POST to your SMS provider here. Return true when handed off.
async function sendViaSms(phone, code) {
  if (process.env.OTP_SMS_URL) {
    try {
      await fetch(process.env.OTP_SMS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code, key: process.env.OTP_SMS_KEY || '' })
      });
      return true;
    } catch { return false; }
  }
  return false;
}

export async function requestOtp(phone) {
  const db = loadDb();
  db.otps ||= [];
  const now = Date.now();
  db.otps = db.otps.filter((o) => o.expires > now);
  const recent = db.otps.filter((o) => o.phone === phone && now - o.created < 60_000).length;
  if (recent >= 3) return { ok: false, error: 'Too many codes — wait a minute.' };
  const code = String(crypto.randomInt(100000, 1000000));
  db.otps = db.otps.filter((o) => o.phone !== phone);
  db.otps.push({ phone, hash: hash(phone, code), created: now, expires: now + TTL, tries: 0 });
  saveDb(db);
  const sent = await sendViaSms(phone, code);
  // Demo: hand the code back so the funnel is testable end-to-end.
  const demo = process.env.NODE_ENV === 'production' && sent ? null : code;
  return { ok: true, demo };
}

export function verifyOtp(phone, code) {
  const db = loadDb();
  const now = Date.now();
  const rec = (db.otps || []).find((o) => o.phone === phone);
  if (!rec || rec.expires < now) return { ok: false, error: 'Code expired — get a new one.' };
  if (rec.tries >= MAX_TRY) return { ok: false, error: 'Too many tries — get a new code.' };
  rec.tries += 1;
  if (rec.hash !== hash(phone, String(code || '').trim())) {
    saveDb(db);
    return { ok: false, error: 'Wrong code — check and retry.' };
  }
  db.otps = db.otps.filter((o) => o.phone !== phone);
  saveDb(db);
  return { ok: true };
}
