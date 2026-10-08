import test from 'node:test';
import assert from 'node:assert/strict';
import { printPricing, processingFee, collegeDeliveryFee } from '../public/print-pricing.js';
import { cartFor, cartItems, addPrint, createPurchase, confirmPurchase, collectCash, cancelPurchase } from './store.js';
import { canFulfil } from './machine.js';
import { createOrderPreview } from '../scripts/order-preview.mjs';
import { previewDb, couponPolicy } from '../scripts/store-preview.mjs';
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
  assert.deepEqual([processingFee(0),processingFee(10),processingFee(11),processingFee(31),processingFee(76),processingFee(151)],[0,2,4,6,8,10]);
  assert.deepEqual([collegeDeliveryFee(29),collegeDeliveryFee(30),collegeDeliveryFee(150),collegeDeliveryFee(300)],[10,9,5,0]);
  assert.equal(printPricing({bw:400,color:0},{...pricing,bw:1}).subtotal,400,'An admin festival rate below the floor never increases');
  assert.throws(()=>processingFee(-1));assert.throws(()=>printPricing({bw:2.5,color:0},pricing));
});
test('one basket fee, COD once, gateway race guard, cash collection and cancellation',()=>{
  let {db,p,id}=basket();assert.equal(p.subtotal,555);assert.equal(p.processingFee,10);assert.equal(p.deliveryFee,4);assert.equal(p.total,569);assert.equal(p.bulkDiscount,45);
  const originals=db.orders.map(o=>o.subtotal);db.pricing.bw=9;db.pricing.color=12;cartItems(db,cartFor(db,id),id);assert.deepEqual(db.orders.map(o=>o.subtotal),originals,'Reserved prices stay frozen after admin edits');db.pricing.bw=2;db.pricing.color=4;
  p.gatewayOrderId='provider-order';assert.throws(()=>confirmPurchase(db,p,'cod',null,validate),/online payment/);assert.equal(p.total,569);delete p.gatewayOrderId;
  assert.equal(confirmPurchase(db,p,'cod',null,validate),true);assert.equal(p.total,579);assert.equal(p.codFee,10);assert.equal(p.paymentStatus,'cod_pending');assert.equal(p.paidAt,undefined);assert.equal(db.wallets[0].balance,1000);
  assert.ok(db.orders.every(canFulfil));assert.equal(confirmPurchase(db,p,'cod',null,validate),false);assert.equal(p.total,579);assert.equal(db.orders.reduce((sum,o)=>sum+o.total,0),p.total);
  assert.throws(()=>collectCash(db,p,'rider',579),/Confirm exactly/);p.status='OUT_FOR_DELIVERY';assert.throws(()=>collectCash(db,p,'rider',578),/Confirm exactly/);assert.equal(p.paymentStatus,'cod_pending');
  assert.equal(collectCash(db,p,'rider',579),true);assert.equal(collectCash(db,p,'rider',579),false);assert.equal(p.cashCollectedBy,'rider');assert.equal(p.paymentStatus,'paid');assert.ok(db.orders.every(o=>o.paymentStatus==='paid'));assert.equal(db.wallets[0].balance,1000);
  ({db,p,id}=basket());confirmPurchase(db,p,'cod',null,validate);cancelPurchase(db,p,id,()=>{},()=>{});assert.equal(p.status,'CANCELLED');assert.equal(db.wallets[0].balance,1000,'Uncollected cash cannot turn into wallet credit');assert.ok(db.orders.every(o=>!canFulfil(o)));
  assert.equal(canFulfil({paymentStatus:'pending',paymentMethod:'cod'}),false);
  ({db,p}=basket());confirmPurchase(db,p,'cod',null,validate);p.deliveryMode='pickup';p.status='READY';assert.equal(collectCash(db,p,'admin',579),true,'Cash pickup can be collected at the counter');
  db=previewDb(true);const product=db.products.find(p=>p.active),before=product.stock,cart=cartFor(db,db.users[0].id);cart.lines.push({productId:product.id,color:product.colors[0] || '',quantity:1});
  p=createPurchase(db,cart,db.users[0].id,{addressId:'preview-address',deliverySlot:'school',institutionName:'Example school'},validate);
  assert.equal(p.processingFee,0);confirmPurchase(db,p,'cod',null,validate);assert.equal(product.stock,before-1);confirmPurchase(db,p,'cod',null,validate);assert.equal(product.stock,before-1);cancelPurchase(db,p,db.users[0].id,()=>{},()=>{});assert.equal(product.stock,before);assert.equal(db.wallets[0].balance,1000);

});
test('HTTP cash consent, ownership, replay and exact collection are enforced',async()=>{
  const {db,p,id}=basket();db.users.push({id:'other-customer',role:'customer',name:'Other'});
  let preview=createOrderPreview(db), server=preview.app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
  let base='http://127.0.0.1:'+server.address().port;
  const post=(route,body={},who=id)=>fetch(base+route,{method:'POST',redirect:'manual',headers:{cookie:'pk_demo='+who,Origin:base,'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(body)});
  try {
    assert.equal((await post('/customer/purchases/'+p.id+'/cod',{confirmCash:'1'},'other-customer')).status,404);
    assert.equal((await post('/customer/purchases/'+p.id+'/cod')).status,400);
    assert.equal((await post('/customer/purchases/'+p.id+'/cod',{confirmCash:'1'})).status,302);
    assert.equal((await post('/customer/purchases/'+p.id+'/cod',{confirmCash:'1'})).status,302);assert.equal(preview.snapshot().purchases[0].total,579);
    const html=await(await fetch(base+'/customer/purchases/'+p.id,{headers:{cookie:'pk_demo='+id}})).text();assert.match(html,/Cash order confirmed/);assert.match(html,/Cash handling/);assert.match(html,/Print processing/);
  } finally {await new Promise(r=>server.close(r));}
  const cash=preview.snapshot();cash.purchases[0].status='OUT_FOR_DELIVERY';cash.orders.forEach(o=>o.status='OUT_FOR_DELIVERY');
  preview=createOrderPreview(cash);server=preview.app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));base='http://127.0.0.1:'+server.address().port;
  try {
    assert.equal((await post('/admin/purchases/'+p.id+'/status',{to:'DELIVERED'},'preview-admin')).status,400);assert.equal(preview.snapshot().purchases[0].paymentStatus,'cod_pending');
    assert.equal((await post('/admin/purchases/'+p.id+'/status',{to:'DELIVERED',cashReceived:'579'},'preview-admin')).status,302);
    assert.equal(preview.snapshot().purchases[0].status,'DELIVERED');assert.equal(preview.snapshot().purchases[0].cashReceived,579);
    assert.equal((await post('/admin/purchases/'+p.id+'/status',{to:'DELIVERED',cashReceived:'579'},'preview-admin')).status,400);
  } finally {await new Promise(r=>server.close(r));}  cash.users.push({id:'cash-rider',role:'rider',name:'Assigned rider'},{id:'other-rider',role:'rider',name:'Other rider'});cash.purchases[0].riderId='cash-rider';
  preview=createOrderPreview(cash);server=preview.app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));base='http://127.0.0.1:'+server.address().port;
  try {
    const route='/rider/purchases/'+p.id+'/status';
    assert.equal((await post(route,{to:'DELIVERED',cashReceived:'579'},'other-rider')).status,400);
    assert.equal((await post(route,{to:'DELIVERED'},'cash-rider')).status,400);
    assert.equal((await post(route,{to:'DELIVERED',cashReceived:'579'},'cash-rider')).status,302);
    assert.equal(preview.snapshot().purchases[0].cashCollectedBy,'cash-rider');assert.equal(preview.snapshot().purchases[0].paymentStatus,'paid');
  } finally {await new Promise(r=>server.close(r));}
});
