import { layout, esc, pkPublicHead, pkPublicHeader, pkPublicFooter } from './views.js';
import { notificationConfig } from './notify.js';
import { emailConfigured } from './email.js';

export function installNotificationRoutes(app, { loadDb, saveDb, currentUser, requireRole, siteOrigin }) {
  const inbox = (db, user) => (db.notifications || []).filter((n) => n.customerId === user.id);
  app.get('/api/notifications', (req, res) => {
    const user = currentUser(req);
    res.set('Cache-Control', 'private, no-store');
    if (!user) return res.status(401).json({ error: 'Please sign in.' });
    const notes = inbox(loadDb(), user);
    res.json({ unread: notes.filter((n) => !n.read).length, notes: notes.slice(-50).reverse().map(({ id, text, at, read, href, kind }) => ({ id, text, at, read, href, kind })) });
  });
  app.post('/api/notifications/read', siteOrigin, (req, res) => {
    const user = currentUser(req);
    if (!user) return res.status(401).json({ error: 'Please sign in.' });
    if (req.body.all !== true && typeof req.body.id !== 'string') return res.sendStatus(400);
    const db = loadDb();
    for (const n of inbox(db, user)) if (req.body.all === true || n.id === req.body.id) n.read = true;
    saveDb(db); res.json({ ok: true });
  });
  for (const role of ['admin', 'customer']) app.get(`/${role}/notifications`, requireRole(role), (req, res) => {
    const db = loadDb(), cfg = notificationConfig(db), prefs = req.user.notificationPrefs || {};
    const check = (name, label, on) => `<label class="pick"><input type="checkbox" name="${name}" value="1" ${on ? 'checked' : ''}> ${label}</label>`;
    res.send(layout({ title: 'Notifications', user: req.user, active: `/${role}/notifications`, body: `
      <div class="page-heading"><p class="eyebrow">${role === 'admin' ? 'OPERATIONS ALERTS' : 'YOUR ORDER UPDATES'}</p><h1>Your <em>inbox.</em></h1><p>Order updates stay here. Choose the reminders you would like to receive.</p></div><div class="notification-layout">
      <section class="card" style="margin-top:18px" data-notification-inbox aria-label="Notification inbox"><p role="status" data-notification-status>Loading notifications…</p><button type="button" class="rowlink" data-notification-read-all>Mark all as read</button><div data-notification-list></div></section>
      ${role === 'admin' ? `<section class="card" style="margin-top:18px"><h2>Alert sound</h2><p>Keep an admin page open for live alerts. Enable sound after opening the page. Login, print orders and wallet top-ups use different tones.</p><button type="button" class="btn solid" data-notification-sound aria-pressed="false">Enable sound</button><label style="display:block;margin-top:12px">Sound style <select data-notification-tone><option value="chime">Chime</option><option value="bell">Bell</option><option value="soft">Soft</option></select></label><button type="button" class="rowlink" data-notification-test>Test sound</button></section>
      <form class="card" style="margin-top:18px" method="POST" action="/admin/notifications/settings"><h2>Customer reminders &amp; offers</h2><p>At most one reminder or offer per customer in 7 days. Paid orders stop the no-order reminder. Email is sent only to customers who opt in.</p>
      ${check('reminders', 'Remind customers who signed in but did not order', cfg.reminders)}${check('walletOffers', 'Include eligible wallet offers', cfg.walletOffers)}${check('email', 'Send reminder and offer emails', cfg.email)}
      <label>Wait after login (hours) <input type="number" name="delayHours" min="0.25" max="72" step="0.25" value="${esc(cfg.delayHours)}" required></label><p>${emailConfigured() ? 'Email provider is configured.' : 'Email delivery needs the existing Resend, Gmail or SMTP configuration; website alerts work now.'}</p><button class="btn solid" type="submit">Save reminder settings</button></form>
      <section class="card" style="margin-top:18px"><h2>Email delivery</h2><p>${['pending', 'sending', 'sent', 'failed', 'unknown', 'cancelled'].map((status) => `${status}: ${db.notifications.filter((n) => n.email?.status === status).length}`).join(' · ')}</p><p>Failed sends retry up to three times, an hour apart. Interrupted sends with unknown delivery are held to avoid duplicate emails.</p></section>` : `<form class="card" style="margin-top:18px" method="POST" action="/customer/notifications/preferences"><h2>Reminder preferences</h2>${check('offers', 'Website reminders and wallet offers', prefs.offers !== false)}${check('email', 'Email me print reminders and wallet offers', prefs.email === true)}<p>Email reminders are optional. Order updates stay in your website inbox.</p><button class="btn solid" type="submit">Save preferences</button></form>`}</div>` }));
  });
  app.post('/customer/notifications/preferences', requireRole('customer'), siteOrigin, (req, res) => {
    const db = loadDb(), user = db.users.find((u) => u.id === req.user.id);
    user.notificationPrefs = { offers: req.body.offers === '1', email: req.body.email === '1' };
    saveDb(db); res.redirect('/customer/notifications');
  });
  app.post('/admin/notifications/settings', requireRole('admin'), siteOrigin, (req, res) => {
    const delayHours = Number(req.body.delayHours);
    if (!Number.isFinite(delayHours) || delayHours < 0.25 || delayHours > 72) return res.status(400).send('Choose a delay between 0.25 and 72 hours.');
    const db = loadDb();
    db.settings.notifications = { reminders: req.body.reminders === '1', walletOffers: req.body.walletOffers === '1', email: req.body.email === '1', delayHours };
    saveDb(db); res.redirect('/admin/notifications');
  });
  app.get('/notifications/unsubscribe/:token', (req, res) => {
    res.set('Cache-Control', 'private, no-store'); res.set('X-Robots-Tag', 'noindex, nofollow');
    if (!/^[a-f0-9]{48}$/.test(req.params.token) || !loadDb().users.some((u) => u.notificationUnsubscribe === req.params.token)) return res.sendStatus(404);
    // GET only confirms: email security scanners must not unsubscribe customers.
    res.send(`<!doctype html><html lang="en"><head>${pkPublicHead('Email preferences')}</head><body class="signin-site">${pkPublicHeader()}<main id="main" class="login-wrap"><p class="eyebrow">EMAIL PREFERENCES</p><h1 class="display">Stop reminder and offer emails?</h1><p class="muted">Your order updates will still appear in your website inbox.</p><form method="POST" class="card" style="margin-top:24px"><button class="btn loud" type="submit">Unsubscribe</button></form></main>${pkPublicFooter()}</body></html>`);
  });
  app.post('/notifications/unsubscribe/:token', siteOrigin, (req, res) => {
    if (!/^[a-f0-9]{48}$/.test(req.params.token)) return res.sendStatus(404);
    const db = loadDb(), user = db.users.find((u) => u.notificationUnsubscribe === req.params.token);
    if (!user) return res.sendStatus(404);
    user.notificationPrefs = { ...user.notificationPrefs, email: false };
    saveDb(db); res.set('Cache-Control', 'private, no-store'); res.set('X-Robots-Tag', 'noindex, nofollow');
    res.send(`<!doctype html><html lang="en"><head>${pkPublicHead('Email preferences saved')}</head><body class="signin-site">${pkPublicHeader()}<main id="main" class="login-wrap"><p class="eyebrow">EMAIL PREFERENCES</p><h1 class="display">Preferences saved.</h1><p class="muted">You have stopped reminder and offer emails. Your order updates stay in your website inbox.</p><a class="btn loud" href="/customer/notifications">Manage preferences</a></main>${pkPublicFooter()}</body></html>`);
  });
}
