// Run: node scripts/offers-check.mjs. Isolated fixtures; no live payments or wallet changes.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {printPricing, offerActive, validatePrintOffer, validateOfferDates} from '../public/print-pricing.js';
import {campaignConfig, validateCampaign, topupTerms, applyTopup, eligibleWalletOffers, adminWalletCredit, walletOf, debitWallet} from '../lib/campus.js';
import {blankDb} from '../lib/db.js';
import {cartItems} from '../lib/store.js';
import {createOrderPreview} from './order-preview.mjs';
import {previewDb} from './store-preview.mjs';
const pricing={bw:2,color:4,studentBw:2,studentColor:4,printOffers:[{id:'navratri',name:'Navratri',type:'color',sides:3,price:9,repeat:true,enabled:true}]};
for(const [color,price] of [[1,4],[2,8],[3,9],[4,13],[6,18],[7,22]]) assert.equal(printPricing({bw:0,color},pricing).subtotal,price);
assert.equal(printPricing({bw:2,color:6},pricing).subtotal,22);
assert.equal(printPricing({bw:0,color:6},{...pricing,printOffers:[{...pricing.printOffers[0],repeat:false}]}).subtotal,21);
assert.equal(printPricing({bw:0,color:3},{...pricing,color:2}).subtotal,6,'Offer never increases an already cheaper rate');
assert.equal(printPricing({bw:0,color:3},{...pricing,printOffers:[{...pricing.printOffers[0],endsOn:'2020-01-01'}]}).subtotal,12);
assert.equal(offerActive({enabled:true,startsOn:'2026-10-11',endsOn:'2026-10-11'},Date.parse('2026-10-10T18:30:00Z')),true);
assert.equal(offerActive({enabled:true,endsOn:'2026-10-10'},Date.parse('2026-10-10T18:30:00Z')),false);
assert.throws(()=>validateOfferDates({startsOn:'2026-02-30'}));
assert.throws(()=>validatePrintOffer({...pricing.printOffers[0],sides:0}));
const db=blankDb();db.users=[{id:'C',role:'customer'},{id:'A',role:'admin'}];const cfg=campaignConfig(db),trial=cfg.wallets.find(o=>o.amount===99);
Object.assign(trial,{bonus:26,validityDays:0});validateCampaign(cfg);
cfg.wallets.push({...trial,id:'better',bonus:50});assert.equal(topupTerms(db,'C',99).bonus,50);cfg.wallets.pop();
const snapshot=topupTerms(db,'C',99,trial.id);trial.bonus=999;trial.enabled=false;
applyTopup(db,'C',snapshot,'Purchased','pay-fixture');
assert.equal(walletOf(db,'C').balance,125);
assert.equal(db.walletTx[1].topupId,db.walletTx[0].id);assert.equal(db.walletTx[1].expiresAt,null);
assert.throws(()=>topupTerms(db,'C',99,trial.id),/unavailable/);
assert.equal(topupTerms(db,'C',99).bonus,0);
trial.enabled=true;trial.startsOn='2099-01-01';
assert.ok(!eligibleWalletOffers(db,'C').some(o=>o.id===trial.id));assert.equal(topupTerms(db,'C',99).bonus,0);
debitWallet(db,'C',20,'Spent');
adminWalletCredit(db,'C',25,'Missed promotion','A','credit-fixture');
adminWalletCredit(db,'C',25,'Missed promotion','A','credit-fixture');
assert.equal(walletOf(db,'C').balance,130);assert.equal(db.walletTx.filter(t=>t.source==='admin-credit').length,1);
assert.throws(()=>adminWalletCredit(db,'C',26,'Missed promotion','A','credit-fixture'));
assert.throws(()=>adminWalletCredit(db,'C',1,'Bad admin','C','bad'));
for(const amount of [0,-1,Infinity,0.001,10001]) assert.throws(()=>adminWalletCredit(db,'C',amount,'Bad credit','A','bad'));
const basket=blankDb();basket.pricing=pricing;basket.users=[{id:'C'}];
basket.orders=[1,2].map((n,i)=>({id:'P'+i,customerId:'C',status:'CREATED',pricingVersion:1,pages:n,copies:1,printType:'color'}));
const cart={lines:[],printIds:['P0','P1']};assert.equal(cartItems(basket,cart,'C').subtotal,9);
for(const parts of [[1,1,1],[3,3,1],[2,2,3]]) {
 basket.orders=parts.map((n,i)=>({id:'P'+i,customerId:'C',status:'CREATED',pricingVersion:1,pages:n,copies:1,printType:'color'}));cart.printIds=basket.orders.map(o=>o.id);
 assert.equal(cartItems(basket,cart,'C').subtotal,printPricing({bw:0,color:parts.reduce((a,b)=>a+b,0)},pricing).subtotal);
}
const seed=previewDb(true),customer=seed.users.find(u=>u.role==='customer'),p=createOrderPreview(seed),server=p.app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
const base='http://127.0.0.1:'+server.address().port;
const post=(url,data,cookie='preview_role=admin',origin=base)=>fetch(base+url,{method:'POST',redirect:'manual',headers:{Cookie:cookie,Origin:origin},body:new URLSearchParams(data)});
try {
 const page=await fetch(base+'/admin/offers',{headers:{Cookie:'preview_role=admin'}});assert.equal(page.status,200);assert.match(await page.text(),/Total wallet credit/);
 let r=await post('/admin/offers/wallet',{name:'Festival',amount:'99',credit:'125',validityDays:'0',enabled:'1'});assert.equal(r.status,302);
 const offer=p.snapshot().settings.campaign.wallets.find(o=>o.name==='Festival');assert.equal(offer.bonus,26);
 r=await post('/admin/offers/wallet',{id:offer.id,name:'Festival',amount:'99',credit:'150',validityDays:'30',startsOn:'2099-01-01'});assert.equal(r.status,302);
 assert.equal(p.snapshot().settings.campaign.wallets.find(o=>o.id===offer.id).enabled,false);
 for(const data of [{amount:'99',credit:'125.001'},{amount:'99',credit:'90'},{amount:'99',credit:'125',startsOn:'2026-02-30'}]) assert.equal((await post('/admin/offers/wallet',{name:'Bad',validityDays:'0',...data})).status,400);
 r=await post('/admin/offers/print',{name:'Navratri',type:'color',sides:'3',price:'9',enabled:'1',repeat:'1'});assert.equal(r.status,302);
 const print=p.snapshot().pricing.printOffers[0];assert.equal(print.price,9);
 assert.equal((await post('/admin/offers/print',{id:print.id,name:'Navratri',type:'color',sides:'3',price:'9',enabled:'1'})).status,302);
 assert.equal(p.snapshot().pricing.printOffers[0].repeat,false);
 assert.equal((await post('/admin/offers/print',{name:'Bad',type:'color',sides:'1.5',price:'9'})).status,400);
 assert.equal((await post('/admin/offers/print',{name:'Hack',type:'color',sides:'3',price:'9'},'preview_role=customer')).status,403);
 assert.equal((await post('/admin/offers/print',{name:'Hack',type:'color',sides:'3',price:'9'},'preview_role=admin','https://evil.example')).status,403);
 const before=p.snapshot().wallets.find(w=>w.customerId===customer.id)?.balance || 0;
 const credit={amount:'25',reason:'Missed promotion',requestId:'route-credit-fixture'};
 const replies=await Promise.all(Array.from({length:10},()=>post('/admin/customers/'+customer.id+'/wallet-credit',credit)));replies.forEach(r=>assert.equal(r.status,302));
 const saved=p.snapshot();assert.equal(saved.wallets.find(w=>w.customerId===customer.id).balance,before+25);assert.equal(saved.walletTx.filter(t=>t.requestId===credit.requestId).length,1);
 assert.equal((await post('/admin/customers/'+customer.id+'/wallet-credit',credit,'preview_role=customer')).status,403);
 const detail=await fetch(base+'/admin/customers/'+customer.id,{headers:{Cookie:'preview_role=admin'}});assert.equal(detail.status,200);assert.match(await detail.text(),/Missed promotion/);
 
 if (process.argv.includes('--browser')) {
  const {chromium}=await import(process.env.PRINTKARR_BROWSER_MODULE || 'file:///C:/Users/WELCOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
  const {PDFDocument}=await import('pdf-lib');
  const browser=await chromium.launch({channel:'msedge',headless:true}), errors=[];
  try {
   const context=await browser.newContext({viewport:{width:390,height:900}});
   await context.addCookies([{name:'preview_role',value:'admin',url:base}]);
   const page=await context.newPage();page.on('pageerror',e=>{if(e.message !== 'Transition was aborted because of invalid state. ViewTransition opt-in disabled')errors.push(e.message);});
   await page.goto(base+'/admin/offers');
   const create=page.locator('form[action="/admin/offers/wallet"]').last();
   await create.locator('[name=name]').fill('Mobile offer');await create.locator('[name=amount]').fill('99');await create.locator('[name=credit]').fill('125');await create.locator('[name=enabled]').check();await create.locator('button').click();await page.waitForURL('**/admin/offers');
   assert.equal(p.snapshot().settings.campaign.wallets.find(o=>o.name==='Mobile offer').bonus,26);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Mobile offer editor fits screen');
   await page.goto(base+'/admin/customers/'+customer.id);await page.locator('[name=amount]').fill('25');await page.locator('[name=reason]').fill('Mobile credit check');await page.locator('form[action$="/wallet-credit"] button').click();await page.waitForURL('**/admin/customers/*');
   assert.ok(p.snapshot().walletTx.some(t=>t.label==='Mobile credit check'));
   const customerContext=await browser.newContext({viewport:{width:390,height:900}}),customerPage=await customerContext.newPage();customerPage.on('pageerror',e=>{if(e.message !== 'Transition was aborted because of invalid state. ViewTransition opt-in disabled')errors.push(e.message);});
   const pdf=await PDFDocument.create();for(let i=0;i<3;i++)pdf.addPage();const fixture=p.uploadsDir+'/bundle.pdf';fs.writeFileSync(fixture,await pdf.save());
   await customerPage.goto(base+'/customer/orders/new');await customerPage.locator('[name=doc]').setInputFiles(fixture);await customerPage.waitForURL(/draft=/);
   await customerPage.locator('[name=printType][value=color]').check();await customerPage.waitForFunction(()=>document.querySelector('[data-print-cost]')?.textContent==='₹9');
   assert.match(await customerPage.locator('.delivery-guide').first().textContent(),/Navratri/);
   await customerPage.locator('.order-continue button').click();await customerPage.waitForURL(/customer\/purchases/);
   assert.equal(p.snapshot().orders.at(-1).subtotal,9);
   assert.deepEqual(errors,[]);console.log('PASS: mobile admin adds offers and credits; colour bundle shown and charged correctly in customer checkout.');
  } finally {await browser.close();}
 }

 console.log('PASS: bundle pricing, basket rounding, IST scheduling, immutable paid bonuses, admin editing, permissions and 10 duplicate credit requests.');
} finally {await new Promise(r=>server.close(r));fs.rmSync(p.uploadsDir,{recursive:true,force:true});}
