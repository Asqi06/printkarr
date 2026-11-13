import { purchaseAnalytics } from './seo.js';
import { printDescription } from '../public/print-plan.js';
// Customer views: dashboard (§5), orders (§15), tracking detail (§14), reorder (§16).
import { layout, esc, greeting, icon, leafletHead } from './views.js';
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

export function customerDashboard(user, { current, walletBalance = 0 }) {
  const card = current
    ? `<a class="card dashboard-action dashboard-current rv" href="/customer/orders/${current.id}">
        <p class="eyebrow">Latest order · #${esc(current.id)}</p>
        <h2>${friendly(current.status)}</h2>
        <p class="muted" style="font-size:13px;margin-top:12px">${esc(current.document)}</p>
        <div class="pbar" style="margin-top:20px"><span style="width:${progressOf(current.status)}%"></span></div>
        <span class="card-link">View order details ${icon('arrow-up-right')}</span>
      </a>`
    : '';
  return layout({title:'Home',user,extraCss:'/customer.css',active:'/customer',body:`
    <div class="dashboard-welcome"><div class="dashboard-greeting"><div class="page-heading"><p class="eyebrow">YOUR PRINT DESK</p><h1>${greeting(user.name?.trim().split(/\s+/)[0] || 'there')}</h1><p>Print your notes. Get your essentials. We’ll bring them to you.</p></div><nav class="home-account-actions" aria-label="Quick access"><a class="btn loud" href="/customer/orders/new">Upload &amp; print ${icon('arrow-up-right')}</a></nav></div></div>
    <div class="dashboard-grid">
      <a class="card dashboard-start" href="/order">${icon('printer')}<h2>Prints, delivered.</h2><p>Notes &amp; assignments, delivered to your door.</p><span class="card-link">Start a print ${icon('arrow-up-right')}</span></a>
      <a class="card dashboard-start dashboard-stationery" href="/stationery">${icon('stack')}<h2>Everyday stationery.</h2><p>Notebooks, pens, files &amp; more, in one order.</p><span class="card-link">Shop stationery ${icon('arrow-up-right')}</span></a>
    </div>
    <div class="dashboard-side"><a class="card dashboard-action" href="/customer/wallet"><p class="eyebrow">WALLET BALANCE</p><div class="stat"><div class="v">${rs(walletBalance)}</div></div><span class="card-link">Wallet &amp; offers ${icon('arrow-up-right')}</span></a>${card || '<a class="card dashboard-action" href="/customer/orders"><p class="eyebrow">YOUR ORDERS</p><h2>Track your prints.</h2><p class="muted">All your delivery updates.</p><span class="card-link">Open orders '+icon('arrow-up-right')+'</span></a>'}</div>
    `});
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

export function orderTrack(status) {
  const steps = ['Received', 'Printing', 'Ready', 'Dispatched', 'Delivered'];
  
  let currentIdx = 0;
  const s = String(status || '').toUpperCase();
  if (['CREATED', 'CONFIRMED', 'PRINT_QUEUE', 'PAYMENT_PENDING'].includes(s)) currentIdx = 0;
  else if (s === 'PRINTING') currentIdx = 1;
  else if (s === 'READY_FOR_PICKUP') currentIdx = 2;
  else if (['RIDER_ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY'].includes(s)) currentIdx = 3;
  else if (['DELIVERED', 'COLLECTED'].includes(s)) currentIdx = steps.length - 1;
  else if (['CANCELLED', 'REFUNDED', 'PRINT_FAILED', 'DELIVERY_FAILED', 'PAYMENT_FAILED'].includes(s)) currentIdx = -1;

  const pct = currentIdx <= 0 ? 0 : Math.round((currentIdx / (steps.length - 1)) * 100);

  return `
    <div class="order-track" role="list" aria-label="Order progress">
      <div class="order-track-line"><div class="order-track-fill" style="width:${pct}%"></div></div>
      ${steps.map((label, i) => {
        const cls = currentIdx < 0 ? '' : i < currentIdx ? 'done' : i === currentIdx ? 'active' : '';
        return `
        <div class="order-track-step ${cls}" role="listitem">
          <div class="order-track-dot"></div>
          <span class="order-track-label">${label}</span>
        </div>`;
      }).join('')}
    </div>`;
}

export function orderDetail(user, order, rider, waUrl, fresh) {
  const reached = new Set(order.history.map((h) => h.to));
  reached.add('CREATED');
  const items = TRACK_STEPS.map((s) => {
    const h = order.history.find((x) => x.to === s);
    const cls = reached.has(s) ? 'done' : '';
    const at = h ? `<span class="at">${esc(new Date(h.at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }))}</span>` : '';
    const mark = reached.has(s) ? '✓' : '○';
    return `<li class="${cls}"><span class="pip"></span><b>${mark} ${s === 'DELIVERED' ? 'Delivered' : s === 'READY_FOR_PICKUP' ? 'Ready for delivery' : STEP_LABEL[s]}</b><br>${at}</li>`;
  }).join('');
  const canCancel = ['CREATED', 'PAYMENT_PENDING', 'CONFIRMED'].includes(order.status);
  const canReorder = ['DELIVERED', 'CANCELLED', 'REFUNDED'].includes(order.status);
  const isLive = ['PRINT_QUEUE','PRINTING','READY_FOR_PICKUP','OUT_FOR_DELIVERY'].includes(order.status);
  return layout({
    extraHead: (!order.purchaseId ? purchaseAnalytics(order) : '') + (isLive ? '<meta http-equiv="refresh" content="60">' : ''),
    title: `Order ${order.id}`, user, extraCss: '/customer.css', active: '/customer/orders',
    body: `
    <div class="page-heading"><p class="eyebrow rv"><a href="/customer/orders" style="text-decoration:none">← Orders</a></p>
    <h1 class="display rv">Order <em>#${esc(order.id)}</em></h1></div>
    <div class="rv" style="margin:10px 0 18px"${fresh ? ` data-confetti-load="${order.couponDiscount ? 110 : 85}"` : ''}>${badge(order.status)}</div>
    ${['PRINT_FAILED','DELIVERY_FAILED','PAYMENT_FAILED'].includes(order.status) ? '<p class="login-err" role="alert">This order needs attention. Check its status and <a href="/contact">contact our team</a> for the next step.</p>' : ''}
    ${order.status === 'DELIVERED' ? `<div class="card promo rv" style="margin-bottom:14px"><p class="eyebrow">Liked PrintKarr?</p><p style="font-weight:700;margin:6px 0">Share PrintKarr and earn credit toward a future print.</p><a class="btn sun" href="/customer/referrals"><span>Get my code →</span></a></div>` : ''}
    ${order.paymentStatus==='cod_pending' ? `<p class="pick hot">This older checkout needs payment review. <a href="/customer/purchases/${esc(order.purchaseId)}">View receipt and contact support →</a></p>` : ''}
    ${order.purchaseId ? `<p class="field-hint" style="margin-bottom:14px">Combined checkout receipt: <a href="/customer/purchases/${esc(order.purchaseId)}">#${esc(order.purchaseId)}</a></p>` : ''}
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
        <div class="sumrow"><span>Delivery</span><span>${order.deliveryFee === 0 ? '<span class="freebadge">FREE</span>' : rs(order.deliveryFee)}</span></div>
        <p class="field-hint">${esc(order.slot || '')}</p>
        ${order.lateCreditedAt ? `<p class="pick">₹${order.lateCredit} missed-slot wallet credit added.</p>` : ''}
        <div class="sumrow total"><span>Total</span><span>${rs(order.total)}</span></div>
        <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap">
        ${['CREATED','PAYMENT_PENDING'].includes(order.status) ? `<a class="btn loud" href="${order.purchaseId ? `/customer/purchases/${esc(order.purchaseId)}` : `/customer/orders/${order.id}/pay`}"><span>Resume payment →</span></a>` : ''}
        ${canReorder ? `<form method="POST" action="/customer/orders/${order.id}/reorder"><button class="btn sun" type="submit"><span>↻ Reorder</span></button></form>` : ''}
        ${canCancel ? `<form method="POST" action="/customer/orders/${order.id}/cancel" data-confirm="Cancel this order?"><button class="btn ghost" type="submit"><span>Cancel order</span></button></form>` : ''}
        ${waUrl ? `<a class="btn ghost" href="${waUrl}" target="_blank" rel="noopener"><span>✆ WhatsApp the shop →</span></a>` : ''}
        </div>
      </div>
      <div class="card rv">
        <p class="eyebrow">Delivery tracking</p>
        ${orderTrack(order.status)}
        <ol class="tline" style="margin-top:20px">${items}</ol>
      </div>
    </div>`
  });
}

