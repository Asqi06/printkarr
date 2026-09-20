// Demo seed — PRD §43. Deterministic content, timestamps relative to now
// so dashboards feel alive. Every order walks the §38 machine via
// transition(), so history is valid by construction.
import { blankDb, saveDb } from '../lib/db.js';
import { transition } from '../lib/machine.js';

const now = Date.now();
const minsAgo = (m) => new Date(now - m * 60000).toISOString();

function money(n) {
  return Math.round(n * 100) / 100;
}

const db = blankDb();

// ---- Users (§3 demo logins + §43 people) — kiosk mode: customers + admin only ----
db.users = [
  { id: 'CUS001', role: 'customer', name: 'Ani', email: 'customer@demo.printkarr.in', password: 'customer123', phone: '+91 98250 11111', student: true },
  { id: 'CUS002', role: 'customer', name: 'Riya', email: 'riya@demo.printkarr.in', password: 'customer123', phone: '+91 98250 22222', student: true },
  { id: 'CUS003', role: 'customer', name: 'Dev', email: 'dev@demo.printkarr.in', password: 'customer123', phone: '+91 98250 33333', student: false },
  { id: 'CUS004', role: 'customer', name: 'Priya', email: 'priya@demo.printkarr.in', password: 'customer123', phone: '+91 98250 44444', student: true },
  { id: 'CUS005', role: 'customer', name: 'Karan', email: 'karan@demo.printkarr.in', password: 'customer123', phone: '+91 98250 55555', student: false },
  { id: 'ADM001', role: 'admin', name: 'Printer Admin', email: 'admin@demo.printkarr.in', password: 'admin123', phone: '+91 98250 99999' }
];

// ---- Addresses (§10) ----
db.addresses = [
  { id: 'ADR1', customerId: 'CUS001', label: 'Hostel', name: 'Ani', phone: '+91 98250 11111', address: 'Laxmi Institute Hostel, Block B, Room 214', area: 'Sarigam', landmark: 'Near main gate', pin: '396155', isDefault: true },
  { id: 'ADR2', customerId: 'CUS001', label: 'Home', name: 'Ani', phone: '+91 98250 11111', address: '42, Shantinagar Society', area: 'Vapi', landmark: 'Opp. bus depot', pin: '396191', isDefault: false },
  { id: 'ADR3', customerId: 'CUS002', label: 'PG', name: 'Riya', phone: '+91 98250 22222', address: 'Sunrise PG, 2nd floor, Room 7', area: 'Sarigam', landmark: 'Behind LIT', pin: '396155', isDefault: true },
  { id: 'ADR4', customerId: 'CUS003', label: 'Office', name: 'Dev', phone: '+91 98250 33333', address: 'Plot 88, GIDC Phase 2', area: 'Vapi', landmark: 'Near overbridge', pin: '396195', isDefault: true },
  { id: 'ADR5', customerId: 'CUS004', label: 'College', name: 'Priya', phone: '+91 98250 44444', address: 'LIT Campus, Library desk', area: 'Sarigam', landmark: 'Central library', pin: '396155', isDefault: true }
];

// ---- Wallets (§17) ----
db.wallets = [
  { customerId: 'CUS001', balance: 240 },
  { customerId: 'CUS002', balance: 50 },
  { customerId: 'CUS003', balance: 120 },
  { customerId: 'CUS004', balance: 0 },
  { customerId: 'CUS005', balance: 310 }
];
db.walletTx = [
  { id: 'WTX1', customerId: 'CUS001', amount: 500, kind: 'credit', label: 'Added', at: minsAgo(60 * 26) },
  { id: 'WTX2', customerId: 'CUS001', amount: -63, kind: 'debit', label: 'Order #PK-1024', at: minsAgo(60 * 5) },
  { id: 'WTX3', customerId: 'CUS001', amount: -35, kind: 'debit', label: 'Order #PK-1019', at: minsAgo(60 * 30) }
];

// ---- Printer (§30) ----
db.printers = [
  { id: 'PRN1', name: 'Epson L3250', online: true, ink: 80, paper: 70, currentJob: 'PK-1038' }
];

// ---- Coupons (§35) ----
db.coupons = [
  { code: 'WELCOME50', type: 'percent', value: 20, minOrder: 100, expiry: '2026-09-30', active: true },
  { code: 'HOSTEL10', type: 'fixed', value: 10, minOrder: 50, expiry: '2026-10-31', active: true }
];

// ---- Orders: 18 across all statuses (§43) ----
// [orderNo, customerId, doc, pages, copies, type, sides, zone, ageMin, targetStatus, riderId, studentRate?]
const P = db.pricing;
const zoneFee = (z) => P.delivery[z];
const plan = [
  ['PK-1024', 'CUS001', 'DBMS_Assignment_Final.pdf', 24, 1, 'bw', 'double', 'campus', 300, 'READY_FOR_PICKUP', null, true],
  ['PK-1025', 'CUS002', 'Design_Portfolio.pdf', 12, 1, 'color', 'single', 'sarigam', 240, 'READY_FOR_PICKUP', null, false],
  ['PK-1026', 'CUS003', 'GST_Invoice_Set.pdf', 8, 3, 'bw', 'single', 'vapi', 200, 'PRINTING', null, false],
  ['PK-1027', 'CUS001', 'Question_Bank_Unit3.pdf', 40, 1, 'bw', 'double', 'campus', 150, 'PRINT_QUEUE', null, true],
  ['PK-1028', 'CUS004', 'Seminar_Poster.pdf', 4, 5, 'color', 'single', 'sarigam', 120, 'CONFIRMED', null, false],
  ['PK-1029', 'CUS005', ' tender_docs.pdf'.trim(), 30, 2, 'bw', 'double', 'bhilad', 100, 'READY_FOR_PICKUP', null, false],
  ['PK-1030', 'CUS002', 'Practical_File_Chem.pdf', 18, 1, 'bw', 'single', 'campus', 90, 'READY_FOR_PICKUP', null, true],
  ['PK-1031', 'CUS001', 'Resume_Ani_2026.pdf', 2, 10, 'color', 'single', 'campus', 70, 'PRINTED', null, false],
  ['PK-1032', 'CUS003', 'Site_Plan_A3.pdf', 6, 2, 'color', 'double', 'vapi', 60, 'CONFIRMED', null, false],
  ['PK-1033', 'CUS004', 'Notes_Physics.pdf', 52, 1, 'bw', 'double', 'sarigam', 50, 'CREATED', null, true],
  ['PK-1034', 'CUS005', 'Employee_Handbook.pdf', 26, 4, 'bw', 'double', 'bhilad', 40, 'PAYMENT_PENDING', null, false],
  ['PK-1035', 'CUS002', 'Lab_Manual.pdf', 22, 1, 'bw', 'double', 'campus', 30, 'PRINTING', null, true],
  ['PK-1036', 'CUS001', 'Maths_Notes.pdf', 16, 1, 'bw', 'single', 'campus', 20, 'READY_FOR_PICKUP', null, true],
  ['PK-1037', 'CUS004', 'Art_Submission.pdf', 10, 1, 'color', 'single', 'sarigam', 15, 'CANCELLED', null, false],
  ['PK-1038', 'CUS001', 'assignment.pdf', 24, 1, 'bw', 'double', 'campus', 8, 'PRINTING', null, true],
  ['PK-1039', 'CUS003', 'Quotation_Q3.pdf', 5, 2, 'bw', 'single', 'vapi', 1500, 'DELIVERED', null, false],
  ['PK-1040', 'CUS002', 'Thesis_Chapter2.pdf', 34, 1, 'bw', 'double', 'sarigam', 2900, 'DELIVERED', null, true],
  ['PK-1041', 'CUS005', 'Safety_Manual.pdf', 44, 1, 'bw', 'single', 'bhilad', 4300, 'DELIVERED', null, false],
  ['PK-1042', 'CUS004', 'Essay_Companion.pdf', 14, 1, 'bw', 'double', 'sarigam', 12, 'READY_FOR_PICKUP', null, true]
];

const PATH_TO = {
  CREATED: ['CREATED'],
  PAYMENT_PENDING: ['CREATED', 'PAYMENT_PENDING'],
  CONFIRMED: ['CREATED', 'PAYMENT_PENDING', 'CONFIRMED'],
  PRINT_QUEUE: ['CREATED', 'PAYMENT_PENDING', 'CONFIRMED', 'PRINT_QUEUE'],
  PRINTING: ['CREATED', 'PAYMENT_PENDING', 'CONFIRMED', 'PRINT_QUEUE', 'PRINTING'],
  PRINTED: ['CREATED', 'PAYMENT_PENDING', 'CONFIRMED', 'PRINT_QUEUE', 'PRINTING', 'PRINTED'],
  READY_FOR_PICKUP: ['CREATED', 'PAYMENT_PENDING', 'CONFIRMED', 'PRINT_QUEUE', 'PRINTING', 'PRINTED', 'READY_FOR_PICKUP'],
  RIDER_ASSIGNED: ['CREATED', 'PAYMENT_PENDING', 'CONFIRMED', 'PRINT_QUEUE', 'PRINTING', 'PRINTED', 'READY_FOR_PICKUP', 'RIDER_ASSIGNED'],
  PICKED_UP: ['CREATED', 'PAYMENT_PENDING', 'CONFIRMED', 'PRINT_QUEUE', 'PRINTING', 'PRINTED', 'READY_FOR_PICKUP', 'RIDER_ASSIGNED', 'PICKED_UP'],
  OUT_FOR_DELIVERY: ['CREATED', 'PAYMENT_PENDING', 'CONFIRMED', 'PRINT_QUEUE', 'PRINTING', 'PRINTED', 'READY_FOR_PICKUP', 'RIDER_ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY'],
  DELIVERED: ['CREATED', 'PAYMENT_PENDING', 'CONFIRMED', 'PRINT_QUEUE', 'PRINTING', 'PRINTED', 'READY_FOR_PICKUP', 'RIDER_ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED'],
  CANCELLED: ['CREATED', 'CANCELLED']
};

db.orders = plan.map(([id, cus, doc, pages, copies, type, sides, zone, age, target, rider, stu], i) => {
  const rate = stu ? (type === 'bw' ? P.studentBw : P.studentColor) : (type === 'bw' ? P.bw : P.color);
  const subtotal = money(pages * copies * rate);
  const deliveryFee = subtotal >= P.freeAbove ? 0 : zoneFee(zone);
  const order = {
    id, customerId: cus, document: doc, pages, copies,
    printType: type, sides, paper: 'A4', orientation: 'auto',
    binding: 'none', notes: '', pageRange: null,
    addressId: db.addresses.find((a) => a.customerId === cus)?.id || null,
    slot: 'Today, 6:30 PM',
    subtotal, deliveryFee, discount: 0, total: money(subtotal + deliveryFee),
    paymentStatus: ['CREATED', 'PAYMENT_PENDING'].includes(target) ? 'pending' : target === 'CANCELLED' ? 'refunded' : 'paid',
    paymentMethod: 'upi',
    status: 'CREATED', history: [],
    riderId: rider,
    createdAt: minsAgo(age + 45), updatedAt: minsAgo(age)
  };
  const steps = PATH_TO[target];
  steps.forEach((s, k) => {
    if (k === 0) return;
    transition(order, s, { by: 'seed', at: minsAgo(age + 45 - k * 4) });
  });
  order.updatedAt = minsAgo(age);
  return order;
});

// ---- Notifications (§41, in-app for demo) ----
const noteFor = (o) => {
  const map = {
    CONFIRMED: `Order #${o.id} confirmed.`,
    PRINTING: `Order #${o.id} has started printing.`,
    PRINTED: `Order #${o.id} is printed and packed.`,
    READY_FOR_PICKUP: `Order #${o.id} is ready for pickup at the kiosk.`,
    DELIVERED: `Order #${o.id} has been collected.`,
    CANCELLED: `Order #${o.id} was cancelled.`
  };
  return map[o.status] || null;
};
db.orders.forEach((o, i) => {
  const text = noteFor(o);
  if (text) db.notifications.push({ id: `NT${i}`, customerId: o.customerId, orderId: o.id, text, at: o.updatedAt, read: o.status === 'DELIVERED' });
});

// Kiosk mode: no rider earnings — pickup only.
db.riderTx = [];

saveDb(db);
const counts = {};
db.orders.forEach((o) => { counts[o.status] = (counts[o.status] || 0) + 1; });
console.log(`Seeded ${db.users.length} users, ${db.orders.length} orders, ${db.notifications.length} notifications.`);
console.log('Status spread:', JSON.stringify(counts));
