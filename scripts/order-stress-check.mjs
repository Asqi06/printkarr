// Run: node scripts/order-stress-check.mjs [--browser]. Fake customers/payments and temporary files only.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { PDFDocument } from 'pdf-lib';
import { analyzeUpload } from '../lib/files.js';
import { createOrderPreview } from './order-preview.mjs';
import { createStorePreview, previewDb } from './store-preview.mjs';
const results=[];
async function check(name, run) { try { await run(); console.log('PASS',name); } catch(e) { results.push(name);console.error('FAIL',name,e.message); } }
const pdf=await PDFDocument.create();pdf.addPage();pdf.addPage();const bytes=await pdf.save();
const seed=previewDb(true);seed.settings.campaign.firstPrint.enabled=false;
const preview=createOrderPreview(seed),server=preview.app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
const base='http://127.0.0.1:'+server.address().port;
const post=(route,body)=>fetch(base+route,{method:'POST',redirect:'manual',headers:{Origin:base},body});
const form=(name='Notes.pdf',data=bytes)=>{const f=new FormData();f.set('doc',new Blob([data]),name);return f;};
try {
 await check('40 simultaneous uploads have distinct drafts',async()=>{
  const now=Date.now;let responses;
  try { const fixed=now();Date.now=()=>fixed; responses=await Promise.all(Array.from({length:40},()=>post('/customer/orders/new/upload',form()))); } finally { Date.now=now; }
  responses.forEach(r=>assert.equal(r.status,302));
  const drafts=preview.snapshot().drafts;assert.equal(drafts.length,40);assert.equal(new Set(drafts.map(d=>d.id)).size,40);
 });
 await check('old guest page preserves a signed-in upload',async()=>{
  preview.reset();const r=await post('/order/upload',form());assert.equal(r.status,307);
  assert.equal(r.headers.get('location'),'/customer/orders/new/upload');
  assert.equal((await post(r.headers.get('location'),form())).status,302);assert.equal(preview.snapshot().drafts.length,1);
 });
 await check('corrupt image headers rejected; real PNG accepted',async()=>{
  for(const [name,data] of [['bad.png',Buffer.from([137,80,78,71,13,10,26,10,0])],['bad.jpg',Buffer.from([255,216,255,224,0,16])]])
   await assert.rejects(()=>analyzeUpload(name,data),/readable image/);
  assert.equal((await analyzeUpload('valid.png',readFileSync('public/favicon-32x32.png'))).pages,1);
 });
 await check('page limit and unexpected multipart fields reject without keeping drafts',async()=>{
  const limited=structuredClone(seed);limited.settings.order.maxPages=1;limited.settings.order.maxFileMb=1;
  const p=createOrderPreview(limited),s=p.app.listen(0,'127.0.0.1');await new Promise(r=>s.once('listening',r));
  const url='http://127.0.0.1:'+s.address().port;
  try {
   for(const [route,cookie] of [['/customer/orders/new/upload',''],['/order/upload','preview_role=guest']]) {
    const r=await fetch(url+route,{method:'POST',headers:{cookie},body:form(),redirect:'manual'});
    assert.equal(r.status,400);assert.match(await r.text(),/Over 1 pages/);assert.equal(p.snapshot().drafts.length,0);
    const big=await fetch(url+route,{method:'POST',headers:{cookie},body:form('Large.pdf',Buffer.alloc(1024*1024+1)),redirect:'manual'});assert.equal(big.status,400);assert.match(await big.text(),/no larger than 1 MB/);
   }
   const bad=new FormData();bad.set('wrongField',new Blob([bytes]),'Notes.pdf');
   const badResponse=await fetch(url+'/customer/orders/new/upload',{method:'POST',body:bad});assert.equal(badResponse.status,400);assert.match(await badResponse.text(),/document field/);
   assert.equal(p.snapshot().drafts.length,0);
  } finally {await new Promise(r=>s.close(r));rmSync(p.uploadsDir,{recursive:true,force:true});}
 });
 await check('20 simultaneous wallet retries debit once; COD retries never add a fee',async()=>{
  for(const method of ['wallet','cod']){
   preview.reset();const upload=await post('/customer/orders/new/upload',form());const draft=new URL(upload.headers.get('location'),base).searchParams.get('draft');
   assert.equal((await post('/customer/orders/new/confirm',new URLSearchParams({draft,printType:'bw',copies:'1',sides:'single',deliverySlot:'school',institutionLocation:'campus:lit'}))).status,302);
   const r=await fetch(base+'/customer/orders/new/place',{method:'POST',headers:{Accept:'application/json'},body:new URLSearchParams({draft,checkout:'1'})});assert.equal(r.status,200);const purchase=await r.json();
   const retries=await Promise.all(Array.from({length:20},()=>post('/customer/purchases/'+purchase.id+'/'+method,new URLSearchParams({confirmCash:'1',expectedTotal:purchase.total}))));
   retries.forEach(r=>assert.equal(r.status,302));const db=preview.snapshot();
   assert.equal(db.wallets[0].balance,method==='wallet'?1000-purchase.total:1000);
   assert.equal(db.purchases[0].processingFee,0);assert.equal(db.purchases[0].lateNightFee,0);assert.equal(db.purchases[0].surgeFee,0);assert.equal(db.purchases[0].deliveryFee,5);
   assert.equal(db.purchases[0].total,purchase.total);assert.equal(db.orders.length,1);assert.equal(db.orders[0].status,'PRINT_QUEUE');
   assert.equal(db.walletTx.filter(t=>t.kind==='debit').length,method==='wallet'?1:0);
  }
 });
} finally {await new Promise(r=>server.close(r));rmSync(preview.uploadsDir,{recursive:true,force:true});}
await check('gateway overlap preserves the first request lock',async()=>{
 let release,calls=0;const pending=new Promise(r=>release=r);
 const p=createStorePreview(previewDb(true),{preview:false,gateway:{id:'fake',secret:'fake'},fetchGateway:async(_url,options)=>{
  calls++;if(calls===1)throw new Error('Simulated provider timeout');await pending;const data=JSON.parse(options.body);return {ok:true,json:async()=>({id:'fake-order',amount:data.amount,currency:'INR'})};
 }});
 const s=p.app.listen(0,'127.0.0.1');await new Promise(r=>s.once('listening',r));const url='http://127.0.0.1:'+s.address().port;
 const request=(route,body={})=>fetch(url+route,{method:'POST',headers:{Origin:url},body:new URLSearchParams(body),redirect:'manual'});
 let first;
 try {
  const product=p.snapshot().products[0];await request('/cart/items',{productId:product.id,color:product.colors[0] || '',quantity:'1'});
  const checkout=await request('/cart/checkout',{addressId:'preview-address',deliverySlot:'express'});assert.equal(checkout.status,302);
  const route='/customer/purchases/'+p.snapshot().purchases[0].id;
  assert.equal((await request(route+'/gateway')).status,400);assert.equal(p.snapshot().purchases[0].gatewayCreating,false);
  first=request(route+'/gateway');
  for(let i=0;!p.snapshot().purchases[0].gatewayCreating && i<200;i++)await new Promise(r=>setTimeout(r,5));
  assert.equal(p.snapshot().purchases[0].gatewayCreating,true);
  assert.equal((await request(route+'/gateway')).status,400);assert.equal(p.snapshot().purchases[0].gatewayCreating,true);
  assert.equal((await request(route+'/cod',{confirmCash:'1'})).status,400);
  release();assert.equal((await first).status,200);assert.equal(calls,2);
  assert.equal((await request(route+'/gateway')).status,200);assert.equal(calls,2);
 } finally {release();if(first)await first;await new Promise(r=>s.close(r));rmSync(p.uploadsDir,{recursive:true,force:true});}
});
assert.deepEqual(results,[]);


if (process.argv.includes('--browser')) {
const {chromium}=await import(process.env.PRINTKARR_BROWSER_MODULE || 'file:///C:/Users/WELCOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const seed=previewDb(true);seed.settings.campaign.firstPrint.enabled=false;seed.wallets[0].balance=1000;
const preview=createOrderPreview(seed),server=preview.app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
const url='http://127.0.0.1:'+server.address().port;
const pdf=await PDFDocument.create();pdf.addPage();const fixture=path.join(preview.uploadsDir,'recovery.pdf');writeFileSync(fixture,await pdf.save());
const browser=await chromium.launch({channel:'msedge',headless:true});const errors=[];
try{
 const page=await browser.newPage({viewport:{width:390,height:900}});page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url+'/customer/orders/new');await page.locator('[name=doc]').setInputFiles(fixture);await page.waitForFunction(()=>document.querySelector('[name=expectedTotal]')?.value && document.querySelector('[data-print-payment]')?.dataset.paymentReady);
 Object.assign(seed,preview.snapshot());seed.wallets[0].balance=1;preview.reset();
 let dropped=false;
 await page.route('**/customer/orders/new/confirm',route=>{if(!dropped){dropped=true;route.abort('connectionfailed');}else route.continue();});
 await page.click('.order-continue button');await page.locator('[data-payment-error]').waitFor({state:'visible'});
 assert.equal(preview.snapshot().orders.length,0);assert.equal(await page.locator('.order-continue button').isEnabled(),true);
 await page.click('.order-continue button');await page.locator('[data-payment-error]').waitFor({state:'visible'});
 await page.waitForFunction(()=>Boolean(document.querySelector('[data-print-payment]')?.dataset.purchaseId));
 assert.match(await page.locator('[data-payment-error]').textContent(),/Insufficient wallet/);assert.equal(preview.snapshot().wallets[0].balance,1);
 const pending=preview.snapshot().purchases[0];
 const resume=await browser.newPage({viewport:{width:390,height:900}});resume.on('pageerror',e=>errors.push(e.message));
 await resume.goto(url+'/customer/orders/new?fresh=1');await resume.locator('[name=doc]').setInputFiles(fixture);await resume.waitForFunction(()=>document.querySelector('[name=expectedTotal]')?.value);
 const nextDraft=await resume.locator('[name=draft]').inputValue();
 if(await resume.locator('[name=confirmCash]').isVisible())await resume.locator('[name=confirmCash]').check();
 await resume.locator('.order-continue button').click();await resume.waitForURL('**/customer/purchases/'+pending.id);
 assert.equal(preview.snapshot().purchases.length,1);assert.ok(preview.snapshot().drafts.some(d=>d.id===nextDraft && d.selections),'New document and settings remain saved');
 await resume.close();
 // A second tab retrying the consumed draft resumes the same purchase too.
 const old=await browser.newPage();await old.goto(url+'/customer/orders/new?fresh=1');
 await old.request.post(url+'/customer/orders/new/confirm',{form:{draft:preview.snapshot().orders[0].draftId}}).then(r=>assert.match(r.url(),/customer\/purchases/));await old.close();
 console.log('Saved checkout recovery passed: pending purchase opens, new draft stays saved, consumed-draft replay resumes without duplicates.');
 await page.click('.order-continue button');await page.waitForURL(/customer\/purchases/);
await page.locator('[name=confirmCash]').check();
 await page.locator('form[action$="/cod"] button').click();await page.waitForFunction(()=>document.querySelector('h1')?.textContent==='Cash order confirmed.');
 assert.equal(preview.snapshot().purchases[0].paymentStatus,'cod_pending');assert.equal(preview.snapshot().wallets[0].balance,1);
 assert.deepEqual(errors,[]);console.log('Recovery browser passed: interrupted request retains draft, insufficient wallet retains balance, saved checkout completes by COD.');
 preview.reset();const cashReview=await browser.newPage({viewport:{width:390,height:900}});cashReview.on('pageerror',e=>errors.push(e.message));
 await cashReview.goto(url+'/customer/orders/new');await cashReview.locator('[name=doc]').setInputFiles(fixture);await cashReview.waitForFunction(()=>document.querySelector('[name=expectedTotal]')?.value);
 await cashReview.locator('[name=copies]').fill('6');await cashReview.locator('[name=paymentMethod][value=cod]').check();await cashReview.locator('[name=confirmCash]').check();
 await cashReview.locator('summary').filter({hasText:'Coupon / referral'}).click();await cashReview.locator('[name=coupon]').fill('DESK10');await cashReview.locator('[name=confirmCash]').check();await cashReview.locator('.order-continue button').click();await cashReview.locator('[data-final-review]').waitFor({state:'visible'});
 const exact=await cashReview.locator('form').filter({has:cashReview.locator('[name=expectedTotal]')}).getAttribute('data-reviewed-total');
 assert.equal(await cashReview.locator('[data-cash-due]').textContent(),'₹'+Number(exact).toLocaleString('en-IN'));
 assert.equal(await cashReview.locator('[data-final-cod]').count(),0);
 await cashReview.locator('[name=confirmCash]').check();await cashReview.locator('.order-continue button').click();await cashReview.waitForURL(/customer\/purchases/);
 assert.equal(preview.snapshot().purchases[0].total,Number(exact));assert.equal(preview.snapshot().purchases[0].codFee,0);await cashReview.close();
 console.log('Inline coupon cash review passed: shown, consented and charged totals have no COD increment.');
 // Javascript-disabled native flow uses the same confirmation and receipt routes.
 preview.reset();const native=await browser.newPage({javaScriptEnabled:false});await native.goto(url+'/customer/orders/new');
 await native.locator('[name=doc]').setInputFiles(fixture);await native.locator('[data-order-upload] button[type=submit]').click();await native.waitForURL(/draft=/);
 await native.locator('[name=paymentMethod][value=cod]').check();await native.locator('[name=confirmCash]').check();
 await native.locator('.order-continue button').click();await native.waitForURL(/summary/);
 await native.locator('[name=confirmCash]').check();await native.locator('.order-continue button').click();await native.waitForURL(/customer\/purchases/);
 // Native summary routes display the saved purchase; explicit cash choice finishes when no script fills expectedTotal.
 if(preview.snapshot().purchases[0].status==='CREATED'){await native.locator('[name=confirmCash]').check();await native.locator('form[action$="/cod"] button').click();}
 assert.equal(preview.snapshot().purchases[0].paymentStatus,'cod_pending');console.log('Native browser passed: upload, settings, price review and COD without JavaScript.');
}finally{await browser.close();await new Promise(r=>server.close(r));rmSync(preview.uploadsDir,{recursive:true,force:true});}


}
