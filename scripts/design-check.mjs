// Read-only design regression check. --serve exposes fixture pages on localhost:3100.
// No production database, emails, payments or print jobs are touched.
import assert from 'node:assert/strict';
import express from 'express';
import { Script, runInNewContext } from 'node:vm';
import { readFileSync } from 'node:fs';
import * as publicViews from '../lib/views_public.js';
import * as account from '../lib/views_order.js';
import * as customer from '../lib/views_customer.js';
import { referralsPage, adminReferralsPage } from '../lib/views_referrals.js';
import * as admin from '../lib/views_admin.js';
import * as packs from '../lib/views_packs.js';
import { campaignDefaults } from '../lib/campus.js';
import { getConfig } from '../lib/referrals.js';
import { loginPage, loginOtpPage, staffLoginPage } from '../lib/views.js';
import { blankDb } from '../lib/db.js';
import { customerDestination, parseCookies } from '../lib/auth.js';
import { buildCoverPdf } from '../agent/cover.js';
const { pricing, settings } = blankDb();
const user = { id: 'preview', role: 'customer', name: 'Ani', email: 'ani@example.com' };
const staff = { ...user, role: 'admin' };
const draft = { id: 'preview', document: 'Design-notes.pdf', pages: 12, area: 'Pickup' };
const order = { ...draft, status: 'PAYMENT_PENDING', printType: 'bw', sides: 'double', copies: 1, total: 24, subtotal: 24, deliveryFee: 0, history: [] };
const campaign = campaignDefaults();
export const pages = new Map([
  ['/', publicViews.landing({ pagesWeek: 128, queueDepth: 2, pricing, campaign, walletOffers:campaign.wallets.filter(o=>o.enabled) })],
  ['/printing-in-daman', publicViews.damanPage()],
  ['/printing-prices', publicViews.printPricesPage({ pricing })],
  ['/order', publicViews.orderPage({ pricing, maxMb: 20 })],
  ['/order/options', publicViews.orderPage({ pricing, draft })],
  ['/order/phone', publicViews.phonePage({ draft })],
  ['/order/college', publicViews.phonePage({ draft: { ...draft, selections: { campusId:'lit', campus:'LIT College', slot:'Next campus batch' } } })],
  ['/order/local', publicViews.phonePage({ draft: { ...draft, area:'Vapi', selections: { deliveryMode:'express' } } })],
  ['/order/verify', publicViews.otpPage({ draft, email: user.email })],
  ...[['printing-in-vapi', 'vapiPage'], ['about', 'aboutPage'], ['how-it-works', 'howItWorksPage'], ['franchise', 'franchisePage'], ['xerox', 'xeroxPage'], ['contact', 'contactPage'], ['blogs', 'blogsPage'], ['terms', 'termsPage'], ['privacy', 'privacyPage']].map(([route, fn]) => ['/' + route, publicViews[fn]()]),
  ...publicViews.POSTS.map(post => ['/blogs/' + post.slug, publicViews.blogArticlePage(post.slug)]),
  ['/login', loginPage(null, true)],
  ['/login/code', loginOtpPage(user.email)],
  ['/admin/login', staffLoginPage('admin')],
  ['/customer', customer.customerDashboard(user, { pricing, notes: [], walletBalance:150 })],
  ['/customer/orders', customer.ordersList(user, { tab: 'active', counts: { active: 1, completed: 0, cancelled: 0 }, orders: [order] })],
  ['/customer/orders/preview', customer.orderDetail(user, order)],
  ['/customer/orders/preview/scan', customer.scanPage(user, { ...order, id: 'preview', status: 'READY_FOR_PICKUP' })],
  ['/customer/orders/new', account.uploadStep(user, {pricing,campaign,maxMb:20})],
  ['/customer/options', account.optionsStep(user, draft, [], campaign, pricing)],
  ['/customer/returning', customer.customerDashboard(user, {pricing,notes:[],lastDoc:{...order,status:'DELIVERED',fileAvailable:false},walletBalance:150})],
  ['/customer/checkout-offer', account.payStep({...user,walletBalance:0}, order, {offers:campaign.wallets.filter(o=>o.enabled),bonusValidityDays:90,razorpay:true,livePay:true})],
  ['/customer/orders/preview/pay', account.payStep(user, order)],
  ['/customer/wallet', account.walletPage(user, { balance:150 }, [], pricing, {campaign, offers:campaign.wallets.filter(o=>o.enabled), bonusBalance:20})],
  ['/customer/wallet-files', account.walletPage(user, {balance:149}, [], pricing, {campaign,offers:campaign.wallets.filter(o=>o.enabled),selectedOffer:'files',fileGifts:[{id:'paid-files',amount:149,freeFiles:{quantity:3,color:null}}]})],
  ['/admin/customer-files', admin.customerDetailAdmin(staff,user,[],{balance:149},[],[],[{id:'paid-files',amount:149,freeFiles:{quantity:3,color:'orange'}}])],
  ['/customer/referrals', referralsPage(user, { cfg: { friendOff: 20, friendMinOrder: 79, referrerCredit: 20, monthlyCap: 500, minWithdrawal: 50, milestones: [{ n: 3, bonus: 10 }] }, code: 'ABC234', stats: { joined: 1, qualified: 0, earned: 0 }, credit: { balance: 0 }, cash: { balance: 0 }, payouts: [], shareText: 'PrintKarr it' })],
  ['/customer/packs', packs.packsPage(user, {subs:[],walletBalance:150,livePay:true})],
  ['/customer/review', account.summaryStep(user, draft, {effPages:12,copies:1,printType:'bw',sides:'double',orientation:'portrait',binding:'none',zone:'vapi',zoneLabel:'Vapi',slot:'Morning'}, {subtotal:24,total:24,deliveryFee:0})],
  ['/customer/wallet-live', account.walletPage(user, {balance:150}, [], pricing, {campaign,offers:campaign.wallets.filter(o=>o.enabled),razorpay:true,livePay:true,returnOrder:'preview',selectedOffer:'study'})],
  ['/customer/profile', account.profilePage(user, [], [])],
  ['/admin/orders/preview', admin.adminOrderDetail(staff, order, user, {area:'Vapi',address:'Campus'}, ['CONFIRMED','CANCELLED'], '', null)],
  ['/admin/customers/preview', admin.customerDetailAdmin(staff,user,[order],{balance:150},[])],
  ['/admin/packs', packs.adminPacksPage(staff, {subs:[],users:[user]})],
  ['/admin/referrals', adminReferralsPage(staff, {cfg:getConfig({}), referrals:[],users:[user],payouts:[]})],
  ['/admin/classroom-qr', admin.classroomQr(staff,'https://printkarr.in/order')],
  ['/admin', admin.adminDashboard(staff, { today: 8, printing: 1, ready: 2, revenue: 240, pages: 120, delivered: 5 })],
  ['/admin/orders', admin.orderQueue(staff, { filter: 'all', q: '', rows: [{ ...order, cname: 'Ani' }] })],
  ['/admin/print-queue', admin.printQueuePage(staff, [], { name: 'Preview printer', online: false, ink: 75, paper: 80 })],
  ['/admin/customers', admin.customersPage(staff, [])],
  ['/admin/pricing', admin.pricingPage(staff, pricing)],
  ['/admin/coupons', admin.couponsPage(staff, [])],
  ['/admin/settings', admin.settingsPage(staff, settings, [])],
  ['/admin/analytics', admin.analyticsPage(staff, { salesToday: 24, salesWeek: 120, pages: 60, bw: 60, color: 0, done: 5, cancelled: 0, live: 1, total: 6, repeat: 1, customers: 5, avgHrs: 1 })],
]);
assert.match(pages.get('/login'), /href="\/auth\/google"[\s\S]*?Continue with Google/);
assert.doesNotMatch(pages.get('/login'), /name="email"|name="password"|code-request|demo-card|\/admin\/login|Shop staff/);
assert.doesNotMatch(pages.get('/admin/login'), /\/auth\/google/);
assert.match(pages.get('/admin/login'), /action="\/admin\/login"[\s\S]*name="email"[\s\S]*name="password"/);
assert.doesNotMatch(loginPage(null,false), /href="\/auth\/google"/);
assert.match(loginPage(null,false), /temporarily unavailable/);
for (const route of ['/customer', '/customer/orders/new']) {
  assert.match(pages.get(route), /<nav class="snav"[^>]*>[\s\S]*?<a href="\/customer"[^>]*>[\s\S]*?<span>Home<\/span><\/a>[\s\S]*?<a href="\/customer\/orders\/new"[^>]*>[\s\S]*?<span>Print<\/span><\/a>/);
  assert.match(pages.get(route), /<a href="\/customer\/referrals"[^>]*>[\s\S]*?<span>Refer &amp; Earn<\/span><\/a>/);
}
assert.match(pages.get('/customer'), /<a href="\/customer" class="live" aria-current="page">[\s\S]*?<span>Home<\/span><\/a>/);
assert.match(pages.get('/customer/orders/new'), /<a href="\/customer\/orders\/new" class="live" aria-current="page">[\s\S]*?<span>Print<\/span><\/a>/);
for (const [route, html] of pages) {
  if (!route.startsWith('/customer')) continue;
  const nav = html.match(/<nav class="snav"[^>]*>([\s\S]*?)<\/nav>/)[1];
  assert.deepEqual([...nav.matchAll(/<a href="([^"]+)"/g)].slice(0, 6).map(m => m[1]), ['/customer', '/customer/orders/new', '/stationery', '/customer/orders', '/customer/wallet', '/customer/profile'], `${route}: stationery and all basic pages fit the mobile bar`);
}
for (const route of ['/', '/customer']) {
  const shortcuts = pages.get(route).match(/<nav class="home-account-actions[^>]*>([\s\S]*?)<\/nav>/)[1];
  assert.match(shortcuts, /href="\/customer\/wallet">(?:<span>)?Wallet \/ Top-up/);
  assert.match(shortcuts, /href="\/customer\/profile">(?:<span>)?My Account/);
}
assert.match(pages.get('/'), /<nav class="customer-mobile-nav"/);
assert.doesNotMatch(readFileSync(new URL('../public/qk-landing.css', import.meta.url), 'utf8'), /\.site-header\s*\{[^}]*visibility:hidden/);
assert.match(readFileSync(new URL('../public/qk-landing.css', import.meta.url), 'utf8'), /\.public-site \.interior-wrap\s*\{[^}]*margin-inline:auto/, 'Public page content must remain centered with side gutters');
assert.doesNotMatch(readFileSync(new URL('../public/qk-landing.css', import.meta.url), 'utf8'), /scroll-margin-top:/, 'Use the shared header scroll padding without adding a second anchor offset');
// Exercise the real auth handlers with in-memory stubs; no database, mail or session writes.
{
  const routes = new Map(), scope = {
    app: { get: (route, handler) => routes.set('GET ' + route, handler), post: (route, ...handlers) => routes.set('POST ' + route, handlers.at(-1)) },
    COOKIE: 'pk_demo', HOME: { customer: '/customer', admin: '/admin' }, process: { env: {} },
    parseCookies, customerDestination, getSessionUser: () => null, verifyCredentials: () => user,
    createSession: () => 'fake-session', loginLimiter() {}, loginView: error => error || 'login',
    loginOtpPage: () => 'code', demoLoginOn: () => false, normEmail: email => email,
    loadDb: () => ({ users: [user] }), requestEmailOtp: async () => ({ ok: true, mailed: true }), verifyEmailOtp: () => ({ ok: true })
  };
  const source = readFileSync(new URL('../server.mjs', import.meta.url), 'utf8');
  runInNewContext(source.slice(source.indexOf('function currentUser('), source.indexOf('function staffLogin(')), scope);
  const response = () => ({ cookies: {}, headers: {}, status() { return this; }, cookie(name, value, options) { this.cookies[name] = { value, options }; }, setHeader(name, value) { this.headers[name] = value; }, redirect(to) { this.location = to; }, send(body) { this.body = body; } });
  for (const destination of ['/customer/wallet', '/customer/profile', '/customer/orders']) {
    const guard = response();
    scope.requireRole('customer')({ method: 'GET', path: destination, protocol: 'https', headers: {} }, guard, () => assert.fail('Guest must sign in'));
    assert.equal(guard.location, '/login');
    assert.equal(guard.cookies.pk_next.value, destination);
    assert.equal(guard.cookies.pk_next.options.httpOnly, true);
    const req = { protocol: 'https', headers: { cookie: 'pk_next=' + encodeURIComponent(destination) }, body: { email: user.email, password: 'fake', code: '123456' } };
    for (const route of ['POST /login', 'POST /login/code-verify']) {
      const res = response(); await routes.get(route)(req, res);
      assert.equal(res.location, destination, `${route}: restore the selected page`);
      assert.ok(res.headers['Set-Cookie'].some(cookie => cookie.startsWith('pk_next=;') && cookie.includes('Max-Age=0')));
    }
    const otp = response(); await routes.get('POST /login/code-request')(req, otp);
    assert.equal(otp.body, 'code');
    assert.equal(otp.headers['Set-Cookie'], undefined, 'Code request retains the destination cookie');
  }
  for (const value of [undefined, '//evil.example', 'https://evil.example', '/customer/../admin', '/customer/wallet?next=https://evil.example', '/customer/wallet\r\n', '/customer/wallet\n', ['/customer/wallet']]) assert.equal(customerDestination(value), '/customer');
  for (const route of ['/customer', '/customer/orders/new', '/customer/packs', '/customer/referrals']) assert.equal(customerDestination(route), route);
  console.log('Navigation and sign-in checked: visible shortcuts, six mobile destinations including Stationery and safe return to Wallet / My Account.');
}
// Exercise the actual OAuth callback, including customer/staff separation, without Google or DB writes.
{
  const source = readFileSync(new URL('../server.mjs', import.meta.url), 'utf8');
  for (const scenario of ['customer','new-customer','staff','owner-email','unverified','replayed-state']) {
    let callback, sessions=0, saves=0;
    const db={users:scenario==='new-customer'||scenario==='owner-email'?[]:[scenario==='staff'?staff:user],wallets:[{customerId:user.id,balance:150}]};
    const scope={
      app:{get(route,fn){callback=fn;}}, GOOGLE:{id:'test',secret:'test'}, process:{env:{ADMIN_EMAIL:scenario==='owner-email'?user.email:''}},
      oauthStates:new Map(scenario==='replayed-state'?[]:[['nonce',Date.now()+60000]]), parseCookies, URLSearchParams,
      googleRedirectUri:()=> 'https://printkarr.in/auth/google/callback', loadDb:()=>db, saveDb(){saves++;}, referralCodeFor(){},
      createSession(){sessions++;return 'session';}, sessionCookie:()=>['session=test'], customerReturnTo:()=>'/customer/wallet', HOME:{customer:'/customer',admin:'/admin'}, loginView:error=>error,
      isAdminEmail:email=>scenario==='owner-email'&&email===user.email,
      fetch:async url=>({json:async()=>url.endsWith('/token')?{access_token:'test'}:{email:user.email,name:user.name,email_verified:scenario!=='unverified'}})
    };
    runInNewContext(source.slice(source.indexOf("app.get('/auth/google/callback'"),source.indexOf("app.post('/logout'")),scope);
    const res={status(code){this.code=code;return this;},send(body){this.body=body;},redirect(url){this.location=url;},setHeader(name,value){this.cookie=value;}};
    await callback({headers:{cookie:'g_state=nonce'},query:{state:'nonce',code:'test'}},res);
    if(scenario==='staff'||scenario==='owner-email'){assert.equal(res.location,'/admin/login');assert.equal(sessions,0);assert.equal(saves,0);}
    else if(scenario==='unverified'||scenario==='replayed-state'){assert.equal(res.code,401);assert.equal(sessions,0);}
    else {assert.equal(res.location,'/customer/wallet');assert.equal(sessions,1);assert.equal(saves,scenario==='new-customer'?1:0);assert.equal(db.wallets[0].balance,150);}
  }
  console.log('OAuth checked: Google customer access, retained wallet, staff credential separation and invalid-state rejection.');
}
assert.match(pages.get('/customer/orders/preview/scan'), /jsqr@1\.4\.0\/dist\/jsQR\.js/);
assert.match(pages.get('/'), /Printing in Vapi/);
assert.match(publicViews.landing({ pricing: { ...pricing, bw: 7, color: 11, studentBw: 6 } }), /A4 black &amp; white<\/span><strong>₹7<\/strong>[\s\S]*A4 colour<\/span><strong>₹11<\/strong>/);
for (const id of ['how-it-works', 'features', 'pricing', 'compare', 'kiosks', 'packs', 'referrals', 'faq']) assert.match(pages.get('/'), new RegExp(`id="${id}"`));
assert.match(pages.get('/'), /no pickup address has been announced yet/i);
assert.match(pages.get('/order/options'), /name="deliverySlot" value="college" checked/);
assert.match(pages.get('/order/options'), /<details class="order-more">/);
assert.match(pages.get('/customer/referrals'), /₹20 print credit/);
assert.doesNotMatch(pages.get('/customer/referrals'), /withdraw|real cash/i);

assert.match(pages.get('/customer/orders/preview/pay'), /class="receipt-paper"[\s\S]*ORDER #preview[\s\S]*₹24/);
assert.match(pages.get('/customer/orders/preview/pay'), /id="payForm"[\s\S]*name="method"/);
for (const [route, html] of pages) {
  assert.equal((html.match(/<header\b/g) || []).length, 1, `${route}: one header`);
  assert.equal((html.match(/<main\b/g) || []).length, 1, `${route}: one main landmark`);
  assert.match(html, /<h1\b/, `${route}: page heading`);
  assert.match(html, /design\.css\?v=/, `${route}: shared design system`);
  if (route === '/' || route === '/how-it-works') {
    assert.doesNotMatch(html, /pk-flow|Your file’s journey/, `${route}: removed crossed-out file journey`);
  }
  for (const script of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)) {
    if (script[0].includes('application/ld+json')) JSON.parse(script[1]);
    else new Script(script[1], { filename: route });
  }
}
assert.match(readFileSync(new URL('../public/design.css', import.meta.url), 'utf8'), /\.step-detail img \{[^}]*object-fit: contain/);
assert.match(readFileSync(new URL('../public/customer.css', import.meta.url), 'utf8'), /prefers-reduced-motion: reduce[^}]*receipt-paper/);
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
assert.match(pages.get('/'), /Good prints.<br><em>Zero fuss.<\/em>/);

for (const html of pages.values()) assert.doesNotMatch(html, /liquid-glass/);
assert.doesNotMatch(readFileSync(new URL('../public/qk-landing.css', import.meta.url), 'utf8'), /backdrop-filter|liquid-glass/);
// Run the camera promise chain: detecting a QR must stop the stream and navigate.
for (const playbackFails of [false, true]) {
  let click, stopped = 0;
  const status = { textContent:'' }, button = { disabled:false, addEventListener: (event, handler) => { click=handler; }, setAttribute() { this.disabled=true; }, removeAttribute() { this.disabled=false; } };
  const video = { style:{}, readyState:4, HAVE_ENOUGH_DATA:4, videoWidth:1, videoHeight:1, play: () => playbackFails ? Promise.reject(new Error('play blocked')) : Promise.resolve() };
  const win = { location:{href:''}, addEventListener() {} };
  const token = 'a'.repeat(32);
  const script = pages.get('/customer/orders/preview/scan').match(/<script>\s*(\(function\(\)\{[\s\S]*?)<\/script>/)[1];
  runInNewContext(script, {
    document: { getElementById: id => ({'scan-start':button,'scan-video':video,'scan-status':status}[id]), createElement: () => ({getContext: () => ({drawImage() {}, getImageData: () => ({data:[]})})}) },
    navigator: { mediaDevices:{getUserMedia: () => Promise.resolve({getTracks: () => [{stop() { stopped++; }}]})} },
    window:win, jsQR: () => ({data:'https://printkarr.in/c/' + token}), requestAnimationFrame() { assert.fail('A found QR must not keep scanning'); }
  });
  click();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(stopped, 1, 'Camera stream is released on success and playback failure');
  assert.equal(win.location.href, playbackFails ? '' : '/c/' + token);
  if (playbackFails) assert.equal(button.disabled, false, 'Camera can be retried after failure');
}
const collectedPage = publicViews.collectPage({state:'collected', message:'Order marked collected.'});
assert.match(collectedPage, /Pickup <em>confirmed/);
assert.doesNotMatch(collectedPage, /Link <em>expired/);
// A broken at-rule once swallowed every layout rule after the navigation.
for (const file of ['qk-landing.css', 'design.css', 'customer.css']) {
  const css = readFileSync(new URL('../public/' + file, import.meta.url), 'utf8');
  const tokens = css.replace(/\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g, '');
  const stack = [], pairs = { ')': '(', '}': '{', ']': '[' };
  for (const token of tokens) {
    if ('({['.includes(token)) stack.push(token);
    else if (')}]'.includes(token)) assert.equal(stack.pop(), pairs[token], `${file}: unmatched CSS delimiter`);
  }
  assert.equal(stack.length, 0, `${file}: unclosed CSS rule`);
}
console.log('Shared styles checked: balanced rules and media queries.');
// Every kiosk view uses a real responsive image and no 3D dependencies.
for (const html of pages.values()) assert.doesNotMatch(html, /kiosk-3d|qp-3d|three[-.]|kiosk\.obj|qk-stage|qk-canvas/);
for (const route of ['/', '/franchise', '/xerox']) assert.match(pages.get(route), /src="\/images\/kiosk-hero\.webp"[^>]*srcset=[^>]*alt="PrintKarr planned/);
console.log('Kiosk checked: responsive image across every public view, no 3D renderer.');
// Wallet choice updates the existing top-up fields, selected state, and configured reward.
{
  const html = pages.get('/customer/wallet');
  const source = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(s=>s.includes('var offers ='));
  const fields = {amount:{value:49,addEventListener(type,fn){this.input=fn;},focus(){}}, topNudge:{}, offerId:{value:'first'}};
  const buttons = campaign.wallets.filter(o=>o.enabled).map(o=>({dataset:{offer:o.id,amount:o.amount},addEventListener(type,fn){this.click=fn;},setAttribute(name,value){this[name]=value;},closest(){return {classList:{toggle(){}}};}}));
  runInNewContext(source, {document:{getElementById:id=>fields[id],querySelectorAll:()=>buttons}});
  const study = buttons.find(b=>b.dataset.offer==='study'), files = buttons.find(b=>b.dataset.offer==='files');
  study.click(); assert.equal(fields.amount.value,199); assert.equal(fields.offerId.value,'study');
  assert.match(fields.topNudge.textContent,/225/); assert.equal(study['aria-pressed'],'true'); assert.equal(buttons[0]['aria-pressed'],'false');
  files.click(); assert.equal(fields.amount.value,149); assert.equal(fields.offerId.value,'files');
  assert.match(fields.topNudge.textContent,/3 free paper\/cardboard files/); assert.doesNotMatch(fields.topNudge.textContent,/₹0 bonus/);
  fields.amount.value=123; fields.amount.input(); assert.equal(fields.offerId.value,''); assert.match(fields.topNudge.textContent,/Custom top-up.*123/);
  console.log('Wallet choice checked: configured bonus, selection state and custom top-up.');
}
// Optional animation libraries never gate content, and motion preference changes cancel effects.
{
  const source = readFileSync(new URL('../public/design-motion.js', import.meta.url), 'utf8');
  runInNewContext(source, { window:{ matchMedia:() => ({matches:true}) } });
  let change, cancelled=0, reset=0;
  const node = { style:{removeProperty(){reset++;}} };
  // The preference object is live, as it is in the browser.
  const pref = {matches:false, addEventListener(type, fn){change=fn;}};
  runInNewContext(source, {window:{matchMedia:() => pref, gsap:{fromTo:() => ({kill(){cancelled++;}})}}, document:{querySelector:selector => selector === '.editorial-hero' ? node : null, querySelectorAll:selector => selector.startsWith('.hero-eyebrow') ? [node] : []}});
  pref.matches=true; change(); assert.equal(cancelled,1); assert.equal(reset,2);
  runInNewContext(source, {window:{matchMedia:() => ({matches:false,addEventListener(){}})}, document:{querySelector:()=>null,querySelectorAll:()=>[]}});
  const effects = [], observed = [], nodes = {row:{style:{}}, rate:{style:{}}, wallet:{style:{}}};
  let reveal;
  function Observer(callback) { reveal=callback; this.observe=node=>observed.push(node); this.unobserve=()=>{}; }
  runInNewContext(source, {IntersectionObserver:Observer, window:{IntersectionObserver:Observer,matchMedia:()=>({matches:false,addEventListener(){}}),Motion:{animate:(node,frames)=>{effects.push({node,frames});return {};}}}, document:{querySelector:()=>null,querySelectorAll:selector=>selector === '.process-list li' ? [nodes.row] : selector.startsWith('.qk-prices') ? [nodes.rate] : selector === '.wallet-art-card' ? [nodes.wallet] : []}});
  reveal(observed.map(target=>({target,isIntersecting:true})));
  assert.equal(effects.find(e=>e.node===nodes.row).frames.x[0],36);
  assert.equal(effects.find(e=>e.node===nodes.rate).frames.scale[0],.88);
  assert.equal(effects.find(e=>e.node===nodes.wallet).frames.rotate[1],-6);
  const classes=new Set(), button={addEventListener(type,fn){this.click=fn;},setAttribute(name,value){this[name]=value;}};
  const marquee={querySelector:()=>button,classList:{toggle(name){classes.has(name)?classes.delete(name):classes.add(name);return classes.has(name);},add(name){classes.add(name);}}};
  runInNewContext(source, {window:{matchMedia:()=>({matches:false,addEventListener(){}})},document:{querySelector:selector=>selector === '.print-marquee' ? marquee : null,querySelectorAll:()=>[]}});
  button.click(); assert.equal(button['aria-pressed'],'true'); assert.equal(button.textContent,'Resume motion');
  button.click(); assert.equal(button['aria-pressed'],'false'); assert.ok(!classes.has('is-paused'));
  assert.equal((pages.get('/').match(/class="print-marquee"/g)||[]).length,1);
  assert.match(readFileSync(new URL('../public/design.css',import.meta.url),'utf8'),/@view-transition\s*\{\s*navigation:auto/);
  console.log('Motion checked: reduced-motion, changing preference, and missing-library fallback.');
}
if (process.argv.includes('--serve')) {
  const app = express();
  app.use(express.static('public', { index: false }));
  app.get(['/customer/orders/preview/preview.pdf', '/customer/orders/new/preview/preview.pdf'], (_req,res)=>res.type('pdf').send(buildCoverPdf('PrintKarr preview', [['Document','Fictional print preview'],['Review','Check your pages, margins and settings']])));
  // The preview intentionally accepts no form submissions.
  app.get('*', (req, res) => pages.has(req.path) ? res.send(pages.get(req.path)) : res.status(404).send('Preview route not found'));
  app.listen(3100, '127.0.0.1', () => console.log('Read-only design preview: http://127.0.0.1:3100'));
}
