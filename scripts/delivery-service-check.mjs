// Run: node scripts/delivery-service-check.mjs — isolated data, no money, email or printer.
import assert from 'node:assert/strict';
import { createOrderPreview } from './order-preview.mjs';
import { previewDb } from './store-preview.mjs';
import { deliveryFeeFor, HUBS } from '../lib/pricing.js';
import { deliveryPlan, validateDestination, campaignConfig } from '../lib/campus.js';
import { hashPassword, passwordMatches } from '../lib/auth.js';
import { fulfillmentFor, assignPurchase } from '../lib/partners.js';
import { cartFor, cartQuote, createPurchase, confirmPurchase, setQuantity, saveProduct } from '../lib/store.js';
import { buildCoverPdf } from '../agent/cover.js';
import { couponPolicy } from './store-preview.mjs';

const db=previewDb({real:true}), user=db.users[0], point=HUBS.vapi, at=Date.parse('2026-10-06T10:00:00+05:30');
for(const [km,fee,batch] of [[0,15,10],[1.9,15,10],[2.1,25,15],[4.1,35,20],[6.1,45,25],[8.1,50,25]]) {
  const pin={lat:point.lat-km/1.25/111.195,lng:point.lng};
  assert.equal(deliveryFeeFor(db.pricing,'vapi',pin).fee,0);
  assert.equal(deliveryFeeFor(db.pricing,'vapi',pin,deliveryPlan(db,'local-vapi-afternoon',null,at)).fee,0);
}
assert.throws(()=>deliveryFeeFor(db.pricing,'vapi',null));
assert.throws(()=>deliveryFeeFor(db.pricing,'vapi',{lat:20.1,lng:73.1}),/Outside|outside/);
assert.equal(deliveryFeeFor(db.pricing,'daman',HUBS.daman).fee,0);
assert.throws(()=>deliveryPlan(db,'pickup'),/development/);
assert.throws(()=>validateDestination(deliveryPlan(db,'school'),''),/name/);
for(const name of ['LIT Sarigam','Example Public School','Vapi Arts College']) {
  const plan=validateDestination(deliveryPlan(db,'school',null,at),name);
  assert.equal(deliveryFeeFor(db.pricing,'vapi',point,plan).fee,5);
  assert.equal(deliveryFeeFor(db.pricing,'vapi',point,validateDestination(deliveryPlan(db,'school-express'),name)).fee,5);
}
assert.equal(deliveryPlan(db,'school',null,at).slotId,'school-afternoon');
assert.equal(deliveryPlan(db,'school',null,Date.parse('2026-10-06T11:00:00+05:30')).slotId,'school-morning','Cutoff rolls to next available window');
const hash=hashPassword('local-test-password');assert.ok(passwordMatches('local-test-password',hash));assert.ok(!passwordMatches('wrong-password',hash));
const validate=couponPolicy.validateCoupon;
const cart=cartFor(db,user.id);db.orders.push({id:'test-print',customerId:user.id,status:'CREATED',paymentStatus:'pending',document:'Notes.pdf',pages:100,bwPages:100,colorPages:0,copies:1,printType:'bw',sides:'single',binding:'none',subtotal:200,addressId:'preview-address'});cart.printIds=['test-print'];
assert.equal(cartQuote(db,cart,user.id,{addressId:'preview-address',deliverySlot:'express'},validate).deliveryFee,0,'No extra address delivery charge');
assert.equal(cartQuote(db,cart,user.id,{addressId:'preview-address',deliverySlot:'school',institutionName:'Example School'},validate).deliveryFee,5,'School delivery is flat at every quantity');
assert.equal(cartQuote(db,cart,user.id,{addressId:'preview-address',deliverySlot:'local-vapi-afternoon'},validate).deliveryFee,0,'Scheduled address basket offer retained');
{
  const newDb=previewDb(true);newDb.addresses=[];newDb.users[0].phone='';
  const newCart=cartFor(newDb,user.id);setQuantity(newDb,newCart,newDb.products[0].id,'green',1);
  const selection={addressId:'__new',deliverySlot:'school',institutionName:'Example College',nn_address:'Example College, Chala',nn_area:'Vapi',nn_pin:'396191',nn_phone:'9825011111',deliveryLat:point.lat,deliveryLng:point.lng};
  assert.throws(()=>cartQuote(newDb,newCart,user.id,{...selection,nn_pin:'bad'},validate),/PIN/);
  const purchased=createPurchase(newDb,newCart,user.id,selection,validate,true);assert.equal(purchased.deliveryFee,5);assert.equal(newDb.addresses.length,1);assert.equal(newDb.addresses[0].institutionName,'Example College');
  confirmPurchase(newDb,purchased,'wallet',null,validate);assert.equal(purchased.status,'PAID','Stationery-only customer can add address and pay in checkout');
}
db.partners=[{id:'shop-one',staffId:'staff-one',name:'Example print shop',address:'Sample pickup',...point,zone:'vapi',active:true,color:true,binding:true,stationery:true,batch:true,radiusKm:10,batchCapacity:1,bwRate:1,colorRate:3}];
db.users.push({id:'staff-one',role:'partner',name:'Partner One',email:'one@example.test'},{id:'staff-other',role:'partner',name:'Partner Other',email:'other@example.test'},{id:'rider-one',role:'rider',name:'Rider One',email:'rider@example.test'});
const p=createPurchase(db,cart,user.id,{addressId:'preview-address',deliverySlot:'school',institutionName:'Example School'},validate,true);
assert.equal(p.fulfillmentId,'shop-one');assert.equal(confirmPurchase(db,p,'wallet',null,validate),true);assert.equal(p.partnerState,'ASSIGNED');assert.equal(p.partnerSettlement,100);assert.equal(db.orders[0].fulfillmentId,'shop-one');
assert.equal(confirmPurchase(db,p,'wallet',null,validate),false,'Payment confirmation is idempotent');
assert.throws(()=>fulfillmentFor(db,point,{...p,zone:'vapi'}),/full/);

// Stock belongs to one fulfilment desk; mixed shops and silent reassignment are rejected.
{
  const stockDb=structuredClone(db), stockCart=cartFor(stockDb,user.id);
  stockDb.products[0].shopId='shop-one';
  setQuantity(stockDb,stockCart,stockDb.products[0].id,'green',1);
  const stocked=createPurchase(stockDb,stockCart,user.id,{addressId:'preview-address',deliverySlot:'express'},validate,true);
  assert.equal(stocked.fulfillmentId,'shop-one');
  assert.throws(()=>saveProduct(stockDb,{...stockDb.products[0],shopId:'',active:'on',stock:99}),/reserved/);
  confirmPurchase(stockDb,stocked,'wallet',null,validate);
  assert.equal(stocked.partnerSettlement,25,'Shop receives stationery selling value after discounts');
  assert.throws(()=>assignPurchase(stockDb,stocked,null,'admin'),/owns its stock/);
  const mixed=cartFor(stockDb,'other-customer');
  mixed.lines=[{productId:stockDb.products[0].id,color:'green',quantity:1},{productId:stockDb.products[1].id,color:'',quantity:1}];
  assert.throws(()=>cartQuote(stockDb,mixed,user.id,{addressId:'preview-address'},validate),/separate orders/);
  stockDb.partners[0].active=false;
  assert.throws(()=>cartQuote(stockDb,{...stockCart,lines:[{productId:stockDb.products[0].id,color:'green',quantity:1}]},user.id,{addressId:'preview-address'},validate),/unavailable/);
}
db.partners.push({...db.partners[0],id:'shop-other',staffId:'staff-other',name:'Other print shop',lat:point.lat+.005,batchCapacity:30});
db.products[0].shopId='shop-one'; db.products[1].shopId='shop-other';
const preview=createOrderPreview(db), server=preview.app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));const base='http://127.0.0.1:'+server.address().port;
async function request(url,id,body) {return fetch(base+url,{method:body?'POST':'GET',headers:{cookie:'pk_demo='+id,'Content-Type':'application/x-www-form-urlencoded'},body:body?new URLSearchParams(body):undefined,redirect:'manual'});}
try {
  assert.equal((await request('/partner','preview-customer')).status,403);
  assert.equal((await request('/partner/files/test-print','staff-other')).status,404);
  assert.equal((await request('/partner/purchases/'+p.id+'/ready','staff-one',{})).status,400,'Cannot mark ready before accepting');
  assert.equal((await request('/partner/purchases/'+p.id+'/accept','staff-other',{})).status,400,'Another shop cannot accept an order');
  assert.equal((await request('/partner/purchases/'+p.id+'/accept','staff-one',{})).status,302);
  assert.equal((await request('/partner/purchases/'+p.id+'/ready','staff-one',{})).status,302);
  assert.equal((await request('/admin/delivery/'+p.id+'/rider','preview-admin',{riderId:'rider-one'})).status,302);
  assert.equal((await request('/rider/purchases/'+p.id+'/status','rider-one',{to:'OUT_FOR_DELIVERY'})).status,400,'Rider must wait for shop handover');
  assert.equal((await request('/partner/purchases/'+p.id+'/handover','staff-one',{})).status,302);
  assert.equal((await request('/rider/purchases/'+p.id+'/status','rider-one',{to:'OUT_FOR_DELIVERY'})).status,302);
  assert.equal((await request('/rider/purchases/'+p.id+'/status','rider-one',{to:'DELIVERED'})).status,302);
  assert.equal((await request('/rider/purchases/'+p.id+'/status','rider-one',{to:'DELIVERED'})).status,400,'No duplicate delivery');
  const receipt=await request('/customer/purchases/'+p.id,user.id);assert.match(await receipt.text(),/delivered/);
  const shops=await(await fetch(base+'/shops')).text();assert.match(shops,/Example print shop/);assert.match(shops,/shop=shop-one/);
  const storefront=await(await fetch(base+'/stationery?shop=shop-one')).text();assert.match(storefront,/Cardboard file/);assert.doesNotMatch(storefront,/Everyday notebook/);
  const ownCatalogue=await(await request('/partner/catalogue','staff-one')).text();assert.match(ownCatalogue,/Cardboard file/);assert.doesNotMatch(ownCatalogue,/Everyday notebook/);
  assert.equal((await request('/partner/catalogue?edit='+db.products[1].id,'staff-one')).status,404);
  const productForm=new FormData();for(const [key,value] of Object.entries({name:'Partner pen',category:'Writing',price:'12',stock:'3',active:'on',shopId:'shop-other'}))productForm.set(key,value);
  assert.equal((await fetch(base+'/partner/catalogue',{method:'POST',headers:{cookie:'pk_demo=staff-one'},body:productForm,redirect:'manual'})).status,302);
  assert.equal(preview.snapshot().products.at(-1).shopId,'shop-one','Partner cannot forge another shop’s stock');
  productForm.set('id',db.products[1].id);
  assert.equal((await fetch(base+'/partner/catalogue',{method:'POST',headers:{cookie:'pk_demo=staff-one'},body:productForm,redirect:'manual'})).status,400);
  const pdf=buildCoverPdf('Sample document',[['Name','Test only']]), upload=new FormData();upload.set('shopId','shop-other');upload.set('doc',new Blob([pdf],{type:'application/pdf'}),'Sample.pdf');
  const uploaded=await fetch(base+'/customer/orders/new/upload',{method:'POST',headers:{cookie:'pk_demo='+user.id},body:upload,redirect:'manual'});const draft=new URL(base+uploaded.headers.get('location')).searchParams.get('draft');
  assert.ok(draft);assert.equal(preview.snapshot().drafts.at(-1).preferredShopId,'shop-other');
  const confirm=await request('/customer/orders/new/confirm',user.id,{draft,nn_phone:user.phone,deliverySlot:'school',institutionName:'Another College',addressId:'preview-address',copies:1,sides:'single',printType:'bw',deliveryLat:point.lat,deliveryLng:point.lng});
  assert.equal(confirm.status,302,await confirm.text());assert.equal(preview.snapshot().drafts.at(-1).selections.fulfillmentId,'shop-other','Chosen shop survives upload and location selection');
  const summary=await request(confirm.headers.get('location'),user.id);assert.equal(summary.status,200);const summaryHtml=await summary.text();assert.match(summaryHtml,/₹5/);assert.match(summaryHtml,/Other print shop/);
  const newAddressConfirm=await request('/customer/orders/new/confirm',user.id,{draft,nn_phone:user.phone,deliverySlot:'school',institutionName:'New College',addressId:'__new',nn_address:'New College, Chala',nn_area:'Vapi',nn_pin:'396191',copies:1,sides:'single',printType:'bw',deliveryLat:point.lat,deliveryLng:point.lng});
  assert.equal(newAddressConfirm.status,302,await newAddressConfirm.text());
  const savedSchool=preview.snapshot().addresses.at(-1);assert.equal(savedSchool.lat,point.lat);assert.equal(savedSchool.institutionName,'New College');
  assert.equal((await request(newAddressConfirm.headers.get('location'),user.id)).status,200,'New school address keeps its map pin through summary');
  const expressConfirm=await request('/customer/orders/new/confirm',user.id,{draft,nn_phone:user.phone,deliverySlot:'express',addressId:'preview-address',copies:1,sides:'single',printType:'bw',deliveryLat:point.lat,deliveryLng:point.lng});
  assert.equal(expressConfirm.status,302);assert.equal(preview.snapshot().drafts.at(-1).selections.preferredShopId,'shop-other','Express retains the selected shop');
  assert.match(await (await request(expressConfirm.headers.get('location'),user.id)).text(),/Other print shop/);
  assert.equal((await request('/customer/orders/new/confirm',user.id,{draft,deliverySlot:'college'})).status,400,'Old first-free LIT route cannot be selected for new orders');
  assert.match(await (await fetch(base+'/')).text(),/Your file\.|School \/ College|₹5/);
  assert.match(await (await fetch(base+'/kiosks')).text(),/IN DEVELOPMENT/);
  console.log('Delivery service checks passed: distance bands, school pricing, cutoffs, basket rules, capacity, payment replay, staff isolation, full partner → rider delivery, owned shop catalogues and selected-shop print checkout.');
} finally { await new Promise(resolve=>server.close(resolve)); }
