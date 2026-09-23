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
      <div style="display:flex;gap:8px;align-items:center;margin-top:6px"><span class="rowlink">View details →</span>${['CREATED','PAYMENT_PENDING'].includes(o.status) ? `<a class="btn sun" style="padding:6px 10px;font-size:10px" href="/customer/orders/${o.id}/pay" onclick="event.stopPropagation()"><span>Resume payment</span></a>` : ''}</div>
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
  PRINT_QUEUE: 'In print queue', PRINTING: 'Printing', PRINTED: 'Printed',
  READY_FOR_PICKUP: 'Ready for pickup — at the kiosk', DELIVERED: 'Collected'
};
const TRACK_STEPS = ['CREATED', 'PAYMENT_PENDING', 'PRINT_QUEUE', 'PRINTING', 'READY_FOR_PICKUP', 'DELIVERED'];

function kioskPollBlock(id) {
  return `<p class="mono muted" id="kiosk-status" style="font-size:11px;margin-top:10px">Checking kiosk…</p>
  <script>
  (function(){
    var st=document.getElementById('kiosk-status'); var last=''+document.documentElement.innerHTML;
    function say(t){ if(st) st.textContent=t; }
    function poll(){
      fetch('/api/orders/'+encodeURIComponent('${id}')+'/status').then(function(r){ return r.ok?r.json():null; }).then(function(d){
        if(!d) return;
        var badge=document.querySelector('.badge'); if(badge) badge.textContent=d.friendly||d.status;
        if(d.status==='READY_FOR_PICKUP' && last.indexOf('READY_FOR_PICKUP')===-1){ try{ window.kioskChime&&window.kioskChime(); }catch{} say('Ready for pickup — at the kiosk counter ✓'); }
        if(d.status==='DELIVERED'){ say('Collected — enjoy!'); clearInterval(iv); }
        else if(d.status==='PRINTING') say('Printing…');
        else if(d.status==='PRINT_QUEUE') say('In queue…');
      }).catch(function(){});
    }
    var iv=setInterval(poll,8000); poll();
  })();
  </script>`;
}

export function orderDetail(user, order, rider, waUrl, fresh) {
  const reached = new Set(order.history.map((h) => h.to));
  reached.add('CREATED');
  const items = TRACK_STEPS.map((s) => {
    const h = order.history.find((x) => x.to === s);
    const cls = reached.has(s) ? 'done' : '';
    const at = h ? `<span class="at">${esc(new Date(h.at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }))}</span>` : '';
    const mark = reached.has(s) ? '✓' : '○';
    return `<li class="${cls}"><span class="pip"></span><b>${mark} ${STEP_LABEL[s]}</b><br>${at}</li>`;
  }).join('');
  const canCancel = ['CREATED', 'PAYMENT_PENDING', 'CONFIRMED'].includes(order.status);
  const canReorder = ['DELIVERED', 'CANCELLED', 'REFUNDED'].includes(order.status);
  const isLive = ['PRINT_QUEUE','PRINTING','READY_FOR_PICKUP'].includes(order.status);
  return layout({
    title: `Order ${order.id}`, user, extraCss: '/customer.css', active: '/customer/orders',
    body: `
    <p class="eyebrow rv"><a href="/customer/orders" style="text-decoration:none">← Orders</a></p>
    <h1 class="display rv" style="font-size:clamp(2rem,6vw,3.6rem)">Order <em>#${esc(order.id)}</em></h1>
    <div class="rv" style="margin:10px 0 18px"${fresh ? ` data-confetti-load="${order.couponDiscount ? 110 : 85}"` : ''}>${badge(order.status)}</div>
    <div class="grid c2">
      <div class="card rv">
        <p class="eyebrow">Summary</p>
        <p style="font-weight:700;margin:8px 0">📄 ${esc(order.document)}</p>
        <div class="sumrow"><span>${order.pages} pages × ${order.copies}</span><span>${rs(order.subtotal)}</span></div>
        <div class="sumrow"><span>${order.printType === 'bw' ? 'B&W' : 'Color'} · ${order.sides === 'double' ? 'Double' : 'Single'}-sided</span></div>
        ${order.discount ? `<div class="sumrow disc"><span>Student discount</span><span>−${rs(order.discount)}</span></div>` : ''}
        ${order.couponDiscount ? `<div class="sumrow disc"><span>Coupon ${esc(order.couponCode || '')}</span><span>−${rs(order.couponDiscount)}</span></div>` : ''}
        ${order.firstFree ? `<div class="sumrow disc"><span>First delivery treat 🎉</span><span>FREE</span></div>` : ''}
        <div class="sumrow"><span>Collect</span><span>${order.deliveryFee === 0 ? 'FREE at kiosk' : rs(order.deliveryFee)}</span></div>
        <div class="sumrow total"><span>Total</span><span>${rs(order.total)}</span></div>
        <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap">
        ${['CREATED','PAYMENT_PENDING'].includes(order.status) ? `<a class="btn loud" href="/customer/orders/${order.id}/pay"><span>Resume payment →</span></a>` : ''}
        ${canReorder ? `<form method="POST" action="/customer/orders/${order.id}/reorder"><button class="btn sun" type="submit"><span>↻ Reorder</span></button></form>` : ''}
        ${canCancel ? `<form method="POST" action="/customer/orders/${order.id}/cancel" onsubmit="return confirm('Cancel this order?')"><button class="btn ghost" type="submit"><span>Cancel order</span></button></form>` : ''}
        ${waUrl ? `<a class="btn ghost" href="${waUrl}" target="_blank" rel="noopener"><span>✆ WhatsApp the shop →</span></a>` : ''}
        </div>
      </div>
      <div class="card rv">
        <p class="eyebrow">Tracking — kiosk pickup</p>
        <ol class="tline">${items}</ol>
        ${isLive ? kioskPollBlock(order.id) : ''}
      </div>
    </div>`
  });
}
