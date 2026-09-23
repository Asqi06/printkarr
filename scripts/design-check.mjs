// Read-only design regression check. --serve exposes fixture pages on localhost:3100.
// No production database, emails, payments or print jobs are touched.
import assert from 'node:assert/strict';
import express from 'express';
import { Script, runInNewContext } from 'node:vm';
import { readFileSync } from 'node:fs';
import * as publicViews from '../lib/views_public.js';
import * as account from '../lib/views_order.js';
import * as customer from '../lib/views_customer.js';
import * as admin from '../lib/views_admin.js';
import { loginPage, loginOtpPage, staffLoginPage } from '../lib/views.js';
import { blankDb } from '../lib/db.js';
const { pricing, settings } = blankDb();
const user = { id: 'preview', role: 'customer', name: 'Ani', email: 'ani@example.com' };
const staff = { ...user, role: 'admin' };
const draft = { id: 'preview', document: 'Design-notes.pdf', pages: 12, area: 'Pickup' };
const order = { ...draft, status: 'PAYMENT_PENDING', printType: 'bw', sides: 'double', copies: 1, total: 24, subtotal: 24, deliveryFee: 0, history: [] };
const pages = new Map([
  ['/', publicViews.landing({ pagesWeek: 128, queueDepth: 2, pricing })],
  ['/order', publicViews.orderPage({ pricing, maxMb: 20 })],
  ['/order/options', publicViews.orderPage({ pricing, draft })],
  ['/order/phone', publicViews.phonePage({ draft })],
  ['/order/verify', publicViews.otpPage({ draft, email: user.email })],
  ...[['about', 'aboutPage'], ['how-it-works', 'howItWorksPage'], ['franchise', 'franchisePage'], ['xerox', 'xeroxPage'], ['contact', 'contactPage'], ['blogs', 'blogsPage'], ['terms', 'termsPage'], ['privacy', 'privacyPage']].map(([route, fn]) => ['/' + route, publicViews[fn]()]),
  ...publicViews.POSTS.map(post => ['/blogs/' + post.slug, publicViews.blogArticlePage(post.slug)]),
  ['/login', loginPage(null, false)],
  ['/login/code', loginOtpPage(user.email)],
  ['/admin/login', staffLoginPage('admin')],
  ['/customer', customer.customerDashboard(user, { pricing, notes: [] })],
  ['/customer/orders', customer.ordersList(user, { tab: 'active', counts: { active: 1, completed: 0, cancelled: 0 }, orders: [order] })],
  ['/customer/orders/preview', customer.orderDetail(user, order)],
  ['/customer/orders/new', account.uploadStep(user)],
  ['/customer/options', account.optionsStep(user, draft, [])],
  ['/customer/orders/preview/pay', account.payStep(user, order)],
  ['/customer/wallet', account.walletPage(user, { balance: 150 }, [], pricing)],
  ['/customer/profile', account.profilePage(user, [], [])],
  ['/admin', admin.adminDashboard(staff, { today: 8, printing: 1, ready: 2, revenue: 240, pages: 120, delivered: 5 })],
  ['/admin/orders', admin.orderQueue(staff, { filter: 'all', q: '', rows: [{ ...order, cname: 'Ani' }] })],
  ['/admin/print-queue', admin.printQueuePage(staff, [], { name: 'Preview printer', online: false, ink: 75, paper: 80 })],
  ['/admin/customers', admin.customersPage(staff, [])],
  ['/admin/pricing', admin.pricingPage(staff, pricing)],
  ['/admin/coupons', admin.couponsPage(staff, [])],
  ['/admin/settings', admin.settingsPage(staff, settings, [])],
  ['/admin/analytics', admin.analyticsPage(staff, { salesToday: 24, salesWeek: 120, pages: 60, bw: 60, color: 0, done: 5, cancelled: 0, live: 1, total: 6, repeat: 1, customers: 5, avgHrs: 1 })],
]);
assert.match(pages.get('/login'), /<details class="login-password-options">/);
assert.match(pages.get('/login'), /<details class="login-demo-options">/);
const demoScript = pages.get('/login').match(/<script>\s*(document\.querySelectorAll\('\.demo-card'\)[\s\S]*?)<\/script>/)?.[1];
let demoClick, demoToast, scrollBlock;
const demoFields = { email: { value: '' }, password: { value: '' } };
const passwordOptions = { open: false, scrollIntoView: ({ block }) => { scrollBlock = block; } };
const demoOptions = { open: true };
runInNewContext(demoScript, {
  document: {
    querySelectorAll: () => [{ dataset: { email: 'demo@example.com', pass: 'demo123' }, addEventListener: (event, handler) => { demoClick = handler; } }],
    querySelector: (selector) => selector === '.login-password-options' ? passwordOptions : demoOptions,
    getElementById: (id) => demoFields[id]
  },
  toast: (message) => { demoToast = message; }
});
demoClick();
assert.equal(demoFields.email.value, 'demo@example.com');
assert.equal(demoFields.password.value, 'demo123');
assert.equal(passwordOptions.open, true);
assert.equal(demoOptions.open, false);
assert.equal(scrollBlock, 'center');
assert.match(demoToast, /Demo account filled/);
for (const [route, html] of pages) {
  assert.equal((html.match(/<header\b/g) || []).length, 1, `${route}: one header`);
  assert.equal((html.match(/<main\b/g) || []).length, 1, `${route}: one main landmark`);
  assert.match(html, /<h1\b/, `${route}: page heading`);
  assert.match(html, /design\.css\?v=/, `${route}: shared design system`);
  if (route === '/' || route === '/how-it-works') {
    assert.doesNotMatch(html, /pk-flow|Your file’s journey/, `${route}: removed crossed-out file journey`);
  }
  for (const script of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)) new Script(script[1], { filename: route });
}
assert.match(readFileSync(new URL('../public/design.css', import.meta.url), 'utf8'), /\.step-detail img \{[^}]*object-fit: contain/);
console.log(`${pages.size} page renders passed: landmarks, headings, theme and inline scripts.`);
// Exercise the actual browser handlers without a browser dependency or real side effects.
for (const reducedMotion of [false, true]) {
  const node = () => {
    const classes = new Set();
    return { disabled: false, handlers: {}, textContent: '',
      classList: { add: c => classes.add(c), remove: c => classes.delete(c), contains: c => classes.has(c), toggle: (c, on) => on ? classes.add(c) : classes.delete(c) },
      addEventListener(event, handler) { this.handlers[event] = handler; } };
  };
  const button = node(), status = node(), demo = node(), form = node(), look = node(), description = node();
  demo.querySelector = selector => selector === '.demo-trigger' ? button : status;
  look.querySelector = () => description;
  const controls = { printType: { value: 'bw' }, sides: { value: 'double' }, copies: { value: '1' }, orientation: { value: 'auto' } };
  form.querySelector = selector => Object.entries(controls).find(([name]) => selector.includes('name="' + name + '"'))?.[1] || null;
  form.prepend = el => assert.equal(el, look);
  const timers = [];
  runInNewContext(readFileSync(new URL('../public/shell.js', import.meta.url), 'utf8'), {
    document: { querySelectorAll: selector => selector === '[data-print-demo]' ? [demo] : selector === 'form' ? [form] : [], createElement: () => look },
    window: { matchMedia: query => ({ matches: query.includes('reduced-motion') && reducedMotion }) },
    IntersectionObserver: class { observe() {} },
    setTimeout: (callback, delay) => timers.push({ callback, delay }), clearTimeout() {}
  });
  button.handlers.click();
  button.handlers.click();
  assert.equal(timers.length, 1, 'Rapid repeat clicks must not start duplicate print demos');
  assert.equal(timers[0].delay, reducedMotion ? 0 : 1600);
  assert.equal(button.disabled, true);
  timers[0].callback();
  assert.equal(button.disabled, false);
  assert.ok(demo.classList.contains('is-printed'));
  assert.match(status.textContent, /no real print job/);
  assert.match(description.textContent, /Black & white.*Double-sided.*1/);
  controls.printType.value = 'color'; controls.sides.value = 'single'; controls.copies.value = '2'; controls.orientation.value = 'landscape';
  form.handlers.change();
  assert.match(description.textContent, /Full colour.*Single-sided.*2/);
  assert.ok(look.classList.contains('color') && look.classList.contains('landscape'));
  assert.equal(look.classList.contains('double'), false);
}
console.log('Interaction checks passed: demo replay guard, reduced motion and live paper settings.');
if (process.argv.includes('--serve')) {
  const app = express();
  app.use(express.static('public', { index: false }));
  // The preview intentionally accepts no form submissions.
  app.get('*', (req, res) => pages.has(req.path) ? res.send(pages.get(req.path)) : res.status(404).send('Preview route not found'));
  app.listen(3100, '127.0.0.1', () => console.log('Read-only design preview: http://127.0.0.1:3100'));
}
