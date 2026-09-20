// Customer views: dashboard (§5), orders (§15), tracking detail (§14), reorder (§16).
import { layout, esc, greeting, LEAFLET_HEAD } from './views.js';
import { progressOf } from './pricing.js';

export const FRIENDLY = {
  CREATED: 'Draft', PAYMENT_PENDING: 'Awaiting payment', CONFIRMED: 'Confirmed',
  PRINT_QUEUE: 'In print queue', PRINTING: 'Printing', PRINTED: 'Printed',
  READY_FOR_PICKUP: 'Ready for pickup', RIDER_ASSIGNED: 'Rider assigned',
  PICKED_UP: 'Picked up', OUT_FOR_DELIVERY: 'Out for delivery',
  DELIVERED: 'Delivered', CANCELLED: 'Cancelled',
  PAYMENT_FAILED: 'Payment failed', PRINT_FAILED: 'Print failed',
  DELIVERY_FAILED: 'Delivery failed', REFUNDED: 'Refunded'
};

export const friendly = (s) => FRIENDLY[s] || s;
const badge = (s) => `<span class="badge b-${s}">${friendly(s)}</span>`;
const rs = (n) => '₹' + (Math.round(n * 100) / 100);

export function customerDashboard(user, { current, pricing, notes, lastDoc }) {
  const reprint = !current && lastDoc
    ? `<div class="card sun rv" style="margin-bottom:14px">
        <p class="eyebrow">Reprint in one tap</p>
        <p style="font-weight:700;margin:6px 0">📄 ${esc(lastDoc.document)}</p>
        <p class="muted mono" style="font-size:11px">${lastDoc.pages} pages · ${lastDoc.printType === 'bw' ? 'B&W' : 'Color'} · same settings</p>
        <form method="POST" action="/customer/orders/${lastDoc.id}/reorder" style="margin-top:10px"><button class="btn solid" type="submit"><span>↻ Reprint · ${rs(lastDoc.total)}</span></button></form>
      </div>`
    : '';
  const card = current
    ? `<a class="card ink rv" href="/customer/orders/${current.id}" style="text-decoration:none">
        <p class="eyebrow" style="color:rgba(250,245,234,.6)">Current order · #${esc(current.id)}</p>
        <div class="stat" style="margin:8px 0"><div class="v">${friendly(current.status)}</div></div>
        <div class="pbar"><span style="width:${progressOf(current.status)}%"></span></div>
        <p class="mono" style="font-size:11px;margin-top:8px">Estimated delivery · ${esc(current.slot || 'Today')}</p>
      </a>`
    : `<a class="card sun rv" href="/customer/orders/new" style="text-decoration:none">
        <div class="stat"><div class="v">No queue</div><div class="k">Start your first print order →</div></div>
      </a>`;
  const notesHtml = (notes || []).slice(0, 3).map((n) =>
    `<div class="note"><b>${esc(n.orderId)}</b> — ${esc(n.text)}<span class="at">${esc(new Date(n.at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }))}</span></div>`
  ).join('') || '<p class="muted">All quiet. Order updates land here.</p>';
  return layout({
    title: 'Dashboard', user, extraCss: '/customer.css', active: '/customer',
    body: `
    <p class="eyebrow rv">Customer dashboard</p>
    <h1 class="display rv" style="font-size:clamp(2rem,6vw,4rem)">${greeting(user.name).replace(/, ([^,]+)$/, ', <em>$1</em>')}</h1>
    <div class="rv" style="margin:16px 0 20px"><a class="btn loud big" href="/customer/orders/new"><span>+ New Print Order</span></a></div>
    ${reprint}
    <div class="grid c2">${card}
      <div class="card promo rv"><p class="eyebrow">Student special</p>
        <div class="stat"><div class="v">₹${pricing.studentBw}<em>/page</em></div><div class="k">B&W prints for students · color ₹${pricing.color}/page</div></div>
      </div>
    </div>
    <h2 class="h-sec rv">Quick actions</h2>
    <div class="chips rv">
      <a class="chip" href="/customer/orders/new">New order</a>
      <a class="chip" href="/customer/orders">Order history</a>
      <a class="chip" href="/customer/wallet">Wallet</a>
      <a class="chip" href="/customer/profile#addresses">Saved addresses</a>
      <a class="chip" href="/customer/profile#help">Help</a>
    </div>
    <h2 class="h-sec rv">Latest updates</h2>
    <div class="card rv notes">${notesHtml}</div>`
  });
}

export function ordersList(user, { tab, counts, orders }) {
  const tabs = ['active', 'completed', 'cancelled'].map((t) =>
    `<a class="chip ${t === tab ? 'on' : ''}" href="/customer/orders?tab=${t}">${t[0].toUpperCase() + t.slice(1)} · ${counts[t]}</a>`
  ).join('');
  const cards = orders.map((o) => `
    <a class="card rv" href="/customer/orders/${o.id}">
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:center">
        <b class="mono">#${esc(o.id)}</b>${badge(o.status)}
      </div>
      <p style="margin:10px 0 2px;font-weight:700">📄 ${esc(o.document)}</p>
      <p class="muted mono" style="font-size:11px">${o.pages} pages · ${o.printType === 'bw' ? 'B&W' : 'Color'} · ${rs(o.total)}</p>
      <span class="rowlink">View details →</span>
    </a>`).join('') || '<div class="card"><p class="muted">Nothing here yet.</p></div>';
  return layout({
    title: 'Orders', user, extraCss: '/customer.css', active: '/customer/orders',
    body: `
    <p class="eyebrow rv">Orders</p>
    <h1 class="display rv" style="font-size:clamp(2rem,6vw,3.6rem)">Your <em>print shelf.</em></h1>
    <div class="chips rv" style="margin:16px 0">${tabs}</div>
    <div class="grid c2">${cards}</div>
    <div class="rv" style="margin-top:18px"><a class="btn solid" href="/customer/orders/new"><span>+ New Print Order</span></a></div>`
  });
}

const STEP_LABEL = {
  CREATED: 'Order received', PAYMENT_PENDING: 'Payment confirmed', CONFIRMED: 'Confirmed',
  PRINT_QUEUE: 'In print queue', PRINTING: 'Printing', PRINTED: 'Quality check',
  READY_FOR_PICKUP: 'Ready', RIDER_ASSIGNED: 'Rider assigned',
  PICKED_UP: 'Picked up', OUT_FOR_DELIVERY: 'Out for delivery', DELIVERED: 'Delivered'
};
const TRACK_STEPS = ['CREATED', 'PAYMENT_PENDING', 'PRINTING', 'PRINTED', 'RIDER_ASSIGNED', 'OUT_FOR_DELIVERY', 'DELIVERED'];
const LIVE_STATUSES = ['RIDER_ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY'];

function liveMapBlock(id) {
  return `<div id="livemap" style="height:280px;border:2px solid var(--ink);border-radius:12px;margin-top:12px;z-index:0"></div>
  <p class="mono muted" id="live-status" style="font-size:10px;margin-top:6px">Locating your rider…</p>
  <script>
  (function(){
    var box = document.getElementById('livemap'), st = document.getElementById('live-status'), tries = 0;
    function say(t){ if (st) st.textContent = t; }
    function addTiles(mp, cfg){
      var main = L.tileLayer(cfg.map.tiles, { attribution: cfg.map.attribution, maxZoom: 19 });
      var errs = 0, swapped = false;
      main.on('tileerror', function(){
        if (swapped || ++errs < 3) return; swapped = true;
        try { mp.removeLayer(main); } catch (e) {}
        L.tileLayer(cfg.map.tilesFallback, { attribution: cfg.map.attributionFallback, maxZoom: 19 }).addTo(mp);
      });
      main.addTo(mp);
    }
    function boot(){
      if (typeof L === 'undefined') {
        if (++tries > 30) { say('Map library blocked — check connection or ad-blocker. The timeline below still updates.'); if (box) box.style.display = 'none'; return; }
        setTimeout(boot, 200); return;
      }
      ready();
    }
    function ready(){
    fetch('/api/config').then(function(r){ return r.json(); }).then(function(cfg){
      var map = L.map('livemap', { scrollWheelZoom: false }).setView([cfg.map.hub.lat, cfg.map.hub.lng], 12);
      addTiles(map, cfg);
      var hub = L.marker([cfg.map.hub.lat, cfg.map.hub.lng]).addTo(map).bindPopup('Printkarr Hub');
      var riderM = null, dropM = null;
      function fit(){ try { map.fitBounds(L.featureGroup([hub, riderM, dropM].filter(Boolean)).getBounds().pad(0.25)); } catch (e) {} }
      function poll(){
        fetch('/api/orders/${id}/location').then(function(r){
          if (r.status === 410) { say('Delivered — tracking complete.'); return null; }
          if (!r.ok) { say('Waiting for the rider…'); return null; }
          return r.json();
        }).then(function(d){
          if (!d) return;
          if (!dropM) { dropM = L.circle([d.drop.lat, d.drop.lng], { radius: 450 }).addTo(map).bindPopup('Drop area (approx)'); fit(); }
          if (d.rider) {
            if (!riderM) { riderM = L.marker([d.rider.lat, d.rider.lng]).addTo(map).bindPopup('Your rider'); fit(); }
            else riderM.setLatLng([d.rider.lat, d.rider.lng]);
            say('Rider is live • updated ' + d.riderAgoSec + 's ago · drop ~' + d.drop.approxKm + ' km from hub');
          } else say('Rider has not started sharing yet — watch this space.');
        }).catch(function(){ say('Connection hiccup — retrying…'); });
      }
      poll(); setInterval(poll, 10000);
    }).catch(function(){ say('Map unavailable right now.'); });
    }
    boot();
  })();
  </script>`;
}

const TRACK_NOTE = { accepted: 'Rider accepted the job', 'at-pickup': 'Rider reached the hub', arrived: 'Rider at your door', proof: null };
export function orderDetail(user, order, rider, waUrl) {
  const live = !!order.riderId && LIVE_STATUSES.includes(order.status);
  const reached = new Set(order.history.map((h) => h.to));
  reached.add('CREATED');
  const sub = (order.tracking || []).filter((t) => TRACK_NOTE[t.key] || (t.key === 'proof' && t.note));
  const items = TRACK_STEPS.map((s) => {
    const h = order.history.find((x) => x.to === s);
    const cls = reached.has(s) ? 'done' : '';
    const at = h ? `<span class="at">${esc(new Date(h.at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }))}</span>` : '';
    const mark = reached.has(s) ? '✓' : '○';
    return `<li class="${cls}"><span class="pip"></span><b>${mark} ${STEP_LABEL[s]}</b><br>${at}</li>`;
  }).join('');
  const subItems = sub.map((t) =>
    `<li class="done"><span class="pip"></span><b>✓ ${esc(t.key === 'proof' ? t.note : TRACK_NOTE[t.key])}</b><br><span class="at">${esc(new Date(t.at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }))}</span></li>`
  ).join('');
  const canCancel = ['CREATED', 'PAYMENT_PENDING', 'CONFIRMED'].includes(order.status);
  const canReorder = ['DELIVERED', 'CANCELLED', 'REFUNDED'].includes(order.status);
  return layout({
    title: `Order ${order.id}`, user, extraCss: '/customer.css', extraHead: live ? LEAFLET_HEAD : null, active: '/customer/orders',
    body: `
    <p class="eyebrow rv"><a href="/customer/orders" style="text-decoration:none">← Orders</a></p>
    <h1 class="display rv" style="font-size:clamp(2rem,6vw,3.6rem)">Order <em>#${esc(order.id)}</em></h1>
    <div class="rv" style="margin:10px 0 18px">${badge(order.status)}</div>
    <div class="grid c2">
      <div class="card rv">
        <p class="eyebrow">Summary</p>
        <p style="font-weight:700;margin:8px 0">📄 ${esc(order.document)}</p>
        <div class="sumrow"><span>${order.pages} pages × ${order.copies}</span><span>${rs(order.subtotal)}</span></div>
        <div class="sumrow"><span>${order.printType === 'bw' ? 'B&W' : 'Color'} · ${order.sides === 'double' ? 'Double' : 'Single'}-sided</span></div>
        ${order.discount ? `<div class="sumrow disc"><span>Student discount</span><span>−${rs(order.discount)}</span></div>` : ''}
        ${order.couponDiscount ? `<div class="sumrow disc"><span>Coupon ${esc(order.couponCode || '')}</span><span>−${rs(order.couponDiscount)}</span></div>` : ''}
        ${order.firstFree ? `<div class="sumrow disc"><span>First delivery treat 🎉</span><span>FREE</span></div>` : ''}
        <div class="sumrow"><span>Delivery</span><span>${order.deliveryFee === 0 ? 'FREE' : rs(order.deliveryFee)}</span></div>
        <div class="sumrow total"><span>Total</span><span>${rs(order.total)}</span></div>
        ${rider ? `<p class="muted mono" style="font-size:11px;margin-top:10px">Rider: ${esc(rider.name)} · ${esc(rider.phone)}</p>` : ''}
        <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap">
        ${canReorder ? `<form method="POST" action="/customer/orders/${order.id}/reorder"><button class="btn sun" type="submit"><span>↻ Reorder</span></button></form>` : ''}
        ${canCancel ? `<form method="POST" action="/customer/orders/${order.id}/cancel" onsubmit="return confirm('Cancel this order?')"><button class="btn ghost" type="submit"><span>Cancel order</span></button></form>` : ''}
        ${waUrl ? `<a class="btn ghost" href="${waUrl}" target="_blank" rel="noopener"><span>✆ WhatsApp the shop →</span></a>` : ''}
        </div>
      </div>
      <div class="card rv">
        <p class="eyebrow">Tracking</p>
        <ol class="tline">${items}${subItems}</ol>
        ${live ? liveMapBlock(order.id) : ''}
      </div>
    </div>`
  });
}
