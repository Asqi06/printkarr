// Outbound email — SMTP via nodemailer. Configure with:
//   SMTP_HOST (default smtp.gmail.com), SMTP_PORT (default 587),
//   SMTP_USER, SMTP_PASS, SMTP_FROM (default SMTP_USER).
// Gmail path: create an App Password (Google Account → Security →
// 2-Step Verification → App passwords), paste it as SMTP_PASS.
// Without SMTP_USER/SMTP_PASS, emailConfigured() is false and callers
// must NOT pretend a message was sent.
import nodemailer from 'nodemailer';

let _transport = null;

export function emailConfigured() {
  return !!(process.env.SMTP_USER && process.env.SMTP_PASS);
}

function transport() {
  if (_transport) return _transport;
  const port = Number(process.env.SMTP_PORT || 587);
  _transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
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
  if (!emailConfigured()) return { ok: false, error: 'Email delivery is not configured on this server (SMTP_USER/SMTP_PASS).' };
  try {
    await transport().sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      ...codeMail(code)
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e && e.message ? e.message : 'Email send failed.' };
  }
}
