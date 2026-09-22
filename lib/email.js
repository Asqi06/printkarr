// Outbound email — Resend API first (HTTPS, works everywhere incl. Render),
// SMTP via nodemailer as fallback. Configure ONE of:
//   RESEND_API_KEY (https://resend.com → API Keys, free tier, no card), or
//   SMTP_HOST (default smtp.gmail.com), SMTP_PORT (default 587),
//   SMTP_USER, SMTP_PASS, SMTP_FROM (default SMTP_USER).
// Gmail SMTP path: Google Account → Security → 2-Step Verification →
// App passwords → paste as SMTP_PASS. Note some hosts block outbound SMTP;
// if you see "Connection timeout", use RESEND_API_KEY instead.
import nodemailer from 'nodemailer';

let _transport = null;

export function emailConfigured() {
  return !!(process.env.RESEND_API_KEY || (process.env.SMTP_USER && process.env.SMTP_PASS));
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
          from: process.env.SMTP_FROM || 'PrintKarr <onboarding@resend.dev>',
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
  // Path 2: SMTP fallback.
  try {
    await transport().sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      ...mail
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e && e.message ? e.message : 'Email send failed.' };
  }
}
