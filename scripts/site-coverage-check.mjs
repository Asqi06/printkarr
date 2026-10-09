// Every HTML screen family, using fixtures only. --serve exposes the review gallery.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import express from 'express';
import {pages} from './design-check.mjs';
import {previewDb} from './store-preview.mjs';
import {createOrderPreview} from './order-preview.mjs';
import {staffLoginPage,esc} from '../lib/views.js';
import {purchasePage,cataloguePage,storeError,shopPage} from '../lib/views_store.js';
import {notFoundPage,contactThankYouPage,contactPage,blogArticlePage} from '../lib/views_public.js';
import {printQueuePage,customersPage} from '../lib/views_admin.js';
const seed=previewDb(),user=seed.users[0],admin=seed.users[1],partner={id:'partner-preview',role:'partner',name:'Sample partner'};
const receipt={id:'PK-DESIGN-RECEIPT',customerId:user.id,status:'PAID',paymentStatus:'paid',paymentMethod:'wallet',preview:true,items:[{name:'Sample notebook',quantity:1,price:35,total:35}],printIds:[],address:seed.addresses[0],slot:'Scheduled local delivery',subtotal:35,stationerySubtotal:35,printSubtotal:0,discount:0,deliveryFee:15,processingFee:0,codFee:0,total:50,createdAt:new Date().toISOString()};
for(const role of ['partner','rider'])pages.set('/'+role+'/login',staffLoginPage(role));
pages.set('/404',notFoundPage());pages.set('/contact/thank-you',contactThankYouPage({confirmed:true}));pages.set('/contact/error',contactPage({error:'Please check your email and try again.',values:{name:'Sample customer',email:'invalid'}}));pages.set('/blogs/missing-story',blogArticlePage('missing-story'));
pages.set('/stationery/catalogue-preview',shopPage(seed.products,null));pages.set('/cart/error',storeError(user,'This item is no longer available. Review your basket before continuing.'));
pages.set('/admin/catalogue/edit',cataloguePage(admin,seed,seed.products[0].id));pages.set('/partner/catalogue/edit',cataloguePage(partner,seed,seed.products[0].id));
pages.set('/admin/customers/populated',customersPage(admin,[{...user,count:3,spent:178,wallet:150,pendingFiles:2}]));
pages.set('/admin/print-queue/populated',printQueuePage(admin,[{id:'PK-DESIGN-JOB',document:'Sample assignment.pdf',pages:12,copies:1,printType:'bw',sides:'single',status:'PRINT_QUEUE'}],{name:'Preview printer',online:false,ink:75,paper:80}));
for(const role of ['customer','admin'])for(const state of ['CREATED','PAID','REFUNDED'])pages.set('/'+role+'/purchases/'+state.toLowerCase(),purchasePage(role==='admin'?admin:user,{...receipt,status:state,paymentStatus:state==='CREATED'?'pending':state==='REFUNDED'?'refunded':'paid'},seed,{gateway:false}));
for(const state of ['CREATED','PAID'])pages.set('/customer/checkout/'+state.toLowerCase(),purchasePage(user,{...receipt,status:state,paymentStatus:state==='CREATED'?'pending':'cod_pending',focused:true},seed,{gateway:false}));
// Exercise populated operational screens through their existing read-only handlers.
{
  const ops=previewDb(),shop={id:'design-shop',staffId:'design-partner',name:'Sample local shop',address:'Sample pickup address, Vapi',zone:'vapi',lat:20.389722,lng:72.889945,radiusKm:5,batchCapacity:30,active:true,color:true,binding:true,stationery:true,batch:true};
  ops.users.push({id:'design-partner',role:'partner',name:'Sample partner',email:'partner@example.test'},{id:'design-rider',role:'rider',name:'Sample rider',email:'rider@example.test'});ops.partners=[shop];
  ops.purchases=['PAID','READY','OUT_FOR_DELIVERY'].map((status,i)=>({...receipt,id:'PK-SAMPLE-'+(i+1),status,paymentStatus:i===2?'cod_pending':'paid',fulfillmentId:shop.id,fulfillmentName:shop.name,riderId:'design-rider',partnerState:i===0?'ASSIGNED':'ACCEPTED',deliveryZone:'vapi',partnerSettlement:20,handedOverAt:i===2?'2026-10-09T08:00:00.000Z':null,history:[]}));
  const preview=createOrderPreview(ops),server=preview.app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
  try{for(const [route,role] of [['/admin/delivery','admin'],['/admin/partners?edit=design-shop','admin'],['/partner','partner'],['/rider','rider'],['/admin/purchases','admin'],['/customer/purchases','customer']]){const response=await fetch('http://127.0.0.1:'+server.address().port+route,{headers:{cookie:'preview_role='+role}});assert.equal(response.status,200);pages.set(route.split('?')[0]+'/populated',await response.text());}}
  finally{await new Promise(r=>server.close(r));}
}
for(const [route,html] of pages) {
  if(html.includes('class="order-focus"') && html.includes('/store.js?'))assert.match(html, /<script src="\/store\.js[^"]*" defer>/,route+' must initialize payment after the complete form is parsed');
}
const inventory=[...pages].map(([route,html])=>({route,title:html.match(/<title>([^]*?)<\/title>/)?.[1],workspace:/class="app-view/.test(html),forms:[...html.matchAll(/<form\b[^>]*action="([^"]*)"/g)].map(x=>x[1]),theme:html.includes('/studio.css?')}));
assert.ok(inventory.every(p=>p.theme),'Every page includes the complete shared redesign');
const app=express();app.use(express.static('public',{index:false}));app.get('/api/notifications',(_req,res)=>res.json({unread:0,notes:[]}));
app.get('/__design',(_req,res)=>res.send(`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>PrintKarr · All page review</title><style>body{font:15px/1.6 system-ui;background:#f7f8f3;color:#17211a;margin:40px}h1{font-size:42px;letter-spacing:-2px;color:#234be8}p{max-width:700px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:12px;margin-top:30px}a{display:block;background:white;border:1px solid #d7dfcb;border-radius:9px;padding:17px;color:#234be8;text-decoration:none}small{display:block;color:#6c795f;font-size:11px}a:hover{background:#dcef87}</style></head><body><h1>Every page, on the desk.</h1><p>${pages.size} pages and states in the Paper Studio theme. Local fixtures only: balances, customers, products and orders shown here are sample data. Forms in this review gallery do not perform real actions.</p><main>${inventory.map(p=>`<a href="${esc(p.route)}">${p.title}<small>${esc(p.route)}</small></a>`).join('')}</main></body></html>`));
app.get('*',(req,res)=>pages.has(req.path)?res.send(pages.get(req.path)):res.status(404).send(notFoundPage()));app.post('*',(_req,res)=>res.status(405).send('Read-only design gallery. Use the interactive local preview for form testing.'));
fs.mkdirSync('docs/paper-studio/pages',{recursive:true});fs.writeFileSync('docs/paper-studio/page-inventory.json',JSON.stringify(inventory,null,2));
if(process.argv.includes('--serve'))app.listen(3140,'127.0.0.1',()=>console.log('All page review: http://127.0.0.1:3140/__design'));
else {
  const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || 'file:///C:/Users/WELCOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
  const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));const base='http://127.0.0.1:'+server.address().port;
  const browser=await chromium.launch({channel:'msedge',headless:true}),results=[];
  try {
    for(const width of [1440,390]) {
      const page=await browser.newPage({viewport:{width,height:980},reducedMotion:'reduce'});await page.route('https://**/*',r=>r.abort());
      for(const [route] of pages) {
        const pageErrors=[];const handler=e=>pageErrors.push(e.stack || e.message);page.on('pageerror',handler);
        await page.goto(base+route,{waitUntil:'domcontentloaded'});await page.evaluate(()=>document.fonts.ready);
        const state=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,heading:document.querySelector('h1')?.textContent,workspace:document.body.classList.contains('app-view'),body:!!document.querySelector('.workspace-content'),sidebar:document.querySelector('.app-sidebar')?getComputedStyle(document.querySelector('.app-sidebar')).backgroundColor:null,overflow:[...document.querySelectorAll('main *')].filter(el=>{const r=el.getBoundingClientRect();return r.width>0&&r.right>innerWidth+2&&getComputedStyle(el).position!=='absolute'&&!el.closest('.tblwrap,.review-rail,.document-preview');}).slice(0,6).map(el=>el.tagName+'.'+el.className)}));
        const file=route==='/'?'home':route.replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'');
        await page.screenshot({path:`docs/paper-studio/pages/${file}-${width}.jpg`,quality:78});
        results.push({route,width,...state,errors:pageErrors});page.off('pageerror',handler);
        if(state.scroll>width+1||pageErrors.length)console.log('CHECK',route,width,JSON.stringify(state),pageErrors);
        assert.ok(state.heading?.trim(),route+' has a page heading');
        if(state.workspace)assert.ok(state.body,route+' new workspace layout');
      }
      console.log('Rendered',pages.size,'screens at',width);await page.close();
    }
    for(const width of [320,768,1024]) {
      const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});await page.route('https://**/*',r=>r.abort());
      for(const route of ['/admin','/admin/settings','/admin/orders','/admin/delivery/populated','/customer','/customer/profile','/partner/populated','/rider/populated']) {
        await page.goto(base+route);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,route+' overflow at '+width);
        await page.locator('.app-account-menu>summary').click();
        assert.equal(await page.locator('.app-account-popover').evaluate(el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1;}),true,route+' menu fits at '+width);
        if(route==='/admin') {await page.locator('.app-account-popover a[href="/admin/settings"]').click();assert.equal(new URL(page.url()).pathname,'/admin/settings');}
      }
      await page.close();
    }
    console.log('Workspace menus and dense pages also passed at 320, 768 and 1024 px.');
    fs.writeFileSync('docs/paper-studio/page-coverage.json',JSON.stringify(results,null,2));
    const failures=results.filter(r=>r.scroll>r.width+1||r.errors.length);
    assert.deepEqual(failures.map(r=>({route:r.route,width:r.width,scroll:r.scroll,errors:r.errors})),[]);
    console.log(`${pages.size} pages/states passed at desktop and mobile: headings, shared design, workspace markup, overflow and script errors.`);
  } finally {await browser.close();await new Promise(r=>server.close(r));}
}
