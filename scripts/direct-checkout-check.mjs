// Run: node scripts/direct-checkout-check.mjs [--browser]
// In-memory customers only: no payments, email, production data or printer.
import assert from 'node:assert/strict';
import {writeFileSync, mkdirSync} from 'node:fs';
import path from 'node:path';
import {PDFDocument} from 'pdf-lib';
import {institutionAddress, deliveryPlan} from '../lib/campus.js';
import {deliveryFeeFor} from '../lib/pricing.js';
import {cartFor, cartQuote, setQuantity} from '../lib/store.js';
import {previewDb, couponPolicy} from './store-preview.mjs';
import {createOrderPreview} from './order-preview.mjs';
const seed=previewDb(true), user=seed.users[0];seed.settings.campaign.firstPrint.enabled=false;
const school={institutionLocation:'locality:vapi-chala',institutionName:'Sample Public School'};
const address=institutionAddress(seed,school,user.id);assert.equal(address.pin,'');assert.equal(address.landmark,'Main gate');assert.equal(address.locationAccuracy,'locality');
assert.equal(institutionAddress(seed,{institutionLocation:'campus:lit',institutionName:'Spoofed'},user.id).institutionName,'LIT Sarigam');
for(const input of [{institutionLocation:'address:preview-address'}, {...school,institutionName:'x'}, {...school,institutionLocation:'locality:made-up'}, {...school,institutionLocation:'locality:vapi-other'}])assert.throws(()=>institutionAddress(seed,input,user.id));
seed.addresses.push({...address,id:'school-saved',customerId:user.id,phone:user.phone,isDefault:true});
assert.throws(()=>institutionAddress(seed,{institutionLocation:'address:school-saved'},'someone-else'));
assert.throws(()=>institutionAddress(seed,{institutionLocation:'address:school-saved'}));
const far={...institutionAddress(seed,{institutionLocation:'campus:lit'},user.id),lat:0,lng:0};assert.throws(()=>deliveryFeeFor(seed.pricing,far.area,far,deliveryPlan(seed,'school')));
const cart=cartFor(seed,user.id);setQuantity(seed,cart,seed.products[0].id,'green',1);
const q=cartQuote(seed,cart,user.id,{...school,deliverySlot:'school'},couponPolicy.validateCoupon);assert.equal(q.address.pin,'');assert.equal(q.deliveryFee,10);
seed.carts=[];
const preview=createOrderPreview(seed),server=preview.app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));const base='http://127.0.0.1:'+server.address().port;
const request=(url,body,cookie='',json=false)=>fetch(base+url,{redirect:'manual',method:body?'POST':'GET',headers:{cookie,'Content-Type':'application/x-www-form-urlencoded',...(body?{Origin:base}:{}),...(json?{Accept:'application/json'}:{})},body:body?new URLSearchParams(body):undefined});
const file=await PDFDocument.create();for(let i=0;i<8;i++)file.addPage().drawText('Fictional checkout page '+(i+1));const bytes=Buffer.from(await file.save());
async function upload(cookie=''){const form=new FormData();form.append('doc',new Blob([bytes],{type:'application/pdf'}),'Student assignment.pdf');const r=await fetch(base+(cookie?'/order/upload':'/customer/orders/new/upload'),{method:'POST',body:form,headers:{cookie},redirect:'manual'});assert.equal(r.status,302);return {draft:new URL(r.headers.get('location'),base).searchParams.get('draft'),cookie:cookie?cookie+'; '+r.headers.get('set-cookie').split(';')[0]:''};}
try {
  const {draft}=await upload();const input={draft,...school,deliverySlot:'school',printType:'mixed',splitMixed:'1',mixedRange:'3,6',copies:1,sides:'single'};
  assert.equal((await request('/customer/orders/new/confirm',input)).status,302);
  let db=preview.snapshot();assert.equal(db.addresses.find(a=>a.id==='school-saved').isDefault,true,'Reusing an institution retains the chosen default');assert.equal(db.drafts[0].selections.institutionName,school.institutionName);assert.equal(db.drafts[0].selections.deliveryPoint.localityId,'vapi-chala');
  const count=db.addresses.length;assert.equal((await request('/customer/orders/new/confirm',input)).status,302);assert.equal(preview.snapshot().addresses.length,count,'Retrying does not duplicate saved institution addresses');
  assert.equal((await request('/customer/orders/new/confirm',{...input,institutionLocation:'address:school-saved',schoolPhone:'invalid'})).status,400);
  assert.equal((await request('/customer/orders/new/confirm',input)).status,302);
  const placed=await request('/customer/orders/new/place',{draft,checkout:'1',paymentMethod:'cod'},'',true);assert.equal(placed.status,200);const purchase=await placed.json();
  assert.equal((await request('/customer/purchases/'+purchase.id+'/cod',{expectedTotal:purchase.total})).status,400,'Cash consent is mandatory');
  assert.equal((await request('/customer/purchases/'+purchase.id+'/cod',{confirmCash:'1',expectedTotal:purchase.total+1})).status,400,'The amount shown must match');
  assert.equal((await request('/customer/purchases/'+purchase.id+'/cod',{confirmCash:'1',expectedTotal:purchase.total})).status,302);
  assert.equal((await request('/customer/purchases/'+purchase.id+'/cod',{confirmCash:'1',expectedTotal:purchase.total})).status,302);
  db=preview.snapshot();assert.equal(db.purchases[0].total,purchase.total+10);assert.equal(db.orders[0].paymentStatus,'cod_pending');assert.equal(db.orders[0].status,'PRINT_QUEUE');assert.equal(db.wallets[0].balance,1000);
  preview.reset();
  const native=await upload();assert.equal((await request('/customer/orders/new/confirm',{draft:native.draft,printType:'bw',copies:1,sides:'single',deliverySlot:'school',institutionLocation:'campus:lit'})).status,302);
  const summary=await(await request('/customer/orders/new/summary?draft='+native.draft)).text(), exact=Number(summary.match(/name="expectedTotal" value="([^"]+)"/)[1]);
  const nativeInput={draft:native.draft,checkout:'1',paymentMethod:'cod',confirmCash:'1',expectedTotal:exact};const nativePlaced=await request('/customer/orders/new/place',nativeInput);assert.equal(nativePlaced.status,307);
  assert.equal((await request(nativePlaced.headers.get('location'),nativeInput)).status,302);assert.equal(preview.snapshot().orders[0].paymentStatus,'cod_pending','Native form completes COD directly after explicit consent');
  preview.reset();
  const guest=await upload('preview_role=guest');assert.equal((await request('/order/options',{draft:guest.draft,...school,deliverySlot:'school',printType:'bw',copies:1,sides:'single'},guest.cookie)).status,302);
  const contact=await(await request('/order/phone?draft='+guest.draft,null,guest.cookie)).text();assert.doesNotMatch(contact,/name="(?:address|pin|localityId)"/);
  const otp=await request('/order/otp-request',{draft:guest.draft,name:'Sample student',email:'student@example.test',phone:'9825011111'},guest.cookie);assert.match(await otp.text(),/000000/);
  assert.equal((await request('/order/otp-verify',{draft:guest.draft,code:'000000'},guest.cookie)).status,302);
  assert.equal(preview.snapshot().addresses.at(-1).pin,'');
  console.log('Direct checkout routes passed: institution lookup, privacy, locality coverage, saved-address reuse, guest without address/PIN, explicit COD consent, exact total and replay.');
  if(process.argv.includes('--browser')) {
    const {chromium}=await import(process.env.PRINTKARR_BROWSER_MODULE || 'playwright');const browser=await chromium.launch({channel:'msedge',headless:true});
    const fixture=path.join(preview.uploadsDir,'browser-source.pdf');writeFileSync(fixture,bytes);mkdirSync('tmp/direct-checkout',{recursive:true});const errors=[];
    try {
      for(const width of [320,390,1440]) {
        preview.reset();const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize({width,height:900});await page.goto(base+'/customer/orders/new');
        await page.locator('[name=doc]').setInputFiles(fixture);await page.waitForFunction(()=>location.search.includes('draft='));await page.waitForFunction(()=>document.querySelector('[name=expectedTotal]')?.value);
        await page.click('[name=printType][value=mixed]');await page.fill('[name=mixedRange]','3,6');await page.click('[name=deliverySlot][value=school]');
        await page.selectOption('[name=institutionLocation]','campus:lit');assert.equal(await page.$eval('[data-address-fields]',e=>e.hidden),true);assert.equal(await page.$eval('[name=nn_pin]',e=>e.willValidate),false);assert.equal(await page.$eval('[name=institutionName]',e=>e.disabled),true);
        await page.click('[name=deliverySlot][value=express]');assert.equal(await page.$eval('[name=institutionLocation]',e=>e.willValidate),false);assert.equal(await page.$eval('[data-address-fields]',e=>e.hidden),false);
        await page.click('[name=deliverySlot][value=school]');await page.selectOption('[name=institutionLocation]','locality:vapi-chala');await page.$eval('[name=institutionName]',e=>{e.value='Sample Public School';e.dispatchEvent(new Event('input',{bubbles:true}));});
        await page.click('[name=paymentMethod][value=cod]');assert.equal(await page.$eval('[data-cash-consent]',e=>e.hidden),false);assert.equal(await page.$eval('[name=confirmCash]',e=>e.required),true);
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'No horizontal overflow at '+width);
        await page.screenshot({path:'tmp/direct-checkout/settings-'+width+'.png',fullPage:true});
        await page.click('[name=confirmCash]');await page.click('.order-continue button');await page.waitForFunction(()=>location.pathname.includes('/customer/purchases/') || !document.querySelector('[data-payment-error]').hidden);
        if(!page.url().includes('/customer/purchases/'))throw new Error(await page.$eval('[data-payment-error]',e=>e.textContent));
        assert.equal(await page.locator('h1').textContent(),'Cash order confirmed.');assert.equal(await page.locator('.customer-mobile-nav').count(),0);const order=preview.snapshot().orders[0];assert.equal(order.paymentStatus,'cod_pending');assert.equal(order.bwPages,6);assert.equal(order.colorPages,2);assert.equal(preview.snapshot().purchases[0].codFee,10);
        await page.screenshot({path:'tmp/direct-checkout/receipt-'+width+'.png',fullPage:true});await page.close();
      }
      preview.reset();const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize({width:390,height:900});await page.goto(base+'/customer/orders/new');await page.locator('[name=doc]').setInputFiles(fixture);await page.waitForFunction(()=>document.querySelector('[name=expectedTotal]')?.value);
      await page.click('.order-continue button');await page.waitForFunction(()=>location.pathname.includes('/customer/purchases/') || !document.querySelector('[data-payment-error]').hidden);assert.ok(page.url().includes('/customer/purchases/'),await page.$eval('body',e=>e.innerText));assert.equal(preview.snapshot().orders[0].paymentStatus,'paid','Wallet completes from the settings page');await page.close();
      preview.reset();const reviewPage=await browser.newPage();reviewPage.on('pageerror',e=>errors.push(e.message));await reviewPage.setViewportSize({width:390,height:900});await reviewPage.goto(base+'/customer/orders/new');await reviewPage.locator('[name=doc]').setInputFiles(fixture);await reviewPage.waitForFunction(()=>document.querySelector('[name=expectedTotal]')?.value);
      await reviewPage.locator('summary').filter({hasText:'Coupon / referral'}).click();await reviewPage.fill('[name=coupon]','DESK10');await reviewPage.click('.order-continue button');await reviewPage.locator('[data-final-review]').waitFor({state:'visible'});
      assert.equal(preview.snapshot().orders.length,0,'Changed price must be reviewed before order creation');assert.equal(preview.snapshot().wallets[0].balance,1000);assert.ok(reviewPage.url().includes('draft='));
      await reviewPage.click('#cPlus');assert.equal(await reviewPage.locator('[data-final-review]').count(),0,'Changing print quantity invalidates the reviewed price');
      await reviewPage.click('.order-continue button');await reviewPage.locator('[data-final-review]').waitFor({state:'visible'});await reviewPage.click('.order-continue button');await reviewPage.waitForURL(/customer\/purchases/);
      assert.equal(preview.snapshot().orders[0].paymentStatus,'paid');assert.equal(preview.snapshot().orders[0].copies,2);assert.equal(preview.snapshot().orders[0].couponDiscount,10);await reviewPage.close();
      assert.deepEqual(errors,[]);console.log('Direct checkout browser passed: upload → settings/delivery/payment → confirmed receipt, mobile/desktop COD and wallet, route switching and no hidden required fields.');
    } finally {await browser.close();}
  }
} finally {await new Promise(r=>server.close(r));}
