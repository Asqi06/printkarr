// Admin views — control tower (§26–§37).
import { layout, esc } from './views.js';
import { friendly } from './views_customer.js';

const rs = (n) => '₹' + (Math.round(n * 100) / 100);
const badge = (s) => `<span class="badge b-${s}">${friendly(s)}</span>`;
const A = (active) => ({ extraCss: '/customer.css', active });

export function adminDashboard(u, d) {
  return layout({
    title: 'Control center', user: u, ...A('/admin'),
    body: `
    <p class="eyebrow rv">PrintKarr operations</p>
    <h1 class="display rv" style="font-size:clamp(2rem,6vw,4rem)">Daily <em>overview.</em></h1>
    <div class="grid c3" style="margin:18px 0">
      <div class="card sun rv"><div class="stat"><div class="v">${d.today}</div><div class="k">Today's orders</div></div></div>
      <div class="card rv"><div class="stat"><div class="v">${d.printing}</div><div class="k">Printing now</div></div></div>
      <div class="card rv"><div class="stat"><div class="v">${d.ready}</div><div class="k">Ready / pickup</div></div></div>
    </div>
    <div class="grid c3">
      <div class="card ink rv"><div class="stat"><div class="v">${rs(d.revenue)}</div><div class="k">Revenue today</div></div></div>
      <div class="card rv"><div class="stat"><div class="v">${d.pages}</div><div class="k">Pages printed today</div></div></div>
      <div class="card rv"><div class="stat"><div class="v">${d.delivered}</div><div class="k">Picked up today</div></div></div>
    </div>
    <div class="rv" style="margin-top:18px;display:flex;gap:8px;flex-wrap:wrap">
      <a class="btn loud" href="/admin/orders"><span>Order queue →</span></a>
      <a class="btn solid" href="/admin/print-queue"><span>Print queue →</span></a>
    </div>`
  });
}

const FILTERS = ['all', 'new', 'printing', 'ready', 'completed', 'cancelled'];

export function orderQueue(u, { filter, q, rows }) {
  const chips = FILTERS.map((f) =>
    `<a class="chip ${f === filter ? 'on' : ''}" href="/admin/orders?filter=${f}${q ? `&q=${encodeURIComponent(q)}` : ''}">${f}</a>`).join('');
  const trs = rows.map((o) => `
    <tr><td><a class="rowlink mono" href="/admin/orders/${o.id}">${esc(o.id)}</a></td>
    <td>${esc(o.cname)}</td><td>${o.pages}</td><td>${o.printType === 'bw' ? 'B&W' : 'Color'}</td>
    <td>${badge(o.status)}</td><td><b>${rs(o.total)}</b></td></tr>`).join('')
    || `<tr><td colspan="6" class="muted">No orders match.</td></tr>`;
  return layout({
    title: 'Order queue', user: u, ...A('/admin/orders'),
    body: `
    <p class="eyebrow rv">Order queue · ${rows.length} shown</p>
    <h1 class="display rv" style="font-size:clamp(2rem,6vw,3.6rem)">Order <em>queue.</em></h1>
    <form class="rv" method="GET" action="/admin/orders" style="display:flex;gap:8px;margin:16px 0;flex-wrap:wrap">
      <input type="hidden" name="filter" value="${esc(filter)}">
      <input name="q" value="${esc(q)}" placeholder="Search order ID or customer…" style="flex:1;min-width:220px;border:2px solid var(--ink);border-radius:10px;padding:11px 14px;font:inherit;background:var(--paper)">
      <button class="btn solid" type="submit"><span>Search</span></button>
    </form>
    <div class="chips rv" style="margin-bottom:14px">${chips}</div>
    <div class="tblwrap rv"><table class="tbl"><thead><tr><th>Order</th><th>Customer</th><th>Pages</th><th>Type</th><th>Status</th><th>Total</th></tr></thead><tbody>${trs}</tbody></table></div>`
  });
}

export function adminOrderDetail(u, o, c, addr, nexts, waUrl, agentSeen, collectQr = null) {
  const lat = Number(addr.lat), lng = Number(addr.lng);
  const mapLink = Number.isFinite(lat) && Number.isFinite(lng) && lat >= 20.1 && lat <= 20.55 && lng >= 72.7 && lng <= 73.1
    ? `https://www.google.com/maps?q=${lat},${lng}` : null;
  const agentHint = o.status === 'PRINT_QUEUE'
    ? (agentSeen && Date.now() - agentSeen < 60000
      ? `<p class="pick hot" style="margin-bottom:10px">◉ Agent is watching — it grabs this job within seconds. Hands off the buttons below.</p>`
      : `<p class="pick" style="margin-bottom:10px">○ Agent not seen lately — start it (<span class="mono">npm run agent</span>) or print manually below.</p>`)
    : '';
  const actions = nexts.map((to) => {
    const label = { PRINT_QUEUE: 'Send to print queue', PRINTING: 'Start printing', PRINTED: 'Mark printed', READY_FOR_PICKUP: 'Mark collected', PICKED_UP: 'Mark picked up', OUT_FOR_DELIVERY: 'Start delivery', DELIVERED: 'Mark delivered', CANCELLED: 'Cancel order', REFUNDED: 'Refund' }[to] || to;
    return `<form method="POST" action="/admin/orders/${o.id}/transition" style="display:inline"><input type="hidden" name="to" value="${to}"><button class="btn ${to === 'CANCELLED' ? 'ghost' : 'solid'}" type="submit"><span>${label}</span></button></form>`;
  }).join('');
  return layout({
    title: `Order ${o.id}`, user: u, ...A('/admin/orders'),
    body: `
    <p class="eyebrow rv"><a href="/admin/orders" style="text-decoration:none">← Queue</a></p>
    <h1 class="display rv" style="font-size:clamp(2rem,6vw,3.6rem)">Job <em>#${esc(o.id)}</em></h1>
    <div class="rv" style="margin:10px 0 18px">${badge(o.status)}</div>
    <div class="grid c2">
      <div class="card rv"><p class="eyebrow">Print job</p>
        <p style="font-weight:700;margin:8px 0">📄 ${esc(o.document)}</p>
        <div class="sumrow"><span>Customer</span><span>${esc(c.name)} · ${esc(c.phone || '')}</span></div>
        <div class="sumrow"><span>Pages × copies</span><span>${o.pages} × ${o.copies}${o.pageRange ? ` (${esc(o.pageRange)})` : ''}</span></div>
        <div class="sumrow"><span>Spec</span><span>${o.printType === 'bw' ? 'B&W' : 'Color'} · ${o.sides} · ${esc(o.paper || 'A4')}</span></div>
        <div class="sumrow"><span>Notes</span><span>${esc(o.notes || '—')}</span></div>
        <div class="sumrow"><span>${/pickup/i.test(String(addr.area || '')) ? 'Collection' : 'Delivery'}</span><span>${esc(addr.address || o.slot)}, ${esc(addr.area || '')}</span></div>
        ${mapLink ? `<a class="rowlink" href="${mapLink}" target="_blank" rel="noopener">Open pinned delivery point ↗</a>` : ''}
        <div class="sumrow"><span>Delivery slot</span><span>${esc(o.slot)}</span></div>
        ${o.lateCredit ? `<p class="field-hint">Missed-slot credit: ₹${o.lateCredit}${o.lateCreditedAt ? ' · credited' : ''}.</p>` : ''}
        <div class="sumrow total"><span>Total</span><span>${rs(o.total)}</span></div>
        <a class="btn ghost" style="margin-top:12px" href="/admin/orders/${o.id}/file"><span>⬇ Download PDF</span></a>
        ${waUrl ? `<a class="btn sun" style="margin-top:12px" href="${waUrl}" target="_blank" rel="noopener"><span>✆ Forward on WhatsApp →</span></a>` : ''}
      </div>
      <div class="card rv"><p class="eyebrow">Next actions</p>
        <div style="margin-top:10px">${agentHint}</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">${actions || '<p class="muted">Terminal state — nothing to do.</p>'}</div>
        ${collectQr && collectQr.img ? `<div style="margin-top:16px;text-align:center;border:3px solid var(--tang);border-radius:14px;padding:14px;background:var(--paper)">
          <p class="eyebrow">Kiosk pickup QR — customer scans to confirm</p>
          <img src="${collectQr.img}" alt="Pickup QR for order ${esc(o.id)}" style="width:100%;max-width:280px;margin-top:8px">
          <p class="mono muted" style="font-size:10px;margin-top:8px;word-break:break-all">${esc(collectQr.url)}</p></div>` : ''}
        <p class="eyebrow" style="margin-top:16px">History</p>
        <ol class="tline">${o.history.map((h) => `<li class="done"><span class="pip"></span><b>${esc(h.from)} → ${esc(h.to)}</b><br><span class="at">${esc(new Date(h.at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }))}${h.by ? ' · ' + esc(h.by) : ''}</span></li>`).join('')}</ol>
      </div>
    </div>`
  });
}

export function printQueuePage(u, jobs, printer) {
  const cards = jobs.map((o) => `
    <a class="card rv" href="/admin/orders/${o.id}">
      <div style="display:flex;justify-content:space-between;align-items:center"><b class="mono">#${esc(o.id)}</b>${badge(o.status)}</div>
      <p style="font-weight:700;margin:8px 0">📄 ${esc(o.document)}</p>
      <p class="muted mono" style="font-size:11px">${o.pages} pages · ${o.printType === 'bw' ? 'B&W' : 'Color'} · ${o.sides} · ${o.copies} ${o.copies === 1 ? 'copy' : 'copies'}</p>
      <span class="rowlink">Open job →</span></a>`).join('')
    || '<div class="card"><p class="muted">Queue clear. The Epson rests.</p></div>';
  const bar = (v) => `<div class="pbar"><span style="width:${v}%"></span></div>`;
  return layout({
    title: 'Print queue', user: u, ...A('/admin/print-queue'),
    body: `
    <p class="eyebrow rv">Print queue</p>
    <h1 class="display rv" style="font-size:clamp(2rem,6vw,3.6rem)">Print <em>queue.</em></h1>
    <div class="rv" style="margin:12px 0"><a class="btn sun" href="/admin/qr"><span>▣ Classroom QR →</span></a></div>
    <div class="card ink rv" style="margin:18px 0"><p class="eyebrow" style="color:rgba(250,245,234,.6)">Printer status · ${esc(printer.name)}</p>
      <div class="stat" style="margin:6px 0"><div class="v">${printer.online ? '● Online' : '○ Offline'}</div></div>
      <div class="grid c2"><div><p class="mono" style="font-size:11px">Ink ${printer.ink}%</p>${bar(printer.ink)}</div>
      <div><p class="mono" style="font-size:11px">Paper ${printer.paper}%</p>${bar(printer.paper)}</div></div>
      <p class="mono" style="font-size:11px;margin-top:10px">Current job · ${esc(printer.currentJob || 'idle')}</p></div>
    <div class="grid c2">${cards}</div>`
  });
}

export function classroomQr(u, orderUrl) {
  return layout({
    title: 'Classroom QR', user: u, ...A('/admin/print-queue'),
    body: `
    <p class="eyebrow rv">Pilot entry point · V0</p>
    <h1 class="display rv" style="font-size:clamp(2rem,6vw,3.6rem)">Classroom <em>QR.</em></h1>
    <div class="card rv" style="margin-top:18px;text-align:center;max-width:560px">
      <img src="/qr.png" alt="QR: scan to print" style="width:100%;max-width:400px;border:4px solid var(--tang);border-radius:14px">
      <p class="mono" style="font-size:12px;margin:12px 0;word-break:break-all">${esc(orderUrl)}</p>
      <p class="muted" style="margin-bottom:14px">Print this page, paste it in the classroom.<br>Students scan → upload → pay → collect at the counter.</p>
      <button class="btn solid" type="button" onclick="window.print()"><span>Print this page</span></button>
    </div>`
  });
}

export function customersPage(u, rows) {
  const trs = rows.map((r) => `
    <tr><td><a class="rowlink" href="/admin/customers/${r.id}">${esc(r.name)}</a></td>
    <td>${r.count}</td><td><b>${rs(r.spent)}</b></td><td>${rs(r.wallet)}</td></tr>`).join('');
  return layout({
    title: 'Customers', user: u, ...A('/admin/customers'),
    body: `
    <p class="eyebrow rv">Customers</p>
    <h1 class="display rv" style="font-size:clamp(2rem,6vw,3.6rem)">Your <em>customers.</em></h1>
    <div class="tblwrap rv" style="margin-top:16px"><table class="tbl"><thead><tr><th>Customer</th><th>Orders</th><th>Spent</th><th>Wallet</th></tr></thead><tbody>${trs}</tbody></table></div>`
  });
}

export function customerDetailAdmin(u, c, orders, wallet, addresses, packSubs = []) {
  const rows = orders.map((o) => `<div class="sumrow"><span><a class="rowlink mono" href="/admin/orders/${o.id}">#${esc(o.id)}</a> · ${esc(o.document)}</span><span>${badge(o.status)} ${rs(o.total)}</span></div>`).join('') || '<p class="muted">No orders yet.</p>';
  const addr = addresses.map((a) => `<div class="sumrow"><span><b>${esc(a.label)}</b> — ${esc(a.address)}, ${esc(a.area)}</span></div>`).join('');
  const packs = packSubs.length
    ? packSubs.map((s) => `<div class="sumrow"><span><b>${esc(s.packName)}</b> · B&W ${s.bwUsed}/${s.bwTotal} · C ${s.colorUsed}/${s.colorTotal} · F ${s.filesUsed}/${s.filesTotal}</span><span>${rs(s.paidTotal)}/${rs(s.price)}</span></div>`).join('')
    : '<p class="muted">No semester packs.</p>';
  return layout({
    title: c.name, user: u, ...A('/admin/customers'),
    body: `
    <p class="eyebrow rv"><a href="/admin/customers" style="text-decoration:none">← Customers</a></p>
    <h1 class="display rv" style="font-size:clamp(2rem,6vw,3.6rem)">${esc(c.name)}<em>.</em></h1>
    <div class="grid c2" style="margin-top:16px">
      <div class="card rv"><p class="eyebrow">Ledger</p>
        <div class="sumrow"><span>Orders</span><span>${orders.length}</span></div>
        <div class="sumrow"><span>Spent</span><span>${rs(orders.filter((o) => o.paymentStatus === 'paid').reduce((s, o) => s + o.total, 0))}</span></div>
        <div class="sumrow"><span>Wallet</span><span>${rs(wallet.balance)}</span></div>
        <div class="sumrow"><span>Student rate</span><span>${c.student ? 'ON' : 'Off'}</span></div></div>
      <div class="card rv"><p class="eyebrow">Addresses</p><div style="margin-top:6px">${addr || '<p class="muted">None saved.</p>'}</div></div>
    </div>
    <h2 class="h-sec rv">Semester packs</h2><div class="card rv">${packs}</div>
    <h2 class="h-sec rv">Order history</h2><div class="card rv">${rows}</div>`
  });
}

export function pricingPage(u, p) {
  const num = (k, label, extra) => `
    <div class="field"><label for="p-${k}">${label}</label><input id="p-${k}" name="${k}" type="number" step="0.05" min="0" value="${p[k]}"></div>`;
  return layout({
    title: 'Pricing', user: u, ...A('/admin/pricing'),
    body: `
    <p class="eyebrow rv">Pricing · live the second you save</p>
    <h1 class="display rv" style="font-size:clamp(2rem,6vw,3.6rem)">Print <em>pricing.</em></h1>
    <form class="card rv" style="margin-top:18px" method="POST" action="/admin/pricing">
      <div class="grid c2">${num('bw', 'B&W ₹ / page')}${num('color', 'Color ₹ / page')}</div>
      <div class="grid c2">${num('studentBw', 'Student B&W ₹ / page')}${num('studentColor', 'Student color ₹ / page')}</div>
      <div class="grid c2">
        <div class="field"><label>Sarigam delivery ₹</label><input name="dz_sarigam" type="number" min="0" value="${p.delivery.sarigam}"></div>
        <div class="field"><label>Bhilad delivery ₹</label><input name="dz_bhilad" type="number" min="0" value="${p.delivery.bhilad}"></div>
      </div>
      <p class="muted" style="font-size:12px;margin:8px 0 12px">Approximate straight-line bands. Vapi: ₹10 within 1 km of Chala, ₹15 up to 3 km, then +₹5 per 2 km. Daman: ₹20 near Dabhel Check Post, then +₹5 per 2 km. Base delivery is capped at ₹60. Kiosk collection is free.</p>
      <p class="eyebrow" style="margin-top:18px">Time &amp; demand surcharges</p>
      <p class="muted" style="font-size:12px;margin:6px 0 12px">Late-night fees apply to delivery orders placed within this India-time window. Surge uses active print-queue jobs as its demand measure. A fee of ₹0 disables that surcharge; a threshold of 0 disables surge.</p>
      <div class="grid c3">
        <div class="field"><label for="night-start">Late-night starts</label><input id="night-start" name="nightStart" type="time" value="${p.surcharges.lateNight.start}"></div>
        <div class="field"><label for="night-end">Late-night ends</label><input id="night-end" name="nightEnd" type="time" value="${p.surcharges.lateNight.end}"></div>
        <div class="field"><label for="night-fee">Late-night delivery ₹</label><input id="night-fee" name="nightFee" type="number" min="0" step="0.05" value="${p.surcharges.lateNight.fee}"></div>
      </div>
      <div class="grid c2">
        <div class="field"><label for="surge-jobs">Surge starts at active jobs</label><input id="surge-jobs" name="surgeJobs" type="number" min="0" step="1" value="${p.surcharges.surge.activeJobs}"></div>
        <div class="field"><label for="surge-fee">High-demand surcharge ₹</label><input id="surge-fee" name="surgeFee" type="number" min="0" step="0.05" value="${p.surcharges.surge.fee}"></div>
      </div>
      <button class="btn loud big" style="width:100%" type="submit"><span>Save pricing →</span></button>
    </form>`
  });
}

export function couponsPage(u, coupons) {
  const rows = coupons.map((c) => `
    <tr><td><b class="mono">${esc(c.code)}</b></td><td>${c.type === 'percent' ? c.value + '%' : '₹' + c.value}</td>
    <td>₹${c.minOrder}</td><td>${esc(c.expiry)}</td><td>${c.active ? '● live' : '○ off'}</td>
    <td><form method="POST" action="/admin/coupons/toggle" style="display:inline"><input type="hidden" name="code" value="${esc(c.code)}">
    <button class="rowlink" type="submit">${c.active ? 'disable' : 'enable'}</button></form></td></tr>`).join('');
  return layout({
    title: 'Coupons', user: u, ...A('/admin/coupons'),
    body: `
    <p class="eyebrow rv">Coupons &amp; offers</p>
    <h1 class="display rv" style="font-size:clamp(2rem,6vw,3.6rem)">Coupons &amp; <em>offers.</em></h1>
    <div class="tblwrap rv" style="margin-top:16px"><table class="tbl"><thead><tr><th>Code</th><th>Off</th><th>Min ₹</th><th>Expiry</th><th></th><th></th></tr></thead><tbody>${rows}</tbody></table></div>
    <div class="card rv" style="margin-top:14px"><p class="eyebrow">Create offer</p>
      <form method="POST" action="/admin/coupons" style="margin-top:10px">
        <div class="grid c2"><div class="field"><label for="field-code">Code</label><input id="field-code" name="code" required placeholder="DIWALI20"></div>
        <div class="field"><label for="field-type">Type</label><select id="field-type" name="type"><option value="percent">Percentage</option><option value="fixed">Fixed ₹</option></select></div></div>
        <div class="grid c3"><div class="field"><label for="field-value">Discount</label><input id="field-value" name="value" type="number" min="1" required placeholder="20"></div>
        <div class="field"><label for="field-minOrder">Min order ₹</label><input id="field-minOrder" name="minOrder" type="number" min="0" value="0"></div>
        <div class="field"><label for="field-expiry">Expiry</label><input id="field-expiry" name="expiry" type="date" required></div></div>
        <button class="btn sun" type="submit"><span>+ Create</span></button></form></div>`
  });
}

export function analyticsPage(u, a) {
  const bar = (label, v, max, suffix) => `
    <div style="margin:8px 0"><div class="sumrow"><span>${label}</span><span><b>${v}</b>${suffix || ''}</span></div>
    <div class="pbar"><span style="width:${max ? Math.round((v / max) * 100) : 0}%"></span></div></div>`;
  return layout({
    title: 'Analytics', user: u, ...A('/admin/analytics'),
    body: `
    <p class="eyebrow rv">Analytics — kiosk</p>
    <h1 class="display rv" style="font-size:clamp(2rem,6vw,3.6rem)">Business <em>analytics.</em></h1>
    <div class="grid c3" style="margin:18px 0">
      <div class="card sun rv"><div class="stat"><div class="v">${rs(a.salesToday)}</div><div class="k">Sales today</div></div></div>
      <div class="card rv"><div class="stat"><div class="v">${rs(a.salesWeek)}</div><div class="k">Sales this week</div></div></div>
      <div class="card ink rv"><div class="stat"><div class="v">${a.pages}</div><div class="k">Pages (B&W ${a.bw} · Color ${a.color})</div></div></div>
    </div>
    <div class="grid c2">
      <div class="card rv"><p class="eyebrow">Orders</p>${bar('Completed', a.done, a.total)}${bar('Cancelled', a.cancelled, a.total)}${bar('Live right now', a.live, a.total)}</div>
      <div class="card rv"><p class="eyebrow">Customers</p>${bar('Repeat customers', a.repeat, a.customers)}${bar('Avg pickup (hrs)', a.avgHrs, Math.max(a.avgHrs, 1))}</div>
    </div>
    <div class="rv" style="margin-top:14px"><a class="btn ghost" href="/admin/analytics.csv"><span>⬇ Export CSV</span></a></div>`
  });
}

function campaignSettings(cfg) {
  const input = (key, label, value, type = 'number') => `<div class="field"><label for="cp-${key}">${esc(label)}</label><input id="cp-${key}" name="${key}" type="${type}" ${type === 'number' ? 'min="0" step="0.01"' : ''} value="${esc(value)}" required></div>`;
  const check = (key, label, value) => `<label class="pick"><input name="${key}" type="checkbox" value="1" ${value ? 'checked' : ''}> ${esc(label)}</label>`;
  return `<form class="card rv" style="margin-top:18px" method="POST" action="/admin/settings/campaign">
    <p class="eyebrow">Wallet offers and campus delivery</p>
    <p class="field-hint">Zero bonus validity means no expiry. Paid wallet balance never expires. The Semester Pass is optional; its member benefit is free campus batch delivery.</p>
    <div class="grid c2">${input('bonusValidityDays', 'Bonus validity (days)', cfg.bonusValidityDays)}${check('showPages', 'Show approximate B&W pages', cfg.showPages)}</div>
    <div class="grid c2">${check('firstPrint-enabled', 'Existing first B&W print offer enabled', cfg.firstPrint.enabled)}${input('firstPrint-pages', 'First print free page-sides', cfg.firstPrint.pages)}</div>
    ${cfg.wallets.map((o) => `<fieldset style="margin:14px 0"><legend>${esc(o.name)}</legend><div class="grid c3">${input(`wallet-${o.id}-name`, 'Offer name', o.name, 'text')}${input(`wallet-${o.id}-amount`, 'Pay ₹', o.amount)}${input(`wallet-${o.id}-bonus`, 'Bonus ₹', o.bonus)}</div><div class="grid c2">${check(`wallet-${o.id}-enabled`, 'Enabled', o.enabled)}${check(`wallet-${o.id}-firstOnly`, 'First top-up only', o.firstOnly)}${check(`wallet-${o.id}-freeFirstBatch`, 'First campus batch delivery free', o.freeFirstBatch)}${check(`wallet-${o.id}-freeBatch`, 'Free campus batch delivery during membership', o.freeBatch)}${input(`wallet-${o.id}-memberDays`, 'Membership days (0 = wallet only)', o.memberDays || 0)}</div></fieldset>`).join('')}
    <div class="grid c2">${check('delivery-enabled', 'Campus batch delivery enabled', cfg.delivery.enabled)}${check('delivery-freeEnabled', 'Free batch delivery above minimum enabled', cfg.delivery.freeEnabled)}${check('delivery-guaranteeEnabled', 'Morning missed-slot credit enabled', cfg.delivery.guaranteeEnabled)}${input('delivery-freeMinOrder', 'Free batch minimum print subtotal ₹', cfg.delivery.freeMinOrder)}${input('delivery-lateCredit', 'Missed-slot credit ₹', cfg.delivery.lateCredit)}${input('delivery-cutoff', 'Morning payment cutoff (IST)', cfg.delivery.cutoff, 'time')}</div>
    ${cfg.delivery.slots.map((o) => `<fieldset style="margin:14px 0"><legend>${esc(o.name)} slot</legend><div class="grid c2">${input(`slot-${o.id}-name`, 'Name', o.name, 'text')}${check(`slot-${o.id}-enabled`, 'Enabled', o.enabled)}${input(`slot-${o.id}-start`, 'Starts (IST)', o.start, 'time')}${input(`slot-${o.id}-end`, 'Ends (IST)', o.end, 'time')}${input(`slot-${o.id}-cutoff`, 'Payment cutoff (IST; morning uses global cutoff)', o.cutoff, 'time')}${check(`slot-${o.id}-guaranteed`, 'Morning guarantee', o.guaranteed)}</div></fieldset>`).join('')}
    <div class="field"><label for="campuses">Campuses (JSON: id, name, zone, address, pin, lat, lng, enabled)</label><textarea id="campuses" name="campuses" rows="8" required>${esc(JSON.stringify(cfg.delivery.campuses, null, 2))}</textarea></div>
    <button class="btn loud" type="submit"><span>Save offers and delivery →</span></button>
  </form><details class="card" style="margin-top:14px"><summary>Advanced: add wallet offers or delivery slots</summary><form method="POST" action="/admin/settings/campaign"><label for="campaign-json">Complete offer configuration (JSON)</label><textarea id="campaign-json" name="campaign" rows="18" required>${esc(JSON.stringify(cfg, null, 2))}</textarea><button class="btn solid" type="submit"><span>Save full configuration</span></button></form></details>`;
}

export function settingsPage(u, s, demos, kiosk = { live: false, envLive: false, blockers: [] }) {
  const demoRows = (demos || []).map((d) =>
    `<div class="sumrow"><span><b>${esc(d.name)}</b> · <span class="mono" style="font-size:12px">${esc(d.email)}</span> · ${esc(d.role)}</span>
    ${d.id === u.id
      ? '<span class="at">you — remove others first</span>'
      : `<form method="POST" action="/admin/demos/remove" onsubmit="return confirm('Remove ${esc(d.email)}? Their orders stay, shown under a retired account.')" style="display:inline"><input type="hidden" name="id" value="${d.id}"><button class="rowlink" type="submit" style="border:none;background:none;cursor:pointer">remove</button></form>`}</div>`
  ).join('') || '<p class="muted">No demo accounts left. Clean launch. ✷</p>';
  const kioskState = kiosk.envLive
    ? '<p class="mono" style="font-size:11px;margin-top:8px">● LIVE via server config (production + gateway) — the switch below is redundant.</p>'
    : kiosk.live
      ? '<p class="mono" style="font-size:11px;margin-top:8px">● Kiosk is LIVE — real payments only, demo methods hidden.</p>'
      : '<p class="mono" style="font-size:11px;margin-top:8px">○ Kiosk is in DEMO — simulated payments, no money moves.</p>';
  const kioskBlocks = kiosk.blockers.length
    ? `<p class="login-err" role="alert" style="margin-top:10px">Can't go live yet — missing: ${kiosk.blockers.map(esc).join(' · ')}</p>`
    : '';
  return layout({
    title: 'Settings', user: u, ...A('/admin/settings'),
    body: `
    <p class="eyebrow rv">Settings</p>
    <h1 class="display rv" style="font-size:clamp(2rem,6vw,3.6rem)">Site <em>settings.</em></h1>
    <form class="card rv" style="margin-top:18px" method="POST" action="/admin/settings">
      <p class="eyebrow">Business</p>
      <div class="grid c2" style="margin-top:8px">
        <div class="field"><label for="field-name">Name</label><input id="field-name" name="name" value="${esc(s.business.name)}"></div>
        <div class="field"><label for="field-phone">Phone</label><input id="field-phone" name="phone" value="${esc(s.business.phone)}"></div>
      </div>
      <div class="grid c2"><div class="field"><label for="field-email">Email</label><input id="field-email" name="email" value="${esc(s.business.email)}"></div>
      <div class="field"><label for="field-address">Address</label><input id="field-address" name="address" value="${esc(s.business.address)}"></div></div>
      <div class="field" style="max-width:320px"><label for="field-hours">Hours</label><input id="field-hours" name="hours" value="${esc(s.hours)}"></div>
      <p class="eyebrow">Order limits</p>
      <div class="grid c3" style="margin-top:8px">
        <div class="field"><label for="field-maxFileMb">Max file MB</label><input id="field-maxFileMb" name="maxFileMb" type="number" min="1" value="${s.order.maxFileMb}"></div>
        <div class="field"><label for="field-maxPages">Max pages</label><input id="field-maxPages" name="maxPages" type="number" min="1" value="${s.order.maxPages}"></div>
        <div class="field"><label for="field-minTotal">Min total ₹</label><input id="field-minTotal" name="minTotal" type="number" min="0" value="${s.order.minTotal}"></div>
      </div>
      <p class="eyebrow">Service zones</p><p style="margin:6px 0 14px">${s.zones.map((z) => `<span class="chip on" style="margin-right:6px">${esc(z)}</span>`).join('')}</p>
      <button class="btn loud big" style="width:100%" type="submit"><span>Save settings →</span></button>
    </form>
    ${campaignSettings(s.campaign)}
    <div class="card rv" style="margin-top:14px"><p class="eyebrow">Kiosk live / demo</p>
      <p class="muted" style="font-size:13px;margin:6px 0 10px">Flip the kiosk between simulated payments and real money — no redeploy.</p>
      <form method="POST" action="/admin/settings/kiosk" style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
        <input type="hidden" name="live" value="${kiosk.live ? '' : '1'}">
        <button class="btn ${kiosk.live || kiosk.envLive ? 'ghost' : 'loud'}" type="submit" ${kiosk.blockers.length && !kiosk.live ? 'disabled' : ''}><span>${kiosk.live || kiosk.envLive ? 'Take kiosk offline (demo)' : 'Bring kiosk online (live)'}</span></button>
      </form>
      ${kioskState}${kioskBlocks}</div>
    <div class="card rv" style="margin-top:14px"><p class="eyebrow">Demo access</p>
      <p class="muted" style="font-size:13px;margin:6px 0 10px">Demo logins ${process.env.DEMO_LOGIN === 'off' ? '<b>are OFF</b> (DEMO_LOGIN=off)' : 'are <b>ON</b> — set DEMO_LOGIN=off in production to disable them entirely'}. Removing an account keeps its orders, shown under a retired profile.</p>
      <div>${demoRows}</div></div>`
  });
}
