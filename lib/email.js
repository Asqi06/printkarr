// Outbound email — first working path wins:
//   1. Resend API over HTTPS (needs RESEND_API_KEY + a VERIFIED domain to
//      reach anyone except yourself — impossible on *.onrender.com, which
//      is why Gmail API below is the recommended path here).
//   2. Gmail API over HTTPS (no SMTP ports, no DNS, no custom domain):
//      GMAIL_FROM + GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET +
//      GOOGLE_REFRESH_TOKEN (one-time setup in Google OAuth Playground).
//   3. SMTP fallback (often blocked on shared hosts).
import nodemailer from 'nodemailer';

let _transport = null;

export function emailConfigured() {
  return !!(process.env.RESEND_API_KEY
    || (process.env.GMAIL_FROM && process.env.GOOGLE_REFRESH_TOKEN)
    || (process.env.SMTP_USER && process.env.SMTP_PASS));
}

let _gToken = null; // { access, expiresAt } — cached in memory, refreshed hourly
async function gmailAccessToken() {
  const id = process.env.GOOGLE_CLIENT_ID, secret = process.env.GOOGLE_CLIENT_SECRET, rt = process.env.GOOGLE_REFRESH_TOKEN;
  if (!id || !secret || !rt) return null;
  if (_gToken && _gToken.expiresAt > Date.now() + 60000) return _gToken.access;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  try {
    const r = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST', signal: ctrl.signal,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: id, client_secret: secret, refresh_token: rt, grant_type: 'refresh_token' })
    });
    if (!r.ok) return null;
    const j = await r.json();
    if (!j.access_token) return null;
    _gToken = { access: j.access_token, expiresAt: Date.now() + (j.expires_in || 3600) * 1000 };
    return _gToken.access;
  } catch { return null; } finally { clearTimeout(timer); }
}

const b64url = (s) => Buffer.from(s, 'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

function mimeMessage(from, to, subject, html) {
  const head = [
    `From: ${from}`, `To: ${to}`,
    `Subject: =?UTF-8?B?${Buffer.from(subject, 'utf8').toString('base64')}?=`,
    'MIME-Version: 1.0', 'Content-Type: text/html; charset=UTF-8'
  ].join('\r\n');
  return b64url(head + '\r\n\r\n' + html);
}

// Returns null when not configured, {ok}/{ok:false,error} otherwise.
async function sendViaGmailApi(to, mail) {
  const from = String(process.env.GMAIL_FROM || '').trim();
  if (!from) return null;
  const access = await gmailAccessToken();
  if (!access) return { ok: false, error: 'Gmail authorization failed — check GOOGLE_CLIENT_ID/SECRET/REFRESH_TOKEN.' };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20000);
  try {
    const r = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST', signal: ctrl.signal,
      headers: { Authorization: `Bearer ${access}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw: mimeMessage(from, to, mail.subject, mail.html) })
    }).finally(() => clearTimeout(timer));
    if (r.ok) return { ok: true };
    const detail = (await r.text().catch(() => '')).slice(0, 160);
    return { ok: false, error: `Gmail refused (${r.status}) ${detail}` };
  } catch (e) {
    clearTimeout(timer);
    return { ok: false, error: e && e.name === 'AbortError' ? 'Gmail timed out.' : (e && e.message ? e.message : 'Gmail send failed.') };
  }
}

function transport() {
  if (_transport) return _transport;
  const port = Number(process.env.SMTP_PORT || 587);
  _transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    // Never hang the request: fail fast so the caller can fall back.
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 20000
  });
  return _transport;
}

// Resend rejects anything that isn't `email@x.com` or `Name <email@x.com>`.
// Self-heal common misconfigurations (e.g. "PrintKarr you@gmail.com").
function resolveFrom() {
  const raw = String(process.env.SMTP_FROM || '').trim();
  if (/^.+ <[^<>\s@]+@[^<>\s@]+\.[^<>\s@]+>$/.test(raw)) return raw;
  const m = raw.match(/[^<>\s@]+@[^<>\s@]+\.[^<>\s@]+/);
  if (m) {
    const name = raw.replace(m[0], '').replace(/[<>"']/g, '').trim();
    return name ? `${name} <${m[0]}>` : m[0];
  }
  const user = String(process.env.SMTP_USER || '').trim();
  if (/^[^<>\s@]+@[^<>\s@]+\.[^<>\s@]+$/.test(user)) return user;
  return 'PrintKarr <onboarding@resend.dev>';
}

const codeMail = (code) => ({
  subject: `Your PrintKarr code is ${code}`,
  text: `Your PrintKarr verification code is ${code}. It expires in 10 minutes.\n\nIf you didn't request this, ignore this email.`,
  html: `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px">
<p style="font-size:14px;color:#5c6d86">Your PrintKarr verification code:</p>
<p style="font-family:monospace;font-size:40px;font-weight:700;letter-spacing:.3em;color:#0c1c33">${code}</p>
<p style="font-size:13px;color:#5c6d86">Expires in 10 minutes. If you didn't request this, ignore this email.</p></div>`
});

export async function sendOtpEmail(to, code) {
  if (!emailConfigured()) return { ok: false, error: 'Email delivery is not configured on this server (set RESEND_API_KEY or SMTP_USER/SMTP_PASS).' };
  const mail = codeMail(code);
  // Path 1: Resend over HTTPS — immune to SMTP port blocks.
  if (process.env.RESEND_API_KEY) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 20000);
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        signal: ctrl.signal,
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: resolveFrom(),
          to, subject: mail.subject, html: mail.html, text: mail.text
        })
      }).finally(() => clearTimeout(timer));
      if (r.ok) return { ok: true };
      const detail = (await r.text().catch(() => '')).slice(0, 160);
      return { ok: false, error: `Email service refused (${r.status}) ${detail}` };
    } catch (e) {
      return { ok: false, error: e && e.name === 'AbortError' ? 'Email service timed out.' : (e && e.message ? e.message : 'Email send failed.') };
    }
  }
  // Path 2: Gmail API over HTTPS — no custom domain needed.
  const g = await sendViaGmailApi(to, mail);
  if (g) return g;
  // Path 3: SMTP fallback.
  try {
    await transport().sendMail({
      from: resolveFrom(),
      to,
      ...mail
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e && e.message ? e.message : 'Email send failed.' };
  }
}
