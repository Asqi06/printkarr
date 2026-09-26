// Kiosk collection tokens — the QR the customer scans at the counter to
// confirm pickup. Same trust model as share tokens: possession of the link
// (displayed on the kiosk screen, later the Pi) proves presence. Single-use,
// order must still be awaiting pickup when consumed.
import crypto from 'node:crypto';

export const COLLECT_TTL_MS = 7 * 864e5;

export function collectTokens(db) {
  db.collectTokens ||= [];
  return db.collectTokens;
}

// Lazily mint (or reuse) a live token for an order awaiting pickup.
// Only expired tokens are pruned; used ones stay so a re-scan can say
// "already collected" instead of "bad link".
export function collectTokenFor(db, orderId, now = Date.now()) {
  const all = collectTokens(db);
  db.collectTokens = all.filter((t) => Date.parse(t.expiresAt) > now);
  let tok = db.collectTokens.find((t) => t.orderId === orderId && !t.usedAt);
  if (!tok) {
    tok = {
      token: crypto.randomBytes(16).toString('hex'),
      orderId,
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + COLLECT_TTL_MS).toISOString(),
      usedAt: null
    };
    db.collectTokens.push(tok);
  }
  return tok.token;
}

export function findCollectToken(db, token, now = Date.now()) {
  const t = collectTokens(db).find((x) => x.token === token);
  if (!t) return { ok: false, error: 'bad-link' };
  if (t.usedAt) return { ok: false, error: 'used' };
  if (Date.parse(t.expiresAt) < now) return { ok: false, error: 'expired' };
  return { ok: true, token: t };
}

export function consumeCollectToken(db, token, order, now = Date.now()) {
  const found = findCollectToken(db, token, now);
  if (!found.ok) return found;
  if (!order || order.id !== found.token.orderId) return { ok: false, error: 'mismatch' };
  if (order.status !== 'READY_FOR_PICKUP') return { ok: false, error: 'not-ready' };
  found.token.usedAt = new Date(now).toISOString();
  return { ok: true, token: found.token };
}
