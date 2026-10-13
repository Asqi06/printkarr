// Runs the actual production server with isolated temporary data and disconnected providers.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { performance } from 'node:perf_hooks';
import { pathToFileURL } from 'node:url';
import { blankDb, saveDb, loadDb } from '../lib/db.js';
import { cartFor, addPrint, createPurchase } from '../lib/store.js';
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'printkarr-security-'));
const data=path.join(dir,'data'),file=path.join(data,'db.json');
assert.ok(path.resolve(dir).startsWith(path.resolve(os.tmpdir())+path.sep));
const probe=net.createServer();probe.listen(0,'127.0.0.1');await once(probe,'listening');const port=probe.address().port;await new Promise(r=>probe.close(r));
const base=`http://127.0.0.1:${port}`,db=blankDb(),purchases=[];
db.settings.campaign.firstPrint.enabled=false;
for(let i=0;i<100;i++) {
  const id=`CUS-${i}`,token=crypto.randomBytes(24).toString('hex');
  db.users.push({id,role:'customer',name:`Load user ${i}`,email:`load${i}@example.test`,phone:'9825011111'});
  db.sessions.push({token,userId:id,createdAt:new Date().toISOString()});
  db.wallets.push({customerId:id,balance:100});
  db.addresses.push({id:`ADDR-${i}`,customerId:id,address:'Test college, Chala',area:'Vapi',pin:'396191',phone:'9825011111',lat:20.389722,lng:72.889945,isDefault:true});
  db.orders.push({id:`PK-LOAD-${i}`,customerId:id,document:'Synthetic load test.pdf',pricingVersion:1,pages:5,copies:1,printType:'bw',sides:'single',binding:'none',subtotal:10,status:'CREATED',paymentStatus:'pending',history:[],createdAt:new Date().toISOString()});
  cartFor(db,id);const cart=addPrint(db,id,`PK-LOAD-${i}`);
  purchases.push({token,customerId:id,purchase:createPurchase(db,cart,id,{addressId:`ADDR-${i}`,deliverySlot:'school-express',institutionName:'Test college'},()=>({ok:true}))});
}
saveDb(db,file);
const env={...process.env,PORT:String(port),NODE_ENV:'production',PUBLIC_SITE_URL:base,PRINTKARR_DATA_DIR:data,RENDER:'false',TRUST_PROXY_HOPS:'0',ADMIN_EMAIL:'owner@example.test',ADMIN_PASSWORD:'test-only-strong-admin-password',DEMO_LOGIN:'on',OTP_PEPPER:'synthetic-test-pepper'};
for(const key of ['MONGODB_URI','RAZORPAY_KEY_ID','RAZORPAY_KEY_SECRET','RAZORPAY_WEBHOOK_SECRET','GOOGLE_CLIENT_ID','GOOGLE_CLIENT_SECRET','GOOGLE_REFRESH_TOKEN','RESEND_API_KEY','SMTP_USER','SMTP_PASS','OWNER_WHATSAPP_NUMBER','UPSTASH_REDIS_REST_URL','UPSTASH_REDIS_REST_TOKEN','AGENT_TOKEN'])env[key]='';
const child=spawn(process.execPath,['server.mjs'],{cwd:path.resolve(import.meta.dirname,'..'),env,stdio:['ignore','pipe','pipe']});
let logs='';child.stdout.on('data',b=>logs+=b);child.stderr.on('data',b=>logs+=b);
const request=(route,options={})=>fetch(base+route,{...options,redirect:'manual',signal:AbortSignal.timeout(15000)});
const post=(route,token,body={},origin=base)=>request(route,{method:'POST',headers:{cookie:`pk_demo=${token}`,Origin:origin,'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(body)});
try {
  let ready=false;
  for(let i=0;i<100;i++) {
    if(child.exitCode!==null)throw new Error('Isolated server exited: '+logs);
    try{ready=(await request('/api/ready')).ok;}catch{}
    if(ready)break;await new Promise(r=>setTimeout(r,100));
  }
  assert.ok(ready,'Isolated production server must start: '+logs);
  const guest=await request('/admin/orders');assert.equal(guest.status,302);
  assert.equal((await request('/admin/orders',{headers:{cookie:`pk_demo=${purchases[0].token}`}})).status,403);
  for(const route of ['/server.mjs','/lib/auth.js','/data/db.json','/.env'])assert.equal((await request(route)).status,404);
  assert.equal((await request('/api/ready/details')).status,401);
  const state=await(await request('/api/ready')).json();assert.equal(state.users,undefined);
  const home=await request('/');const csp=home.headers.get('content-security-policy');
  assert.match(csp,/nonce-/);assert.match(csp,/script-src-attr 'none'/);assert.doesNotMatch(csp,/script-src [^;]*unsafe-inline/);
  const html=await home.text();assert.doesNotMatch(html,/on(?:click|submit|focus|blur)=/);
  const nonce=csp.match(/'nonce-([^']+)'/)[1];
  for(const script of html.matchAll(/<script(?![^>]*src=)([^>]*)>/g))if(!/type="application\//.test(script[1]))assert.ok(script[1].includes(nonce));
  // Real guest OTP consumption must survive the subsequent customer/session saves.
  const {PDFDocument}=await import('pdf-lib');const guestPdf=await PDFDocument.create();guestPdf.addPage();
  const upload=new FormData();upload.append('doc',new Blob([await guestPdf.save()],{type:'application/pdf'}),'Synthetic guest.pdf');
  const uploaded=await request('/order/upload',{method:'POST',headers:{Origin:base},body:upload});assert.equal(uploaded.status,302);
  const guestCookie=uploaded.headers.get('set-cookie').split(';')[0],draft=new URL(uploaded.headers.get('location'),base).searchParams.get('draft');
  const guestPost=(route,body)=>request(route,{method:'POST',headers:{Cookie:guestCookie,Origin:base,'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(body)});
  assert.equal((await guestPost('/order/options',{draft,printType:'bw',copies:'1',sides:'single',deliverySlot:'school-express',institutionLocation:'locality:vapi-chala',institutionName:'Test college'})).status,302);
  await guestPost('/order/otp-request',{draft,name:'Synthetic guest',email:'guest@example.test',phone:'9825011111'});
  const guestData=loadDb(file);
  guestData.emailOtps=[{email:'guest@example.test',hash:crypto.createHash('sha256').update('em:guest@example.test:123456:synthetic-test-pepper').digest('hex'),created:Date.now(),expires:Date.now()+60000,tries:0}];saveDb(guestData,file);
  const verified=await guestPost('/order/otp-verify',{draft,code:'123456'});assert.equal(verified.status,302);
  assert.match(verified.headers.get('set-cookie'),/Secure/);
  const verifiedData=loadDb(file);assert.equal(verifiedData.emailOtps.length,0);assert.equal(verifiedData.users.filter(u=>u.email==='guest@example.test').length,1);
  await guestPost('/order/otp-verify',{draft,code:'123456'});
  assert.equal(loadDb(file).users.filter(u=>u.email==='guest@example.test').length,1);
  assert.equal((await post('/customer/purchases/'+purchases[0].purchase.id+'/wallet',purchases[0].token,{},'https://evil.example')).status,403);
  assert.equal((await post('/customer/purchases/'+purchases[0].purchase.id+'/cod',purchases[0].token,{confirmCash:'1'})).status,410);
  assert.equal((await post('/customer/purchases/'+purchases[1].purchase.id+'/wallet',purchases[0].token)).status,404);
  const readStart=performance.now();
  await Promise.all(purchases.map(async p=>assert.equal((await request('/customer/purchases/'+p.purchase.id,{headers:{cookie:`pk_demo=${p.token}`}})).status,200)));
  const readMs=Math.round(performance.now()-readStart);
  // Concurrent retries of the same checkout must debit once, including a file reload.
  await Promise.all(Array.from({length:100},async()=>assert.equal((await post('/customer/purchases/'+purchases[0].purchase.id+'/wallet',purchases[0].token)).status,302)));
  let saved=loadDb(file);assert.equal(saved.wallets.find(w=>w.customerId==='CUS-0').balance,100-purchases[0].purchase.total);
  assert.equal(saved.walletTx.filter(t=>t.customerId==='CUS-0' && t.kind==='debit').length,1);
  const latencies=[],writeStart=performance.now();
  await Promise.all(purchases.map(async p=>{const start=performance.now();assert.equal((await post('/customer/purchases/'+p.purchase.id+'/wallet',p.token)).status,302);latencies.push(performance.now()-start);}));
  saved=loadDb(file);
  for(const p of purchases){assert.equal(saved.wallets.find(w=>w.customerId===p.customerId).balance,100-p.purchase.total);assert.equal(saved.purchases.find(x=>x.id===p.purchase.id).paymentStatus,'paid');}
  assert.equal(saved.walletTx.filter(t=>t.kind==='debit').length,100);
  const owner=saved.users.find(u=>u.role==='admin');assert.ok(owner.passwordHash);assert.equal(owner.password,undefined);
  const writeMs=Math.round(performance.now()-writeStart);
  if(process.argv.includes('--browser')) {
    const module=process.env.PRINTKARR_BROWSER_MODULE;
    const {chromium}=await import(module ? module.startsWith('file:') ? module : pathToFileURL(module).href : 'playwright');
    const browser=await chromium.launch({headless:true,...(process.platform==='win32' ? {channel:'msedge'} : {})});
    const {PDFDocument}=await import('pdf-lib');const pdf=await PDFDocument.create();for(let i=0;i<8;i++)pdf.addPage().drawText('Synthetic print test '+(i+1));
    const fixture=path.join(dir,'browser.pdf');fs.writeFileSync(fixture,await pdf.save());
    const context=await browser.newContext();await context.addCookies([{name:'pk_demo',value:purchases[99].token,url:base}]);
    const errors=[];
    try {
      for(const width of [320,390,1440]) {
        const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error' && /Content Security Policy|Refused to execute/.test(m.text()))errors.push(m.text());});
        await page.setViewportSize({width,height:900});await page.goto(base+'/customer/orders/new?fresh=1');
        await page.locator('[name=doc]').setInputFiles(fixture);await page.waitForSelector('[data-print-quote]');
        await page.click('[name=printType][value=mixed]');await page.fill('[name=mixedRange]','3,6');
        await page.click('[name=deliverySlot][value=school-express]');await page.selectOption('[name=institutionLocation]','locality:vapi-chala');await page.fill('[name=institutionName]','Test college');
        assert.equal(await page.locator('[name=paymentMethod][value=cod]').count(),0);await page.click('[name=paymentMethod][value=wallet]');
        await page.click('.order-continue button');await page.waitForURL(/\/customer\/purchases\//);
        const paid=loadDb(file).purchases.find(p=>page.url().endsWith(p.id));assert.equal(paid.paymentStatus,'paid');assert.equal(paid.total,25);
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
        await page.close();
      }
      assert.deepEqual(errors,[]);console.log('Browser: upload, mixed settings, institution address and wallet checkout passed at 320/390/1440px with production CSP.');
    } finally {await browser.close();}
  }
  latencies.sort((a,b)=>a-b);
  console.log(JSON.stringify({concurrency:100,concurrentReadsMs:readMs,concurrentWalletWritesMs:writeMs,walletP95Ms:Math.round(latencies[94]),walletDebits:100,duplicateRetryDebits:1,environment:'isolated local production server; synthetic data, no live provider or Atlas load'},null,2));
} finally {
  child.kill();if(child.exitCode===null)await once(child,'exit');
  fs.rmSync(dir,{recursive:true,force:true});
}
