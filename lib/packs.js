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
    color: 10,
    files: 2,
    fileValue: 25,
    bwRate: 2,
    colorRate: 6,
    market: 470,
    save: 30,
    blurb: 'Light semester · assignments + a few color prints'
  },
  {
    id: 'M',
    name: 'Semester Pack M',
    price: 499,
    bw: 250,
    color: 15,
    files: 4,
    fileValue: 25,
    bwRate: 2,
    colorRate: 6,
    market: 800,
    save: 120,
    blurb: 'Regular semester · notes, journals + files'
  },
  {
    id: 'L',
    name: 'Semester Pack L',
    price: 725,
    bw: 400,
    color: 20,
    files: 5,
    fileValue: 25,
    bwRate: 2,
    colorRate: 6,
    market: 1000,
    save: 200,
    savePlus: true,
    blurb: 'Heavy semester · thesis season insurance'
  }
];

export function packById(id) {
  return PACKS.find((p) => p.id === String(id || '').toUpperCase()) || null;
}

export function ensurePackSubs(db) {
  db.packSubs ||= [];
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
    bw: Math.max(0, (sub.bwTotal || 0) - (sub.bwUsed || 0)),
    color: Math.max(0, (sub.colorTotal || 0) - (sub.colorUsed || 0)),
    files: Math.max(0, (sub.filesTotal || 0) - (sub.filesUsed || 0))
  };
}

export function exhaustedOf(sub) {
  const l = leftOf(sub);
  return l.bw <= 0 && l.color <= 0;
}

// Oldest usable sub that can cover `sides` of `printType`. Null when none.
export function coverFor(db, customerId, printType, sides) {
  const need = Math.max(1, Math.ceil(Number(sides) || 0));
  const cands = mySubs(db, customerId).filter((s) => usableOf(s));
  for (const s of cands) {
    const l = leftOf(s);
    if (printType === 'color' ? l.color >= need : l.bw >= need) return s;
  }
  return null;
}

export function deductSides(sub, printType, sides) {
  const need = Math.max(1, Math.ceil(Number(sides) || 0));
  if (printType === 'color') sub.colorUsed = Math.min(sub.colorTotal, (sub.colorUsed || 0) + need);
  else sub.bwUsed = Math.min(sub.bwTotal, (sub.bwUsed || 0) + need);
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
