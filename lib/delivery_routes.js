import crypto from 'node:crypto';
import { layout, esc } from './views.js';
import { hashPassword } from './auth.js';
import { canFulfil, transition } from './machine.js';

export function installDeliveryRoutes(app, { loadDb, saveDb, requireRole, siteOrigin, notifyState, qualifyForOrder }) {
  app.use(['/rider', '/admin/delivery'], (_req, res, next) => {
    res.set('Cache-Control', 'private, no-store').set('X-Robots-Tag', 'noindex, nofollow');
    next();
  });

  app.get('/admin/delivery', requireRole('admin'), (req, res) => {
    const db = loadDb();
    const riders = db.users.filter((u) => u.role === 'rider');
    const pending = (db.purchases || []).filter((p) => canFulfil(p) && ['READY', 'OUT_FOR_DELIVERY'].includes(p.status));
    const cards = pending.map((p) => `<article class="card operation-card">
      <h2><a href="/admin/purchases/${encodeURIComponent(p.id)}">${esc(p.id)}</a></h2>
      <p>${esc(p.address?.address || p.institutionName || 'Address unavailable')} · ${esc(p.deliveryZone || '')}</p>
      <p>${esc(p.slot || '')} · ${esc(p.status)}</p>
      <form method="POST" action="/admin/delivery/${encodeURIComponent(p.id)}/rider">
        <label class="operation-label" for="rider-${esc(p.id)}">Delivery rider</label>
        <select id="rider-${esc(p.id)}" name="riderId" required><option value="">Choose rider</option>${riders.map((r) => `<option value="${esc(r.id)}" ${p.riderId === r.id ? 'selected' : ''}>${esc(r.name)}</option>`).join('')}</select>
        <button class="btn ghost" type="submit">Assign rider</button>
      </form>
      ${p.riderId ? `<p>Assigned to ${esc(riders.find((r) => r.id === p.riderId)?.name || 'a rider')}.</p>` : '<p>Waiting for rider assignment.</p>'}
    </article>`).join('');
    const staff = `<section class="card operation-card"><h2>Add a delivery rider</h2><form method="POST" action="/admin/delivery/staff">
      <div class="field"><label for="staff-name">Rider name</label><input id="staff-name" name="staffName" required maxlength="100"></div>
      <div class="field"><label for="staff-email">Email</label><input id="staff-email" name="email" type="email" required maxlength="120"></div>
      <div class="field"><label for="staff-password">Initial password (12+ characters)</label><input id="staff-password" name="password" type="password" minlength="12" maxlength="200" autocomplete="new-password" required></div>
      <button class="btn loud" type="submit">Create rider account</button>
    </form></section>`;
    res.send(layout({ user: req.user, title: 'Delivery desk', active: '/admin/delivery', body: `<div class="page-heading"><p class="eyebrow">LAST MILE</p><h1>Delivery <em>desk.</em></h1><p>Assign paid, packed purchases to a rider and follow them through delivery.</p></div><div class="grid c2">${cards || '<div class="empty-state"><h2>No deliveries waiting.</h2><p>Purchases ready for dispatch will appear here.</p></div>'}${staff}</div>` }));
  });

  app.post('/admin/delivery/staff', siteOrigin, requireRole('admin'), (req, res) => {
    const db = loadDb();
    const name = String(req.body.staffName || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    if (name.length < 2 || name.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 120 || password.length < 12 || password.length > 200 || db.users.some((u) => u.email.toLowerCase() === email)) {
      return res.status(400).send(layout({ user: req.user, title: 'Delivery desk', body: '<div class="card"><p role="alert">Use a unique valid email, rider name and password of 12–200 characters.</p><a href="/admin/delivery">Back to deliveries</a></div>' }));
    }
    db.users.push({ id: `RID-${crypto.randomUUID()}`, role: 'rider', name, email, passwordHash: hashPassword(password) });
    saveDb(db);
    res.redirect('/admin/delivery');
  });

  app.post('/admin/delivery/:id/rider', siteOrigin, requireRole('admin'), (req, res) => {
    const db = loadDb();
    const purchase = (db.purchases || []).find((p) => p.id === req.params.id && ['READY', 'OUT_FOR_DELIVERY'].includes(p.status) && canFulfil(p));
    const rider = db.users.find((u) => u.id === req.body.riderId && u.role === 'rider');
    if (!purchase || !rider) return res.status(400).send(layout({ user: req.user, title: 'Delivery desk', body: '<div class="card"><p role="alert">Choose a rider for a paid purchase ready for delivery.</p><a href="/admin/delivery">Back to deliveries</a></div>' }));
    purchase.riderId = rider.id;
    saveDb(db);
    res.redirect('/admin/delivery');
  });

  app.get('/rider', requireRole('rider'), (req, res) => {
    const db = loadDb();
    const trips = (db.purchases || []).filter((p) => p.riderId === req.user.id && ['READY', 'OUT_FOR_DELIVERY'].includes(p.status));
    const cards = trips.map((p) => `<article class="card operation-card"><h2>${esc(p.id)}</h2>
      <p>Pick up from: ${esc(db.settings.business.address)}</p><p>Deliver to: ${esc(p.institutionName || '')} ${esc(p.address?.address || '')} · ${esc(p.address?.pin || '')}</p>
      <p>${esc(p.slot || '')}</p>${p.address?.locationAccuracy === 'locality' ? '<p class="field-hint">Map point is approximate. Follow the full address and confirm with the customer if needed.</p>' : ''}
      <p>Contact: ${esc(p.address?.phone || db.users.find((u) => u.id === p.customerId)?.phone || '')}</p>
      ${p.address?.lat && p.address?.lng ? `<a href="https://www.google.com/maps?q=${encodeURIComponent(p.address.lat + ',' + p.address.lng)}" class="btn" target="_blank" rel="noopener">Open delivery location</a>` : ''}
      <form method="POST" action="/rider/purchases/${encodeURIComponent(p.id)}/status"><input type="hidden" name="to" value="${p.status === 'OUT_FOR_DELIVERY' ? 'DELIVERED' : 'OUT_FOR_DELIVERY'}"><button class="btn loud">${p.status === 'OUT_FOR_DELIVERY' ? 'Confirm delivered' : 'Start delivery'}</button></form>
    </article>`).join('');
    res.send(layout({ user: req.user, title: 'My deliveries', active: '/rider', body: `<div class="page-heading"><p class="eyebrow">DELIVERY ROUTE</p><h1>Your <em>deliveries.</em></h1><p>Collect the packed order from PrintKarr and deliver it to the saved address.</p></div><div class="grid c2">${cards || '<div class="empty-state"><h2>No trips assigned.</h2><p>Your next delivery will appear here.</p></div>'}</div>` }));
  });

  app.post('/rider/purchases/:id/status', siteOrigin, requireRole('rider'), (req, res) => {
    const db = loadDb();
    const p = (db.purchases || []).find((x) => x.id === req.params.id && x.riderId === req.user.id);
    const to = req.body.to;
    if (!p || !(p.status === 'READY' && to === 'OUT_FOR_DELIVERY' || p.status === 'OUT_FOR_DELIVERY' && to === 'DELIVERED') || !canFulfil(p)) {
      return res.status(400).send(layout({ user: req.user, title: 'My deliveries', body: '<div class="card"><p role="alert">This delivery cannot move to that step.</p><a href="/rider">Back to deliveries</a></div>' }));
    }
    const orders = (p.printIds || []).map((id) => db.orders.find((o) => o.id === id)).filter(Boolean);
    for (const order of orders) {
      if (to === 'OUT_FOR_DELIVERY') {
        transition(order, 'PICKED_UP', { by: req.user.id });
        transition(order, 'OUT_FOR_DELIVERY', { by: req.user.id });
      } else {
        transition(order, 'DELIVERED', { by: req.user.id });
        qualifyForOrder(db, order);
      }
    }
    p.status = to;
    p.history.push({ to, by: req.user.id, at: new Date().toISOString() });
    saveDb(db);
    for (const order of orders) notifyState(order);
    res.redirect('/rider');
  });
}
