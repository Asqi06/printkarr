// node scripts/split-print-check.mjs — temporary files, fictional wallet, no printer.
import assert from 'node:assert/strict';
import {PDFDocument, degrees} from 'pdf-lib';
import {printPlan} from '../public/print-plan.js';
import {splitMixedPdf} from '../lib/files.js';
import {printJobs, printSettings} from '../agent/print-settings.js';
import {createOrderPreview} from './order-preview.mjs';
import {previewDb} from './store-preview.mjs';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

// A yielded PDF parse must not overwrite a concurrent wallet/address write.
const serverSource=readFileSync(new URL('../server.mjs',import.meta.url),'utf8').replaceAll('\r\n','\n');
for(const route of ['/customer/orders/new/confirm','/order/options']){
 let db={drafts:[{id:'race-draft',customerId:'customer',pages:8,stored:'draft.pdf'}],addresses:[],pricing:{},settings:{order:{maxFileMb:20}},wallets:[]}, handler;
 const start=serverSource.indexOf(`app.post('${route}'`), end=serverSource.indexOf('\n});',start)+4;
 runInNewContext(serverSource.slice(start,end),{
  app:{post:(_route,...callbacks)=>{handler=callbacks.at(-1);}},requireRole:()=>()=>{},currentUser:()=>null,
  loadDb:()=>structuredClone(db),saveDb:next=>{db=structuredClone(next);},guestDraft:next=>next.drafts[0],
  printPlan,splitMixedPdf:async()=>{await Promise.resolve();db.wallets.push({customerId:'customer',balance:725});throw new Error('Unreadable PDF');},
  fs:{readFileSync:()=>Buffer.from('pdf')},path:{join:()=>''},ROOT:'',
  campaignConfig:()=>({}),printQuoteExtras:()=>({}),optionsStep:()=>'',orderPage:()=>''
 });
 await handler({user:{id:'customer'},body:{draft:'race-draft',printType:'mixed',splitMixed:'1',mixedRange:'3,6'}},{status(){return this;},send(){}});
 assert.equal(db.wallets[0]?.balance,725,route+' must preserve writes while PDF splitting yields');
}
const source=await PDFDocument.create();
for(let n=1;n<=8;n++){const page=source.addPage([500+n,700+n]);if(n===3)page.setRotation(degrees(90));page.drawText('Original page '+n);}
const bytes=await source.save();
const plan=printPlan({printType:'mixed',splitMixed:'1',mixedRange:'3, 6',range:'1-6,8',copies:2,sides:'double'},8);
const parts=await splitMixedPdf(bytes,{...plan,filePages:8});
for(const [i,expected] of [[0,[1,2,4,5,8]],[1,[3,6]]]){const pdf=await PDFDocument.load(parts[i].bytes);assert.equal(pdf.getPageCount(),expected.length);assert.deepEqual(pdf.getPages().map(p=>p.getWidth()),expected.map(n=>500+n));if(i===1)assert.equal(pdf.getPage(0).getRotation().angle,90);}
await assert.rejects(()=>splitMixedPdf(bytes,{...plan,filePages:9}),/count changed/);
await assert.rejects(()=>splitMixedPdf(bytes,{...plan,filePages:8,colorRange:'2,3'}),/overlap/);
await assert.rejects(()=>splitMixedPdf(Buffer.from('broken'),{...plan,filePages:8}));
for(const mixedRange of ['', '1-8', '9'])assert.throws(()=>printPlan({printType:'mixed',splitMixed:'1',mixedRange},8));
const jobs=printJobs({...plan,pages:plan.effPages,filePages:8});assert.deepEqual(jobs.map(j=>[j.printType,j.pages,j.copies]),[['bw',5,2],['color',2,2]]);
assert.match(printSettings(jobs[0]),/duplexlong,monochrome.*2x/);assert.match(printSettings(jobs[1]),/duplexlong,color.*2x/);
assert.throws(()=>printJobs({...plan,splitMixed:false}),/operator/);
const seed=previewDb(), preview=createOrderPreview(seed), server=preview.app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
const base='http://127.0.0.1:'+server.address().port;
const request=(route,body,cookie='')=>fetch(base+route,{redirect:'manual',method:body?'POST':'GET',headers:{cookie,'Content-Type':'application/x-www-form-urlencoded'},body:body?new URLSearchParams(body):undefined});
try{
 const form=new FormData();form.append('doc',new Blob([bytes],{type:'application/pdf'}),'Eight pages.pdf');const up=await fetch(base+'/customer/orders/new/upload',{method:'POST',body:form,redirect:'manual'});assert.equal(up.status,302);const id=new URL(up.headers.get('location'),base).searchParams.get('draft');
 const url='/customer/orders/new/'+id+'/split/color.pdf?mixedRange=3,6&range=1-6,8';const pdfRes=await request(url);assert.equal(pdfRes.status,200,await pdfRes.clone().text());assert.equal((await PDFDocument.load(await pdfRes.arrayBuffer())).getPageCount(),2);assert.equal(pdfRes.headers.get('cache-control'),'private, no-store');assert.equal((await request(url,undefined,'preview_role=admin')).status,403);assert.equal((await request('/order/'+id+'/split/color.pdf?mixedRange=3,6',undefined,'preview_role=guest')).status,404);
 const confirm=await request('/customer/orders/new/confirm',{draft:id,printType:'mixed',splitMixed:'1',mixedRange:'3,6',range:'1-6,8',copies:2,sides:'single',deliverySlot:'express',addressId:'preview-address',nn_phone:'9825011111'});assert.equal(confirm.status,302,await confirm.text());const selection=preview.snapshot().drafts[0].selections;assert.equal(selection.splitMixed,true);assert.equal(selection.bwPages,5);
 const place=await request('/customer/orders/new/place',{draft:id,checkout:'1'});assert.equal(place.status,302);const receipt=place.headers.get('location');await request(receipt+'/wallet',{});const order=preview.snapshot().orders[0];assert.equal(order.splitMixed,true);assert.equal(order.subtotal,36);
 assert.equal((await request('/api/agent/next')).status,204,'Old agents cannot claim split jobs');const next=await request('/api/agent/next?splitMixed=1');assert.equal((await next.json()).order.id,order.id);
 assert.equal((await request('/api/agent/'+order.id+'/started',{})).status,409);assert.equal((await request('/api/agent/'+order.id+'/started',{splitMixed:'true'})).status,409,'Capability flag must be a boolean, not arbitrary text');
 const agentPost=(route,body)=>fetch(base+route,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
 assert.equal((await agentPost('/api/agent/'+order.id+'/started',{splitMixed:true})).status,200);assert.equal((await agentPost('/api/agent/'+order.id+'/done',{splitMixed:true,queueDrained:true,completedParts:['bw']})).status,400);assert.equal((await agentPost('/api/agent/'+order.id+'/done',{splitMixed:true,queueDrained:true,completedParts:['bw','color'],observedJobs:2})).status,200);assert.equal(preview.snapshot().orders[0].status,'PRINTING');assert.equal(preview.snapshot().orders[0].printAwaitingVerification,true);
 seed.orders=[{...order,status:'PRINTING',fulfillmentId:'test-shop',purchaseId:'test-purchase'}];seed.users.push({id:'test-staff',role:'partner',name:'Sample shop staff'},{id:'other-staff',role:'partner',name:'Other shop staff'});seed.partners=[{id:'test-shop',staffId:'test-staff'},{id:'other-shop',staffId:'other-staff'}];seed.purchases=[{id:'test-purchase',partnerState:'ACCEPTED'}];preview.reset();
 const partnerUrl='/partner/files/'+order.id+'/color.pdf';const partnerRes=await request(partnerUrl,undefined,'pk_demo=test-staff');assert.equal(partnerRes.status,200);assert.equal((await PDFDocument.load(await partnerRes.arrayBuffer())).getPageCount(),2);assert.equal((await request(partnerUrl,undefined,'pk_demo=other-staff')).status,404,'Another shop cannot download the split customer file');
 const coverUrl='/partner/files/'+order.id+'/cover.pdf', coverRes=await request(coverUrl,undefined,'pk_demo=test-staff');assert.equal(coverRes.status,200);assert.equal(coverRes.headers.get('cache-control'),'private, no-store');const cover=await PDFDocument.load(await coverRes.arrayBuffer());assert.equal(cover.getPageCount(),1);assert.equal(cover.getTitle(),'PrintKarr cover - '+order.id);assert.equal((await request(coverUrl,undefined,'pk_demo=other-staff')).status,404);
 console.log('Split printing passed: preserved pages/rotation, disjoint subsets, pricing/copies, private PDF previews, ownership, old-agent compatibility and both-set completion guard.');
}finally{await new Promise(r=>server.close(r));}
