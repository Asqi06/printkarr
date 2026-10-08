import crypto from 'node:crypto';
import { deliveryPoint, HUBS, kmBetween } from './pricing.js';
import { transition, canFulfil } from './machine.js';

export function fulfillmentFor(db, point, plan, prints = [], items = []) {
  const zone = plan.scheduledZone || plan.zone || 'vapi';
  const shops = new Set([...items.map(i=>i.shopId), ...prints.map(p=>p.preferredShopId), plan.preferredShopId].filter(Boolean));
  if (shops.size > 1) throw new Error('Choose prints and stationery from one shop per order. Place a separate order for another shop.');
  const preferred = [...shops][0];
  if (items.some(i => !i.shopId) && preferred) throw new Error('PrintKarr stock and another shop’s items need separate orders.');
  const candidates = (db.partners || []).filter(s => s.active && s.zone === zone
    && (!items.length || s.stationery)
    && (!prints.some(p => p.colorPages > 0 || p.printType !== 'bw') || s.color)
    && (!prints.some(p => p.binding && p.binding !== 'none') || s.binding)
    && (plan.deliveryMode !== 'batch' && plan.deliveryMode !== 'scheduled' || s.batch));
  const shop = !items.some(i => !i.shopId) && candidates.filter(s => (!preferred || s.id === preferred) && kmBetween(s, point) * 1.25 <= s.radiusKm).sort((a, b) => kmBetween(a, point) - kmBetween(b, point))[0];
  if (preferred && !shop) throw new Error('Your chosen shop cannot fulfil this order at the selected location and time. Choose another shop or delivery option.');
  const out = shop ? { fulfillmentId: shop.id, fulfillmentName: shop.name, fulfillmentPoint: { lat: shop.lat, lng: shop.lng }, fulfillmentRadiusKm: shop.radiusKm } : { fulfillmentId: null, fulfillmentName: 'PrintKarr print desk', fulfillmentPoint: HUBS[zone], fulfillmentRadiusKm: 20 };
  if (plan.deliveryStartAt) {
    const active = (db.purchases || []).filter(p => !['CANCELLED','REFUNDED','DELIVERED'].includes(p.status) && p.deliveryStartAt === plan.deliveryStartAt && (p.fulfillmentId || null) === out.fulfillmentId);
    if (active.length >= (shop?.batchCapacity || 30)) throw new Error('This delivery window is full. Choose another window or express.');
  }
  return out;
}

export function savePartner(db, input) {
  const name = String(input.name || '').trim(), address = String(input.address || '').trim();
  const point = deliveryPoint(input.lat, input.lng), radiusKm = Number(input.radiusKm), rate = Number(input.bwRate), colorRate = Number(input.colorRate), batchCapacity = Number(input.batchCapacity);
  if (name.length < 2 || name.length > 100 || !address || address.length > 200 || !point || !Object.keys(HUBS).includes(input.zone) || !Number.isFinite(radiusKm) || radiusKm <= 0 || radiusKm > 20 || !Number.isInteger(batchCapacity) || batchCapacity < 1 || batchCapacity > 200 || !Number.isFinite(rate) || rate < 0 || rate > 100 || !Number.isFinite(colorRate) || colorRate < 0 || colorRate > 100) throw new Error('Add valid shop details, coordinates, radius, capacity and per-side settlement rates.');
  const staff = db.users.find(u => u.id === input.staffId && u.role === 'partner');
  if (!staff) throw new Error('Create a partner staff account, then choose it for this shop.');
  if (input.id && !(db.partners || []).some(s => s.id === input.id)) throw new Error('Shop not found.');
  if ((db.partners || []).some(s => s.id !== input.id && s.staffId === staff.id)) throw new Error('This staff account is already assigned to a shop.');
  const shop = { id: input.id || crypto.randomUUID(), name, address, ...point, zone: input.zone, radiusKm, batchCapacity, bwRate: rate, colorRate, staffId: staff.id, active: input.active === 'on', color: input.color === 'on', binding: input.binding === 'on', stationery: input.stationery === 'on', batch: input.batch === 'on' };
  db.partners ||= [];
  const previous = db.partners.find(s => s.id === shop.id);
  if (previous) Object.assign(previous, shop); else db.partners.push(shop);
  return shop;
}

export function assignPurchase(db, purchase, shopId, by) {
  if (!['PAID','READY'].includes(purchase.status) || !canFulfil(purchase)) throw new Error('Assign a paid, undelivered order.');
  const shop = (db.partners || []).find(s => s.id === shopId && s.active);
  if (shopId && !shop) throw new Error('Choose an active shop.');
  if (purchase.items.some(i => (i.shopId || null) !== (shop?.id || null))) throw new Error('Stationery must be fulfilled by the shop that owns its stock.');
  const prints = purchase.printIds.map(id => db.orders.find(o => o.id === id));
  if (prints.some(o => !o || !['PRINT_QUEUE','PRINT_FAILED'].includes(o.status)) || purchase.status !== 'PAID') throw new Error('Reassign before printing starts. Contact the shop for jobs already printing.');
  if (shop && (purchase.items.length && !shop.stationery || prints.some(o => (o.colorPages > 0 || o.printType !== 'bw') && !shop.color || o.binding !== 'none' && o.binding && !shop.binding))) throw new Error('Shop cannot fulfil all printing and stationery in this order.');
  if (shop && kmBetween(shop, purchase.address) * 1.25 > shop.radiusKm) throw new Error('Address is outside this shop’s delivery radius.');
  if (shop && ['batch','scheduled'].includes(purchase.deliveryMode) && !shop.batch) throw new Error('This shop does not support batch delivery.');
  purchase.fulfillmentId = shop?.id || null;
  purchase.fulfillmentName = shop?.name || 'PrintKarr print desk';
  purchase.partnerState = shop ? 'ASSIGNED' : null;
  purchase.partnerSettlement = shop ? Math.round((prints.reduce((sum, p) => sum + ((p.bwPages ?? (p.printType === 'bw' ? p.pages : 0)) * shop.bwRate + (p.colorPages ?? (p.printType === 'color' ? p.pages : 0)) * shop.colorRate) * p.copies, 0) + purchase.items.reduce((sum, i) => sum + i.total - (i.cartDiscount || 0), 0)) * 100) / 100 : 0;
  delete purchase.partnerRejectReason;
  for (const order of prints) { order.fulfillmentId = purchase.fulfillmentId; if (order.status === 'PRINT_FAILED') transition(order,'PRINT_QUEUE',{by,note:'Reassigned for reprint'}); }
  purchase.history.push({ to: 'SHOP_ASSIGNED', by, at: new Date().toISOString(), note: purchase.fulfillmentName });
}

export function handoverPurchase(db, p, riderId, by) {
  if (p.status !== 'READY' || !db.users.some(u => u.id === riderId && u.role === 'rider')) throw new Error('Mark all items ready and choose a rider before handover.');
  if (p.riderId && p.riderId !== riderId) throw new Error('This order is assigned to another rider.');
  if (p.handedOverAt) return p;
  p.riderId = riderId;
  p.handedOverAt = new Date().toISOString();
  p.handedOverBy = by;
  return p;
}
