import fs from 'node:fs';
let p='public/studio.css',s=fs.readFileSync(p,'utf8');s=s.replace('grid-column:1;grid-row:6/span 40;','grid-column:1;grid-row:span 40;');fs.writeFileSync(p,s);
p='scripts/site-coverage-check.mjs';s=fs.readFileSync(p,'utf8');s=s.replace("import {previewDb} from './store-preview.mjs';", "import {previewDb} from './store-preview.mjs';\nimport {createOrderPreview} from './order-preview.mjs';");
const block=`// Exercise populated operational screens through their existing read-only handlers.
{
  const ops=previewDb(),shop={id:'design-shop',staffId:'design-partner',name:'Sample local shop',address:'Sample pickup address, Vapi',zone:'vapi',lat:20.389722,lng:72.889945,radiusKm:5,batchCapacity:30,active:true,color:true,binding:true,stationery:true,batch:true};
  ops.users.push({id:'design-partner',role:'partner',name:'Sample partner',email:'partner@example.test'},{id:'design-rider',role:'rider',name:'Sample rider',email:'rider@example.test'});ops.partners=[shop];
  ops.purchases=['PAID','READY','OUT_FOR_DELIVERY'].map((status,i)=>({...receipt,id:'PK-SAMPLE-'+(i+1),status,paymentStatus:i===2?'cod_pending':'paid',fulfillmentId:shop.id,fulfillmentName:shop.name,riderId:'design-rider',partnerState:i===0?'ASSIGNED':'ACCEPTED',deliveryZone:'vapi',partnerSettlement:20,handedOverAt:i===2?'2026-10-09T08:00:00.000Z':null,history:[]}));
  const preview=createOrderPreview(ops),server=preview.app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
  try{for(const [route,role] of [['/admin/delivery','admin'],['/admin/partners?edit=design-shop','admin'],['/partner','partner'],['/rider','rider'],['/admin/purchases','admin'],['/customer/purchases','customer']]){const response=await fetch('http://127.0.0.1:'+server.address().port+route,{headers:{cookie:'preview_role='+role}});assert.equal(response.status,200);pages.set(route.split('?')[0]+'/populated',await response.text());}}
  finally{await new Promise(r=>server.close(r));}
}
`;
s=s.replace('for(const [route,html] of pages)',block+'for(const [route,html] of pages)');fs.writeFileSync(p,s);
