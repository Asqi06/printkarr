import test from 'node:test';
import assert from 'node:assert/strict';
import { printPricing, processingFee, collegeDeliveryFee } from '../public/print-pricing.js';
import { cartFor, cartItems, addPrint, createPurchase, checkPurchase, confirmPurchase, cancelPurchase } from './store.js';
import { surchargeFees, deliveryFeeFor, HUBS } from './pricing.js';
import { canFulfil } from './machine.js';
import { createOrderPreview } from '../scripts/order-preview.mjs';
import { createStorePreview, previewDb, couponPolicy } from '../scripts/store-preview.mjs';
const validate=couponPolicy.validateCoupon;
function basket() {
  const db=previewDb(), id=db.users[0].id, cart=cartFor(db,id);
  db.settings.campaign.firstPrint.enabled=false;
  for(const [n,type] of [[1,'bw'],[2,'color']]) {
    db.orders.push({id:'PK-CASH-'+n,customerId:id,pricingVersion:1,status:'CREATED',paymentStatus:'pending',pages:100,copies:1,printType:type,sides:'single',binding:'none',document:'Fictional notes.pdf',subtotal:type==='bw'?200:400,history:[]});addPrint(db,id,'PK-CASH-'+n);
  }
  const p=createPurchase(db,cart,id,{addressId:'preview-address',deliverySlot:'school',institutionName:'Example classes'},validate);
  return {db,p,id};
}
test('configured surcharges stay removed and institution delivery is five at every size and speed',()=>{
  assert.deepEqual(surchargeFees({surcharges:{lateNight:{start:'00:00',end:'23:59',fee:99},surge:{activeJobs:1,fee:99}}},1000,new Date('2026-10-10T00:00:00Z')),{lateNightFee:0,surgeFee:0});
  for(const printedSides of [0,1,30,300,1001]) for(const deliveryMode of ['batch','express']) {
    const plan={institutionDelivery:true,institutionName:'Example school',deliveryMode,printedSides};
    assert.equal(deliveryFeeFor({},'vapi',HUBS.vapi,plan).fee,5);
  }
  assert.equal(deliveryFeeFor({delivery:{vapi:99}},'vapi',HUBS.vapi).fee,0);
});
test('progressive slabs, mixed quantities, floors and caps stay monotonic',()=>{
  const pricing={bw:2,color:4,studentBw:2,studentColor:4};
  assert.equal(printPricing({bw:100,color:0},pricing).subtotal,190);
  assert.equal(printPricing({bw:100,color:100},pricing).subtotal,555);
  assert.equal(printPricing({bw:0,color:400},pricing).subtotal,1400);
  for(const kind of ['bw','color']) {
    let previous=0;
    for(let n=1;n<=1001;n++) {
      const counts={bw:kind==='bw'?n:0,color:kind==='color'?n:0},q=printPricing(counts,pricing);
      const total=q.subtotal+processingFee(n)+collegeDeliveryFee(n);
      assert.ok(total>=previous,kind+' quantity '+n);previous=total;
      assert.ok(processingFee(n)<=10 && collegeDeliveryFee(n)<=10);
      if(n>300)assert.equal(Math.round((q.subtotal-printPricing({bw:kind==='bw'?n-1:0,color:kind==='color'?n-1:0},pricing).subtotal)*100),kind==='bw'?140:300);
    }
  }
  assert.deepEqual([processingFee(0),processingFee(10),processingFee(11),processingFee(31),processingFee(76),processingFee(151)],[0,0,0,0,0,0]);
  assert.deepEqual([collegeDeliveryFee(29),collegeDeliveryFee(30),collegeDeliveryFee(150),collegeDeliveryFee(300)],[5,5,5,5]);
  assert.equal(printPricing({bw:400,color:0},{...pricing,bw:1}).subtotal,400,'An admin festival rate below the floor never increases');
  assert.throws(()=>processingFee(-1));assert.throws(()=>printPricing({bw:2.5,color:0},pricing));
});
test('pending checkouts lose removed fees; provider-bound and paid amounts stay fixed',()=>{
  const {db,p}=basket();Object.assign(p,{deliveryFee:10,processingFee:2,lateNightFee:3,surgeFee:4,total:574});
  p.gatewayOrderId='frozen-provider-order';checkPurchase(db,p,validate);assert.equal(p.total,574);
  delete p.gatewayOrderId;p.gatewayCreating=true;checkPurchase(db,p,validate);assert.equal(p.total,574);
  delete p.gatewayCreating;checkPurchase(db,p,validate);assert.equal(p.total,560);assert.equal(p.deliveryFee,5);assert.equal(p.processingFee+p.lateNightFee+p.surgeFee,0);
  checkPurchase(db,p,validate);assert.equal(p.total,560,'Refreshing twice cannot deduct twice');
  confirmPurchase(db,p,'wallet',null,validate);assert.equal(p.total,560);assert.equal(db.orders.reduce((n,o)=>n+o.total,0),560);
});

test('obsolete provider quotes refresh only on an explicit missing-order response',async()=>{
  for(const [status,result,refresh] of [[400,{error:{description:'The id provided does not exist'}},true],[401,{error:{description:'Authentication failed'}},false],[200,{id:'old-order',status:'created',amount:57400},false],[400,{error:{description:'Other validation error'}},false]]) {
    const {db,p}=basket();Object.assign(p,{gatewayOrderId:'old-order',deliveryFee:10,processingFee:2,lateNightFee:3,surgeFee:4,total:574});
    let calls=0;const preview=createStorePreview(db,{preview:false,gateway:{id:'fake',secret:'fake'},fetchGateway:async()=>{calls++;return new Response(JSON.stringify(result),{status,headers:{'Content-Type':'application/json'}});}});
    const server=preview.app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
    try {
      const base='http://127.0.0.1:'+server.address().port;
      assert.equal((await fetch(base+'/customer/purchases/'+p.id)).status,200);
      const saved=preview.snapshot().purchases[0];assert.equal(saved.total,refresh ? 560 : 574);assert.equal(saved.gatewayOrderId,refresh ? undefined : 'old-order');
      if(refresh){assert.equal(saved.retiredGatewayOrders[0].id,'old-order');assert.equal(saved.retiredGatewayOrders[0].total,574);await fetch(base+'/customer/purchases/'+p.id);assert.equal(calls,1);assert.equal(preview.snapshot().purchases[0].total,560);}
    } finally {await new Promise(r=>server.close(r));}
  }
});

test('new baskets preserve older carts and gateway payment records while using current fees',()=>{
  const {db,p,id}=basket();Object.assign(p,{gatewayOrderId:'old-provider-order',deliveryFee:10,processingFee:2,total:567});
  const original=db.carts.find(c=>c.purchaseId===p.id), saved=structuredClone(original);
  const cart=cartFor(db,id);assert.notEqual(cart.id,original.id);assert.deepEqual(original,saved);assert.equal(db.carts.length,2);assert.equal(cartFor(db,id).id,cart.id);assert.equal(p.total,567);assert.equal(p.gatewayOrderId,'old-provider-order');
  db.orders.push({id:'PK-NEW-PRICE',customerId:id,pricingVersion:1,status:'CREATED',paymentStatus:'pending',pages:6,copies:1,printType:'bw',sides:'single',binding:'none',document:'New print.pdf',subtotal:12,history:[]});
  addPrint(db,id,'PK-NEW-PRICE');const fresh=createPurchase(db,cart,id,{addressId:'preview-address',deliverySlot:'school',institutionName:'Example school'},validate);
  assert.notEqual(fresh.id,p.id);assert.equal(fresh.processingFee,0);assert.equal(fresh.deliveryFee,5);assert.equal(fresh.total,17);
  confirmPurchase(db,p,'razorpay','captured-old-payment',validate);assert.equal(p.total,567);assert.equal(cart.purchaseId,fresh.id,'An earlier payment cannot erase the new basket');assert.equal(fresh.paymentStatus,'pending');
});

test('cash is rejected centrally and wallet payment/cancellation are idempotent',()=>{
  const {db,p,id}=basket(),before=db.wallets[0].balance;
  assert.throws(()=>confirmPurchase(db,p,'cod',null,validate),/wallet or Razorpay/);
  assert.equal(p.status,'CREATED');assert.equal(db.wallets[0].balance,before);
  p.gatewayOrderId='order_pending';assert.throws(()=>confirmPurchase(db,p,'wallet',null,validate),/online payment/);delete p.gatewayOrderId;
  assert.equal(confirmPurchase(db,p,'wallet',null,validate),true);
  assert.equal(confirmPurchase(db,p,'wallet',null,validate),false);
  assert.equal(db.wallets[0].balance,before-p.total);assert.ok(db.orders.every(canFulfil));
  cancelPurchase(db,p,id,()=>{},()=>{});cancelPurchase(db,p,id,()=>{},()=>{});
  assert.equal(db.wallets[0].balance,before);assert.equal(p.status,'REFUNDED');
});

test('removed cash endpoint cannot create or charge an order',async()=>{
  const {db,p}=basket();const preview=createStorePreview(db),server=preview.app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
  const base='http://127.0.0.1:'+server.address().port;
  try {
    const response=await fetch(base+'/customer/purchases/'+p.id+'/cod',{method:'POST',headers:{Origin:base}});
    assert.equal(response.status,410);assert.equal(preview.snapshot().purchases[0].status,'CREATED');assert.equal(preview.snapshot().wallets[0].balance,1000);
    const html=await(await fetch(base+'/customer/purchases/'+p.id)).text();assert.doesNotMatch(html,/Cash on delivery|cash-choice/);
  }finally{await new Promise(r=>server.close(r));}
});
