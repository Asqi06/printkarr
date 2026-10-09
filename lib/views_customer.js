import { purchaseAnalytics } from './seo.js';
import { printDescription } from '../public/print-plan.js';
// Customer views: dashboard (§5), orders (§15), tracking detail (§14), reorder (§16).
import { layout, esc, greeting, icon, LEAFLET_HEAD } from './views.js';
import { progressOf } from './pricing.js';

export const FRIENDLY = {
  CREATED: 'Draft', PAYMENT_PENDING: 'Awaiting payment', CONFIRMED: 'Confirmed',
  PRINT_QUEUE: 'In print queue', PRINTING: 'Printing', PRINTED: 'Printed',
  READY_FOR_PICKUP: 'Ready for rider pickup', RIDER_ASSIGNED: 'Rider assigned',
  PICKED_UP: 'Picked up', OUT_FOR_DELIVERY: 'Out for delivery',
  DELIVERED: 'Delivered', CANCELLED: 'Cancelled',
  PAYMENT_FAILED: 'Payment failed', PRINT_FAILED: 'Print failed',
  DELIVERY_FAILED: 'Delivery failed', REFUNDED: 'Refunded'
};

export const friendly = (s) => FRIENDLY[s] || s;
const badge = (s) => `<span class="badge b-${s}">${friendly(s)}</span>`;
const rs = (n) => '₹' + (Math.round(n * 100) / 100);

export function customerDashboard(user, { current, pricing, notes, lastDoc, packsHtml, walletBalance = 0, campaign, walletOffers = [] }) {
  const reprint = lastDoc
    ? `<div class="card sun rv" style="margin-bottom:14px">
        <p class="eyebrow">Print again, with fewer steps</p>
        <p style="font-weight:700;margin:6px 0">${icon('file-text')} ${esc(lastDoc.document)}</p>
        <p class="muted mono" style="font-size:11px">${lastDoc.pages} pages · ${esc(printDescription(lastDoc))} · same settings</p>
        ${lastDoc.fileAvailable === false ? `<p class="field-hint">Your original file is no longer available. Upload it again to reuse your settings.</p><a class="btn solid" href="/customer/orders/new?repeat=${encodeURIComponent(lastDoc.id)}">Reuse print settings →</a>` : `<form method="POST" action="/customer/orders/${lastDoc.id}/reorder" style="margin-top:10px"><button class="btn solid" type="submit"><span>Review &amp; reprint →</span></button></form>`}
      </div>`
    : '';
  const card = current
    ? `<a class="card dashboard-action dashboard-current rv" href="/customer/orders/${current.id}">
        <p class="eyebrow">Latest order · #${esc(current.id)}</p>
        <h2>${friendly(current.status)}</h2>
        <p class="muted" style="font-size:13px;margin-top:12px">${esc(current.document)}</p>
        <div class="pbar" style="margin-top:20px"><span style="width:${progressOf(current.status)}%"></span></div>
        <span class="card-link">View order details ${icon('arrow-up-right')}</span>
      </a>`
    : '';
  const notesHtml = (notes || []).slice(0, 3).map((n) =>
    `<div class="note"><b>${esc(n.orderId)}</b> — ${esc(n.text)}<span class="at">${esc(new Date(n.at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }))}</span></div>`
  ).join('') || '<p class="muted">All quiet. Order updates land here.</p>';
  return layout({title:'Home',user,extraCss:'/customer.css',active:'/customer',body:`
    <div class="dashboard-welcome"><div class="dashboard-greeting"><div class="page-heading"><p class="eyebrow">YOUR PRINT DESK</p><h1>${greeting(user.name?.trim().split(/\s+/)[0] || 'there')}</h1><p>Print your notes. Get your essentials. We’ll bring them to you.</p></div><nav class="home-account-actions" aria-label="Quick access"><a class="btn loud" href="/customer/orders/new">Upload &amp; print ${icon('arrow-up-right')}</a></nav></div><figure class="dashboard-art"><img src="/images/paper-studio-hero.webp" width="1100" height="733" alt="Blue printer with colourful pages, notebook and pencil"><figcaption>Good ideas. Great on paper.</figcaption></figure></div>
    <div class="dashboard-grid">
      <a class="card dashboard-start" href="/shops">${icon('map-pin')}<h2>Prints, delivered.</h2><p>Notes &amp; assignments, delivered to your door.</p><span class="card-link">Find shops ${icon('arrow-up-right')}</span></a>
      <a class="card dashboard-start dashboard-stationery" href="/stationery">${icon('stack')}<h2>Everyday stationery.</h2><p>Notebooks, pens, files &amp; more, in one order.</p><span class="card-link">Shop stationery ${icon('arrow-up-right')}</span></a>
    </div>
    <p class="dashboard-delivery-note">${icon('map-pin')} School &amp; college delivery <strong>up to ₹10</strong> · Express <strong>₹25</strong></p>
    <div class="dashboard-side"><a class="card dashboard-action" href="/customer/wallet"><p class="eyebrow">WALLET BALANCE</p><div class="stat"><div class="v">${rs(walletBalance)}</div></div><span class="card-link">Wallet &amp; offers ${icon('arrow-up-right')}</span></a>${card || '<a class="card dashboard-action" href="/customer/orders"><p class="eyebrow">YOUR ORDERS</p><h2>Track your prints.</h2><p class="muted">All your delivery updates.</p><span class="card-link">Open orders '+icon('arrow-up-right')+'</span></a>'}</div>
    <div class="dashboard-pricing"><span>B&amp;W base <strong>₹${user.student ? pricing.studentBw : pricing.bw} / printed side</strong></span><span>Colour base <strong>₹${user.student ? pricing.studentColor : pricing.color} / printed side</strong></span><a class="rowlink" href="/printing-prices">View pricing →</a></div>${reprint}${packsHtml || ''}<h2 class="h-sec">Latest updates</h2><div class="card notes">${notesHtml}</div>`});
}

export function ordersList(user, { tab, counts, orders }) {
  const tabs = ['active','completed','cancelled'].map(t=>`<a class="chip ${t === tab ? 'on' : ''}" href="/customer/orders?tab=${t}" ${t===tab ? 'aria-current="page"' : ''}>${t[0].toUpperCase()+t.slice(1)} <span>${counts[t]}</span></a>`).join('');
  const cards = orders.map(o=>`<article class="card order-row"><div><p class="order-id">#${esc(o.id)}</p><h2>${icon('file-text')} ${esc(o.document)}</h2><p class="order-meta">${o.pages} pages · ${esc(printDescription(o))} · ${o.copies} ${o.copies===1?'copy':'copies'}</p><div class="order-row-actions"><a class="rowlink" href="/customer/orders/${esc(o.id)}">View order →</a>${o.status==='DELIVERED' ? `<form method="POST" action="/customer/orders/${esc(o.id)}/reorder"><button class="rowlink" type="submit">${o.fileAvailable===false?'Upload again':'Review &amp; reprint'} →</button></form>` : ''}${['CREATED','PAYMENT_PENDING'].includes(o.status)?`<a class="btn loud" href="/customer/orders/${esc(o.id)}/pay">Resume payment →</a>`:''}</div></div><div class="order-row-side">${badge(o.status)}<strong>${rs(o.total)}</strong></div></article>`).join('');
  return layout({title:'Orders',user,extraCss:'/customer.css',active:'/customer/orders',body:`<div class="page-heading-row"><div class="page-heading"><p class="eyebrow">FROM UPLOAD TO YOUR DOOR</p><h1>Your <em>print orders.</em></h1><p>Track current prints, find past documents and reorder with your saved settings.</p></div><a class="btn loud" href="/customer/orders/new">New print ${icon('upload-simple')}</a></div><nav class="chips" aria-label="Filter print orders" style="margin-bottom:24px">${tabs}</nav><div class="order-list">${cards || `<section class="empty-state"><h2>${tab==='active'?'Your next print starts here.':'No '+esc(tab)+' orders yet.'}</h2><p>${tab==='active'?'Upload your notes, choose your settings and see the full price before payment.':'Orders in this category will appear here.'}</p><a class="btn loud" href="/customer/orders/new">Upload &amp; print →</a></section>`}</div>`});
}

const STEP_LABEL = {
  CREATED: 'Order received', PAYMENT_PENDING: 'Awaiting payment', CONFIRMED: 'Order confirmed',
  PRINT_QUEUE: 'In print queue', PRINTING: 'Printing', PRINTED: 'Printed',
  READY_FOR_PICKUP: 'Printed and ready for the rider', OUT_FOR_DELIVERY: 'Out for delivery', DELIVERED: 'Delivered'
};
const TRACK_STEPS = ['CREATED', 'CONFIRMED', 'PRINT_QUEUE', 'PRINTING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED'];

function kioskPollBlock(id, status) {
  return `<p class="mono muted" id="kiosk-status" style="font-size:11px;margin-top:10px">Checking your order…</p>
  <script>
  (function(){
    var st=document.getElementById('kiosk-status'); var shown=${JSON.stringify(status)};
    function say(t){ if(st) st.textContent=t; }
    function poll(){
      fetch('/api/orders/'+encodeURIComponent('${id}')+'/status').then(function(r){ return r.ok?r.json():null; }).then(function(d){
        if(!d) return;
        if(d.status!==shown){
          if(d.status==='READY_FOR_PICKUP'){ try{ window.kioskChime&&window.kioskChime(); }catch{} }
          clearInterval(iv); location.reload(); return;
        }
        if(d.status==='PRINTING') say('Printing…');
        else if(d.status==='PRINT_QUEUE') say('In queue…');
        else if(d.status==='READY_FOR_PICKUP') say('Printed and ready for rider pickup');
      }).catch(function(){});
    }
    var iv=setInterval(poll,8000); poll();
  })();
  </script>`;
}

export function orderDetail(user, order, rider, waUrl, fresh) {
  const pickup = !order.deliveryZone || order.deliveryZone === 'pickup';
  const reached = new Set(order.history.map((h) => h.to));
  reached.add('CREATED');
  const items = TRACK_STEPS.map((s) => {
    const h = order.history.find((x) => x.to === s);
    const cls = reached.has(s) ? 'done' : '';
    const at = h ? `<span class="at">${esc(new Date(h.at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }))}</span>` : '';
    const mark = reached.has(s) ? '✓' : '○';
    return `<li class="${cls}"><span class="pip"></span><b>${mark} ${s === 'DELIVERED' && !pickup ? 'Delivered' : s === 'READY_FOR_PICKUP' && !pickup ? 'Ready for delivery' : STEP_LABEL[s]}</b><br>${at}</li>`;
  }).join('');
  const canCancel = !order.purchaseId && ['CREATED', 'PAYMENT_PENDING', 'CONFIRMED'].includes(order.status);
  const canReorder = ['DELIVERED', 'CANCELLED', 'REFUNDED'].includes(order.status);
  const isLive = ['PRINT_QUEUE','PRINTING','READY_FOR_PICKUP','OUT_FOR_DELIVERY'].includes(order.status);
  return layout({
    extraHead: !order.purchaseId ? purchaseAnalytics(order) : '',
    title: `Order ${order.id}`, user, extraCss: '/customer.css', active: '/customer/orders',
    body: `
    <div class="page-heading"><p class="eyebrow rv"><a href="/customer/orders" style="text-decoration:none">← Orders</a></p>
    <h1 class="display rv">Order <em>#${esc(order.id)}</em></h1></div>
    <div class="rv" style="margin:10px 0 18px"${fresh ? ` data-confetti-load="${order.couponDiscount ? 110 : 85}"` : ''}>${badge(order.status)}</div>
    ${['PRINT_FAILED','DELIVERY_FAILED','PAYMENT_FAILED'].includes(order.status) ? '<p class="login-err" role="alert">This order needs attention. Check its status and <a href="/contact">contact our team</a> for the next step.</p>' : ''}
    ${order.status === 'DELIVERED' ? `<div class="card promo rv" style="margin-bottom:14px"><p class="eyebrow">Liked PrintKarr?</p><p style="font-weight:700;margin:6px 0">Share PrintKarr and earn credit toward a future print.</p><a class="btn sun" href="/customer/referrals"><span>Get my code →</span></a></div>` : ''}
    ${!order.purchaseId && order.status === 'READY_FOR_PICKUP' && pickup ? `<div class="card sun rv" style="margin-bottom:14px"><p class="eyebrow">Ready at the kiosk</p><p style="font-weight:700;margin:6px 0">Your prints are at the counter. Scan the kiosk QR to mark them collected.</p><a class="btn solid" href="/customer/orders/${order.id}/scan"><span>Scan kiosk QR →</span></a></div>` : ''}
    ${order.paymentStatus==='cod_pending' ? `<p class="pick hot">Cash due on delivery. <a href="/customer/purchases/${esc(order.purchaseId)}">See the full cash total and receipt →</a></p>` : ''}
    ${order.purchaseId ? `<p class="card" style="margin-bottom:18px">Part of a shared prints &amp; stationery purchase. <a href="/customer/purchases/${esc(order.purchaseId)}">View receipt, delivery and cancellation →</a></p>` : ''}
    <div class="grid c2">
      <div class="card rv">
        <p class="eyebrow">Summary</p>
        <p style="font-weight:700;margin:8px 0">${icon('file-text')} ${esc(order.document)}</p>
        <div class="sumrow"><span>${order.pages} pages × ${order.copies}</span><span>${rs(order.subtotal)}</span></div>
        <div class="sumrow"><span>${esc(printDescription(order))} · ${order.sides === 'double' ? 'Double' : 'Single'}-sided</span></div>
        ${order.discount ? `<div class="sumrow disc"><span>Student discount</span><span>−${rs(order.discount)}</span></div>` : ''}
        ${order.packDiscount ? `<div class="sumrow disc"><span>Semester pack ${esc(order.packSubId || '')}</span><span>−${rs(order.packDiscount)}</span></div>` : ''}
        ${order.referralDiscount ? `<div class="sumrow disc"><span>Friend referral ${esc(order.referralCode || '')}</span><span>−${rs(order.referralDiscount)}</span></div>` : ''}
        ${order.couponDiscount ? `<div class="sumrow disc"><span>Coupon ${esc(order.couponCode || '')}</span><span>−${rs(order.couponDiscount)}</span></div>` : ''}
        ${order.cartDiscount ? `<div class="sumrow disc"><span>Shared cart coupon</span><span>−${rs(order.cartDiscount)}</span></div>` : ''}
        ${order.firstFree ? `<div class="sumrow disc"><span>First delivery treat 🎉</span><span>FREE</span></div>` : ''}
        ${order.processingFee ? `<div class="sumrow"><span>Print processing</span><span>${rs(order.processingFee)}</span></div>` : ''}${order.codFee ? `<div class="sumrow"><span>Cash handling</span><span>${rs(order.codFee)}</span></div>` : ''}
        <div class="sumrow"><span>${pickup ? 'Collect' : 'Delivery'}</span><span>${order.deliveryFee === 0 ? `<span class="freebadge">FREE${pickup ? ' at kiosk' : ''}</span>` : rs(order.deliveryFee)}</span></div>
        <p class="field-hint">${esc(order.slot || '')}</p>
        ${order.lateCreditedAt ? `<p class="pick">₹${order.lateCredit} missed-slot wallet credit added.</p>` : ''}
        <div class="sumrow total"><span>Total</span><span>${rs(order.total)}</span></div>
        <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap">
        ${!order.purchaseId && ['CREATED','PAYMENT_PENDING'].includes(order.status) ? `<a class="btn loud" href="/customer/orders/${order.id}/pay"><span>Resume payment →</span></a>` : ''}
        ${canReorder ? `<form method="POST" action="/customer/orders/${order.id}/reorder"><button class="btn sun" type="submit"><span>↻ Reorder</span></button></form>` : ''}
        ${canCancel ? `<form method="POST" action="/customer/orders/${order.id}/cancel" onsubmit="return confirm('Cancel this order?')"><button class="btn ghost" type="submit"><span>Cancel order</span></button></form>` : ''}
        ${waUrl ? `<a class="btn ghost" href="${waUrl}" target="_blank" rel="noopener"><span>✆ WhatsApp the shop →</span></a>` : ''}
        </div>
      </div>
      <div class="card rv">
        <p class="eyebrow">Tracking — ${pickup ? 'kiosk pickup' : 'delivery'}</p>
        <ol class="tline">${items}</ol>
        ${isLive ? kioskPollBlock(order.id, order.status) : ''}
      </div>
    </div>`
  });
}

export function scanPage(user, order) {
  return layout({
    title: `Scan pickup QR`, user, extraCss: '/customer.css', active: '/customer/orders',
    extraHead: `<script src="https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js" defer></script>`,
    body: `
    <div class="page-heading"><p class="eyebrow rv"><a href="/customer/orders/${order.id}" style="text-decoration:none">← Order #${esc(order.id)}</a></p>
    <h1 class="display rv">Scan the <em>kiosk code.</em></h1></div>
    <div class="card rv" style="margin-top:16px;text-align:center">
      <video id="scan-video" playsinline muted style="display:none;width:100%;max-width:420px;border-radius:12px;background:#111"></video>
      <p class="mono" id="scan-status" role="status" style="font-size:12px;margin-top:10px">Tap start, then point at the QR on the kiosk slip or screen.</p>
      <button class="btn loud big" type="button" id="scan-start" style="width:100%;margin-top:12px"><span>Start camera →</span></button>
      <p class="muted" style="font-size:12px;margin-top:12px">No camera? Open your phone's camera app and point it at the code instead — it opens the same confirm page.</p>
    </div>
    <script>
    (function(){
      var btn = document.getElementById('scan-start');
      var video = document.getElementById('scan-video');
      var status = document.getElementById('scan-status');
      var cameraStream = null;
      function stopCamera(){
        if (cameraStream) cameraStream.getTracks().forEach(function(track){ track.stop(); });
        cameraStream = null;
      }
      window.addEventListener('pagehide', stopCamera);
      function say(t){ if (status) status.textContent = t; }
      btn.addEventListener('click', function(){
        if (typeof jsQR === 'undefined') { say('Scanner library did not load — use your phone camera app instead.'); return; }
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { say('This browser blocks camera access here — use your phone camera app instead.'); return; }
        btn.setAttribute('disabled', 'true');
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }).then(function(stream){
          cameraStream = stream;
          video.style.display = 'block';
          video.srcObject = stream;
          return video.play();
        }).then(function(){
          say('Scanning… hold the QR inside the frame.');
          var canvas = document.createElement('canvas');
          var ctx = canvas.getContext('2d', { willReadFrequently: true });
          (function tick(){
            if (video.readyState !== video.HAVE_ENOUGH_DATA) { requestAnimationFrame(tick); return; }
            canvas.width = video.videoWidth; canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0);
            var found = null;
            try { found = jsQR(ctx.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height); } catch (e) { found = null; }
            if (found && found.data) {
              var m = String(found.data).match(/\\/c\\/([a-f0-9]{32})/);
              if (m) {
                say('Code found — opening confirm page…');
                stopCamera();
                window.location.href = '/c/' + m[1];
                return;
              }
              say('That code is not a PrintKarr pickup — try the kiosk slip.');
            }
            requestAnimationFrame(tick);
          })();
        }).catch(function(){
          stopCamera();
          btn.removeAttribute('disabled');
          say('Camera blocked — allow access, or use your phone camera app instead.');
        });
      });
    })();
    </script>`
  });
}
