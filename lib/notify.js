// In-app notifications — PRD §41. Every major state change notifies.
// Website inbox + a persisted, opt-in email queue. No external messaging dependency.
import { loadDb, saveDb } from './db.js';
import crypto from 'node:crypto';
import { eligibleWalletOffers } from './campus.js';
import { sendEmail, emailConfigured } from './email.js';
import { flushAtlas } from './atlas.js';
import { esc } from './views.js';
import { SITE } from './seo.js';

const DAY = 864e5;

export function notificationConfig(db) {
  return { reminders: true, walletOffers: true, email: true, delayHours: 1, ...db.settings?.notifications };
}

export function addNotification(db, note) {
  db.notifications ||= [];
  if (note.key && db.notifications.some((n) => n.customerId === note.customerId && n.key === note.key)) return;
  const row = { id: `NT-${crypto.randomUUID()}`, at: new Date().toISOString(), read: false, ...note };
  db.notifications.push(row);
  return row;
}

export function notifyAdmins(db, kind, text, href, key) {
  for (const user of db.users || []) if (user.role === 'admin') addNotification(db, { customerId: user.id, orderId: null, kind, text, href, key });
}

export function hasOrderedSince(db, customerId, at) {
  return [...(db.orders || []), ...(db.purchases || [])].some((o) => o.customerId === customerId
    && (o.paymentStatus === 'paid' || o.history?.some((h) => ['CONFIRMED', 'PAID'].includes(h.to)))
    && Date.parse(o.paidAt || o.updatedAt || o.createdAt) >= Date.parse(at));
}

export function scheduleCustomerNotes(db, now = Date.now()) {
  const cfg = notificationConfig(db);
  let count = 0;
  // ponytail: one scan per customer fits the pilot; index by customer before a large campaign.
  for (const user of db.users || []) {
    const login = Date.parse(user.lastLoginAt);
    if (user.role !== 'customer' || user.notificationPrefs?.offers === false || !Number.isFinite(login)
      || now - login < cfg.delayHours * 36e5 || now - login > 30 * DAY) continue;
    const last = Math.max(0, ...(db.notifications || []).filter((n) => n.customerId === user.id && ['reminder', 'offer'].includes(n.kind)).map((n) => Date.parse(n.at)));
    if (now - last < 7 * DAY) continue;
    const reminder = cfg.reminders && !hasOrderedSince(db, user.id, user.lastLoginAt)
      && !(db.notifications || []).some((n) => n.customerId === user.id && n.key === `reminder:${user.lastLoginAt}`);
    const offers = cfg.walletOffers ? eligibleWalletOffers(db, user.id).filter((o) => o.bonus > 0 || o.freeFiles > 0) : [];
    if (!reminder && !offers.length) continue;
    const offer = offers[0];
    const text = [reminder ? 'Aap PrintKarr par aaye the. Print chahiye? Apna document upload karke order poora karein.' : '',
      offer ? `${offer.name}: ₹${offer.amount} wallet top-up${offer.bonus ? ` + ₹${offer.bonus} bonus` : ''}${offer.freeFiles ? ` + ${offer.freeFiles} free files` : ''}. Current terms apply.` : ''].filter(Boolean).join(' ');
    const note = addNotification(db, { customerId: user.id, orderId: null, kind: reminder ? 'reminder' : 'offer', text,
      href: reminder ? '/customer/orders/new' : '/customer/wallet', at: new Date(now).toISOString(),
      key: reminder ? `reminder:${user.lastLoginAt}` : `offer:${Math.floor(now / (7 * DAY))}`, loginAt: user.lastLoginAt,
      walletOffer: offer ? { id: offer.id, amount: offer.amount, bonus: offer.bonus || 0, freeFiles: offer.freeFiles || 0 } : null });
    if (!note) continue;
    if (cfg.email && user.notificationPrefs?.email === true && user.email && !user.email.endsWith('@demo.printkarr.in')) {
      user.notificationUnsubscribe ||= crypto.randomBytes(24).toString('hex');
      note.email = { status: 'pending', attempts: 0 };
    }
    count++;
  }
  return count;
}

let running = false;
export async function runNotificationJobs({ now = Date.now(), readDb = loadDb, writeDb = saveDb, persist = flushAtlas, send = sendEmail, configured = emailConfigured } = {}) {
  if (running) return;
  running = true;
  try {
    const db = readDb();
    let changed = scheduleCustomerNotes(db, now) > 0;
    for (const n of db.notifications || []) if (n.email?.status === 'sending' && now - Date.parse(n.email.startedAt) > 10 * 60e3) {
      // ponytail: an interrupted send has unknown delivery; don't auto-retry and duplicate it. Use a provider idempotency key before scaling.
      n.email.status = 'unknown'; changed = true;
    }
    if (changed) { writeDb(db); await persist(); }
    if (!configured()) return;
    const pending = (db.notifications || []).filter((n) => n.email?.status === 'pending' && !(Date.parse(n.email.retryAt) > now)).slice(0, 10);
    for (const queued of pending) {
      const current = readDb(), note = current.notifications.find((n) => n.id === queued.id), user = current.users.find((u) => u.id === note?.customerId);
      if (note?.email?.status !== 'pending') continue;
      const cfg = notificationConfig(current);
      const offer = note.walletOffer && eligibleWalletOffers(current, user?.id).find((o) => o.id === note.walletOffer.id);
      const staleOffer = note.walletOffer && (!cfg.walletOffers || !offer || ['amount', 'bonus', 'freeFiles'].some((k) => (offer[k] || 0) !== note.walletOffer[k]));
      if (!user || !cfg.email || user.notificationPrefs?.email !== true || user.notificationPrefs?.offers === false
        || staleOffer || now - Date.parse(note.at) > 7 * DAY || (note.kind === 'reminder' && (!cfg.reminders || user.lastLoginAt !== note.loginAt || hasOrderedSince(current, user.id, note.loginAt)))
        || (note.kind === 'offer' && !cfg.walletOffers)) {
        note.email.status = 'cancelled'; writeDb(current); await persist(); continue;
      }
      note.email.status = 'sending'; note.email.startedAt = new Date(now).toISOString(); note.email.attempts++;
      writeDb(current); await persist();
      const unsubscribe = `${SITE}/notifications/unsubscribe/${user.notificationUnsubscribe}`;
      let result;
      try { result = await send(user.email, { subject: note.kind === 'reminder' ? 'Your next print is a few clicks away — PrintKarr' : 'Wallet offers at PrintKarr',
        text: `${note.text}\n\n${SITE}${note.href}\n\nStop reminder and offer emails: ${unsubscribe}`,
        html: `<div style="font-family:system-ui;max-width:480px;margin:auto;padding:24px"><h2>PrintKarr</h2><p>${esc(note.text)}</p><p><a href="${esc(SITE + note.href)}">${note.kind === 'reminder' ? 'Print your document' : 'View wallet offers'}</a></p><p><a href="${esc(unsubscribe)}">Unsubscribe from reminders and offers</a></p></div>` }); }
      catch { result = { ok: false }; }
      // Reload after network I/O: never overwrite orders, wallet changes or preferences made while sending.
      const latest = readDb(), delivered = latest.notifications.find((n) => n.id === note.id);
      if (!delivered) continue;
      delivered.email.status = result.ok ? 'sent' : delivered.email.attempts >= 3 ? 'failed' : 'pending';
      if (result.ok) delivered.email.sentAt = new Date(now).toISOString();
      else delivered.email.retryAt = new Date(now + 3600e3).toISOString();
      writeDb(latest); await persist();
    }
  } finally { running = false; }
}

export function notify(customerId, orderId, text, at) {
  const db = loadDb();
  addNotification(db, {
    customerId, orderId, text,
    at: at || new Date().toISOString(),
    read: false
  });
  saveDb(db);
}

export function notifyState(order) {
  const map = {
    CONFIRMED: `Order #${order.id} confirmed — payment received.`,
    PRINT_QUEUE: `Order #${order.id} is in the print queue.`,
    PRINTING: `Order #${order.id} has started printing.`,
    PRINTED: `Order #${order.id} has finished printing.`,
    READY_FOR_PICKUP: `Order #${order.id} is ready for ${order.deliveryZone && order.deliveryZone !== 'pickup' ? 'delivery' : 'pickup'}.`,
    RIDER_ASSIGNED: `Rider has been assigned to order #${order.id}.`,
    PICKED_UP: `Rider has picked up order #${order.id}.`,
    OUT_FOR_DELIVERY: `Order #${order.id} is out for delivery.`,
    DELIVERED: `Order #${order.id} was ${order.deliveryZone && order.deliveryZone !== 'pickup' ? 'delivered' : 'collected'}. Enjoy!`,
    CANCELLED: `Order #${order.id} was cancelled.`
  };
  const text = map[order.status];
  if (!text) return;
  const db = loadDb();
  addNotification(db, { customerId: order.customerId, orderId: order.id, text, href: `/customer/orders/${encodeURIComponent(order.id)}` });
  if (['CONFIRMED', 'PRINT_QUEUE'].includes(order.status)) {
    const user = db.users.find((u) => u.id === order.customerId);
    notifyAdmins(db, 'order', `New print order #${order.id} from ${user?.name || 'Customer'} — ₹${order.total}.`, `/admin/orders/${encodeURIComponent(order.id)}`, `order:${order.id}`);
  }
  saveDb(db);
}
