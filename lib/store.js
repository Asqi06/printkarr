import crypto from 'node:crypto';
import { printPricing, processingFee, COD_FEE } from '../public/print-pricing.js';
import { deliveryFeeFor, addressPoint, HUBS, surchargeFees, activePrintJobs } from './pricing.js';
import { deliveryPlan, deliveryChoice, validateDestination, batchPrice, debitWallet, refundWallet, campaignConfig } from './campus.js';
import { transition, canTransition } from './machine.js';
import { leftOf, usableOf, deductSides, ensurePackSubs } from './packs.js';
import { printSides, packCovers } from '../public/print-plan.js';
import { fulfillmentFor, assignPurchase } from './partners.js';

export const FREE_DELIVERY = 149;
export const money = (n) => Math.round(n * 100) / 100;
export const DEMO_PRODUCTS = [
  ['demo-file', 'Cardboard file', 'Files', 25, 'Keep assignments together.', ['orange', 'green', 'red', 'yellow']],
  ['demo-notebook', 'Everyday notebook', 'Notebooks', 59, 'A place for the next good idea.', []],
  ['demo-pencil', 'Writing pencils · set of 3', 'Writing', 24, 'For sketches, notes and working things out.', []],
  ['demo-pen', 'Blue ballpoint pen', 'Writing', 12, 'An everyday desk essential.', []],
  ['demo-eraser', 'Soft eraser', 'Desk essentials', 10, 'A little room for a fresh start.', []],
  ['demo-ruler', 'Desk ruler', 'Desk essentials', 29, 'Keep the small details in line.', []]
].map(([id, name, category, price, description, colors]) => ({ id, name, category, price, description, colors, stock: 99, active: true, demo: true, image: '' }));

export const catalogue = (db) => (db.products || []).filter(p => !p.demo);
export const openPurchase = (p) => p.status === 'CREATED';
export const printNet = (o) => Math.max(0, money(o.subtotal - (o.packDiscount || 0) - (o.firstPrintDiscount || 0) - (o.couponDiscount || 0) - (o.referralDiscount || 0)));

export function cartFor(db, customerId, token) {
  db.carts ||= [];
  const guest = db.carts.find((c) => c.id === token && !c.customerId && !c.purchaseId);
  let cart = customerId && db.carts.find((c) => c.customerId === customerId);
  if (guest && customerId) {
    if (cart?.purchaseId) throw new Error('You have an open checkout. Finish it in Purchase history before merging this guest cart.');
    if (!cart) { guest.customerId = customerId; cart = guest; }
    else if (!cart.purchaseId) {
      for (const line of guest.lines) {
        const existing = cart.lines.find((l) => l.productId === line.productId && l.color === line.color);
        if (existing) existing.quantity = Math.min(50, existing.quantity + line.quantity);
        else cart.lines.push(line);
      }
      db.carts.splice(db.carts.indexOf(guest), 1);
    }
  }
  cart ||= guest;
  if (!cart) { cart = { id: crypto.randomUUID(), customerId: customerId || null, lines: [], printIds: [] }; db.carts.push(cart); }
  if (!cart.purchaseId) {
    const samples = new Set((db.products || []).filter(p=>p.demo).map(p=>p.id));
    cart.lines = cart.lines.filter(l=>!samples.has(l.productId));
  }
  return cart;
}

export function addPrint(db, customerId, orderId) {
  const order = db.orders.find((o) => o.id === orderId && o.customerId === customerId);
  if (!order || !['CREATED', 'PAYMENT_PENDING'].includes(order.status)) throw new Error('Only your unpaid prints can be added.');
  const cart = cartFor(db, customerId);
  if (cart.purchaseId) throw new Error('Finish or cancel the current checkout before adding another print.');
  if (!cart.printIds.includes(order.id)) cart.printIds.push(order.id);
  return cart;
}

export function availableStock(db, productId, exceptId) {
  const product = (db.products || []).find((p) => p.id === productId);
  // ponytail: reservations scan open purchases; index SKU holds when the catalogue grows.
  const held = (db.purchases || []).filter((p) => openPurchase(p) && p.id !== exceptId)
    .flatMap((p) => p.items).filter((i) => i.productId === productId).reduce((sum, i) => sum + i.quantity, 0);
  return Math.max(0, (product?.stock || 0) - held);
}

export function setQuantity(db, cart, productId, color, input, add = false) {
  if (cart.purchaseId) throw new Error('Finish or cancel the current checkout before changing your cart.');
  const quantity = Number(input), product = catalogue(db).find((p) => p.id === productId && p.active);
  if (!product || !Number.isInteger(quantity) || quantity < 0 || quantity > 50) throw new Error('Choose an available product and a quantity from 1 to 50.');
  color = String(color || '');
  if ((product.colors.length && !product.colors.includes(color)) || (!product.colors.length && color)) throw new Error('Choose an available file colour.');
  const line = cart.lines.find((l) => l.productId === productId && l.color === color);
  const next = add ? (line?.quantity || 0) + quantity : quantity;
  const others = cart.lines.filter((l) => l.productId === productId && l !== line).reduce((sum, l) => sum + l.quantity, 0);
  if (next > 50 || next + others > availableStock(db, productId)) throw new Error('That quantity is currently unavailable. Please choose fewer.');
  if (next === 0) cart.lines = cart.lines.filter((l) => l !== line);
  else if (line) line.quantity = next;
  else cart.lines.push({ productId, color, quantity: next });
}

export function cartItems(db, cart, customerId) {
  const products = catalogue(db);
  const items = cart.lines.map((l) => {
    const p = products.find((p) => p.id === l.productId && p.active);
    if (!p || !Number.isInteger(l.quantity) || l.quantity < 1 || l.quantity > 50 || (p.colors.length ? !p.colors.includes(l.color) : !!l.color)) throw new Error('A cart item is no longer available. Remove it before continuing.');
    if (p.shopId && !(db.partners || []).some(s=>s.id===p.shopId && s.active && s.stationery)) throw new Error('This stationery shop is unavailable. Remove its items or try again later.');
    return { ...l, shopId: p.shopId || null, name: p.name, price: p.price, total: money(p.price * l.quantity), demo: p.demo, image: p.image };
  });
  const prints = cart.printIds.map((id) => {
    const o = db.orders.find((o) => o.id === id && o.customerId === customerId && ['CREATED', 'PAYMENT_PENDING'].includes(o.status));
    if (!o) throw new Error('A print in your cart has changed. Remove it before continuing.');
    return o;
  });
  const basketSides = prints.reduce((sum,o)=>sum+printSides(o).bw+printSides(o).color,0);
  for (const o of prints.filter(o=>o.pricingVersion===1 && !o.purchaseId && !cart.purchaseId)) {
    const priced=printPricing(printSides(o),db.pricing,!!db.users.find(u=>u.id===customerId)?.student,basketSides);
    Object.assign(o,priced);
    if(o.packSubId)o.packDiscount=priced.subtotal;
    o.firstPrintDiscount=Math.min(o.firstPrintDiscount || 0,priced.subtotal);
    o.couponDiscount=Math.min(o.couponDiscount || 0,Math.max(0,printNet({...o,couponDiscount:0})));
  }
  return { items, prints, subtotal: money(items.reduce((s, i) => s + i.total, 0) + prints.reduce((s, o) => s + printNet(o), 0)) };
}

export function checkPackQuota(db, prints) {
  ensurePackSubs(db);
  for (const order of prints.filter((o) => o.packSubId)) {
    const sub = (db.packSubs || []).find((s) => s.id === order.packSubId && s.customerId === order.customerId);
    const pending = db.orders.filter((o) => o.packSubId === order.packSubId && (['CREATED', 'PAYMENT_PENDING'].includes(o.status) || prints.some((p) => p.id === o.id)));
    const needed = pending.reduce((sum, o) => { const n = printSides(o); return { bw: sum.bw + n.bw, color: sum.color + n.color }; }, { bw: 0, color: 0 });
    if (!sub || !usableOf(sub) || !packCovers(leftOf(sub), needed)) throw new Error('The semester pack cannot cover all pending prints. Cancel another unpaid print or recreate this print without the pack.');
  }
}

export function cartQuote(db, cart, customerId, { addressId, deliverySlot, institutionName, shopId, coupon = '', ...contact }, validateCoupon, at = Date.now()) {
  const { items, prints, subtotal } = cartItems(db, cart, customerId);
  const first = prints[0];
  addressId ||= first?.addressId || db.addresses.find(a => a.customerId === customerId && a.isDefault)?.id || db.addresses.find(a => a.customerId === customerId && !a.campusId)?.id;
  deliverySlot ||= deliveryChoice(first || {});
  if (!items.length && !prints.length) throw new Error('Your cart is empty.');
  for (const i of items) {
    const need = items.filter((x) => x.productId === i.productId).reduce((s, x) => s + x.quantity, 0);
    if (need > availableStock(db, i.productId)) throw new Error(`${i.name} no longer has enough stock. Update your cart.`);
  }
  checkPackQuota(db, prints);
  for (const o of prints) if (o.couponCode && !validateCoupon(db, o.couponCode, o.subtotal, customerId, o.id).ok) throw new Error('A print coupon has already been used. Remove and recreate that unpaid print.');
  let couponDiscount = 0, couponCode = null, influencer = null;
  if (String(coupon).trim()) {
    if (prints.some((o) => o.couponCode || o.couponDiscount > 0)) throw new Error('A print already has a coupon. Remove the cart coupon to continue.');
    const result = validateCoupon(db, coupon, subtotal, customerId);
    if (!result.ok) throw new Error(result.error);
    couponDiscount = Math.min(subtotal, result.discount); couponCode = result.code; influencer = result.influencer || null;
  }
  const net = money(subtotal - couponDiscount);
  const plan = deliveryPlan(db, deliverySlot, null, at);
  plan.preferredShopId = shopId || first?.preferredShopId || null;
  let address = db.addresses.find((a) => a.id === addressId && a.customerId === customerId);
  if (addressId === '__new') {
    const area = String(contact.nn_area || '').toLowerCase(), point = addressPoint(area, contact);
    if (!point || !HUBS[area] || !/^[1-9]\d{5}$/.test(String(contact.nn_pin || '')) || !String(contact.nn_address || '').trim() || String(contact.nn_address).length > 200) throw new Error('Add your street address, area, six-digit PIN and locality.');
    address = { customerId, name: db.users.find(u=>u.id===customerId)?.name, address: String(contact.nn_address).trim(), area, pin: String(contact.nn_pin), phone: String(contact.nn_phone || '').trim(), ...point };
  }
  if (plan.campusId) address = { name: plan.campus, address: plan.campusAddress, pin: plan.campusPin, area: plan.campusZone, lat: plan.campusPoint.lat, lng: plan.campusPoint.lng };
  if (plan.deliveryMode === 'pickup') address = { address: plan.pickupAddress, area: 'pickup' };
  if (!address || !String(address.address || '').trim() || plan.deliveryMode !== 'pickup' && !String(address.phone || db.users.find((u) => u.id === customerId)?.phone || '').replace(/\D/g, '').match(/^(?:91)?[6-9]\d{9}$/)) throw new Error('Add a delivery address and a valid Indian mobile number.');
  // Validate coverage before applying the threshold: a large basket cannot unlock an unavailable route.
  const zone = String(address.area).toLowerCase(), point = zone === 'pickup' ? null : addressPoint(zone, {}, address);
  validateDestination(plan, institutionName || address.institutionName || first?.institutionName);
  Object.assign(plan, fulfillmentFor(db, point, { ...plan, zone }, prints, items));
  const printedSides=prints.reduce((sum,o)=>{const n=printSides(o);return sum+n.bw+n.color;},0);
  plan.printedSides=printedSides;
  const processFee=processingFee(printedSides);
  const delivery = deliveryFeeFor(db.pricing, zone, point, plan);
  const batch = batchPrice(db, customerId, plan, 0, delivery.fee, at); // Existing first/member benefits; replaces the old ₹99 basket rule.
  const existingFree = prints.some((o) => o.firstBatchFree && o.campusId === plan.campusId && o.deliveryMode === plan.deliveryMode);
  const firstDiscount = prints.some((o) => o.firstDeliveryDiscount > 0 && o.deliveryZone === delivery.zone && o.deliveryMode === plan.deliveryMode);
  const deliveryFee = !plan.institutionDelivery && plan.deliveryMode === 'scheduled' && net >= FREE_DELIVERY || existingFree || firstDiscount ? 0 : batch.fee;
  const extra = surchargeFees(db.pricing, activePrintJobs(db), new Date(at));
  const lateNightFee = zone === 'pickup' || plan.campusId === 'lit' || plan.institutionDelivery || plan.deliveryMode === 'scheduled' ? 0 : extra.lateNightFee;
  const surgeFee = prints.length ? extra.surgeFee : 0;
  const total = money(net + processFee + deliveryFee + lateNightFee + surgeFee);
  if (total < (db.settings.order.minTotal || 0)) throw new Error(`Minimum order is ₹${db.settings.order.minTotal}.`);
  return { items, printIds: prints.map((o) => o.id), printedSides, processingFee:processFee, bulkDiscount:money(prints.reduce((sum,o)=>sum+(o.bulkDiscount || 0),0)), subtotal, couponCode, couponDiscount, influencer, net, deliveryFee, lateNightFee, surgeFee, total, address: { ...address, ...point }, addressId: address.id || null, deliverySlot, ...plan, slot: plan.deliveryMode === 'express' && !plan.campusId && !plan.institutionDelivery ? `Address delivery · ${delivery.zone === 'daman' ? 'Daman' : 'Vapi'}` : plan.slot, firstBatchFree: existingFree || batch.firstBatchFree, bonusValidityDays: campaignConfig(db).bonusValidityDays, deliveryZone: delivery.zone, deliveryKm: delivery.km, distanceEstimated: !!delivery.distanceEstimated };
}

export function createPurchase(db, cart, customerId, selection, validateCoupon, preview = false) {
  if (cart.purchaseId) return db.purchases.find((p) => p.id === cart.purchaseId && p.customerId === customerId);
  const quote = cartQuote(db, cart, customerId, selection, validateCoupon);
  if (quote.items.some((i) => i.demo) && !preview) throw new Error('Demo products cannot be purchased. Remove them to pay for prints, or wait for the real catalogue.');
  if (!quote.addressId && quote.deliveryMode !== 'pickup') {
    quote.address.id = crypto.randomUUID(); quote.address.institutionName = quote.institutionName || null; quote.address.isDefault = !db.addresses.some(a => a.customerId === customerId && a.isDefault);
    quote.addressId = quote.address.id; db.addresses.push({ ...quote.address });
  }
  db.purchases ||= [];
  // ponytail: unpaid stock holds last until explicit cancellation; add gateway-aware expiry/webhook reconciliation before high-volume sales.
  const purchase = { ...quote, id: `SHOP-${crypto.randomUUID()}`, customerId, status: 'CREATED', paymentStatus: 'pending', createdAt: new Date().toISOString(), history: [], preview };
  db.purchases.push(purchase); cart.purchaseId = purchase.id;
  return purchase;
}

export function checkPurchase(db, purchase, validateCoupon) {
  const plan = { ...deliveryPlan(db, purchase), fulfillmentPoint: purchase.fulfillmentPoint, fulfillmentRadiusKm: purchase.fulfillmentRadiusKm };
  if (purchase.fulfillmentId && !(db.partners || []).some(s => s.id === purchase.fulfillmentId && s.active)) throw new Error('This shop is unavailable. Cancel the unpaid checkout and choose a new delivery.');
  deliveryFeeFor(db.pricing, purchase.deliveryZone, { lat: purchase.address.lat, lng: purchase.address.lng }, plan);
  const prints = purchase.printIds.map((id) => db.orders.find((o) => o.id === id && o.customerId === purchase.customerId));
  if (prints.some((o) => !o || !['CREATED', 'PAYMENT_PENDING'].includes(o.status))) throw new Error('A print has changed. Contact support before retrying payment.');
  checkPackQuota(db, prints);
  // validateCoupon accepts the reserving purchase when passed as the final argument.
  if (purchase.couponCode && !validateCoupon(db, purchase.couponCode, purchase.subtotal, purchase.customerId, purchase.id).ok) throw new Error('This coupon has already been used. Cancel this checkout and try without it.');
  for (const o of prints) if (o.couponCode && !validateCoupon(db, o.couponCode, o.subtotal, o.customerId, o.id).ok) throw new Error('A print coupon has already been used. Cancel this checkout.');
  for (const item of purchase.items) {
    const product = catalogue(db).find(p => p.id === item.productId && p.active);
    if (!product || (product.shopId || null) !== (purchase.fulfillmentId || null) || availableStock(db, item.productId, purchase.id) < purchase.items.filter((i) => i.productId === item.productId).reduce((s, i) => s + i.quantity, 0)) throw new Error('Reserved stock is unavailable. Contact support.');
  }
  return prints;
}

export function confirmPurchase(db, purchase, method, paymentId, validateCoupon) {
  if (!openPurchase(purchase)) return false; // Payment callbacks/reloads are idempotent.
  if (!['wallet','razorpay','cod'].includes(method)) throw new Error('Choose an available payment method.');
  if (method !== 'razorpay' && (purchase.gatewayOrderId || purchase.gatewayCreating)) throw new Error('An online payment is open. Contact support before changing payment method.');
  const prints = checkPurchase(db, purchase, validateCoupon);
  if(method==='cod') { purchase.codFee=COD_FEE;purchase.total=money(purchase.total+COD_FEE);purchase.codConfirmedAt=new Date().toISOString(); }

  if (method === 'wallet') purchase.walletDebitId = debitWallet(db, purchase.customerId, purchase.total, `Basket ${purchase.id}`);
  for (const item of purchase.items) catalogue(db).find((p) => p.id === item.productId).stock -= item.quantity;
  // Allocate rounded discounts from the remaining value, so the line totals always reconcile to the paid basket.
  let discountLeft = purchase.couponDiscount, valueLeft = purchase.subtotal;
  const shares = [...prints.map(printNet), ...purchase.items.map((i) => i.total)].map((value) => {
    const share = valueLeft ? Math.min(value, money(discountLeft * value / valueLeft)) : 0;
    discountLeft = money(discountLeft - share); valueLeft = money(valueLeft - value);
    return share;
  });
  purchase.items.forEach((item, i) => { item.cartDiscount = shares[prints.length + i]; });
  prints.forEach((order, i) => {
    const share = shares[i];
    const itemTotal = Math.max(0, money(printNet(order) - share));
    const address = purchase.addressId ? db.addresses.find((a) => a.id === purchase.addressId) : { ...purchase.address, id: crypto.randomUUID(), customerId: purchase.customerId };
    if (!purchase.addressId && !db.addresses.some((a) => a.id === address.id)) { db.addresses.push(address); purchase.addressId = address.id; }
    Object.assign(order, { purchaseId: purchase.id, addressId: purchase.addressId, fulfillmentId: purchase.fulfillmentId || null, institutionDelivery: !!purchase.institutionDelivery, institutionName: purchase.institutionName || null, campusId: purchase.campusId || null, campus: purchase.campus || null, deliveryMode: purchase.deliveryMode, slotId: purchase.slotId || null, slot: purchase.slot, promisedBy: purchase.promisedBy || null, deliveryStartAt: purchase.deliveryStartAt || null, deliveryCutoffAt: purchase.deliveryCutoffAt || null, bonusValidityDays: purchase.bonusValidityDays, deliveryZone: purchase.deliveryZone, deliveryKm: purchase.deliveryKm, firstBatchFree: i === 0 && purchase.firstBatchFree, lateCredit: i === 0 ? purchase.lateCredit || 0 : 0, total: money(itemTotal + (i ? 0 : purchase.deliveryFee + (purchase.processingFee || 0) + (purchase.codFee || 0) + purchase.lateNightFee + purchase.surgeFee)), cartDiscount: share, deliveryFee: i ? 0 : purchase.deliveryFee, lateNightFee: i ? 0 : purchase.lateNightFee, surgeFee: i ? 0 : purchase.surgeFee, firstDeliveryDiscount: 0, processingFee:i ? 0 : purchase.processingFee || 0,codFee:i ? 0 : purchase.codFee || 0,codConfirmedAt:purchase.codConfirmedAt || null,paymentStatus: method==='cod' ? 'cod_pending' : 'paid', paymentMethod: method, paymentId });
    if (order.status === 'CREATED') transition(order, 'PAYMENT_PENDING', { by: purchase.customerId });
    transition(order, 'CONFIRMED', { by: purchase.customerId, note: `Shared basket ${purchase.id}` });
    transition(order, 'PRINT_QUEUE', { by: 'system', note: method==='cod' ? 'Cash on delivery confirmed' : 'Shared basket paid' });
    if (order.packSubId) deductSides(db.packSubs.find((s) => s.id === order.packSubId), order.printType, printSides(order));
  });
  purchase.paymentStatus = method==='cod' ? 'cod_pending' : 'paid'; purchase.paymentMethod = method; purchase.paymentId = paymentId || null;
  purchase.status = 'PAID'; purchase.confirmedAt = new Date().toISOString();
  if(method!=='cod')purchase.paidAt=purchase.confirmedAt;
  purchase.history.push({ to: method==='cod' ? 'COD_CONFIRMED' : 'PAID', at: purchase.confirmedAt, by: purchase.customerId });
  if (purchase.fulfillmentId) assignPurchase(db, purchase, purchase.fulfillmentId, 'system');
  const cart = db.carts.find((c) => c.purchaseId === purchase.id);
  if (cart) { cart.lines = []; cart.printIds = []; cart.purchaseId = null; }
  return true;
}

export function collectCash(db,p,actorId,amount) {
  if(p.paymentMethod!=='cod' || p.paymentStatus==='paid')return false;
  if(p.paymentStatus!=='cod_pending' || !(p.status==='OUT_FOR_DELIVERY' || p.status==='READY' && p.deliveryMode==='pickup') || !String(amount ?? '').trim() || !Number.isFinite(Number(amount)) || money(Number(amount))!==p.total) throw new Error(`Confirm exactly ₹${p.total} cash collected before marking delivered.`);
  p.paymentStatus='paid';p.paidAt=new Date().toISOString();p.cashCollectedBy=actorId;p.cashCollectedAt=p.paidAt;p.cashReceived=p.total;
  for(const id of p.printIds) { const o=db.orders.find(o=>o.id===id);o.paymentStatus='paid';o.cashCollectedAt=p.paidAt; }
  p.history.push({to:'CASH_COLLECTED',at:p.paidAt,by:actorId});return true;
}

export function cancelPurchase(db, p, actorId, restorePackQuota, voidPendingForOrder) {
  if (['CANCELLED', 'REFUNDED'].includes(p.status)) return;
  if (p.gatewayOrderId || p.gatewayCreating || p.status !== 'CREATED' && (p.status !== 'PAID' || !['wallet','cod'].includes(p.paymentMethod))) throw new Error('Contact support for an online payment refund or an order already being fulfilled.');
  const prints = p.printIds.map((id) => db.orders.find((o) => o.id === id && o.customerId === p.customerId));
  if (prints.some((o) => !o || !canTransition(o.status, 'CANCELLED'))) throw new Error('Printing or delivery has started. Contact support to cancel.');
  const paid = p.paymentStatus === 'paid';
  const committed = paid || p.paymentStatus==='cod_pending';
  if (paid) {
    refundWallet(db, p.customerId, p.walletDebitId, p.total, `Refund basket ${p.id}`);
  }
  if(committed) {
    for (const i of p.items) { const product = catalogue(db).find((x) => x.id === i.productId); if (product) product.stock += i.quantity; }
  }
  for (const o of prints) {
    transition(o, 'CANCELLED', { by: actorId });
    if (committed) restorePackQuota(db, o);
    voidPendingForOrder(db, o.id); o.paymentStatus = paid ? 'refunded' : 'pending';
  }
  p.status = paid ? 'REFUNDED' : 'CANCELLED'; p.paymentStatus = paid ? 'refunded' : 'pending';
  p.history.push({ to: p.status, at: new Date().toISOString(), by: actorId });
  const cart = db.carts.find((c) => c.purchaseId === p.id);
  if (cart) { cart.purchaseId = null; cart.printIds = []; }
}

export function saveProduct(db, input) {
  const name = String(input.name || '').trim(), category = String(input.category || '').trim(), price = Number(input.price), stock = Number(input.stock);
  const description = String(input.description || '').trim(), image = String(input.image || '').trim(), colors = String(input.colors || '').split(',').map((c) => c.trim().toLowerCase()).filter(Boolean);
  if (!name || name.length > 100 || !category || category.length > 40 || description.length > 500 || !Number.isFinite(price) || price < 0.01 || price > 10000 || !Number.isInteger(stock) || stock < 0 || stock > 100000) throw new Error('Check the name, category, price (₹0.01–10,000) and whole-number stock.');
  if (image && !(/^\/product-images\/store-[a-f0-9-]{36}\.(png|jpg)$/.test(image) || image.startsWith('/images/') && !image.includes('..') && !image.includes('\\') || /^https:\/\//.test(image))) throw new Error('Use a local /images/ path or an HTTPS product photo.');
  if (colors.some((c) => !['orange', 'green', 'red', 'yellow'].includes(c))) throw new Error('File colours can be orange, green, red or yellow.');
  db.products ||= [];
  const existing = db.products.find((p) => p.id === input.id);
  const shopId = Object.hasOwn(input, 'shopId') ? input.shopId || null : existing?.shopId || null;
  if (shopId && !(db.partners || []).some(s=>s.id===shopId)) throw new Error('Choose a valid stationery shop.');
  if (existing && (existing.shopId || null) !== shopId && existing.stock !== availableStock(db, existing.id)) throw new Error('Wait until reserved orders finish before moving a product to another shop.');
  if (existing && stock < existing.stock - availableStock(db, existing.id)) throw new Error('Stock cannot be reduced below units reserved in open checkouts.');
  const product = { id: existing?.id || crypto.randomUUID(), shopId, name, category, price: money(price), stock, description, image, colors: [...new Set(colors)], active: input.active === 'on', demo: input.demo === 'on' };
  if (existing) Object.assign(existing, product); else db.products.push(product);
  return product;
}
