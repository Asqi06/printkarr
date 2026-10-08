// Shared pricing — reads live config (admin-editable in Phase 4, §34).
// Print and address-delivery rates come from db.pricing; LIT has a fixed campus tariff.
import { LOCALITIES, kmBetween, distanceFee } from '../public/localities.js';
export { kmBetween };
import { loadDb } from './db.js';
import { pageRange, printSides } from '../public/print-plan.js';
import { printPricing, processingFee, collegeDeliveryFee } from '../public/print-pricing.js';

export function rateFor(printType, student, pricing) {
  const p = pricing || loadDb().pricing;
  if (printType === 'color') return student ? p.studentColor : p.color;
  return student ? p.studentBw : p.bw;
}

// Effective page count from a range string like "1-12, 15-20".
// Returns { pages, valid, error }. Empty range = whole document.
export function rangePages(range, totalPages) {
  try { return { pages: pageRange(range, totalPages).length, valid: true }; }
  catch (error) { return { pages: 0, valid: false, error: error.message }; }
}

export function activePrintJobs(db) {
  return db.orders.filter((o) => ['PRINT_QUEUE', 'PRINTING'].includes(o.status)).length;
}

export function surchargeFees(pricing, activeJobs = 0, at = new Date()) {
  const { lateNight = {}, surge = {} } = pricing.surcharges || {};
  const mins = (time) => {
    const match = String(time || '').match(/^(\d{2}):(\d{2})$/);
    return match ? Number(match[1]) * 60 + Number(match[2]) : null;
  };
  const start = mins(lateNight.start), end = mins(lateNight.end);
  const ist = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(at);
  const [hour, minute] = ist.split(':').map(Number);
  const now = hour * 60 + minute;
  const night = start != null && end != null && start !== end && (start < end ? now >= start && now < end : now >= start || now < end);
  const threshold = Number(surge.activeJobs) || 0;
  return {
    lateNightFee: night ? Number(lateNight.fee) || 0 : 0,
    surgeFee: threshold > 0 && activeJobs >= threshold ? Number(surge.fee) || 0 : 0
  };
}

export const HUBS = {
  vapi: { lat: 20.389722, lng: 72.889945 }, // Chala, Vapi 396191
  daman: { lat: 20.398424, lng: 72.89082 }, // Dabhel Check Post
  sarigam: { lat: 20.27801, lng: 72.84171 },
  bhilad: { lat: 20.258333, lng: 72.883333 }
};

export function deliveryPoint(lat, lng) {
  const a = Number(lat), b = Number(lng);
  return Number.isFinite(a) && Number.isFinite(b) && a >= 20.1 && a <= 20.55 && b >= 72.7 && b <= 73.1
    ? { lat: a, lng: b } : null;
}

// Exact device coordinates take precedence; locality centres are explicitly approximate.
export function addressPoint(zone, input = {}, saved = {}) {
  const localityId = input.localityId || saved.localityId || null;
  const locality = LOCALITIES.find(l => l.id === localityId && l.zone === zone);
  if (localityId && !locality) throw new Error('Choose a locality in your delivery area.');
  const lat = input.deliveryLat, lng = input.deliveryLng;
  if (lat || lng) {
    const point = deliveryPoint(lat, lng);
    if (!point) throw new Error('Location unavailable. Choose your locality instead.');
    return { ...point, localityId, locationAccuracy: 'device' };
  }
  const point = deliveryPoint(saved.lat, saved.lng);
  if (point && (!input.localityId || input.localityId === saved.localityId)) return { ...point, localityId, locationAccuracy: saved.locationAccuracy || 'device' };
  if (locality) return { lat: locality.lat, lng: locality.lng, localityId, locationAccuracy: 'locality' };
  throw new Error('Choose your locality, or use your current location.');
}

export function deliveryFeeFor(pricing, zone, point, plan = {}) {
  if (zone === 'pickup') return { fee: 0, km: 0, zone };
  const validPoint = deliveryPoint(point?.lat, point?.lng);
  if (!HUBS[zone] || !validPoint) throw new Error('Choose your locality, or use your current location.');
  // Nearby hubs cannot identify a city boundary: retain the confirmed address area.
  const km = kmBetween(HUBS[zone], validPoint);
  if (km > 25) throw new Error('That delivery point is outside our local service area.');
  if (plan.institutionDelivery) {
    if (!String(plan.institutionName || '').trim()) throw new Error('Enter your school or college name.');
    if (km * 1.25 > 20) throw new Error('School / college address is outside our local coverage.');
    return { fee: plan.deliveryMode === 'batch' ? collegeDeliveryFee(plan.printedSides || 0) : 25, km: Math.round(km * 10) / 10, zone };
  }
  if (zone === 'vapi' || plan.deliveryMode === 'scheduled' && plan.scheduledZone === 'vapi') {
    const origin = deliveryPoint(plan.fulfillmentPoint?.lat, plan.fulfillmentPoint?.lng) || HUBS.vapi;
    // ponytail: distance bands use a 1.25× straight-line estimate; replace with a routing provider when available.
    const distance = kmBetween(origin, validPoint) * 1.25;
    if (distance > (plan.fulfillmentRadiusKm || 20)) throw new Error('Outside this delivery service area.');
    if (plan.deliveryMode === 'scheduled' && (zone !== plan.scheduledZone || distance > plan.scheduledRadiusKm)) throw new Error('Outside this scheduled route. Choose express delivery.');
    return { fee: distanceFee(distance, plan.deliveryMode === 'scheduled'), km: Math.round(distance * 10) / 10, zone, distanceEstimated: true };
  }
  if (plan.deliveryMode === 'scheduled') {
    if (zone !== plan.scheduledZone || km > plan.scheduledRadiusKm) throw new Error('Outside this scheduled route. Choose address delivery or a different route.');
    if (!Number.isFinite(plan.scheduledFee) || plan.scheduledFee < 0) throw new Error('Scheduled delivery pricing is unavailable.');
    return { fee: plan.scheduledFee, km: Math.round(km * 10) / 10, zone };
  }
  if (plan.campusId === 'lit') {
    if (kmBetween(HUBS.sarigam, validPoint) > 0.5) throw new Error('College delivery must go to LIT College.');
    return { fee: plan.deliveryMode === 'batch' ? collegeDeliveryFee(plan.printedSides || 0) : 25, km: 0, zone: 'sarigam' };
  }
  if (['sarigam', 'bhilad'].includes(zone)) {
    const other = zone === 'sarigam' ? 'bhilad' : 'sarigam';
    if (kmBetween(HUBS[other], validPoint) + 0.5 < km || km > 6) throw new Error('Choose the area that matches your delivery point.');
  }
  if (['vapi', 'daman'].includes(zone) && ['sarigam', 'bhilad'].some((other) => kmBetween(HUBS[other], validPoint) + 2 < km)) {
    throw new Error('Choose the area that matches your delivery point.');
  }
  const fee = Number(pricing.delivery[zone]);
  if (!Number.isFinite(fee) || fee < 0) throw new Error('Delivery pricing is unavailable.');
  return { fee, km: Math.round(km * 10) / 10, zone };
}

export function quote({ pages, copies, printType, bwPages, colorPages, student, zone, point, ...plan }) {
  const db = loadDb();
  const p = db.pricing;
  const rate = rateFor(printType, student, p);
  const counts = printSides({ pages, copies, printType, bwPages, colorPages });
  const priced = printPricing(counts, p, student);
  const { subtotal } = priced;
  const processFee = processingFee(priced.printedSides);
  const stdSubtotal = Math.round((counts.bw * p.bw + counts.color * p.color) * 100) / 100;
  const discount = Math.round((stdSubtotal - priced.regularSubtotal) * 100) / 100;
  const { fee: deliveryFee, km: deliveryKm, zone: deliveryZone, distanceEstimated } = deliveryFeeFor(p, zone, point, { ...plan, printedSides: priced.printedSides });
  const extra = surchargeFees(p, activePrintJobs(db));
  const lateNightFee = zone === 'pickup' || plan.campusId === 'lit' || plan.institutionDelivery || plan.deliveryMode === 'scheduled' ? 0 : extra.lateNightFee;
  const surgeFee = extra.surgeFee;
  return {
    rate, ...priced, processingFee: processFee,
    studentDiscount: student ? discount : 0,
    deliveryFee, deliveryKm, deliveryZone, distanceEstimated: !!distanceEstimated, lateNightFee, surgeFee,
    total: Math.round((subtotal + processFee + deliveryFee + lateNightFee + surgeFee) * 100) / 100
  };
}

// Demo progress for the dashboard card (§5).
const WEIGHT = {
  CREATED: 5, PAYMENT_PENDING: 12, CONFIRMED: 22, PRINT_QUEUE: 35,
  PRINTING: 55, PRINTED: 68, READY_FOR_PICKUP: 76,
  RIDER_ASSIGNED: 82, PICKED_UP: 88, OUT_FOR_DELIVERY: 94, DELIVERED: 100
};
export function progressOf(status) {
  return WEIGHT[status] ?? 0;
}
