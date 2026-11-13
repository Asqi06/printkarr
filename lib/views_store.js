import { scriptNonce } from './security.js';
import { purchaseAnalytics } from './seo.js';
import { printDescription } from '../public/print-plan.js';
import { esc, icon, layout, pkPublicHead, pkPublicHeader, pkPublicFooter, THEME_SCRIPTS, ASSET_V, DELIVERY_MAP_HEAD, deliveryPicker, festivalAttr } from './views.js';
import { deliverySlotsFields, feeExplanation, slabMeter } from './views_order.js';
import { campaignConfig, walletOf, deliveryChoice, eligibleWalletOffers } from './campus.js';
import { FREE_DELIVERY, money, printNet, catalogue, availableStock } from './store.js';

const rs = (n) => `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const hidden = (name, value) => `<input type="hidden" name="${name}" value="${esc(value)}">`;
const cartCount = (cart) => (cart?.lines || []).reduce((s, l) => s + l.quantity, 0) + (cart?.printIds || []).length;
const css = `<link rel="stylesheet" href="/store.css?v=${ASSET_V}">`;
const cartLink = (cart) => `<a class="store-cart-link" href="/cart">${icon('stack')} Your cart <span data-cart-count>${cartCount(cart)}</span></a>`;
const photo = (p) => p.image ? `<img src="${esc(p.image)}" alt="${esc(p.name)}" width="640" height="640" loading="lazy" decoding="async">` : `<div class="product-placeholder"><span>${esc(p.category)}</span><b>${esc(p.name)}</b><small>Product photo to be added</small></div>`;
const remove = (fields) => `<form method="POST" action="/cart/remove">${Object.entries(fields).map(([key, val]) => hidden(key, val)).join('')}<button class="store-text-button" type="submit">${fields.printId ? 'Remove & cancel print' : 'Remove'}<span class="sr-only"> ${esc(fields.printId || fields.productId)}</span></button></form>`;
// Blinkit-style add → quantity stepper. "Add" stays JS-free; the stepper upgrades in place.
const qtyOf = (cart, p) => (cart?.lines || []).filter((l) => l.productId === p.id).reduce((sum, l) => sum + l.quantity, 0);
const qtyColor = (cart, p) => (cart?.lines || []).find((l) => l.productId === p.id)?.color || p.colors?.[0] || '';
const qtyStepper = (p, qty, color) => `<div class="qty-step" data-qty data-color="${esc(color)}" data-qty="${qty}" ${qty ? '' : 'hidden'}>
  <form method="POST" action="/cart/items" data-qty-form>${hidden('productId', p.id)}${hidden('color', color)}${hidden('quantity', Math.max(0, qty - 1))}<button class="qty-btn" type="submit" data-qty-dec aria-label="Remove one ${esc(p.name)}">−</button></form>
  <b data-qty-num aria-live="polite">${qty}</b>
  <form method="POST" action="/cart/items" data-qty-form>${hidden('productId', p.id)}${hidden('color', color)}${hidden('quantity', 1)}${hidden('add', '1')}<button class="qty-btn" type="submit" data-qty-inc aria-label="Add one ${esc(p.name)}">+</button></form>
</div>`;


function pkCheckoutFooter() {
  return `<footer class="pk-checkout-footer" aria-label="Checkout guarantee and support">
    <div class="pk-checkout-footer-inner">
      <div class="pk-checkout-trust">
        <span>${icon('check')} Exact total before payment</span>
        <span>${icon('map-pin')} 45-Min Express in Vapi &amp; Daman</span>
        <span>${icon('file-text')} Verified local print desks</span>
      </div>
      <div class="pk-checkout-footlinks">
        <span>© ${new Date().getFullYear()} PrintKarr</span>
        <a href="/terms">Terms</a>
        <a href="/privacy">Privacy</a>
        <a href="/contact">Help &amp; WhatsApp</a>
      </div>
    </div>
  </footer>`;
}

function publicShell(title, body, active = '/stationery', extraHead = '') {
  return `<!doctype html><html lang="en"${festivalAttr()}><head>${pkPublicHead(title)}${css}${extraHead}<link rel="stylesheet" href="/customer.css?v=${ASSET_V}"><meta name="theme-color" content="#192044"><link rel="stylesheet" href="/site-overhaul.css?v=${ASSET_V}"><link rel="stylesheet" href="/studio.css?v=${ASSET_V}"><link rel="stylesheet" href="/playful-system.css?v=${ASSET_V}"></head><body data-design="paper-studio" class="public-site store-view"><div class="pk-page">${pkPublicHeader(active)}<a class="store-skip" href="#main">Skip to content</a><main id="main">${body}</main>${active === '/cart' ? pkCheckoutFooter() : pkPublicFooter()}</div>${THEME_SCRIPTS}<script src="/shell.js?v=${ASSET_V}" defer></script><script src="/store.js?v=${ASSET_V}" defer></script></body></html>`;
}

export function deliveryProgress() {
  return '<p class="field-hint">Delivery fees are calculated by estimated distance from the printing desk to your saved address.</p>';
}

export function shopPage(products, cart, added = false) {
  const categories = [...new Set(products.map((p) => p.category))];
  const demo = products.some((p) => p.demo);
  const body = `<div class="store-wrap"><div class="store-topline"><span>THE PRINTKARR SUPPLY DESK</span>${cartLink(cart)}</div>
    <section class="store-hero" aria-labelledby="shop-title"><img class="store-hero-photo" src="/images/stationery-demo-hero.png" alt="Illustrative demo flat lay of notebooks, folders and writing essentials" width="1536" height="1024" fetchpriority="high"><div class="store-hero-copy"><p class="eyebrow">PAPER. PENCILS. POSSIBILITIES.</p><h1 id="shop-title">Your everyday<br><em>essentials.</em></h1><p>Notebooks, files and writing essentials.<br>Add your prints and get one local delivery.</p><a class="btn loud big pk-btn pk-btn-primary" href="#catalogue">Find your essentials ${icon('arrow-down')}</a></div><span class="hero-photo-caption">Illustrative demo imagery</span></section>
    <div class="store-promise"><p>${icon('printer')} Prints + stationery, one cart</p><p>${icon('gift')} Free scheduled delivery on ₹149+</p><p>${icon('map-pin')} Coverage confirmed before payment</p></div>
    ${demo ? '<aside class="store-demo-note"><strong>A preview of our supply desk.</strong> Sample products, prices and availability are shown for demonstration. Demo products cannot be purchased. Real catalogue details will be added by PrintKarr.</aside>' : ''}
    ${!products.length ? '<p class="store-demo-note">The stationery catalogue is being prepared. You can still order prints from here.</p>' : ''}<section class="store-catalogue" id="catalogue" aria-labelledby="catalogue-title"><div class="catalogue-heading"><div><p class="eyebrow">THE EVERYDAY COLLECTION</p><h2 id="catalogue-title">Small essentials.<br><em>Big plans.</em></h2></div><a class="rowlink" href="/order">Need a print too? ${icon('arrow-up-right')}</a></div>
    <form class="store-toolbar" role="search" data-store-search><label class="store-search">Search essentials<input type="search" data-product-search placeholder="Notebook, file, pen…" aria-controls="product-grid"></label><label class="store-sort">Sort by<select data-product-sort><option value="featured">Collection order</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option></select></label></form>
    <nav class="store-filters store-chip-rail" aria-label="Filter by category"><button type="button" data-category-chip="all" aria-pressed="true">All essentials</button>${categories.map(c=>`<button type="button" data-category-chip="${esc(c)}" aria-pressed="false">${esc(c)}</button>`).join('')}</nav><p class="store-results" data-product-results role="status">${products.length} essentials</p>
    <div class="product-grid" id="product-grid">${products.map((p, index) => `<article class="product-card" data-product data-name="${esc(p.name.toLowerCase())}" data-category="${esc(p.category)}" data-price="${p.price}" data-index="${index}"><div class="product-art category-${index % 4}">${photo(p)}${p.demo ? '<span class="product-demo">Demo product</span>' : ''}</div><div class="product-info"><p class="product-category">${esc(p.category)}</p><div class="product-heading"><h3>${esc(p.name)}</h3><strong>${rs(p.price)}</strong></div><p class="product-description">${esc(p.description)}</p>
    <form method="POST" action="/cart/items" data-add-product ${qtyOf(cart, p) ? 'hidden' : ''}>${hidden('productId', p.id)}${hidden('add', '1')}${hidden('quantity', 1)}${p.colors.length ? `<fieldset class="product-colors"><legend>Choose colour</legend>${p.colors.map((color, i) => `<label title="${esc(color)}"><input type="radio" name="color" value="${esc(color)}" ${i ? '' : 'checked'} required><span style="--swatch:${({orange:'#dc651d',green:'#42714d',red:'#c63e38',yellow:'#efb930'})[color]}"><span class="sr-only">${esc(color)}</span></span></label>`).join('')}<small data-color-label>${esc(p.colors[0])}</small></fieldset>` : '<div class="product-colors product-no-colors">One option. Easy choice.</div>'}<button class="product-add" type="submit" ${p.stock ? '' : 'disabled'}>${p.stock ? `Add to cart ${icon('arrow-up-right')}` : 'Out of stock'}</button></form><p class="product-feedback" role="status" hidden></p>${qtyStepper(p, qtyOf(cart, p), qtyColor(cart, p))}</div></article>`).join('')}</div>
    <div class="store-no-results" data-no-results hidden><h3>No essentials found.</h3><p>Try another word or choose All essentials.</p></div></section>
    <section class="store-print-banner"><div><p class="eyebrow">DON’T FORGET THE ASSIGNMENT</p><h2>Your stationery.<br>Your prints. <em>One delivery.</em></h2><p>Add a print before checkout. Free delivery on ₹149+ applies to scheduled address delivery. School and express rates are shown at checkout.</p></div><a class="btn loud big pk-btn pk-btn-primary" href="/order">Upload a document ${icon('arrow-up-right')}</a></section></div>
    <div class="store-toast" data-store-toast role="status" ${added ? '' : 'hidden'}>Added to your cart. <a href="/cart">View cart →</a></div>`;
  return publicShell('Stationery', body);
}

function totals(q) {
  return `<div class="sumrow"><span>Items after print benefits</span><span>${rs(q.subtotal)}</span></div>${q.couponDiscount ? `<div class="sumrow disc"><span>Coupon ${esc(q.couponCode)}</span><span>−${rs(q.couponDiscount)}</span></div>` : ''}${q.bulkDiscount ? `<p class="field-hint">${rs(q.bulkDiscount)} print saving is already included in the print item value.</p>` : ''}${q.processingFee ? `<div class="sumrow"><span>Print processing</span><span>${rs(q.processingFee)}</span></div>` : ''}<div class="sumrow"><span>Delivery · one trip</span><span>${q.deliveryFee ? rs(q.deliveryFee) : '<span class="freebadge">FREE</span>'}</span></div>${q.lateNightFee ? `<div class="sumrow"><span>Late-night fee</span><span>${rs(q.lateNightFee)}</span></div>` : ''}${q.surgeFee ? `<div class="sumrow"><span>Print demand fee</span><span>${rs(q.surgeFee)}</span></div>` : ''}<div class="sumrow total"><span>Total</span><span>${rs(q.total)}</span></div>`;
}

export function cartPage(user, db, cart, contents, quote, error, selection = {}) {
  const count = cartCount(cart), net = quote?.net ?? contents?.subtotal ?? 0;
  const addresses = (db.addresses || []).filter((a) => a.customerId === user?.id && !a.campusId && ['vapi', 'daman', 'sarigam', 'bhilad'].includes(String(a.area).toLowerCase())).sort((a, b) => Number(!!b.isDefault) - Number(!!a.isDefault));
  const delivery = quote?.address?.address ? quote.address : addresses.find((a) => a.id === selection.addressId) || addresses.find((a) => a.isDefault) || addresses[0] || null;
  const addressId = selection.addressId || quote?.addressId || delivery?.id || '__new';
  const inCart = new Set((cart.lines || []).map((l) => l.productId));
  const picks = catalogue(db).filter((p) => p.active !== false && (p.stock ?? 0) > 0 && !inCart.has(p.id)).slice(0, 4);
  const first = contents?.prints?.[0];
  const slot = selection.deliverySlot || quote?.deliverySlot || (first ? deliveryChoice(first) : 'express');
  
  const freeRemaining = Math.max(0, FREE_DELIVERY - net);
  const aovMeter = freeRemaining > 0
    ? `<div class="pk-cart-aov-meter"><span class="pk-meter-icon">🚚</span><div class="pk-meter-text"><b>Add ${rs(freeRemaining)} more</b> to unlock <strong>FREE scheduled delivery</strong></div><div class="pk-meter-track"><span class="pk-meter-fill" style="width:${Math.min(100, Math.max(8, Math.round((net / FREE_DELIVERY) * 100)))}%"></span></div></div>`
    : `<div class="pk-cart-aov-meter unlocked"><span class="pk-meter-icon">🎉</span><div class="pk-meter-text"><strong>You've unlocked FREE delivery!</strong> (Orders above ₹149)</div></div>`;

  const suggest = picks.length ? `<section class="cart-suggest" aria-label="Desk picks to add">
    <div class="cart-suggest-head">
      <span class="cart-suggest-badge">⚡ Recommended Essentials</span>
      <h2>Round out your order</h2>
      <p class="field-hint">Impulse essentials that deliver together at no extra delivery fee</p>
    </div>
    <div class="cart-suggest-row">${picks.map((p) => `<article class="cart-suggest-card">
      <div class="cart-suggest-art">${photo(p)}</div>
      <div class="cart-suggest-copy">
        <h3>${esc(p.name)}</h3>
        <p>${rs(p.price)}${p.colors?.length ? ` · ${esc(p.colors[0])}` : ''}</p>
        <form method="POST" action="/cart/items">${hidden('productId', p.id)}${hidden('quantity', 1)}${hidden('add', '1')}${hidden('back', 'cart')}${p.colors?.length ? hidden('color', p.colors[0]) : ''}<button class="product-add" type="submit">+ Add</button></form>
      </div>
    </article>`).join('')}</div>
  </section>` : '';

  const stationery = (contents?.items || []).map((i) => {
    const p = catalogue(db).find((x) => x.id === i.productId) || { name: i.name, category: 'Stationery' };
    return `<article class="qk-line" data-cart-row><div class="qk-line-art">${photo(p)}</div><div class="qk-line-copy"><h2>${esc(i.name)}</h2><p>${i.color ? esc(i.color) + ' · ' : ''}${rs(i.price)} each</p><div class="qk-step"><form method="POST" action="/cart/items">${hidden('productId', i.productId)}${hidden('color', i.color)}${hidden('quantity', Math.max(0, i.quantity - 1))}<button type="submit" aria-label="Remove one ${esc(i.name)}">−</button></form><b>${i.quantity}</b><form method="POST" action="/cart/items">${hidden('productId', i.productId)}${hidden('color', i.color)}${hidden('quantity', 1)}${hidden('add', '1')}${hidden('back', 'cart')}<button type="submit" aria-label="Add one ${esc(i.name)}">+</button></form></div></div><div class="qk-line-side"><b>${rs(i.total)}</b>${remove({ productId: i.productId, color: i.color })}</div></article>`;
  }).join('');
  const prints = (contents?.prints || []).map((o) => `<article class="qk-line qk-line-print"><div class="qk-line-art qk-file">${icon('file-text')}</div><div class="qk-line-copy"><h2>${esc(o.document)}</h2><p>${o.pages} pages × ${o.copies} · ${esc(printDescription(o))} · ${esc(o.sides)} sided</p><a class="rowlink" href="/customer/orders/${esc(o.id)}">View print →</a></div><div class="qk-line-side"><b>${rs(printNet(o))}</b>${remove({ printId: o.id })}</div></article>`).join('');
  const unavailable = !contents ? (cart.lines || []).map((l) => `<article class="qk-line"><div class="qk-line-copy"><p>Unavailable item · ${esc(l.productId)}</p>${remove({ productId: l.productId, color: l.color })}</div></article>`).join('') : '';
  const deliver = `<div class="qk-deliver">${icon('map-pin')}<div><b>${delivery ? `Deliver to ${esc(delivery.label || 'Home')}` : 'Add a delivery address'}</b><p>${delivery ? `${esc(delivery.address)}${delivery.pin ? ' · ' + esc(delivery.pin) : ''}` : 'Choose or add the address for this order.'}</p></div><a href="#cart-address">CHANGE</a></div>`;
  const head = `<div class="qk-cart-head"><a class="qk-cart-back" href="/stationery" aria-label="Back to essentials">←</a><div><h1>My cart</h1><p><span class="qk-dot"></span>${quote ? `${esc(quote.slot)} · ${esc(quote.fulfillmentName || 'PrintKarr print desk')}` : 'Choose a delivery slot at checkout'}</p></div><span class="qk-cart-count">${count} ${count === 1 ? 'item' : 'items'}</span></div>`;
  const coupon = `<details class="order-more" ${selection.coupon ? 'open' : ''}><summary>Have a coupon?</summary><div class="field"><label for="cart-coupon">Coupon code</label><input id="cart-coupon" name="coupon" value="${esc(selection.coupon || '')}" maxlength="40" autocomplete="off"><small>One use per coupon per customer.</small></div></details>`;
  const bill = quote ? `<details class="qk-bill" open><summary><span>Bill details</span><b>${rs(quote.total)}</b></summary>${quote.printedSides > 0 && !(contents?.prints || []).some((o) => o.packDiscount > 0) ? slabMeter(quote.printedSides, db.pricing) : ''}${quote.bulkDiscount ? `<p class="qk-save">You save ${rs(quote.bulkDiscount)} on print rates</p>` : ''}${totals(quote)}</details>` : `<div class="qk-bill"><p class="field-hint">Review the total before payment.</p></div>`;
  const slotFields = `<details class="order-more" ${quote && !error ? '' : 'open'}><summary>${quote ? 'Change delivery slot' : 'Choose delivery slot'}</summary><p class="field-hint">Delivery fees are calculated by estimated distance from the printing desk to your saved address.</p>${deliverySlotsFields(campaignConfig(db), db.pricing, slot, false, 'order', { ...selection, contactPhone: user?.phone || '', institutionAddresses: addresses.filter((a) => a.institutionName), institutionLocation: selection.institutionLocation || (delivery?.institutionName ? 'address:' + delivery.id : '') })}</details>`;
  const addressFields = `<div class="field"><label for="cart-address">Delivery address</label><select id="cart-address" name="addressId" required><option value="__new" ${addressId === '__new' ? 'selected' : ''}>Add a new address</option>${addresses.map((a) => `<option value="${esc(a.id)}" ${a.id === addressId ? 'selected' : ''}>${esc(a.label || 'Address')} · ${esc(a.address)} · ${esc(a.area)}</option>`).join('')}</select></div><fieldset class="address-fields" data-cart-new-address ${addressId === '__new' ? '' : 'hidden disabled'}><div class="grid c2"><div class="field"><label for="cart-phone">Delivery phone</label><input id="cart-phone" name="nn_phone" type="tel" value="${esc(selection.nn_phone || user.phone || '')}" autocomplete="tel" required maxlength="20"></div><div class="field"><label for="cart-area">Area</label><select id="cart-area" name="nn_area">${['Vapi','Daman','Sarigam','Bhilad'].map((area) => `<option ${String(selection.nn_area || 'Vapi').toLowerCase() === area.toLowerCase() ? 'selected' : ''}>${area}</option>`).join('')}</select></div></div><div class="field"><label for="cart-street">Street address</label><input id="cart-street" name="nn_address" value="${esc(selection.nn_address || '')}" autocomplete="street-address" required maxlength="200"></div><div class="field"><label for="cart-pin">PIN code</label><input id="cart-pin" name="nn_pin" value="${esc(selection.nn_pin || '')}" autocomplete="postal-code" inputmode="numeric" pattern="[1-9][0-9]{5}" maxlength="6" required></div>${deliveryPicker(selection.nn_area || 'Vapi', {localityId:selection.localityId,lat:selection.deliveryLat,lng:selection.deliveryLng})}</fieldset><label class="pick"><input type="checkbox" name="makeDefault" value="1" ${addresses.some((a) => a.isDefault) ? '' : 'checked'}> Make this my default address</label><script nonce="${scriptNonce()}">(function(){var s=document.getElementById('cart-address'),f=document.querySelector('[data-cart-new-address]');function sync(){f.hidden=s.value!=='__new';f.disabled=f.hidden;}s.addEventListener('change',sync);sync();})();</script>`;
  const checkout = `<form class="qk-checkout-form" method="POST" action="/cart/checkout">${addressFields}${slotFields}${coupon}${bill}<button class="store-text-button" type="submit" formaction="/cart/quote" formnovalidate>Update total</button><div class="qk-paybar"><span><small>To pay</small><b>${rs(quote?.total ?? net)}</b></span><button class="qk-pay" type="submit" ${contents ? '' : 'disabled'}>Proceed →</button></div>${(contents?.items || []).some((i) => i.demo) ? '<p class="field-hint">Demo products are not purchasable on the website.</p>' : ''}</form>`;
  const body = `<div class="store-wrap qk-cart">${head}${aovMeter}${error ? `<p class="store-error" role="alert">${esc(error)}</p>` : ''}${count ? `<div class="qk-layout"><section class="qk-items" aria-label="Items in your cart">${deliver}${stationery}${prints}${unavailable}${suggest}<a class="qk-addprint" href="/customer/orders/new?fresh=1">${icon('printer')} Add a print to this basket</a></section><aside class="qk-summary" aria-label="Checkout">${checkout}</aside></div>` : `<section class="empty-cart"><p class="eyebrow">A CLEAN SLATE</p><h2>A little space<br>for <em>what’s next.</em></h2><p>Start with a notebook, a file, or the print you need today.</p><a class="btn loud big" href="/stationery">Explore stationery →</a><a class="rowlink" href="/customer/orders/new">Start a print →</a></section>`}</div>`;
  return publicShell('Your cart', body, '/cart', `<link rel="stylesheet" href="/quick.css?v=${ASSET_V}">`);
}

const STATUS_FRIENDLY = {
  CREATED: 'Awaiting payment',
  PAYMENT_PENDING: 'Awaiting payment',
  PAID: 'Confirmed · Preparing',
  CONFIRMED: 'Order confirmed',
  PRINT_QUEUE: 'In print queue',
  PRINTING: 'Printing',
  PRINTED: 'Printed',
  READY: 'Ready for delivery',
  READY_FOR_PICKUP: 'Ready for delivery',
  OUT_FOR_DELIVERY: 'Out for delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded'
};
const storeBadge = (s) => `<span class="badge b-${s}">${STATUS_FRIENDLY[s] || s}</span>`;

export function purchasePage(user, p, db, options = {}) {
  const admin = user.role === 'admin', prefix = admin ? '/admin' : '/customer', pending = p.status === 'CREATED';
  const conversion = !admin ? purchaseAnalytics(p) : '';
  const balance = walletOf(db, p.customerId).balance;
  const offer = eligibleWalletOffers(db, p.customerId).find(o => o.amount + (o.bonus || 0) + balance >= p.total);
  const walletLink = '/customer/wallet?purchase=' + encodeURIComponent(p.id) + (offer ? '&offer=' + encodeURIComponent(offer.id) : '');
  const path = `${prefix}/purchases/${p.id}`;
  const userAddresses = (db.addresses || []).filter(a => a.customerId === p.customerId && !a.campusId);

  const printItemsHtml = p.printIds.map((id) => {
    const o = db.orders.find((x) => x.id === id);
    return `
      <div class="receipt-item">
        <div class="receipt-item-info">
          <span class="receipt-item-icon">${icon('file-text')}</span>
          <div>
            <a href="${prefix}/orders/${esc(id)}" class="receipt-item-title">${esc(o?.document || id)}</a>
            <small class="receipt-item-meta">${o ? `${o.pages} pages · ${esc(printDescription(o))} · ${o.copies} ${o.copies === 1 ? 'copy' : 'copies'} · ${esc(o.sides)} sided` : ''}</small>
          </div>
        </div>
        <b>${rs(o ? printNet(o) : 0)}</b>
      </div>
    `;
  }).join('');

  const stationeryItemsHtml = (p.items || []).map((i) => `
    <div class="receipt-item">
      <div class="receipt-item-info">
        <span class="receipt-item-icon">${icon('stack')}</span>
        <div>
          <span class="receipt-item-title">${esc(i.name)}</span>
          <small class="receipt-item-meta">${i.quantity} × ${rs(i.price)}${i.color ? ` · ${esc(i.color)}` : ''}</small>
        </div>
      </div>
      <b>${rs(i.total)}</b>
    </div>
  `).join('');

  let adminControls = '';
  if (admin) {
    const next = { PAID: ['READY', 'All items packed and ready'], READY: ['OUT_FOR_DELIVERY', 'Out for delivery'], OUT_FOR_DELIVERY: ['DELIVERED', 'Delivered'] }[p.status];
    adminControls = `
      <div class="pk-admin-box card" style="margin-top:20px">
        <p class="eyebrow">Admin fulfillment</p>
        <p>Customer: ${esc(db.users.find((u) => u.id === p.customerId)?.name || p.customerId)} · ${esc(db.users.find((u) => u.id === p.customerId)?.phone || '')}</p>
        <div style="display:flex;gap:10px;margin-top:14px;flex-wrap:wrap">
          ${next ? `<form method="POST" action="${path}/status">${hidden('to', next[0])}<button class="btn loud" type="submit">${next[1]}</button></form>` : ''}
          ${['CREATED', 'PAID'].includes(p.status) && !p.gatewayOrderId ? `<form method="POST" action="${path}/status">${hidden('to', 'CANCELLED')}<button class="btn ghost" type="submit">Cancel whole purchase${p.paymentStatus === 'paid' ? ' & refund wallet' : ''}</button></form>` : ''}
        </div>
      </div>
    `;
  }

  const heading = pending ? 'Complete your checkout.' : (STATUS_FRIENDLY[p.status] || 'Order details');

  const body = `
    <div class="page-heading-row" style="margin-bottom:20px">
      <div class="page-heading">
        <p class="eyebrow rv"><a href="${admin ? `/admin/customers/${encodeURIComponent(p.customerId)}` : "/customer/orders"}" style="text-decoration:none">← ${admin ? "Customer" : "Orders"}</a></p>
        <h1 class="display rv">Checkout <em>#${esc(p.id)}</em></h1>
        <p class="field-hint" style="margin:4px 0 0">${p.status === 'DELIVERED' ? 'All items delivered to your address.' : (pending ? 'Review and pay once for all items.' : 'Items in production & delivery.')}</p>
      </div>
      <div class="rv">${pending ? '<span class="badge b-PAYMENT_PENDING">Awaiting Payment</span>' : storeBadge(p.status)}</div>
    </div>

    <div class="grid c2">
      <section class="card store-receipt rv">
        <h2 style="margin-top:0">In your basket</h2>
        <div class="receipt-list">
          ${printItemsHtml}
          ${stationeryItemsHtml}
        </div>
        ${totals(p)}
      </section>

      <section class="card store-receipt rv">
        <h2 style="margin-top:0">${pending ? 'Delivery & Payment' : 'Delivery & Fulfillment'}</h2>
        
        <div class="pk-addr-summary-box">
          <p class="eyebrow">Deliver to</p>
          <p style="font-weight:700;margin:4px 0">${esc(p.address?.address || '')}${p.address?.pin ? ' · ' + esc(p.address.pin) : ''}</p>
          <p class="field-hint" style="margin:2px 0 8px">${esc(p.slot || '')} · From ${esc(p.fulfillmentName || 'PrintKarr print desk')}</p>
          
          ${pending && !admin ? `
            <details class="order-more" style="margin-top:10px">
              <summary>Change delivery address</summary>
              <form method="POST" action="${path}/address" style="margin-top:10px">
                ${userAddresses.length > 1 ? `
                  <div class="field">
                    <label for="sel_p_addr">Choose saved address</label>
                    <select id="sel_p_addr" name="addressId" onchange="this.form.submit()">
                      ${userAddresses.map(a => `<option value="${esc(a.id)}" ${a.id === p.addressId ? 'selected' : ''}>${esc(a.label || 'Saved')}: ${esc(a.address)} (${esc(a.area)})</option>`).join('')}
                    </select>
                  </div>
                ` : ''}
                <div class="field"><label for="p_na_addr">Or enter new street address</label><input id="p_na_addr" name="nn_address" placeholder="Room/Flat, Building, Street" maxlength="200"></div>
                <div class="grid c2">
                  <div class="field"><label for="p_na_area">Locality</label><select id="p_na_area" name="nn_area"><option value="Sarigam">Sarigam</option><option value="Vapi">Vapi</option><option value="Daman">Daman</option><option value="Bhilad">Bhilad</option></select></div>
                  <div class="field"><label for="p_na_pin">PIN Code</label><input id="p_na_pin" name="nn_pin" pattern="[0-9]{6}" maxlength="6" placeholder="396155"></div>
                </div>
                <button type="submit" class="btn small">Update address</button>
              </form>
            </details>
          ` : ''}
        </div>

        ${pending && !admin ? `
          <div class="pk-checkout-pay-box" style="margin-top:20px">
            <p class="eyebrow">Payment options</p>
            ${options.gateway && !p.preview && p.total > 0 ? `
              <button type="button" class="btn loud big" data-store-gateway="${esc(p.id)}" style="width:100%;margin:12px 0 8px">
                <span>Pay online ${rs(p.total)} · UPI / Cards →</span>
              </button>
              <p role="status" data-payment-error hidden class="login-err"></p>
              <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
            ` : ''}

            ${balance >= p.total ? `
              <form method="POST" action="${path}/wallet" style="margin-top:8px">
                <button class="btn sun big" type="submit" style="width:100%">
                  <span>Pay ${rs(p.total)} with wallet (${rs(balance)} available)</span>
                </button>
              </form>
            ` : `
              <p class="field-hint" style="margin-top:10px">Wallet balance: ${rs(balance)}. <a href="${walletLink}">Top up wallet →</a></p>
            `}

            <div style="margin-top:16px;border-top:1px solid var(--pk-line,#e4e9df);padding-top:14px">
              ${!p.gatewayOrderId ? `
                <form method="POST" action="${path}/cancel" data-confirm="Cancel this checkout?">
                  <button class="btn ghost small" type="submit">Cancel checkout</button>
                </form>
              ` : '<p class="field-hint">An online payment is open. Complete it or contact support before cancelling.</p>'}
            </div>
          </div>
        ` : ''}

        ${!pending && !admin ? `
          <div class="pk-paid-box" style="margin-top:20px">
            <p class="field-hint">Paid via ${esc(p.paymentMethod === 'wallet' ? 'Wallet' : 'Online / UPI')}.</p>
            <div style="display:flex;gap:10px;margin-top:14px;flex-wrap:wrap">
              ${p.printIds[0] ? `<a class="btn loud small" href="/customer/orders/${encodeURIComponent(p.printIds[0])}"><span>Track print progress →</span></a>` : ''}
              ${p.status === 'PAID' && p.paymentMethod === 'wallet' ? `
                <form method="POST" action="${path}/cancel" data-confirm="Cancel this purchase and refund wallet?">
                  <button class="btn ghost small" type="submit"><span>Cancel &amp; refund wallet</span></button>
                </form>
              ` : ''}
              <a class="btn ghost small" href="/contact"><span>Get help with purchase →</span></a>
            </div>
          </div>
        ` : ''}

        ${adminControls}
      </section>
    </div>
  `;

  return layout({
    title: heading,
    user,
    active: `${prefix}/purchases`,
    body: conversion + body,
    extraCss: '/store.css',
    extraHead: `<script src="/store.js?v=${ASSET_V}" defer></script>`
  });
}

export function cataloguePage(user, db, editId) {
  const prefix = '/admin';
  const edit = (db.products || []).find((p) => p.id === editId) || {};
  return layout({ title: 'Stationery catalogue', user, active: prefix + '/catalogue', extraCss: '/store.css', body: `<div class="page-heading-row"><div class="page-heading"><p class="eyebrow">THE SUPPLY DESK</p><h1>Your stationery <em>catalogue.</em></h1><p>Add products, photos, selling prices and available stock. Customers see only active, real products.</p></div><a class="btn" href="/stationery">View storefront →</a></div><div class="grid c2" style="margin-top:24px"><section class="card"><h2>${edit.id ? 'Edit product' : 'Add product'}</h2><form method="POST" action="${prefix}/catalogue" enctype="multipart/form-data">${hidden('id', edit.id || '')}<div class="field"><label for="product-name">Product name</label><input id="product-name" name="name" required maxlength="100" value="${esc(edit.name || '')}"></div><div class="field"><label for="product-category">Category</label><input id="product-category" name="category" required maxlength="40" value="${esc(edit.category || '')}" placeholder="Files, Notebooks, Writing…"></div><div class="field"><label for="product-description">Description</label><textarea id="product-description" name="description" maxlength="500">${esc(edit.description || '')}</textarea></div><div class="grid c2"><div class="field"><label for="product-price">Selling price (₹)</label><input id="product-price" name="price" type="number" min="0.01" max="10000" step="0.01" required value="${esc(edit.price ?? '')}"></div><div class="field"><label for="product-stock">Available units</label><input id="product-stock" name="stock" type="number" min="0" max="100000" step="1" required value="${esc(edit.stock ?? '')}"></div></div><div class="field"><label for="product-photo">Product photo</label><input id="product-photo" name="photo" type="file" accept="image/png,image/jpeg,.png,.jpg,.jpeg" aria-describedby="photo-hint"><small class="field-hint" id="photo-hint">Choose a PNG or JPG from your phone or computer, up to 5 MB. Leave empty to keep the current photo.</small>${edit.image ? `<img class="catalogue-photo" src="${esc(edit.image)}" alt="Current photo of ${esc(edit.name)}" width="160" height="160">` : ''}</div><div class="field"><label for="product-colors">File colours (optional, comma separated)</label><input id="product-colors" name="colors" value="${esc((edit.colors || []).join(', '))}" placeholder="orange, green, red, yellow"><small class="field-hint">Stock is shared across colours. Leave blank for products without colour choices.</small></div><label class="pick"><input type="checkbox" name="active" ${edit.active !== false ? 'checked' : ''}> Visible in shop</label><label class="pick"><input type="checkbox" name="demo" ${edit.demo ? 'checked' : ''}> Sample / draft only · hidden from customers</label><button class="btn loud" type="submit">Save product</button>${edit.id ? `<a class="rowlink" href="${prefix}/catalogue">Add a different product →</a>` : ''}</form></section><section><h2>Your catalogue</h2>${(db.products || []).filter(p=>!p.shopId).map((p) => `<a class="purchase-row" href="${prefix}/catalogue?edit=${esc(p.id)}"><span><strong>${esc(p.name)}</strong><small>${p.active && !p.demo ? 'Visible' : 'Hidden'}${p.demo ? ' · Sample' : ''} · ${availableStock(db, p.id)} available / ${p.stock} total units</small></span><b>${rs(p.price)}</b></a>`).join('') || '<p class="store-demo-note">No real products yet. Add your first item here; the customer storefront stays empty until you publish it.</p>'}</section></div>` });
}

export function storeError(user, message, back = '/cart') {
  return publicShell('Please check your cart', `<section class="store-wrap empty-cart"><p class="eyebrow">ONE QUICK CHECK</p><h1>Let’s get this <em>right.</em></h1><p role="alert">${esc(message)}</p><a class="btn loud big" href="${esc(back)}">Go back →</a></section>`, '/cart');
}
