import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { optionsStep, uploadStep, summaryStep } from '../lib/views_order.js';
import { blankDb } from '../lib/db.js';
import { campaignDefaults } from '../lib/campus.js';

const { pricing } = blankDb();
const campaign = campaignDefaults();
const user = { id: 'u1', role: 'customer', name: 'Anirudh', phone: '9016703180' };
const draft = { id: 'd1', document: 'Assignment.pdf', pages: 12, fileType: 'pdf' };
const addresses = [{
  id: 'addr1',
  name: 'Anirudh',
  phone: '9016703180',
  address: 'LIT Sarigam Campus',
  area: 'Sarigam',
  pin: '396155',
  label: 'College',
  institutionName: 'LIT Sarigam',
  isDefault: true
}];

// 1. Check rendered HTML from optionsStep
const html = optionsStep(user, draft, addresses, campaign, pricing, { gateway: true, balance: 100 });

assert.match(html, /order-focus/, 'Must render with order-focus body class');
assert.match(html, /pk-checkout-grid/, 'Must contain 2-column checkout grid');
assert.match(html, /pk-col-main/, 'Must contain main column');
assert.match(html, /pk-col-side/, 'Must contain side column');
assert.match(html, /order-steps/, 'Must contain progress steps');
assert.match(html, /order-file/, 'Must contain document file header');
assert.match(html, /order-choice/, 'Must contain print settings choices');
assert.match(html, /order-stepper/, 'Must contain copies stepper');
assert.match(html, /pk-aov-section/, 'Must contain essential add-ons section');
assert.match(html, /qk-address-card/, 'Must contain saved address card');
assert.match(html, /order-quote/, 'Must contain price quote breakdown');

// 2. Check CSS overrides in public/nature-overhaul.css
const css = readFileSync(new URL('../public/nature-overhaul.css', import.meta.url), 'utf8');

assert.match(css, /body\.order-focus\s*\{[\s\S]*?var\(--pk-canvas\)/, 'order-focus body must use --pk-canvas');
assert.match(css, /body\.order-focus \.order-header/, 'Must style order-header');
assert.match(css, /body\.order-focus \.order-main\s*\{[\s\S]*?max-width:\s*1200px/, 'order-main must expand to 1200px');
assert.match(css, /body\.order-focus \.order-choice \.chip-pick:has\(input:checked\)\s*\{[\s\S]*?var\(--pk-forest\)/, 'Checked chips must use dark forest, not electric blue');
assert.match(css, /body\.order-focus \.order-stepper button/, 'Stepper buttons must be styled for nature theme');
assert.match(css, /\.(?:order-focus \.pick|\.order-main \.route-picks \.pick):has\(input:checked\)/, 'Delivery picks must be styled with nature checkmark');
assert.match(css, /body\.order-focus \.order-continue (?:button|\.btn)/, 'Continue button must use burnt orange');

console.log('Order-focus nature editorial self-check passed: markup & styles verified.');
