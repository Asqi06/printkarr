import assert from 'node:assert/strict';
import fs from 'node:fs';
import { orderTrack, orderDetail } from '../lib/views_customer.js';
import { landing } from '../lib/views_public.js';
import { layout } from '../lib/views.js';

// 1. Check orderTrack progress calculations
const trackDelivered = orderTrack('DELIVERED', false);
assert.match(trackDelivered, /class="order-track-fill" style="width:100%"/);
assert.match(trackDelivered, /Delivered/);
assert.ok(trackDelivered.includes('done') || trackDelivered.includes('active'));

const trackPrinting = orderTrack('PRINTING', false);
assert.match(trackPrinting, /class="order-track-fill" style="width:25%"/);
assert.match(trackPrinting, /class="order-track-step active"/);

const trackPickup = orderTrack('READY_FOR_PICKUP', true);
assert.match(trackPickup, /Collected/);
assert.match(trackPickup, /class="order-track-fill" style="width:67%"/);

// 2. Check views_public landing() includes Blinkit elements
const landingHtml = landing({ pricing: { bw: 2, color: 4 }, walletOffers: [] });
assert.match(landingHtml, /pk-promise-bar/, 'Landing must have Blinkit promise bar');
assert.match(landingHtml, /pk-category-grid/, 'Landing must have Blinkit category grid quick-picks');
assert.match(landingHtml, /B&amp;W Print/, 'Category grid must feature B&W print');

// 3. Check layout() includes persistent cart strip
const mockUser = { id: 'cust1', name: 'Test User', role: 'customer' };
const shellHtml = layout({ user: mockUser, title: 'Test Shell', body: '<p>Content</p>' });
assert.match(shellHtml, /id="cartStrip"/, 'Layout must contain persistent cart strip');
assert.match(shellHtml, /id="cartStripCount"/, 'Cart strip must contain count span');
assert.match(shellHtml, /id="cartStripPrice"/, 'Cart strip must contain price span');

// 4. Check customer orderDetail() renders orderTrack
const mockOrder = {
  id: 'ORD-123',
  status: 'PRINTING',
  document: 'Assignment.pdf',
  pages: 10,
  copies: 1,
  subtotal: 20,
  total: 20,
  deliveryZone: 'vapi',
  history: [{ to: 'CREATED', at: Date.now() }, { to: 'PRINTING', at: Date.now() }]
};
const detailHtml = orderDetail(mockUser, mockOrder, null, null, false);
assert.match(detailHtml, /class="order-track"/, 'Order detail must render the progress tracker');
assert.match(detailHtml, /order-track-dot/, 'Order detail tracker must render tracker dots');

// 5. Check CSS design tokens
const designCss = fs.readFileSync('public/design.css', 'utf8');
assert.match(designCss, /--brand-green:\s*#0c831f/i, 'design.css must define Blinkit brand green');
assert.match(designCss, /--shadow-float:/, 'design.css must define float shadow');
assert.match(designCss, /\.pk-cart-strip/, 'design.css must define cart strip styles');
assert.match(designCss, /\.skeleton/, 'design.css must define shimmer skeletons');

// 6. Check store & order-flow CSS overrides
const storeCss = fs.readFileSync('public/store.css', 'utf8');
assert.match(storeCss, /Blinkit Visual Overhaul \(Phase 4\)/, 'store.css must contain Phase 4 overrides');

const flowCss = fs.readFileSync('public/order-flow.css', 'utf8');
assert.match(flowCss, /Blinkit Visual Overhaul \(Phase 5\)/, 'order-flow.css must contain Phase 5 overrides');

console.log('✓ All Blinkit redesign checks passed successfully.');
