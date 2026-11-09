// Small assert-based check for purchases redesign, inline address and cancellation flow
import assert from 'node:assert/strict';
import { purchasePage, purchasesPage } from '../lib/views_store.js';
import { orderDetail } from '../lib/views_customer.js';

// 1. Check orderDetail allows cancellation even when order has a purchaseId
const fakeOrderWithPurchase = {
  id: 'ORD-12345',
  customerId: 'cust-1',
  document: 'Test Document.pdf',
  pages: 10,
  copies: 1,
  sides: 'single',
  subtotal: 20,
  total: 20,
  deliveryFee: 0,
  status: 'CONFIRMED',
  purchaseId: 'SHOP-99999',
  history: [{ to: 'CREATED', at: new Date().toISOString() }, { to: 'CONFIRMED', at: new Date().toISOString() }]
};

const detailHtml = orderDetail({ id: 'cust-1', role: 'customer', name: 'Student' }, fakeOrderWithPurchase, null, null, false);

assert.ok(detailHtml.includes('action="/customer/orders/ORD-12345/cancel"'), 'Cancel button must be rendered for order with purchaseId');
assert.ok(!detailHtml.includes('Cancel the whole shared purchase from its receipt'), 'Nagging blocker banner must be gone');
assert.ok(detailHtml.includes('Combined checkout receipt: <a href="/customer/purchases/SHOP-99999">'), 'Subtle link to receipt is present');

// 2. Check purchasesPage renders the redesigned cards
const fakePurchases = [
  {
    id: 'SHOP-1',
    customerId: 'cust-1',
    status: 'CREATED',
    total: 45,
    createdAt: new Date().toISOString(),
    printIds: ['ORD-1'],
    items: [{ id: 'p1', name: 'Pen', price: 10, quantity: 2, total: 20 }],
    address: { address: 'Hostel 3, Lit Campus', pin: '396155' },
    slot: 'Standard delivery'
  },
  {
    id: 'SHOP-2',
    customerId: 'cust-1',
    status: 'PAID',
    total: 30,
    createdAt: new Date().toISOString(),
    printIds: ['ORD-2'],
    items: [],
    address: { address: 'Room 12, Main St', pin: '396155' },
    slot: 'Standard delivery'
  }
];

const listHtml = purchasesPage({ id: 'cust-1', role: 'customer' }, fakePurchases);
assert.ok(listHtml.includes('pk-purchase-card'), 'Purchases list renders pk-purchase-card elements');
assert.ok(listHtml.includes('Complete checkout →'), 'Pending purchase displays complete checkout CTA');
assert.ok(listHtml.includes('View receipt →'), 'Paid purchase displays view receipt CTA');
assert.ok(listHtml.includes('Awaiting Payment'), 'Pending purchase shows Awaiting Payment badge');

// 3. Check purchasePage renders inline address options and payment buttons for pending checkout
const fakeDb = {
  users: [{ id: 'cust-1', name: 'Student', phone: '+91 9999999999' }],
  orders: [
    { id: 'ORD-1', document: 'Assignment.pdf', pages: 5, copies: 1, sides: 'single', subtotal: 10, total: 10 }
  ],
  addresses: [
    { id: 'ADR-1', customerId: 'cust-1', label: 'Hostel', address: 'Hostel 3', area: 'Sarigam', pin: '396155' },
    { id: 'ADR-2', customerId: 'cust-1', label: 'Home', address: 'Flat 101', area: 'Vapi', pin: '396191' }
  ],
  wallets: [{ customerId: 'cust-1', balance: 100 }],
  walletTx: [],
  campaign: { bonusValidityDays: 30 },
  pricing: {}
};

const pendingHtml = purchasePage({ id: 'cust-1', role: 'customer' }, fakePurchases[0], fakeDb, { gateway: true });
assert.ok(pendingHtml.includes('data-store-gateway="SHOP-1"'), 'Pay online Razorpay button is rendered');
assert.ok(pendingHtml.includes('Pay ₹45 with wallet'), 'Pay with wallet button is rendered');
assert.ok(pendingHtml.includes('action="/customer/purchases/SHOP-1/address"'), 'Inline address update form is rendered on purchase checkout');
assert.ok(!pendingHtml.includes('href="/customer/profile#addresses"'), 'No redirect links to customer profile for address change on purchase page');

// 4. Test cancelPurchase on a shared purchase
import { cancelPurchase } from '../lib/store.js';
const testDb = {
  users: [{ id: 'cust-1' }],
  orders: [
    { id: 'ORD-TEST-1', customerId: 'cust-1', status: 'CONFIRMED', history: [{ to: 'CONFIRMED', at: new Date().toISOString() }], paymentStatus: 'pending' }
  ],
  purchases: [
    { id: 'SHOP-TEST-1', customerId: 'cust-1', status: 'CREATED', paymentStatus: 'pending', printIds: ['ORD-TEST-1'], items: [], history: [] }
  ],
  carts: [{ customerId: 'cust-1', purchaseId: 'SHOP-TEST-1', printIds: ['ORD-TEST-1'] }],
  wallets: [{ customerId: 'cust-1', balance: 0 }],
  products: []
};

cancelPurchase(testDb, testDb.purchases[0], 'cust-1');
assert.equal(testDb.purchases[0].status, 'CANCELLED', 'Purchase must be marked CANCELLED');
assert.equal(testDb.orders[0].status, 'CANCELLED', 'Linked order must be marked CANCELLED');
assert.equal(testDb.carts[0].purchaseId, null, 'Cart purchaseId must be reset');

console.log('✓ All purchases redesign, inline address, and direct order cancellation tests passed!');
