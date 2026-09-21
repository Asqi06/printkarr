// OTP auth — action-before-identity (conversion blueprint §2).
// Phone in, 6-digit code, auto-created account. No passwords, no email.
// Demo: the code is returned/shown (no SMS provider). Production: plug an
// SMS sender into sendViaSms() (MSG91/Twilio/etc.) via env, keep this API.
import crypto from 'node:crypto';
import { loadDb, saveDb } from './db.js';

const TTL = 10 * 60_000;
const MAX_TRY = 5;

export function normPhone(p) {
  const d = String(p || '').replace(/\D/g, '');
  const m = d.length === 12 && d.startsWith('91') ? d.slice(2) : d;
  return /^[6-9]\d{9}$/.test(m) ? m : null;
}

function hash(phone, code) {
  return crypto.createHash('sha256').update(`${phone}:${code}:${process.env.OTP_PEPPER || 'printkarr-demo'}`).digest('hex');
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
