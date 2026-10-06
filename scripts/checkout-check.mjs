import { pageRange, printPlan, printSides, printDescription } from '../public/print-plan.js';
import { activePrintJobs, surchargeFees } from '../lib/pricing.js';
// Runnable regression check: node scripts/checkout-check.mjs [--browser]
// Uses in-memory route handlers and read-only fixtures; no customer data or money moves.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import path from 'node:path';
import { readFileSync, mkdirSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { blankDb } from '../lib/db.js';
import { addPrint, cartFor, cartItems, cartQuote, printNet, checkPackQuota } from '../lib/store.js';
import { campaignConfig, eligibleWalletOffers, topupTerms, applyTopup, claimWalletFiles, fulfilWalletFiles, walletOf, deliveryPlan, deliveryChoice, validateDestination, batchPrice, validateCampaign } from '../lib/campus.js';
import { fulfillmentFor } from '../lib/partners.js';
import { deliveryFeeFor, deliveryPoint, rangePages } from '../lib/pricing.js';
import { analyzeUpload, orderFile } from '../lib/files.js';
import { canUseOwnerTestPrint } from '../lib/owner-test.js';
import { normPhone, normEmail } from '../lib/otp.js';
import { esc } from '../lib/views.js';
import { optionsStep, summaryStep, walletPrompt } from '../lib/views_order.js';
import { buildCoverPdf } from '../agent/cover.js';
const source = readFileSync(new URL('../server.mjs', import.meta.url), 'utf8').replaceAll('\r\n','\n');
const user = {id:'A',role:'customer',name:'Ani',email:'ani@example.com',phone:'9825011111'};
const db = blankDb(); db.users.push(user);
const pdf = buildCoverPdf('Sample document', [['Name','Fictional preview']]);
let gatewayCalls = 0;
function handler(method, route, extra = {}) {
  let result;
  const start = source.indexOf(`app.${method}('${route}'`), end = source.indexOf('\napp.',start+1);
  assert.ok(start>=0,route);
  const pricing = readFileSync(new URL('../lib/pricing.js',import.meta.url),'utf8').replace(/^import .*;\r?\n/gm,'').replaceAll('export ','');
  const quote = runInNewContext(pricing+'\nquote;', {loadDb:()=>db,Intl,Date,Set,Number,pageRange,printSides});
  runInNewContext(source.match(/function zoneOf\(area\) \{[\s\S]*?\n\}/)[0]+'\n'+source.slice(source.indexOf('function couponOrder('),source.indexOf('const isDemoUser'))+'\n'+source.slice(start,end), {
    app:{[method](...args){result=args.at(-1);result.middleware=args.slice(1,-1).filter(Boolean);}}, requireRole(){}, apiLimiter(){}, otpLimiter(){}, upload:{single(){}},
    loadDb:()=>db, saveDb(){}, currentUser:()=>user, campaignConfig, deliveryPlan, deliveryChoice, validateDestination, fulfillmentFor, batchPrice, deliveryFeeFor, deliveryPoint, quote, rangePages, cartFor, cartItems, cartQuote, printNet, addPrint, checkPackQuota, walletOf, gatewayOn:()=>false,
    printPlan,printSides,printDescription,optionsStep,activePrintJobs,surchargeFees,normPhone,normEmail,esc,crypto,path,Buffer,ROOT:'fixture',orderFile, maxUploadBytes:()=>50*1024*1024, analyzeUpload, canUseOwnerTestPrint,
    fs:{copyFileSync(){throw new Error('Expired file');},readFileSync:()=>pdf},
    topupTerms,applyTopup,claimWalletFiles,fulfilWalletFiles,siteOrigin(){},qualifyForTopup(){},RAZORPAY:{id:'fixture-id',secret:'fixture-secret'},
    fetch:async()=>{gatewayCalls++;return {ok:true,json:async()=>({id:'rzp-fixture',amount:4900})};},
    oops:(_user,_path,message)=>message,...extra
  });
  return result;
}
const response = () => ({code:200,status(code){this.code=code;return this;},json(body){this.body=body;},send(body){this.body=body;},redirect(url){this.url=url;}});
const at = Date.parse('2026-10-02T10:00:00+05:30'), route='local-vapi-afternoon', point={lat:20.389722,lng:72.889945};
campaignConfig(db).delivery.local.vapi.enabled=false;
assert.throws(()=>deliveryPlan(db,route,null,at),/unavailable/);
assert.throws(()=>deliveryPlan(db,'pickup'),/in development/);
db.settings.campaign.delivery.local.vapi={enabled:true,fee:7,radiusKm:2};
const plan = deliveryPlan(db,route,null,at);
assert.equal(plan.promisedBy,'2026-10-02T09:30:00.000Z');
assert.equal(deliveryFeeFor(db.pricing,'vapi',point,plan).fee,10);
assert.throws(()=>deliveryFeeFor(db.pricing,'vapi',{lat:20.43,lng:72.9},plan),/Outside/);
assert.equal(deliveryFeeFor(db.pricing,'vapi',point,{...plan,scheduledFee:-1}).fee,10,'Vapi distance bands ignore a submitted flat fee');
assert.equal(deliveryPlan(db,route,null,Date.parse('2026-10-02T11:00:00+05:30')).promisedBy,'2026-10-03T09:30:00.000Z');
assert.throws(()=>validateCampaign({...campaignConfig(db),delivery:{...campaignConfig(db).delivery,pickup:{enabled:true,address:''}}}),/collection address/);
db.drafts=[{id:'D',customerId:'A',document:'Notes.pdf',pages:12,fileType:'pdf'}];
const confirm=response();
handler('post','/customer/orders/new/confirm')({user,body:{draft:'D',deliverySlot:route,addressId:'__new',nn_area:'Vapi',nn_address:'Test road',nn_pin:'396191',nn_phone:user.phone,deliveryLat:point.lat,deliveryLng:point.lng,copies:2,printType:'color',sides:'double'}},confirm);
assert.match(confirm.url,/summary/); assert.equal(db.drafts[0].selections.deliveryMode,'scheduled');
const review=response();
handler('get','/customer/orders/new/summary',{firstOffers:()=>({print:0,delivery:0}),coverFor:()=>null,parseCookies:()=>({}),summaryStep:(u,d,s,q)=>({s,q})})({user,query:{draft:'D'},headers:{}},review);
assert.equal(review.body.q.deliveryFee,10); assert.equal(review.body.q.total,130);
db.settings.campaign.delivery.local.vapi.enabled=false;
const disabled=response();handler('get','/customer/orders/new/summary')({user,query:{draft:'D'},headers:{}},disabled);assert.equal(disabled.code,400);
const saved = optionsStep(user,db.drafts[0],db.addresses,campaignConfig(db),db.pricing);
assert.match(saved,/name="printType" value="color" checked/);assert.match(saved,/name="copies"[^>]*value="2"/);assert.match(saved,/name="deliverySlot" value="express" checked/);
assert.match(summaryStep(user,db.drafts[0],db.drafts[0].selections,{subtotal:120,total:127,deliveryFee:7}),/data-print-payment/);
const own={id:'PK-1024',customerId:'A',status:'CREATED',document:'Notes.pdf',printType:'color',copies:2,sides:'double'};
db.orders=[own,{id:'PK-1025',customerId:'B',status:'CREATED'}];
const denied=response();await handler('post','/api/wallet/topup-order')({body:{orderId:'PK-1025',amount:49,offerId:'first'}},denied);assert.equal(denied.code,400);assert.equal(gatewayCalls,0);
const topup=response();await handler('post','/api/wallet/topup-order')({body:{orderId:own.id,amount:49,offerId:'first'}},topup);assert.equal(topup.code,200);assert.equal(db.topups[0].returnOrderId,own.id);
assert.ok(!eligibleWalletOffers(db,'A').some(o=>o.id==='first'),'Pending first offer must not be promoted again');
const proof={razorpay_order_id:'rzp-fixture',razorpay_payment_id:'pay-fixture'};proof.razorpay_signature=crypto.createHmac('sha256','fixture-secret').update(proof.razorpay_order_id+'|'+proof.razorpay_payment_id).digest('hex');
const verify=response();handler('post','/customer/wallet/topup-verify')({user,body:proof},verify);assert.equal(verify.url,'/customer/orders/PK-1024/pay');assert.equal(walletOf(db,'A').balance,59);
const replay=response();handler('post','/customer/wallet/topup-verify')({user,body:proof},replay);assert.equal(replay.code,400);assert.equal(walletOf(db,'A').balance,59);
const fileTopup=response();await handler('post','/api/wallet/topup-order',{fetch:async()=>({ok:true,json:async()=>({id:'rzp-files',amount:14900})})})({body:{amount:149,offerId:'files',freeFiles:999}},fileTopup);
assert.equal(fileTopup.code,200);assert.equal(db.topups.at(-1).terms.freeFiles,3);assert.ok(!db.walletTx.some(t=>t.freeFiles));
const fileProof={razorpay_order_id:'rzp-files',razorpay_payment_id:'pay-files'};fileProof.razorpay_signature=crypto.createHmac('sha256','fixture-secret').update(fileProof.razorpay_order_id+'|'+fileProof.razorpay_payment_id).digest('hex');
const fileVerify=response();handler('post','/customer/wallet/topup-verify')({user,body:fileProof},fileVerify);assert.equal(fileVerify.url,'/customer/wallet');assert.equal(walletOf(db,'A').balance,208);
const fileTx=db.walletTx.find(t=>t.freeFiles);assert.equal(fileTx.freeFiles.quantity,3);
const fileReplay=response();handler('post','/customer/wallet/topup-verify')({user,body:fileProof},fileReplay);assert.equal(fileReplay.code,400);assert.equal(db.walletTx.filter(t=>t.freeFiles).length,1);
const claim=response();handler('post','/customer/wallet/files/:txId/claim')({user,params:{txId:fileTx.id},body:{color:'green'}},claim);assert.equal(claim.url,'/customer/wallet#free-files');assert.equal(fileTx.freeFiles.color,'green');
const handover=response();handler('post','/admin/customers/:id/files/:txId/fulfil')({user:{id:'staff',role:'admin'},params:{id:user.id,txId:fileTx.id}},handover);assert.equal(handover.url,'/admin/customers/A');assert.ok(fileTx.freeFiles.fulfilledAt);
assert.equal(walletPrompt(campaignConfig(db),eligibleWalletOffers(db,'A'),1000),'');
const repeat=response();handler('post','/customer/orders/:id/reorder')({user,params:{id:own.id}},repeat);assert.equal(repeat.url,'/customer/orders/new?repeat=PK-1024');
const uploaded=response();handler('post','/customer/orders/new/upload')({user,file:{size:pdf.length,originalname:'Updated.pdf',path:'fixture',filename:'new.pdf'},body:{repeat:own.id}},uploaded);
const newDraft=db.drafts.at(-1);assert.equal(newDraft.selections.copies,2);assert.equal(newDraft.selections.printType,'color');assert.equal(newDraft.pages,1);assert.equal(newDraft.selections.range,undefined,'New file must not inherit stale page ranges');
// Coupon reservations and prior use are derived from existing orders, including legacy orders.
const couponDb=blankDb();couponDb.coupons=[{code:'SAVE',type:'fixed',value:10,minOrder:20,active:true,expiry:'2099-12-31'},{code:'NEXT',type:'percent',value:10,active:true}];
const coupons=runInNewContext(source.slice(source.indexOf('function couponOrder('),source.indexOf('const isDemoUser'))+'\n({validateCoupon});');
assert.equal(coupons.validateCoupon(couponDb,' save ',100,'A').discount,10);
assert.equal(coupons.validateCoupon(couponDb,'SAVE',10,'A').ok,false);
const claimed={id:'first-order',customerId:'A',couponCode:' save ',couponDiscount:10,paymentStatus:'pending',paymentMethod:null,status:'CREATED',history:[{to:'CREATED'}]};
couponDb.orders.push(claimed,{...claimed,id:'legacy-duplicate'});
assert.equal(coupons.validateCoupon(couponDb,'SAVE',100,'A').ok,false);
assert.equal(coupons.validateCoupon(couponDb,'SAVE',100,'B').ok,true);
assert.equal(coupons.validateCoupon(couponDb,'NEXT',100,'A').ok,true);
for(const route of ['/customer/orders/:id/pay','/customer/orders/:id/demo-pay','/customer/orders/:id/razorpay-verify','/api/razorpay/order']) {
  const middleware=handler('post',route,{loadDb:()=>couponDb}).middleware.find(fn=>fn.name==='couponOnce');assert.ok(middleware,route);
  const request={user,params:{id:'legacy-duplicate'},body:{orderId:'legacy-duplicate'},path:route};let allowed=false;
  const denied=response();middleware(request,denied,()=>allowed=true);assert.equal(denied.code,409);assert.equal(allowed,false);
  const ownRequest={...request,params:{id:claimed.id},body:{orderId:claimed.id}};middleware(ownRequest,response(),()=>allowed=true);assert.equal(allowed,true);
}
couponDb.orders=[claimed];claimed.status='CANCELLED';claimed.paymentStatus='refunded';
assert.equal(coupons.validateCoupon(couponDb,'SAVE',100,'A').ok,true,'Cancelling an unpaid order releases its reservation');
claimed.status='PAYMENT_FAILED';claimed.paymentStatus='pending';assert.equal(coupons.validateCoupon(couponDb,'SAVE',100,'A').ok,true);
claimed.status='PRINT_QUEUE';claimed.paymentStatus='paid';claimed.paymentMethod='wallet';
assert.equal(coupons.validateCoupon(couponDb,'SAVE',100,'A').ok,false);
claimed.status='CANCELLED';claimed.paymentStatus='refunded';assert.equal(coupons.validateCoupon(couponDb,'SAVE',100,'A').ok,false,'Refunds do not reset a paid coupon');
claimed.paymentMethod=null;claimed.history.push({to:'CONFIRMED'});assert.equal(coupons.validateCoupon(couponDb,'SAVE',100,'A').ok,false,'Legacy confirmed history preserves paid usage');
couponDb.orders=JSON.parse(JSON.stringify(couponDb.orders));assert.equal(coupons.validateCoupon(couponDb,'SAVE',100,'A').ok,false);
couponDb.coupons[0].active=false;assert.equal(coupons.validateCoupon(couponDb,'SAVE',100,'B').ok,false);couponDb.coupons[0].active=true;
const couponDraft={id:'coupon-draft',customerId:'A',stored:'fixture.pdf',pages:12,selections:{effPages:12,copies:1,printType:'color',sides:'single',zone:'vapi',zoneLabel:'Vapi',deliveryMode:'express',deliveryPoint:point}};
couponDb.drafts=[couponDraft];let moved=0;
const place=handler('post','/customer/orders/new/place',{loadDb:()=>couponDb,nextOrderId:()=> 'PK-COUPON',parseCookies:()=>({}),coverFor:()=>null,firstOffers:()=>({print:0,delivery:0}),fs:{renameSync(){moved++;}}});
const rejected=response();place({user,body:{draft:couponDraft.id,coupon:'SAVE'},headers:{}},rejected);assert.equal(rejected.code,400);assert.match(rejected.body,/already used/);assert.equal(couponDb.drafts.length,1);assert.equal(moved,0);
couponDraft.customerId='B';couponDb.coupons[0].influencer='@riya';const accepted=response();place({user:{...user,id:'B'},body:{draft:couponDraft.id,coupon:'SAVE',influencer:'spoofed'},headers:{}},accepted);assert.equal(accepted.url,'/cart');assert.equal(couponDb.orders.at(-1).couponDiscount,10);assert.equal(moved,1);assert.ok(couponDb.carts.find(c=>c.customerId==='B').printIds.includes('PK-COUPON'));
assert.equal(couponDb.orders.at(-1).influencer,'@riya','Print attribution comes from the coupon, never customer input');
assert.equal(couponDb.referrals.length,0,'Influencer coupon does not create a friend referral');
console.log('Checkout checks passed: route limits/cutoffs, preserved settings, wallet ownership, signed top-up return, file gifts and one coupon use per customer across all payment routes.');
if(process.argv.includes('--browser')) {
  const {default:puppeteer}=await import('puppeteer-core');
  const browser=await puppeteer.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--no-sandbox']});
  mkdirSync('docs/checkout-preview',{recursive:true});
  const errors=[];
  try {
    for(const width of [320,390,1440]) {
      const context=await browser.createBrowserContext(), page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));await page.setViewport({width,height:900});
      await page.goto('http://127.0.0.1:3100',{waitUntil:'networkidle0'});
      assert.equal(await page.$('.wallet-prompt[open]'),null,'Wallet offers must not interrupt ordering');
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      await page.goto('http://127.0.0.1:3100/order/options',{waitUntil:'networkidle0'});
      await page.$eval('#copies',el=>{el.value='3';el.dispatchEvent(new Event('input',{bubbles:true}));});
      assert.match(await page.$eval('[data-print-quote] b',el=>el.textContent),/75/);
      await page.$eval('#range',el=>{el.value='3-5, 4';el.dispatchEvent(new Event('input',{bubbles:true}));});
      assert.match(await page.$eval('[data-print-quote] b',el=>el.textContent),/21/);
      await page.$eval('#range',el=>{el.value='99';el.dispatchEvent(new Event('input',{bubbles:true}));});assert.equal(await page.$eval('#range',el=>el.checkValidity()),false);
      await page.goto('http://127.0.0.1:3100/customer/review',{waitUntil:'domcontentloaded'});
      assert.equal(await page.$eval('.document-preview',el=>el.open),true);await page.screenshot({path:`docs/checkout-preview/review-${width}.png`});
      await page.goto('http://127.0.0.1:3100/customer/checkout-offer',{waitUntil:'domcontentloaded'});
      assert.match(await page.$eval('.wallet-checkout-note',el=>el.textContent),/₹49.*₹10/);await page.screenshot({path:`docs/checkout-preview/checkout-${width}.png`});
      await page.goto('http://127.0.0.1:3100/customer/wallet-live',{waitUntil:'networkidle0'});
      assert.equal(await page.$eval('#offerId',el=>el.value),'study');assert.match(await page.$eval('.wallet-checkout-note',el=>el.textContent),/order #preview/);
      await page.goto('http://127.0.0.1:3100/customer/returning',{waitUntil:'networkidle0'});assert.match(await page.$eval('.sun',el=>el.textContent),/Reuse print settings/);
      await context.close();
    }
    assert.deepEqual(errors,[]);console.log('Browser checks passed at 320, 390 and 1440px: wallet dismissal, accurate live quote, preview and repeat-order flows.');
  } finally {await browser.close();}
}
