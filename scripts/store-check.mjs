// One runnable check for the commerce flow: node scripts/store-check.mjs [--browser].
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync, utimesSync, existsSync, rmSync, mkdtempSync } from 'node:fs';
import nodePath from 'node:path';
import { tmpdir } from 'node:os';
import { saveDb } from '../lib/db.js';
import { janitor } from '../lib/janitor.js';
import { cartFor, setQuantity, addPrint, cartQuote, createPurchase, confirmPurchase, cancelPurchase, availableStock, saveProduct, checkPackQuota, catalogue } from '../lib/store.js';
import { previewDb, createStorePreview, couponPolicy } from './store-preview.mjs';
import { walletOf, topupTerms, applyTopup, settleWallets, deliveryPlan } from '../lib/campus.js';
const validate = couponPolicy.validateCoupon, customer = 'preview-customer';
const selection = { addressId: 'preview-address', deliverySlot: 'express' };
const print = (db, id, subtotal = 50) => { const o = { id, customerId: customer, status: 'CREATED', paymentStatus: 'pending', subtotal, total: subtotal + 15, pages: 25, copies: 1, printType: 'bw', document: 'Assignment.pdf', history: [] }; db.orders.push(o); return o; };
for (const type of ['stationery', 'prints', 'mixed']) for (const amount of [148.99, 149, 150]) {
  const db = previewDb(true), cart = cartFor(db, customer);
  db.products[0].price = type === 'mixed' ? amount - 50 : amount;
  if (type !== 'prints') setQuantity(db, cart, 'demo-file', 'green', 1);
  if (type !== 'stationery') { print(db, 'PK-1', type === 'mixed' ? 50 : amount); addPrint(db, customer, 'PK-1'); }
  const q = cartQuote(db, cart, customer, selection, validate);
  assert.equal(q.net, amount); assert.equal(q.deliveryFee, 15, `${type} express ${amount}`);
  const scheduled=cartQuote(db,cart,customer,{...selection,deliverySlot:'local-vapi-afternoon'},validate);assert.equal(scheduled.deliveryFee,amount<149?10:0,`${type} scheduled ${amount}`); assert.equal(q.total, amount + q.deliveryFee + q.processingFee);
}
{
  const db = previewDb(true), cart = cartFor(db, customer);
  db.products[0].price = 149; setQuantity(db, cart, 'demo-file', 'orange', 1);
  assert.equal(cartQuote(db, cart, customer, { ...selection, coupon: 'DESK10' }, validate).deliveryFee, 15, 'Discounts reduce qualifying item value');
  db.addresses[0].lat = 20.54; db.addresses[0].lng = 73.09;
  assert.throws(() => cartQuote(db, cart, customer, selection, validate), /outside/);
  assert.throws(() => cartQuote(db, cart, customer, { ...selection, deliverySlot: 'pickup' }, validate), /development/);
  assert.throws(() => cartQuote(db, cart, customer, { ...selection, addressId: 'someone-else' }, validate), /address/);
  assert.throws(() => setQuantity(db, cart, 'demo-file', 'purple', 1), /colour/);
  assert.throws(() => setQuantity(db, cart, 'demo-file', 'red', 1.5), /quantity/);
  assert.throws(() => setQuantity(db, cart, 'demo-file', 'red', -1), /quantity/);
  assert.throws(() => saveProduct(db, {name:'X',category:'Y',price:0.001,stock:1}), /price/);
  assert.throws(() => saveProduct(db, {name:'X',category:'Y',price:1,stock:1,image:'javascript:alert(1)'}), /photo/);
}
{
  const db = previewDb(), cart = cartFor(db, customer);
  assert.deepEqual(catalogue(db),[], 'Demo products stay out of the customer catalogue');
  assert.deepEqual(catalogue({products:[]}),[], 'An empty catalogue never falls back to demo products');
  assert.throws(() => setQuantity(db,cart,'demo-file','orange',1),/available product/);
  cart.lines=[{productId:'demo-file',color:'orange',quantity:1}];
  assert.throws(() => createPurchase(db,cart,customer,selection,validate),/no longer available/);
  assert.deepEqual(cartFor(db,customer).lines,[], 'Unpaid carts stop displaying old sample items');
  const published=saveProduct(db,{id:'demo-file',name:'Owner verified file',category:'Files',price:25,stock:5,colors:'green',active:'on'});
  assert.equal(published.demo,false);assert.equal(catalogue(db).length,1);assert.equal(availableStock(db,published.id),5,'A sample can be replaced with verified real stock');
  setQuantity(db,cart,published.id,'green',1);assert.equal(cartQuote(db,cart,customer,selection,validate).items[0].demo,false);
}
{
  const db = previewDb(true), cart = cartFor(db, customer); db.products[0].stock = 2;
  setQuantity(db, cart, 'demo-file', 'orange', 2); print(db, 'PK-1'); addPrint(db, customer, 'PK-1');
  const p = createPurchase(db, cart, customer, {...selection,coupon:'desk10'}, validate);
  assert.equal(availableStock(db,'demo-file'),0); assert.equal(createPurchase(db,cart,customer,selection,validate).id,p.id,'Double-click checkout reserves once');
  const other = cartFor(db,'other-customer'); assert.throws(()=>setQuantity(db,other,'demo-file','green',1),/unavailable/);
  assert.throws(()=>setQuantity(db,cart,'demo-file','orange',1),/checkout/);
  assert.throws(()=>saveProduct(db,{id:'demo-file',name:'File',category:'Files',price:25,stock:1}),/reserved/);
  assert.equal(validate(db,'DESK10',100,customer).ok,false,'Open basket reserves coupon');
  assert.equal(confirmPurchase(db,p,'wallet',null,validate),true); const balance=walletOf(db,customer).balance;
  assert.equal(confirmPurchase(db,p,'wallet',null,validate),false); assert.equal(walletOf(db,customer).balance,balance,'Replay never debits twice');
  assert.equal(db.products[0].stock,0); assert.equal(db.orders.length,1); assert.equal(db.orders[0].status,'PRINT_QUEUE'); assert.equal(db.orders[0].purchaseId,p.id);
  assert.equal(db.orders[0].total + p.items.reduce((s,i)=>s+i.total,0) - (p.couponDiscount-db.orders[0].cartDiscount), p.total, 'Shared totals allocated once');
  cancelPurchase(db,p,customer,()=>{},()=>{}); assert.equal(walletOf(db,customer).balance,1000); assert.equal(db.products[0].stock,2);
  cancelPurchase(db,p,customer,()=>{},()=>{}); assert.equal(walletOf(db,customer).balance,1000); assert.equal(db.products[0].stock,2);
  assert.equal(validate(db,'DESK10',100,customer).ok,false,'Refunded paid coupon stays used');
}
{
  const db=previewDb(true),cart=cartFor(db,customer);setQuantity(db,cart,'demo-file','yellow',1);
  const p=createPurchase(db,cart,customer,{...selection,coupon:'DESK10'},validate);cancelPurchase(db,p,customer,()=>{},()=>{});
  assert.equal(validate(db,'DESK10',100,customer).ok,true,'Unpaid cancel releases coupon');assert.equal(availableStock(db,'demo-file'),99);
  const legacy=print(db,'PK-OLD');Object.assign(legacy,{couponCode:'DESK10',couponDiscount:10,paymentStatus:'paid',paymentMethod:'wallet',status:'DELIVERED'});
  assert.throws(()=>createPurchase(db,cart,customer,{...selection,coupon:'DESK10'},validate),/already used/);
  legacy.couponDiscount=0;assert.equal(validate(db,'DESK10',100,customer).ok,false,'A used code remains single-use even if another benefit reduced its discount to zero');
}
{
  const db=previewDb(true), guest=cartFor(db,null), own=cartFor(db,customer);setQuantity(db,guest,'demo-file','orange',1);setQuantity(db,own,'demo-file','green',1);
  assert.equal(cartFor(db,customer,guest.id).lines.length,2,'Guest cart merges after login');
  assert.notEqual(cartFor(db,'other',own.id).id,own.id,'Another account cannot adopt a customer cart');
  const a=print(db,'PK-A'),b=print(db,'PK-B');a.packSubId=b.packSubId='S';db.packSubs=[{id:'S',customerId:customer,paidTotal:199,bwTotal:30,bwUsed:0}];
  assert.throws(()=>checkPackQuota(db,[a,b]),/cannot cover/);b.status='CANCELLED';assert.doesNotThrow(()=>checkPackQuota(db,[a]));
}
console.log('Cart checks passed: all basket types below/at/above ₹149, discounted threshold, serviceability, ownership, colours, stock, coupon reuse, pack reservations and payment/refund replay.');

{
  const db=previewDb(true),cart=cartFor(db,customer);db.coupons=[{code:'PENNY',type:'fixed',value:.02,active:true}];
  for(const id of ['PK-1','PK-2','PK-3']){print(db,id,1);addPrint(db,customer,id);}
  const p=createPurchase(db,cart,customer,{...selection,coupon:'PENNY'},validate);confirmPurchase(db,p,'wallet',null,validate);
  assert.equal(Math.round(db.orders.reduce((s,o)=>s+o.total,0)*100),Math.round(p.total*100),'Multi-print discounts reconcile to the exact paid amount');
}

{
  const db=previewDb(true),p={id:'SHOP-PENDING',customerId:customer,status:'CREATED',paymentStatus:'pending',deliveryMode:'batch',deliveryFee:15,total:115,net:100,subtotal:100,printIds:[],history:[]};db.purchases.push(p);
  applyTopup(db,customer,topupTerms(db,customer,10),'Added');assert.equal(p.deliveryFee,15,'A top-up does not restore the old ₹99 cart threshold');
  const firstDb=previewDb(true),firstPurchase={...p,history:[]};firstDb.purchases.push(firstPurchase);
  applyTopup(firstDb,customer,topupTerms(firstDb,customer,49,'first'),'Added');assert.equal(firstPurchase.deliveryFee,0,'New first-wallet benefit reaches an unbound pending basket');assert.equal(firstPurchase.total,100);
  const at=Date.parse('2026-10-01T00:30:00+05:30'),plan=deliveryPlan(db,'morning','lit',at);
  db.purchases.push({id:'SHOP-LATE',customerId:customer,status:'PAID',paymentStatus:'paid',printIds:[],...plan,history:[{to:'PAID',at:new Date(at).toISOString()}]});
  const before=walletOf(db,customer).balance;settleWallets(db,Date.parse(plan.promisedBy)+1);assert.equal(walletOf(db,customer).balance,before+plan.lateCredit);settleWallets(db,Date.parse(plan.promisedBy)+2);assert.equal(walletOf(db,customer).balance,before+plan.lateCredit,'Stationery delivery guarantee credits only once');
}

let captures=0,paid=false;
const fixture = createStorePreview(previewDb(true), { preview: false, gateway: {id:'fake-key',secret:'fake-secret'}, fetchGateway:async(url,options)=>{
  if(url.endsWith('/orders'))return {ok:true,json:async()=>({id:'order-bound',amount:3900,currency:'INR'})};
  if(url.endsWith('/capture')){assert.deepEqual(JSON.parse(options.body),{amount:3900,currency:'INR'});captures++;paid=true;}
  return {ok:true,json:async()=>({order_id:'order-bound',amount:3900,currency:'INR',status:paid?'captured':'authorized'})};
} });
const server = await new Promise(resolve=>{const s=fixture.app.listen(0,'127.0.0.1',()=>resolve(s));});
const base = `http://127.0.0.1:${server.address().port}`;
let cookie='';
async function request(route, body, extraHeaders={}) {
  const response=await fetch(base+route,{method:body?'POST':'GET',headers:{Cookie:cookie,...(body?{'Content-Type':'application/x-www-form-urlencoded'}:{}),...extraHeaders},body:body?new URLSearchParams(body):undefined,redirect:'manual'});
  const cookies=response.headers.getSetCookie();if(cookies.length)cookie=[cookie,...cookies.map(c=>c.split(';')[0])].filter(Boolean).join('; ');
  return response;
}
try {
  assert.equal((await request('/admin/catalogue')).status,403);
  assert.equal((await request('/cart/items',{productId:'demo-file',color:'green',quantity:1,add:1},{Origin:'https://evil.example'})).status,403);
  assert.equal((await request('/cart/items',{productId:'demo-file',color:'green',quantity:1,add:1})).status,302);
  const quote = await request('/cart/quote',selection); assert.match(await quote.text(),/₹40/);
  const created=await request('/cart/checkout',{...selection,coupon:'DESK10',total:1,deliveryFee:0});const path=created.headers.get('location');assert.ok(path?.startsWith('/customer/purchases/'));
  assert.equal(fixture.snapshot().purchases[0].total,30,'Client total and delivery overrides ignored');
  assert.equal((await request(path+'/wallet',{})).status,302);assert.equal(fixture.snapshot().wallets[0].balance,970);
  await request(path+'/wallet',{});assert.equal(fixture.snapshot().wallets[0].balance,970);
  await request('/cart/items',{productId:'demo-pencil',quantity:1,add:1});
  const next=await request('/cart/checkout',selection);const online=next.headers.get('location');
  assert.equal((await request(online+'/gateway',{})).status,200);
  assert.equal((await request(online+'/cancel',{})).status,400,'Do not release stock while a bound gateway order is payable');
  const proof={razorpay_order_id:'order-bound',razorpay_payment_id:'pay-bound'};proof.razorpay_signature=crypto.createHmac('sha256','fake-secret').update('order-bound|pay-bound').digest('hex');
  assert.equal((await request(online+'/verify',{...proof,razorpay_order_id:'other-order'})).status,400);
  assert.equal((await request(online+'/verify',{...proof,razorpay_signature:'0'.repeat(64)})).status,400);
  assert.equal((await request(online+'/verify',proof)).status,302);assert.equal(fixture.snapshot().purchases[1].paymentStatus,'paid');
  await request(online+'/verify',proof);assert.equal(fixture.snapshot().products.find(p=>p.id==='demo-pencil').stock,98);
  assert.equal(captures,1,'Authorised payment is captured once for the bound server amount');
  cookie+='; preview_role=admin';
  assert.equal((await request(path.replace('/customer/','/admin/')+'/status',{to:'READY'})).status,302);
  assert.equal((await request(path.replace('/customer/','/admin/')+'/status',{to:'OUT_FOR_DELIVERY'})).status,302);
  assert.equal((await request(path.replace('/customer/','/admin/')+'/status',{to:'DELIVERED'})).status,302);
  assert.equal(fixture.snapshot().purchases[0].status,'DELIVERED','Whole-basket fulfilment works');
  assert.equal((await request('/admin/catalogue',{name:'Owner supplied file',category:'Files',price:'149',stock:'5',colors:'orange, green, red, yellow',active:'on',demo:'on'})).status,302);
  const publicShop=await(await request('/stationery')).text();assert.ok(!publicShop.includes('Owner supplied file'),'Sample drafts stay hidden from customers');
  assert.equal(fixture.snapshot().products.at(-1).name,'Owner supplied file');assert.deepEqual(fixture.snapshot().products.at(-1).colors,['orange','green','red','yellow']);
  const png = readFileSync('public/favicon-32x32.png');
  async function uploadPhoto(bytes, filename, fields = {}, headers = {}) {
    const form = new FormData();
    for (const [key, value] of Object.entries({name:'Photo product',category:'Files',price:'25',stock:'5',active:'on',...fields})) form.set(key,value);
    form.set('photo',new Blob([bytes]),filename);
    return fetch(base+'/admin/catalogue',{method:'POST',body:form,headers:{Cookie:cookie,...headers},redirect:'manual'});
  }
  const beforePhotos=fixture.snapshot().products.length;
  assert.equal((await uploadPhoto(png,'photo.png',{}, {Cookie:'preview_role=customer'})).status,403);
  assert.equal((await uploadPhoto(png,'photo.png',{}, {Origin:'https://evil.example'})).status,403);
  for (const [bytes, name] of [[Buffer.from('<svg></svg>'),'image.svg'],[Buffer.from('MZ-not-a-photo'),'image.jpg'],[png,'program.exe'],[Buffer.alloc(0),'empty.png'],[Buffer.alloc(5*1024*1024+1),'big.png']]) assert.equal((await uploadPhoto(bytes,name)).status,400,`Reject ${name}`);
  assert.equal((await uploadPhoto(png,'photo.png',{price:'-1'})).status,400);
  assert.equal(fixture.snapshot().products.length,beforePhotos,'Invalid uploads never create a product');
  assert.equal((await uploadPhoto(png,'photo.PNG',{image:'https://ignored.example/fake.png'})).status,302);
  const product=fixture.snapshot().products.at(-1),image=product.image;
  assert.match(image,/^\/product-images\/store-[a-f0-9-]{36}\.png$/);
  const photoResponse=await request(image);assert.equal(photoResponse.status,200);assert.match(photoResponse.headers.get('content-type'),/image\/png/);
  assert.deepEqual(Buffer.from(await photoResponse.arrayBuffer()),png,'The uploaded photo is publicly served unchanged');
  assert.equal((await request('/admin/catalogue',{id:product.id,name:'Edited photo product',category:'Files',price:25,stock:5,active:'on',image:'https://ignored.example/replacement.png'})).status,302);
  assert.equal(fixture.snapshot().products.at(-1).image,image,'Editing without a file retains the current photo');
  assert.equal((await uploadPhoto(png,'replacement.png',{id:product.id})).status,302);
  const replacement=fixture.snapshot().products.at(-1).image;
  assert.notEqual(replacement,image);assert.equal((await request(image)).status,404,'Replaced photos are no longer public');
  assert.equal((await request('/product-images/PK-ACTIVE.pdf')).status,404,'Print documents cannot be served as product photos');
  const retentionRoot=mkdtempSync(nodePath.join(tmpdir(),'printkarr-store-retention-')),uploads=nodePath.join(retentionRoot,'data','uploads'),dbFile=nodePath.join(retentionRoot,'db.json');
  try {
    mkdirSync(uploads,{recursive:true});
    for(const url of [image,replacement]){const file=nodePath.join(uploads,nodePath.basename(url));writeFileSync(file,png);utimesSync(file,new Date(Date.now()-2*864e5),new Date(Date.now()-2*864e5));}
    saveDb({...previewDb(true),products:[fixture.snapshot().products.at(-1)]},dbFile);
    assert.equal(janitor(retentionRoot,15,dbFile),1);
    assert.ok(existsSync(nodePath.join(uploads,nodePath.basename(replacement))),'Current product photos survive document cleanup');
    assert.ok(!existsSync(nodePath.join(uploads,nodePath.basename(image))),'Replaced photos are cleaned after 24 hours');
  } finally {rmSync(retentionRoot,{recursive:true,force:true});}
  console.log('Product photo checks passed: local upload, authentication, origin, signatures, size, public delivery, edit retention and orphan cleanup.');
  console.log('HTTP checks passed: origin and role guards, native cart/quote/checkout, server totals, wallet replay, bound captured gateway payment and replay.');
} finally { await new Promise(resolve=>server.close(resolve)); rmSync(fixture.uploadsDir,{recursive:true,force:true}); }

if (process.argv.includes('--browser')) {
  const {default:puppeteer}=await import('puppeteer-core');
  const preview=createStorePreview(),browserServer=await new Promise(resolve=>{const s=preview.app.listen(0,'127.0.0.1',()=>resolve(s));});
  const url=`http://127.0.0.1:${browserServer.address().port}`;
  const browser=await puppeteer.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
  const errors=[];mkdirSync('docs/store-preview-focused',{recursive:true});mkdirSync('docs/shop-discovery-preview',{recursive:true});
  try {
    for(const width of [320,390,1440]) {
      preview.reset();
      const context=await browser.createBrowserContext(),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
      await page.setViewport({width,height:1000});await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
      await page.goto(url+'/',{waitUntil:'networkidle0'});
      if(await page.$('[data-wallet-prompt][open]')) await page.click('.wallet-prompt-close');
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Home overflow at ${width}`);
      assert.equal(await page.$eval('.hero-shop-link',e=>e.getAttribute('href')),'/stationery');
      assert.equal(await page.$eval('.home-stationery .btn',e=>e.getAttribute('href')),'/stationery');
      const aligned=await page.evaluate(()=>{const button=document.querySelector('.wallet-topup-button').getBoundingClientRect(),copy=document.querySelector('.wallet-chapter h2').getBoundingClientRect();return Math.abs(button.left-copy.left)<2;});
      assert.ok(aligned,`Wallet button aligned with copy at ${width}`);
      await page.screenshot({path:`docs/shop-discovery-preview/home-${width}.png`});
      await page.$('.home-stationery').then(e=>e.screenshot({path:`docs/shop-discovery-preview/promo-${width}.png`}));
      await page.$('.wallet-chapter').then(e=>e.screenshot({path:`docs/shop-discovery-preview/wallet-${width}.png`}));
      if(width<760) {
        assert.ok(await page.$eval('.customer-mobile-nav a[href="/stationery"]',e=>{const r=e.getBoundingClientRect();return r.width>=44&&r.height>=44&&getComputedStyle(e).display!=='none';}),'Stationery is visible with a usable touch target');
        await Promise.all([page.waitForNavigation({waitUntil:'networkidle0'}),page.click('.customer-mobile-nav a[href="/stationery"]')]);assert.ok(page.url().endsWith('/stationery'));
      }
      await page.goto(url+'/stationery',{waitUntil:'networkidle0'});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Shop overflow at ${width}`);
      await page.screenshot({path:`docs/store-preview-focused/shop-${width}.png`,fullPage:true});
      await page.type('[data-product-search]','file');assert.equal(await page.$$eval('[data-product]',els=>els.filter(e=>!e.hidden).length),1);
      await page.click('[name="color"][value="red"]');await page.click('[data-add-product] button');await page.waitForFunction(()=>document.querySelector('[data-cart-count]').textContent==='1');
      await page.goto(url+'/customer/orders/new',{waitUntil:'networkidle0'});await Promise.all([page.waitForNavigation({waitUntil:'networkidle0'}),page.click('form[action="/preview/print"] button')]);
      assert.ok(await page.$('.delivery-progress'), `Print submission at ${page.url()}: ${await page.$eval('body',e=>e.textContent.slice(0,1000))}`);
      assert.match(await page.$eval('.delivery-progress',e=>e.textContent),/₹74/);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Cart overflow at ${width}`);
      await page.screenshot({path:`docs/store-preview-focused/cart-${width}.png`,fullPage:true});
      await page.$eval('#cart-coupon',e=>{e.value='DESK10';});await Promise.all([page.waitForNavigation({waitUntil:'networkidle0'}),page.click('[formaction="/cart/quote"]')]);
      assert.match(await page.$eval('.delivery-progress',e=>e.textContent),/₹84/);
      await Promise.all([page.waitForNavigation({waitUntil:'networkidle0'}),page.click('button[type="submit"].loud')]);
      await Promise.all([page.waitForNavigation({waitUntil:'networkidle0'}),page.click('.receipt-actions button.loud')]);assert.match(await page.$eval('.store-status',e=>e.textContent),/PAID/);
      await page.screenshot({path:`docs/store-preview-focused/receipt-${width}.png`,fullPage:true});
      await page.goto(url+'/preview/role/admin',{waitUntil:'networkidle0'});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Admin overflow at ${width}`);
      await page.screenshot({path:`docs/store-preview-focused/admin-${width}.png`,fullPage:true});
      assert.equal(await page.$('#product-image'),null,'The catalogue uses a local file picker');
      await page.type('#product-name','Uploaded photo notebook');await page.type('#product-category','Notebooks');await page.type('#product-price','30');await page.type('#product-stock','8');
      const input=await page.$('#product-photo');await input.uploadFile(nodePath.resolve('public/favicon-32x32.png'));
      await Promise.all([page.waitForNavigation({waitUntil:'networkidle0'}),page.click('form[action="/admin/catalogue"] button[type="submit"]')]);
      const uploaded=preview.snapshot().products.at(-1);assert.match(uploaded.image,/^\/product-images\//);
      await page.goto(url+'/admin/catalogue?edit='+uploaded.id,{waitUntil:'networkidle0'});
      assert.ok(await page.$eval('.catalogue-photo',e=>e.complete&&e.naturalWidth>0),'Saved photo loads in the product editor');
      await page.goto(url+'/preview/role/customer',{waitUntil:'networkidle0'});
      assert.ok(await page.$eval('[data-product] img[src^="/product-images/"]',e=>e.complete&&e.naturalWidth>0),'Uploaded photo loads in the storefront');
      if(width<760){await page.goto(url+'/customer/profile',{waitUntil:'networkidle0'});assert.ok(await page.$eval('.snav a[href="/stationery"]',e=>getComputedStyle(e).display!=='none'),'Stationery visible in account mobile navigation');}
      await context.close();
    }
    assert.deepEqual(errors,[]);console.log('Browser checks passed at 320, 390 and 1440px: visible stationery navigation, homepage promotion, aligned wallet button, local photo upload and display, plus shared cart checkout.');
  } finally {await browser.close();await new Promise(resolve=>browserServer.close(resolve));rmSync(preview.uploadsDir,{recursive:true,force:true});}
}
