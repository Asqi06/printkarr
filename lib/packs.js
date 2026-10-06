import { packCovers, printSides } from '../public/print-plan.js';
// Semester print packs — prepaid bundles for college students.
// 1 printed side = 1 page-side of quota (pages × copies).
// Delivery / surcharges are never covered: packs cover printing only.
export const BOOKING_FEE = 199;

export const PACKS = [
  {
    id: 'S',
    name: 'Semester Pack S',
    price: 329,
    bw: 130,
    color: 30,
    colorSwapRate: 3,
    files: 2,
    fileValue: 25,
    bwRate: 2,
    colorRate: 5,
    market: 460,
    save: 131,
    blurb: 'Assignments, diagrams and short colour projects'
  },
  {
    id: 'M',
    name: 'Semester Pack M',
    price: 499,
    bw: 250,
    color: 45,
    colorSwapRate: 3,
    files: 4,
    fileValue: 25,
    bwRate: 2,
    colorRate: 5,
    market: 825,
    save: 326,
    blurb: 'Notes, journals and colour-heavy submissions'
  },
  {
    id: 'L',
    name: 'Semester Pack L',
    price: 725,
    bw: 400,
    color: 60,
    colorSwapRate: 3,
    files: 5,
    fileValue: 25,
    bwRate: 2,
    colorRate: 5,
    market: 1225,
    save: 500,
    savePlus: true,
    blurb: 'Full-semester notes and 60 colour sides included'
  }
];

export function packById(id) {
  return PACKS.find((p) => p.id === String(id || '').toUpperCase()) || null;
}

export function ensurePackSubs(db) {
  db.packSubs ||= [];
  for (const sub of db.packSubs) {
    const pack = packById(sub.packId), previous = {S:10,M:15,L:20}[sub.packId];
    if (pack && !sub.colorSwapRate && sub.bwTotal === pack.bw && sub.colorTotal === previous) {
      sub.colorTotal = pack.color;
      sub.colorSwapRate = pack.colorSwapRate;
    }
  }
  return db.packSubs;
}

export function mySubs(db, customerId) {
  return ensurePackSubs(db)
    .filter((s) => s.customerId === customerId)
    .sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
}

export function dueOf(sub) {
  return Math.max(0, Math.round(((sub.price || 0) - (sub.paidTotal || 0)) * 100) / 100);
}

export function usableOf(sub) {
  // Quota unlocks once the ₹199 booking fee is secured.
  return (sub.paidTotal || 0) >= BOOKING_FEE;
}

export function leftOf(sub) {
  return {
    bw: Math.max(0, (sub.bwTotal || 0) - (sub.bwUsed || 0) - Math.max(0, (sub.colorUsed || 0) - (sub.colorTotal || 0)) * (sub.colorSwapRate || 0)),
    color: Math.max(0, (sub.colorTotal || 0) - (sub.colorUsed || 0)),
    files: Math.max(0, (sub.filesTotal || 0) - (sub.filesUsed || 0)),
    ...(sub.colorSwapRate ? {colorSwapRate:sub.colorSwapRate} : {})
  };
}

export function exhaustedOf(sub) {
  const l = leftOf(sub);
  return l.bw <= 0 && l.color <= 0;
}

// Oldest usable sub that can cover `sides` of `printType`. Null when none.
export function coverFor(db, customerId, printType, sides) {
  const need = typeof sides === 'object' ? sides : { bw: printType === 'color' ? 0 : Math.max(1, Math.ceil(Number(sides) || 0)), color: printType === 'color' ? Math.max(1, Math.ceil(Number(sides) || 0)) : 0 };
  const cands = mySubs(db, customerId).filter((s) => usableOf(s));
  for (const s of cands) {
    const reserved = (db.orders || []).filter(o=>o.packSubId === s.id && ['CREATED','PAYMENT_PENDING'].includes(o.status)).reduce((sum,o)=>{const n=printSides(o);return {bw:sum.bw+n.bw,color:sum.color+n.color};},{bw:0,color:0});
    if (packCovers(leftOf(s), {bw:need.bw+reserved.bw,color:need.color+reserved.color})) return s;
  }
  return null;
}

export function deductSides(sub, printType, sides) {
  const need = typeof sides === 'object' ? sides : { bw: printType === 'color' ? 0 : Math.max(1, Math.ceil(Number(sides) || 0)), color: printType === 'color' ? Math.max(1, Math.ceil(Number(sides) || 0)) : 0 };
  if (!packCovers(leftOf(sub), need)) throw new Error('The semester pack cannot cover these printed sides.');
  sub.bwUsed = (sub.bwUsed || 0) + need.bw;
  sub.colorUsed = (sub.colorUsed || 0) + need.color;
  sub.updatedAt = new Date().toISOString();
}

export function newSub(pack, customerId, firstPayment) {
  const now = new Date().toISOString();
  return {
    id: 'SUB-' + Date.now().toString(36).toUpperCase(),
    customerId,
    packId: pack.id,
    packName: pack.name,
    price: pack.price,
    bwTotal: pack.bw,
    bwUsed: 0,
    colorTotal: pack.color,
    colorSwapRate: pack.colorSwapRate,
    colorUsed: 0,
    filesTotal: pack.files,
    filesUsed: 0,
    paidTotal: Math.round((firstPayment || 0) * 100) / 100,
    payments: firstPayment
      ? [{ amount: Math.round(firstPayment * 100) / 100, method: 'init', at: now }]
      : [],
    createdAt: now,
    updatedAt: now
  };
}
