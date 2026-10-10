import crypto from 'node:crypto';
import { bulkPricingGuide } from './views_order.js';
import { canFulfil } from './machine.js';
import { printDescription } from '../public/print-plan.js';
// Admin views — control tower (§26–§37).
import { layout, esc, icon } from './views.js';
import { friendly } from './views_customer.js';

const rs = (n) => '₹' + (Math.round(n * 100) / 100);
const badge = (s) => `<span class="badge b-${s}">${friendly(s)}</span>`;
const A = (active) => ({ extraCss: '/customer.css', active });

export function adminDashboard(u, d) {
  return layout({title:'Control center',user:u,...A('/admin'),body:`
    <div class="page-heading-row"><div class="page-heading"><p class="eyebrow">THE OPERATIONS DESK</p><h1>A good day.<br><em>Under control.</em></h1><p>Your print business, from the first upload to the last delivery.</p></div><a class="btn loud" href="/admin/orders">Open order queue ${icon('arrow-up-right')}</a></div>
    <section class="ops-overview"><div class="ops-daily"><p class="eyebrow">TODAY AT PRINTKARR</p><div><strong>${d.today}</strong><span>orders<br>on the desk.</span></div><a href="/admin/orders">See today's work ${icon('arrow-right')}</a><span class="ops-print-mark" aria-hidden="true">${icon('printer')}</span></div><div class="ops-metrics"><article><span>Revenue today</span><strong>${rs(d.revenue)}</strong>${icon('wallet')}</article><article><span>Pages printed today</span><strong>${d.pages}</strong>${icon('file-text')}</article><article><span>Printing now</span><strong>${d.printing}</strong>${icon('printer')}</article><article><span>Ready for rider</span><strong>${d.ready}</strong>${icon('map-pin')}</article></div></section>
    <section class="ops-delivered"><span class="ops-check">${icon('check')}</span><div><strong>${d.delivered} delivered today.</strong><p>Every finished delivery, one less thing on someone’s to-do list.</p></div><a href="/admin/delivery">Manage deliveries ${icon('arrow-up-right')}</a></section>
    <div class="section-heading"><div><p class="eyebrow">KEEP THINGS MOVING</p><h2>Your next stop.</h2></div><span>One workspace. Every step.</span></div>
    <nav class="ops-launchpad" aria-label="Operations shortcuts">${[['printer','Print preparation','Check jobs and printer readiness.','/admin/print-queue'],['map-pin','Delivery desk','Assign shops, riders and handovers.','/admin/delivery'],['stack','Stationery','Keep your catalogue and stock current.','/admin/catalogue'],['users','Your customers','Orders, balances and file handovers.','/admin/customers'],['tag','Prices & offers','Create print bundles and wallet promotions.','/admin/offers'],['chart-line-up','Business numbers','Paid sales and delivery performance.','/admin/analytics']].map(([glyph,label,copy,url])=>`<a href="${url}"><span class="launchpad-icon">${icon(glyph)}</span><h3>${label}</h3><p>${copy}</p>${icon('arrow-up-right')}</a>`).join('')}</nav>`});
}

const FILTERS = ['all', 'new', 'printing', 'ready', 'completed', 'cancelled'];

export function orderQueue(u, { filter, q, rows }) {
  const chips = FILTERS.map((f) =>
    `<a class="chip ${f === filter ? 'on' : ''}" href="/admin/orders?filter=${f}${q ? `&q=${encodeURIComponent(q)}` : ''}">${f}</a>`).join('');
  const trs = rows.map((o) => `
    <tr><td><a class="rowlink mono" href="/admin/orders/${o.id}">${esc(o.id)}</a></td>
    <td>${esc(o.cname)}</td><td>${o.pages}</td><td>${esc(printDescription(o))}</td>
    <td>${badge(o.status)}</td><td><b>${rs(o.total)}</b></td></tr>`).join('')
    || `<tr><td colspan="6" class="muted">No orders match.</td></tr>`;
  return layout({
    title: 'Order queue', user: u, ...A('/admin/orders'),
    body: `
    <div class="page-heading"><p class="eyebrow rv">Order queue · ${rows.length} shown</p>
    <h1 class="display rv">Order <em>queue.</em></h1><p>Find an order, check its status and open the next action.</p></div>
    <form class="rv" method="GET" action="/admin/orders" style="display:flex;gap:8px;margin:16px 0;flex-wrap:wrap">
      <input type="hidden" name="filter" value="${esc(filter)}">
      <input name="q" aria-label="Search orders by ID or customer" value="${esc(q)}" placeholder="Search order ID or customer…" style="flex:1;min-width:220px;border:2px solid var(--ink);border-radius:10px;padding:11px 14px;font:inherit;background:var(--paper)">
      <button class="btn solid" type="submit"><span>Search</span></button>
    </form>
    <div class="chips rv" style="margin-bottom:14px">${chips}</div>
    <div class="tblwrap rv"><table class="tbl"><thead><tr><th>Order</th><th>Customer</th><th>Pages</th><th>Type</th><th>Status</th><th>Total</th></tr></thead><tbody>${trs || '<tr><td colspan="4">No customers yet. Customer accounts appear after sign-in.</td></tr>'}</tbody></table></div>`
  });
}

export function adminOrderDetail(u, o, c, addr, nexts, waUrl, agentSeen, collectQr = null) {
  const lat = Number(addr.lat), lng = Number(addr.lng);
  const mapLink = Number.isFinite(lat) && Number.isFinite(lng) && lat >= 20.1 && lat <= 20.55 && lng >= 72.7 && lng <= 73.1
    ? `https://www.google.com/maps?q=${encodeURIComponent(addr.locationAccuracy === 'locality' ? [addr.address,addr.area,addr.pin].filter(Boolean).join(', ') : lat+','+lng)}` : null;
  const agentHint = o.printType === 'mixed' && o.splitMixed ? `<p class="pick hot">AUTOMATIC SPLIT PRINT: ${esc(printDescription(o))}. Use the updated agent: it creates a B&amp;W PDF and a colour PDF, then prints each set with its own colour setting. Double-sided applies within each set. Arrange original page order / binding after printing and verify both sets before confirming. L3250 double-sided output needs manual printing.</p>` : o.printType === 'mixed' ? `<p class="pick hot">MANUAL MIXED PRINT: ${esc(printDescription(o))}. Keep the selected PDF pages in ascending original order for each copy. ${o.sides === 'double' ? 'Pair adjacent selected pages front/back, including B&W/colour boundaries; do not duplex separate colour batches.' : 'Single-sided output.'} Retain ${esc(o.orientation || 'auto')} orientation and ${esc(o.binding || 'none')} binding. Download the original, use a printer workflow supporting these page settings, then verify every copy before confirming printed. The automatic agent skips this order.</p>` : o.status === 'PRINT_QUEUE'
    ? (o.queuePause ? `<p class="pick hot">Queue paused for <a href="/admin/orders/${esc(o.queuePause)}">${esc(o.queuePause)}</a>. Inspect that output or resolve its print failure before this job starts.</p>` : agentSeen && Date.now() - agentSeen < 60000
      ? `<p class="pick hot" style="margin-bottom:10px">◉ Agent is watching — it grabs this job within seconds. Hands off the buttons below.</p>`
      : `<p class="pick" style="margin-bottom:10px">○ Agent not seen lately — start it (<span class="mono">npm run agent</span>) or print manually below.</p>`)
    : '';
  const actions = nexts.filter(to=>to!=='PAYMENT_PENDING' || o.status!=='PRINT_FAILED' || !canFulfil(o) && !o.purchaseId).filter(to=>!['CONFIRMED','PRINT_QUEUE','PRINTING','PRINTED'].includes(to) || canFulfil(o)).filter(to=>!o.printAgentActive || o.printAwaitingVerification || to==='PRINT_FAILED').filter((to) => !o.purchaseId || !['PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REFUNDED'].includes(to)).map((to) => {
    const label = { PAYMENT_PENDING: o.status==='PRINT_FAILED' ? 'Return unpaid order to customer checkout' : 'Await payment', PRINT_QUEUE: 'Send to print queue', PRINTING: 'Take over for manual printing', PRINTED: 'Confirm all pages printed', READY_FOR_PICKUP: 'Mark collected', PICKED_UP: 'Mark picked up', OUT_FOR_DELIVERY: 'Start delivery', DELIVERED: 'Mark delivered', CANCELLED: 'Cancel order', PRINT_FAILED: o.printAgentActive ? 'Request safe stop' : 'Stop: incomplete / blank output', REFUNDED: 'Refund' }[to] || to;
    return `<form method="POST" action="/admin/orders/${o.id}/transition" style="display:inline"><input type="hidden" name="from" value="${o.status}"><input type="hidden" name="to" value="${to}">${['PRINT_QUEUE','PAYMENT_PENDING'].includes(to) && o.status==='PRINT_FAILED' ? '<label class="pick"><input type="checkbox" name="confirmRetry" value="1" required>The next automatic attempt prints the cover and every page; inspect partial output first.</label>' : ''}<button class="btn ${to === 'CANCELLED' ? 'ghost' : 'solid'}" type="submit"><span>${label}</span></button></form>`;
  }).join('');
  return layout({
    title: `Order ${o.id}`, user: u, ...A('/admin/orders'),
    body: `
    <div class="page-heading"><p class="eyebrow rv"><a href="/admin/orders" style="text-decoration:none">← Queue</a></p>
    <h1 class="display rv">Job <em>#${esc(o.id)}</em></h1></div>
    <div class="rv" style="margin:10px 0 18px">${badge(o.status)}</div>
    ${o.purchaseId ? `<p class="card" style="margin-bottom:18px">Print this document, then pack it with the rest of the basket. <a href="/admin/purchases/${esc(o.purchaseId)}">Open the shared purchase for dispatch, collection or refund →</a></p>` : ''}
    <div class="grid c2">
      <div class="card rv"><p class="eyebrow">Print job</p>
        <p style="font-weight:700;margin:8px 0">📄 ${esc(o.document)}</p>
        <div class="sumrow"><span>Customer</span><span>${esc(c.name)} · ${esc(c.phone || '')}</span></div>
        <div class="sumrow"><span>Pages × copies</span><span>${o.pages} × ${o.copies}${o.pageRange ? ` (${esc(o.pageRange)})` : ''}</span></div>
        <div class="sumrow"><span>Spec</span><span>${esc(printDescription(o))} · ${o.sides} · ${esc(o.paper || 'A4')}</span></div>
        <div class="sumrow"><span>Notes</span><span>${esc(o.notes || '—')}</span></div>
        <div class="sumrow"><span>${/pickup/i.test(String(addr.area || '')) ? 'Collection' : 'Delivery'}</span><span>${esc(addr.address || o.slot)}, ${esc(addr.area || '')}</span></div>
        ${mapLink ? `<a class="rowlink" href="${mapLink}" target="_blank" rel="noopener">${addr.locationAccuracy === 'locality' ? 'Search full delivery address' : 'Open delivery location'} ↗</a>` : ''}
        <div class="sumrow"><span>Delivery slot</span><span>${esc(o.slot)}</span></div>
        ${o.lateCredit ? `<p class="field-hint">Missed-slot credit: ₹${o.lateCredit}${o.lateCreditedAt ? ' · credited' : ''}.</p>` : ''}
        ${o.paymentStatus==='cod_pending' ? '<p class="pick hot">Cash due · not yet collected. Use the shared purchase to record collection.</p>' : ''}<div class="sumrow"><span>Processing / COD fee</span><span>${rs(o.processingFee || 0)} / ${rs(o.codFee || 0)}</span></div><div class="sumrow total"><span>Total</span><span>${rs(o.total)}</span></div>
        <a class="btn ghost" style="margin-top:12px" href="/admin/orders/${o.id}/file"><span>⬇ Download PDF</span></a>
        <a class="rowlink" href="/admin/orders/${o.id}/file?part=cover">Download cover separately →</a>${o.splitMixed ? `<p><a class="rowlink" href="/admin/orders/${o.id}/file?part=bw">Download ${o.bwPages} B&amp;W pages →</a><br><a class="rowlink" href="/admin/orders/${o.id}/file?part=color">Download ${o.colorPages} colour pages →</a></p><p class="field-hint">For a partial print, print only the missing pages from the correct set. This avoids repeating the cover or pages already received.</p>` : ''}
        ${waUrl ? `<a class="btn sun" style="margin-top:12px" href="${waUrl}" target="_blank" rel="noopener"><span>✆ Forward on WhatsApp →</span></a>` : ''}
      </div>
      <div class="card rv"><p class="eyebrow">Next actions</p>
        <div style="margin-top:10px">${!canFulfil(o) ? '<p class="pick hot">Payment not confirmed. The customer must complete checkout or confirm cash before this job can enter printing.</p>' : ''}${o.printStopRequested && o.printAgentActive ? '<p class="pick hot">Stop requested. Wait for the agent to acknowledge and clear its own spool job before retrying.</p>' : ''}${o.printProgress ? `<p class="pick">Automatic print: ${esc(o.printProgress.phase)} · submitted sets: ${esc(o.printProgress.completedParts.join(', ') || 'none yet')}. Queue completion still needs a physical page check.</p>` : ''}${agentHint}${o.printAwaitingVerification ? `<p class="pick hot">Output check required: compare ${o.pages} pages × ${o.copies} copies, including first and last page, page order and legibility. Confirm only after the full print is in the tray. The queue is paused until this check.</p>` : ''}${o.status === 'PRINT_FAILED' ? '<p class="pick hot">Inspect paper, ink, driver and remaining printer jobs before retrying. A retry prints the whole order again; use the downloaded file to print only missing pages manually.</p>' : ''}</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">${actions || '<p class="muted">Terminal state — nothing to do.</p>'}</div>
        ${collectQr && collectQr.img ? `<div style="margin-top:16px;text-align:center;border:3px solid var(--tang);border-radius:14px;padding:14px;background:var(--paper)">
          <p class="eyebrow">Kiosk pickup QR — customer scans to confirm</p>
          <img src="${collectQr.img}" alt="Pickup QR for order ${esc(o.id)}" style="width:100%;max-width:280px;margin-top:8px">
          <p class="mono muted" style="font-size:10px;margin-top:8px;word-break:break-all">${esc(collectQr.url)}</p></div>` : ''}
        <p class="eyebrow" style="margin-top:16px">History</p>
        <ol class="tline">${o.history.map((h) => `<li class="done"><span class="pip"></span><b>${esc(h.from)} → ${esc(h.to)}</b><br>${h.note ? `<span>${esc(h.note)}</span><br>` : ''}<span class="at">${esc(new Date(h.at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }))}${h.by ? ' · ' + esc(h.by) : ''}</span></li>`).join('')}</ol>
      </div>
    </div>`
  });
}

export function printQueuePage(u, jobs, printer) {
  const cards = jobs.map((o) => `
    <a class="card rv" href="/admin/orders/${o.id}">
      <div style="display:flex;justify-content:space-between;align-items:center"><b class="mono">#${esc(o.id)}</b>${badge(o.status)}</div>
      <p style="font-weight:700;margin:8px 0">📄 ${esc(o.document)}</p>
      <p class="muted mono" style="font-size:11px">${o.pages} pages · ${esc(printDescription(o))} · ${o.sides} · ${o.copies} ${o.copies === 1 ? 'copy' : 'copies'}</p>
      <span class="rowlink">Open job →</span></a>`).join('')
    || '<div class="empty-state"><p class="eyebrow">ALL CAUGHT UP</p><h2>A clear print desk.</h2><p>New jobs will appear here when they are ready for printing.</p><a class="rowlink" href="/admin/orders">View all orders →</a></div>';
  const bar = (v) => `<div class="pbar"><span style="width:${v}%"></span></div>`;
  return layout({
    title: 'Print queue', user: u, ...A('/admin/print-queue'),
    body: `
    <div class="page-heading"><p class="eyebrow rv">Print queue</p>
    <h1 class="display rv">Print <em>queue.</em></h1><p>Central desk print jobs and printer readiness. Partner shops use their own queues.</p></div>
    <div class="rv" style="margin:12px 0"><a class="btn sun" href="/admin/qr"><span>▣ Classroom QR →</span></a></div>
    <div class="card ink rv printer-readiness" style="margin:18px 0"><p class="eyebrow" style="color:rgba(250,245,234,.6)">Printer status · ${esc(printer.name)}</p>
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
    <div class="page-heading"><p class="eyebrow rv">Pilot entry point · V0</p>
    <h1 class="display rv">Classroom <em>QR.</em></h1></div>
    <div class="card rv" style="margin-top:18px;text-align:center;max-width:560px">
      <img src="/qr.png" alt="QR: scan to print" style="width:100%;max-width:400px;border:4px solid var(--tang);border-radius:14px">
      <p class="mono" style="font-size:12px;margin:12px 0;word-break:break-all">${esc(orderUrl)}</p>
      <p class="muted" style="margin-bottom:14px">Print this page, paste it in the classroom.<br>Students scan → upload → choose delivery → pay.</p>
      <button class="btn solid" type="button" onclick="window.print()"><span>Print this page</span></button>
    </div>`
  });
}

export function customersPage(u, rows) {
  const trs = rows.map((r) => `
    <tr><td><a class="rowlink" href="/admin/customers/${r.id}">${esc(r.name)}</a></td>
    <td>${r.count}</td><td><b>${rs(r.spent)}</b></td><td>${rs(r.wallet)}${r.pendingFiles ? `<br><a class="rowlink" href="/admin/customers/${encodeURIComponent(r.id)}">${r.pendingFiles} files awaiting handover</a>` : ''}</td></tr>`).join('');
  return layout({
    title: 'Customers', user: u, ...A('/admin/customers'),
    body: `
    <div class="page-heading"><p class="eyebrow rv">Customers</p>
    <h1 class="display rv">Your <em>customers.</em></h1><p>Customer orders, wallet balances and outstanding file handovers.</p></div>
    <div class="tblwrap rv" style="margin-top:16px"><table class="tbl"><thead><tr><th>Customer</th><th>Orders</th><th>Spent</th><th>Wallet</th></tr></thead><tbody>${trs || '<tr><td colspan="4" class="table-empty"><b>Your next customer starts here.</b><p>Customer accounts appear after sign-in. Open an account to view orders, wallet and handovers.</p></td></tr>'}</tbody></table></div>`
  });
}

export function customerDetailAdmin(u, c, orders, wallet, addresses, packSubs = [], fileGifts = [], transactions = []) {
  const rows = orders.map((o) => `<div class="sumrow"><span><a class="rowlink mono" href="/admin/orders/${o.id}">#${esc(o.id)}</a> · ${esc(o.document)}</span><span>${badge(o.status)} ${rs(o.total)}</span></div>`).join('') || '<p class="muted">No orders yet.</p>';
  const addr = addresses.map((a) => `<div class="sumrow"><span><b>${esc(a.label)}</b> — ${esc(a.address)}, ${esc(a.area)}</span></div>`).join('');
  const packs = packSubs.length
    ? packSubs.map((s) => `<div class="sumrow"><span><b>${esc(s.packName)}</b> · B&W ${s.bwUsed}/${s.bwTotal} · Colour used ${s.colorUsed} (${s.colorTotal} included) · F ${s.filesUsed}/${s.filesTotal}</span><span>${rs(s.paidTotal)}/${rs(s.price)}</span></div>`).join('')
    : '<p class="muted">No semester packs.</p>';
  return layout({
    title: c.name, user: u, ...A('/admin/customers'),
    body: `
    <div class="page-heading"><p class="eyebrow rv"><a href="/admin/customers" style="text-decoration:none">← Customers</a></p>
    <h1 class="display rv">${esc(c.name)}<em>.</em></h1></div>
    <div class="grid c2" style="margin-top:16px">
      <div class="card rv"><p class="eyebrow">Ledger</p>
        <div class="sumrow"><span>Orders</span><span>${orders.length}</span></div>
        <div class="sumrow"><span>Spent</span><span>${rs(orders.filter((o) => o.paymentStatus === 'paid').reduce((s, o) => s + o.total, 0))}</span></div>
        <div class="sumrow"><span>Wallet</span><span>${rs(wallet.balance)}</span></div>
        <div class="sumrow"><span>Student rate</span><span>${c.student ? 'ON' : 'Off'}</span></div></div>
      <div class="card rv"><p class="eyebrow">Addresses</p><div style="margin-top:6px">${addr || '<p class="muted">None saved.</p>'}</div></div>
    </div>
    ${fileGifts.length ? `<h2 class="h-sec rv">Wallet file gifts</h2><div class="card rv">${fileGifts.map((t) => `<div class="sumrow"><span><b>${t.freeFiles.quantity} paper/cardboard files</b> · ${esc(t.freeFiles.color || 'Colour not chosen')}<br><small>${rs(t.amount)} top-up · ${esc(t.id)}</small></span>${t.freeFiles.fulfilledAt ? '<span>Handed over</span>' : t.freeFiles.color ? `<form method="POST" action="/admin/customers/${encodeURIComponent(c.id)}/files/${encodeURIComponent(t.id)}/fulfil"><button class="btn sun" type="submit">Mark handed over</button></form>` : '<span>Awaiting colour</span>'}</div>`).join('')}</div>` : ''}
    <h2 class="h-sec rv">Wallet credits &amp; history</h2><div class="card rv"><p>${esc(c.email)}</p><form method="POST" action="/admin/customers/${encodeURIComponent(c.id)}/wallet-credit"><input type="hidden" name="requestId" value="${crypto.randomUUID()}"><div class="grid c2"><div class="field"><label for="wallet-credit-amount">Extra wallet credit ₹</label><input id="wallet-credit-amount" name="amount" type="number" min="0.01" max="10000" step="0.01" required></div><div class="field"><label for="wallet-credit-reason">Reason</label><input id="wallet-credit-reason" name="reason" required maxlength="200" placeholder="Missed top-up promotion bonus"></div></div><p class="field-hint">Adds spendable, non-withdrawable credit without expiry. Existing balance and spending stay intact. Repeating the same submission cannot add credit twice.</p><button class="btn loud" type="submit">Add wallet credit →</button></form>${[...transactions].reverse().map(t=>`<div class="sumrow"><span>${esc(t.label)}<br><small>${esc(t.at)}${t.adminId ? ' · Admin credit' : ''}</small></span><span>${rs(t.amount)}</span></div>`).join('') || '<p>No wallet transactions.</p>'}</div>
    <h2 class="h-sec rv">Semester packs</h2><div class="card rv">${packs}</div>
    <h2 class="h-sec rv">Order history</h2><div class="card rv">${rows}</div>`
  });
}


export function offersPage(u, pricing, cfg) {
  const input=(prefix,key,label,value,type='number',attrs='')=>`<div class="field"><label for="${prefix}-${key}">${esc(label)}</label><input id="${prefix}-${key}" name="${key}" type="${type}" value="${esc(value ?? '')}" ${attrs}></div>`;
  const check=(key,label,value)=>`<label class="pick"><input type="checkbox" name="${key}" value="1" ${value?'checked':''}> ${esc(label)}</label>`;
  const dates=(id,o)=>`<div class="grid c2">${input(id,'startsOn','Starts on (IST; blank = now)',o.startsOn,'date')}${input(id,'endsOn','Last day (IST; blank = no end)',o.endsOn,'date')}</div>`;
  const wallet=o=>{const id='wallet-'+(o.id || 'new');return `<form class="card settings-sheet" method="POST" action="/admin/offers/wallet"><h3>${o.id ? esc(o.name) : 'Add wallet offer'}</h3><input type="hidden" name="id" value="${esc(o.id || '')}"><div class="grid c3">${input(id,'name','Offer name',o.name,'text','required maxlength="120"')}${input(id,'amount','Customer pays ₹',o.amount,'number','required min="10" max="10000" step="0.01"')}${input(id,'credit','Total wallet credit ₹',o.amount+o.bonus,'number','required min="10" max="20000" step="0.01"')}</div>${input(id,'validityDays','Bonus validity days (0 = no expiry)',o.validityDays ?? cfg.bonusValidityDays,'number','required min="0" max="3650" step="1"')}${dates(id,o)}<div class="grid c2">${check('enabled','Enabled',o.enabled)}${check('firstOnly','First top-up only',o.firstOnly)}</div><p class="field-hint">The bonus is total credit minus payment. Paid balance never expires. Existing paid top-ups stay unchanged; payments already started keep their original promised bonus.</p><button class="btn loud" type="submit">${o.id ? 'Save wallet offer' : 'Add wallet offer'} →</button></form>`;};
  const print=o=>{const id='print-'+(o.id || 'new');return `<form class="card settings-sheet" method="POST" action="/admin/offers/print"><h3>${o.id ? esc(o.name) : 'Add print offer'}</h3><input type="hidden" name="id" value="${esc(o.id || '')}"><div class="grid c2">${input(id,'name','Offer name',o.name,'text','required maxlength="120"')}<div class="field"><label for="${id}-type">Print type</label><select id="${id}-type" name="type"><option value="color" ${o.type==='color'?'selected':''}>Colour</option><option value="bw" ${o.type==='bw'?'selected':''}>B&amp;W</option></select></div>${input(id,'sides','Printed sides per bundle',o.sides,'number','required min="1" max="10000" step="1"')}${input(id,'price','Bundle price ₹',o.price,'number','required min="0" max="10000" step="0.01"')}</div>${dates(id,o)}<div class="grid c2">${check('enabled','Enabled',o.enabled)}${check('repeat','Repeat for every full bundle (off = first bundle only)',o.repeat)}</div><p class="field-hint">Copies and colour sides across documents in one checkout count together. Extra sides use the regular rate. The better of this offer and bulk pricing applies automatically. Processing and delivery are extra.</p><button class="btn loud" type="submit">${o.id ? 'Save print offer' : 'Add print offer'} →</button></form>`;};
  return layout({title:'Offers',user:u,...A('/admin/offers'),body:`<div class="page-heading"><p class="eyebrow">YOUR PROMOTIONS</p><h1>Manage <em>offers.</em></h1><p>Create, edit, schedule or turn off an offer here. Changes apply to new quotes as soon as you save.</p><a class="rowlink" href="/admin/pricing">Base print prices →</a> · <a class="rowlink" href="/admin/settings#wallet-settings">First-print, free-file and delivery benefits →</a></div><h2 class="h-sec">Wallet top-up offers</h2>${cfg.wallets.map(wallet).join('')}<details class="card" open><summary>Add a wallet offer</summary>${wallet({name:'Wallet special',amount:99,bonus:26,enabled:false,validityDays:0})}</details><h2 class="h-sec">Print bundle offers</h2>${(pricing.printOffers || []).map(print).join('') || '<p>No print bundle offers yet.</p>'}<details class="card" open><summary>Add a print offer</summary>${print({name:'Navratri colour offer',type:'color',sides:3,price:9,repeat:true,enabled:false})}</details>`});
}

export function pricingPage(u, p) {
  const num = (k, label, extra) => `
    <div class="field"><label for="p-${k}">${label}</label><input id="p-${k}" name="${k}" type="number" step="0.05" min="0" value="${p[k]}"></div>`;
  return layout({
    title: 'Pricing', user: u, ...A('/admin/pricing'),
    body: `
    <div class="page-heading"><p class="eyebrow rv">Pricing · live the second you save</p>
    <h1 class="display rv">Print <em>pricing.</em></h1><p>Keep per-side printing rates and delivery settings clear before checkout.</p><a class="btn ghost" href="/admin/offers">Manage print and wallet offers →</a></div>
    ${bulkPricingGuide(p)}<p class="field-hint">The fields below set the first-slab base rates. Later slabs progressively approach ₹1.40 B&amp;W / ₹3 colour. A base below that floor is preserved. Existing paid quotes remain unchanged.</p>
    <form class="card rv settings-sheet" style="margin-top:18px" method="POST" action="/admin/pricing"><div class="sheet-heading"><span>₹</span><div><h2>Your print rate card</h2><p>Base rates, delivery and optional surcharges.</p></div></div>
      <div class="grid c2">${num('bw', 'B&W ₹ / page')}${num('color', 'Color ₹ / page')}</div>
      <div class="grid c2">${num('studentBw', 'Student B&W ₹ / page')}${num('studentColor', 'Student color ₹ / page')}</div>
      <div class="grid c2">
        <div class="field"><label for="dz-vapi">Vapi legacy base rate (distance bands apply)</label><input readonly id="dz-vapi" name="dz_vapi" type="number" min="0" step="0.01" value="${p.delivery.vapi}"></div>
        <div class="field"><label for="dz-daman">Daman delivery ₹</label><input id="dz-daman" name="dz_daman" type="number" min="0" step="0.01" value="${p.delivery.daman}"></div>
      </div>
      <div class="grid c2">
        <div class="field"><label for="dz-sarigam">Sarigam delivery ₹</label><input id="dz-sarigam" name="dz_sarigam" type="number" min="0" value="${p.delivery.sarigam}"></div>
        <div class="field"><label for="dz-bhilad">Bhilad delivery ₹</label><input id="dz-bhilad" name="dz_bhilad" type="number" min="0" value="${p.delivery.bhilad}"></div>
      </div>
      <p class="muted" style="font-size:12px;margin:8px 0 12px">Vapi express: estimated distance bands ₹15 / ₹25 / ₹35 / ₹45 / ₹50. Vapi scheduled: ₹10 / ₹15 / ₹20 / ₹25 / ₹25. School / college scheduled: up to ₹10, reducing ₹1 per 30 printed sides; free at 300. Express ₹25. Processing ₹2–₹10; COD adds ₹10. Daman and other address routes use the rates above. Pickup is unavailable.</p>
      <p class="eyebrow" style="margin-top:18px">Time &amp; demand surcharges</p>
      <p class="muted" style="font-size:12px;margin:6px 0 12px">Late-night fees apply to address delivery orders in this India-time window; School / college and scheduled delivery are exempt. Surge uses active print-queue jobs as its demand measure. A fee of ₹0 disables that surcharge; a threshold of 0 disables surge.</p>
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

export function couponsPage(u, coupons, influencers = []) {
  const rows = coupons.map((c) => `
    <tr><td><b class="mono">${esc(c.code)}</b></td><td>${esc(c.influencer || 'Regular offer')}</td><td>${c.type === 'percent' ? c.value + '%' : '₹' + c.value}</td>
    <td>₹${c.minOrder}</td><td>${esc(c.expiry)}</td><td>${c.active ? '● live' : '○ off'}</td>
    <td><form method="POST" action="/admin/coupons/toggle" style="display:inline"><input type="hidden" name="code" value="${esc(c.code)}">
    <button class="rowlink" type="submit">${c.active ? 'disable' : 'enable'}</button></form></td></tr>`).join('');
  return layout({
    title: 'Coupons', user: u, ...A('/admin/coupons'),
    body: `
    <div class="page-heading"><p class="eyebrow rv">Coupons &amp; offers</p>
    <h1 class="display rv">Coupons &amp; <em>offers.</em></h1><p>Manage discount codes and see how each campaign performs.</p></div>
    <p class="field-hint">Every coupon is limited to one use per customer. An unpaid open order reserves its code until cancelled.</p>
    <div class="tblwrap rv" style="margin-top:16px"><table class="tbl"><thead><tr><th>Code</th><th>Influencer</th><th>Off</th><th>Min ₹</th><th>Expiry</th><th></th><th></th></tr></thead><tbody>${rows || '<tr><td colspan="7">No coupons yet. Create your first offer below.</td></tr>'}</tbody></table></div>
    <div class="card rv" style="margin-top:14px"><p class="eyebrow">Create offer</p>
      <form method="POST" action="/admin/coupons" style="margin-top:10px">
        <div class="grid c2"><div class="field"><label for="field-code">Code</label><input id="field-code" name="code" required maxlength="20" pattern="[A-Za-z0-9]{3,20}" placeholder="RIYA10"></div>
        <div class="field"><label for="field-type">Type</label><select id="field-type" name="type"><option value="percent">Percentage</option><option value="fixed">Fixed ₹</option></select></div></div>
        <div class="grid c3"><div class="field"><label for="field-value">Discount</label><input id="field-value" name="value" type="number" min="1" required placeholder="20"></div>
        <div class="field"><label for="field-minOrder">Min order ₹</label><input id="field-minOrder" name="minOrder" type="number" min="0" value="0"></div>
        <div class="field"><label for="field-expiry">Expiry</label><input id="field-expiry" name="expiry" type="date" required></div></div>
        <div class="field"><label for="field-influencer">Influencer name or handle (optional)</label><input id="field-influencer" name="influencer" maxlength="80" placeholder="@riya.vapi"><small class="field-hint">Leave blank for a regular coupon. Use the same name for all codes belonging to one influencer.</small></div>
        <p class="field-hint">Influencer codes go in the customer's Coupon code field. Friend referral codes and Refer &amp; Earn wallet rewards stay separate.</p>
        <button class="btn sun" type="submit"><span>+ Create</span></button></form></div>
    <h2 class="h-sec rv" id="influencers">Influencer performance</h2>
    <p class="field-hint">All-time coupon conversions after payment. Unique customers are counted once per influencer, across their codes. New customers used the code on their first successful paid checkout. Cancelled/refunded checkouts are excluded from customers, sales and discounts. Sales include delivery; print-level coupons count only the attributed print value. Shared baskets count once per influencer. Friend referral rewards are independent.</p>
    <div class="tblwrap rv"><table class="tbl"><thead><tr><th>Influencer</th><th>Codes</th><th>Unique customers</th><th>New customers</th><th>Paid checkouts</th><th>Net sales</th><th>Discounts</th><th>Cancelled / refunded</th></tr></thead><tbody>${influencers.map((i) => `<tr><td><b>${esc(i.name)}</b></td><td class="mono">${i.codes.map(esc).join(', ')}</td><td>${i.customers}</td><td>${i.newCustomers}</td><td>${i.orders}</td><td>${rs(i.sales)}</td><td>${rs(i.discounts)}</td><td>${i.refunded}</td></tr>`).join('') || '<tr><td colspan="8" class="muted">Create a coupon with an influencer name to start tracking.</td></tr>'}</tbody></table></div>`
  });
}

export function analyticsPage(u, a) {
  const bar = (label, v, max, suffix) => `
    <div style="margin:8px 0"><div class="sumrow"><span>${label}</span><span><b>${v}</b>${suffix || ''}</span></div>
    <div class="pbar"><span style="width:${max ? Math.round((v / max) * 100) : 0}%"></span></div></div>`;
  return layout({
    title: 'Analytics', user: u, ...A('/admin/analytics'),
    body: `
    <div class="page-heading"><p class="eyebrow rv">Delivery analytics</p>
    <h1 class="display rv">Business <em>analytics.</em></h1><p>A view of paid sales, repeat customers and delivery performance.</p></div>
    <div class="grid c3" style="margin:18px 0">
      <div class="card sun rv"><div class="stat"><div class="v">${rs(a.salesToday)}</div><div class="k">Sales today</div></div></div>
      <div class="card rv"><div class="stat"><div class="v">${rs(a.salesWeek)}</div><div class="k">Sales this week</div></div></div>
      <div class="card ink rv"><div class="stat"><div class="v">${a.pages}</div><div class="k">Pages (B&W ${a.bw} · Color ${a.color})</div></div></div>
    </div>
    <div class="grid c2">
      <div class="card rv"><p class="eyebrow">Orders</p>${bar('Completed', a.done, a.total)}${bar('Cancelled', a.cancelled, a.total)}${bar('Live right now', a.live, a.total)}</div>
      <div class="card rv"><p class="eyebrow">Customers</p>${bar('Repeat customers', a.repeat, a.customers)}${bar('Average fulfilment (hrs)', a.avgHrs, Math.max(a.avgHrs, 1))}</div>
    </div>
    <div class="rv" style="margin-top:14px"><a class="btn ghost" href="/admin/analytics.csv"><span>⬇ Export CSV</span></a></div>`
  });
}

function campaignSettings(cfg) {
  const input = (key, label, value, type = 'number') => `<div class="field"><label for="cp-${key}">${esc(label)}</label><input id="cp-${key}" name="${key}" type="${type}" ${type === 'number' ? 'min="0" step="0.01"' : ''} value="${esc(value)}" required></div>`;
  const check = (key, label, value) => `<label class="pick"><input name="${key}" type="checkbox" value="1" ${value ? 'checked' : ''}> ${esc(label)}</label>`;
  return `<form id="wallet-settings" class="card rv settings-sheet" style="margin-top:18px" method="POST" action="/admin/settings/campaign"><div class="sheet-heading"><span>02</span><div><h2>Wallet offers &amp; delivery</h2><p>Keep every offer and delivery window clear.</p></div></div>
    <p class="eyebrow">Wallet offers and delivery</p><a class="rowlink" href="/admin/offers">Add and schedule print or wallet offers →</a>
    <p class="field-hint">Zero bonus validity means no expiry. Paid wallet balance never expires. Schools and colleges use ₹10 batch or ₹25 express. Earned wallet delivery benefits apply to school / college batches. Vapi scheduled address delivery is free on ₹149+ after discounts.</p>
    <div class="grid c2">${input('bonusValidityDays', 'Bonus validity (days)', cfg.bonusValidityDays)}${check('showPages', 'Show approximate B&W pages', cfg.showPages)}</div>
    <div class="grid c2">${check('firstPrint-enabled', 'Existing first B&W print offer enabled', cfg.firstPrint.enabled)}${input('firstPrint-pages', 'First print free page-sides', cfg.firstPrint.pages)}</div>
    ${cfg.wallets.map((o) => `<fieldset style="margin:14px 0"><legend>${esc(o.name)}</legend><div class="grid c3">${input(`wallet-${o.id}-name`, 'Offer name', o.name, 'text')}${input(`wallet-${o.id}-amount`, 'Pay ₹', o.amount)}${input(`wallet-${o.id}-bonus`, 'Bonus ₹', o.bonus)}</div><div class="grid c2">${check(`wallet-${o.id}-enabled`, 'Enabled', o.enabled)}${check(`wallet-${o.id}-firstOnly`, 'First top-up only', o.firstOnly)}${check(`wallet-${o.id}-freeFirstBatch`, 'First school / college batch free', o.freeFirstBatch)}${check(`wallet-${o.id}-freeBatch`, 'Free school / college batch during membership', o.freeBatch)}${input(`wallet-${o.id}-memberDays`, 'Membership days (0 = wallet only)', o.memberDays || 0)}${input(`wallet-${o.id}-freeFiles`, 'Free paper/cardboard files', o.freeFiles || 0)}</div></fieldset>`).join('')}
    <h2 id="delivery-settings" class="h-sec">Delivery windows &amp; benefits</h2><div class="grid c2">${check('delivery-enabled', 'School / college delivery enabled', cfg.delivery.enabled)}${check('delivery-freeEnabled', 'Free batch delivery above minimum enabled', cfg.delivery.freeEnabled)}${check('delivery-guaranteeEnabled', 'Morning missed-slot credit enabled', cfg.delivery.guaranteeEnabled)}${input('delivery-freeMinOrder', 'Free batch minimum print subtotal ₹', cfg.delivery.freeMinOrder)}${input('delivery-lateCredit', 'Missed-slot credit ₹', cfg.delivery.lateCredit)}${input('delivery-cutoff', 'Morning payment cutoff (IST)', cfg.delivery.cutoff, 'time')}</div>
    ${cfg.delivery.slots.map((o) => `<fieldset style="margin:14px 0"><legend>${esc(o.name)} slot</legend><div class="grid c2">${input(`slot-${o.id}-name`, 'Name', o.name, 'text')}${check(`slot-${o.id}-enabled`, 'Enabled', o.enabled)}${input(`slot-${o.id}-start`, 'Starts (IST)', o.start, 'time')}${input(`slot-${o.id}-end`, 'Ends (IST)', o.end, 'time')}${input(`slot-${o.id}-cutoff`, 'Payment cutoff (IST; morning uses global cutoff)', o.cutoff, 'time')}${check(`slot-${o.id}-guaranteed`, 'Morning guarantee', o.guaranteed)}</div></fieldset>`).join('')}
    <h2 class="h-sec">Scheduled local delivery</h2><p class="field-hint">Enable a route only when you can fulfil it. Uses the enabled slots above and each slot's own cutoff. Vapi uses distance bands, independent of the legacy fee field below. ₹149+ scheduled address baskets qualify for free delivery. Radius is measured from the assigned shop or print desk using an estimate.</p>
    ${['vapi', 'daman'].map((zone) => { const route = cfg.delivery.local?.[zone] || { enabled: false, fee: zone === 'vapi' ? 15 : 20, radiusKm: 3 }; return `<fieldset style="margin:14px 0"><legend>${zone === 'vapi' ? 'Vapi' : 'Daman'} route</legend><div class="grid c3">${check(`local-${zone}-enabled`, 'Accept scheduled orders', route.enabled)}${input(`local-${zone}-fee`, 'Scheduled delivery fee ₹', route.fee)}${input(`local-${zone}-radiusKm`, 'Service radius (km; up to 25)', route.radiusKm)}</div></fieldset>`; }).join('')}
    <input type="hidden" name="pickup-address" value="">
    <input type="hidden" name="campuses" value="${esc(JSON.stringify(cfg.delivery.campuses))}">
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
    <div class="page-heading"><p class="eyebrow rv">Settings</p>
    <h1 class="display rv">Site <em>settings.</em></h1><p>Manage your business details, order limits, wallet offers and delivery windows.</p></div>
    <nav class="settings-index" aria-label="Settings sections"><a href="#business-settings">Business &amp; limits</a><a href="#wallet-settings">Wallet offers</a><a href="#delivery-settings">Delivery windows</a><a href="#access-settings">Access</a></nav><form id="business-settings" class="card rv settings-sheet" style="margin-top:18px" method="POST" action="/admin/settings"><div class="sheet-heading"><span>01</span><div><h2>Business &amp; order limits</h2><p>The essentials behind every PrintKarr order.</p></div></div>
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
    <div class="card rv" style="margin-top:14px"><p class="eyebrow">Kiosks · In development</p><p>Public pickup is disabled. Online delivery payments run independently of kiosk settings.</p><a href="/admin/partners">Manage partner shops</a></div>
    <div id="access-settings" class="card rv settings-sheet" style="margin-top:14px"><div class="sheet-heading"><span>03</span><div><h2>Access &amp; demo accounts</h2><p>Control who can use this workspace.</p></div></div><p class="eyebrow">Demo access</p>
      <p class="muted" style="font-size:13px;margin:6px 0 10px">Demo logins ${process.env.DEMO_LOGIN === 'off' ? '<b>are OFF</b> (DEMO_LOGIN=off)' : 'are <b>ON</b> — set DEMO_LOGIN=off in production to disable them entirely'}. Removing an account keeps its orders, shown under a retired profile.</p>
      <div>${demoRows}</div></div>`
  });
}
