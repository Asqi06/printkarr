import assert from 'node:assert/strict';
import fs from 'node:fs';
import { orderTrack, orderDetail } from '../lib/views_customer.js';
import { landing } from '../lib/views_public.js';
import { layout } from '../lib/views.js';
import { optionsStep } from '../lib/views_order.js';
import { seoHead } from '../lib/seo.js';

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

// 2. Check views_public landing() includes Blinkit elements & Printo depth
const landingHtml = landing({ pricing: { bw: 2, color: 4 }, walletOffers: [] });
assert.match(landingHtml, /pk-promise-bar/, 'Landing must have Blinkit promise bar');
assert.match(landingHtml, /pk-category-grid/, 'Landing must have Blinkit category grid quick-picks');
assert.match(landingHtml, /B&amp;W Document/, 'Category grid must feature B&W Document');
assert.match(landingHtml, /pk-wa-share-btn/, 'Landing must have WhatsApp class group share CTA');
assert.match(landingHtml, /pk-ambassador-banner/, 'Landing must feature campus ambassador referral banner');

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

// 5. Check Printo configurator in optionsStep
const mockDraft = { id: 'draft-test', document: 'Report.pdf', pages: 20, fileType: 'pdf' };
const optionsHtml = optionsStep(mockUser, mockDraft, [], undefined, { bw: 2, color: 4 });
assert.match(optionsHtml, /name="paperGsm"/, 'optionsStep must provide Paper GSM selector');
assert.match(optionsHtml, /value="wiro"/, 'optionsStep must offer Wiro binding');
assert.match(optionsHtml, /value="hardcover"/, 'optionsStep must offer Hardcover Thesis binding');
assert.match(optionsHtml, /id="gutterNotice"/, 'optionsStep must render gutter preflight safety alert');

// 6. Check SEO Product schema
const headHtml = seoHead('/', 'PrintKarr', 'Hyperlocal printing in Vapi');
assert.match(headHtml, /#document-printing-product/, 'SEO head must output Product rich schema');

// 7. Check CSS design tokens
const designCss = fs.readFileSync('public/design.css', 'utf8');
assert.match(designCss, /--brand-green:\s*#0c831f/i, 'design.css must define Blinkit brand green');
assert.match(designCss, /--shadow-float:/, 'design.css must define float shadow');
assert.match(designCss, /\.pk-cart-strip/, 'design.css must define cart strip styles');
assert.match(designCss, /\.skeleton/, 'design.css must define shimmer skeletons');
assert.match(designCss, /\.pk-ambassador-banner/, 'design.css must define campus ambassador banner styles');
assert.match(designCss, /\.pk-wa-share-btn/, 'design.css must define WhatsApp share button styles');

// 8. Check store & order-flow CSS overrides
const storeCss = fs.readFileSync('public/store.css', 'utf8');
assert.match(storeCss, /Blinkit Visual Overhaul \(Phase 4\)/, 'store.css must contain Phase 4 overrides');

const flowCss = fs.readFileSync('public/order-flow.css', 'utf8');
assert.match(flowCss, /Blinkit Visual Overhaul \(Phase 5\)/, 'order-flow.css must contain Phase 5 overrides');

console.log('✓ All Printo × Blinkit redesign checks passed successfully.');
