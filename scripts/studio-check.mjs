import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createOrderPreview} from './order-preview.mjs';
import {notFoundPage,POSTS} from '../lib/views_public.js';
import {discoveryRoutes} from '../lib/seo.js';
import {PDFDocument} from 'pdf-lib';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || 'file:///C:/Users/WELCOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const fixture=createOrderPreview();discoveryRoutes(fixture.app,POSTS);fixture.app.use((_req,res)=>res.status(404).send(notFoundPage()));
const server=fixture.app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));const base='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({channel:'msedge',headless:true});fs.mkdirSync('docs/paper-studio',{recursive:true});const errors=[];
try {
  for(const width of [1440,768,390,320]) {
    const page=await browser.newPage({viewport:{width,height:900}});page.on('pageerror',e=>errors.push(e.message));
    const requests=[];page.on('request',r=>requests.push(r.url()));
    await page.goto(base,{waitUntil:'networkidle'});
    assert.equal(await page.locator('canvas').count(),0);assert.ok(!requests.some(x=>/three|cinema|lenis|ScrollTrigger/.test(x)),'No 3D runtime');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Home overflow '+width);
    assert.equal(await page.locator('[data-quote-total]').innerText(),'₹28.00');
    await page.locator('[name="copies"]').fill('2');assert.equal(await page.locator('[data-quote-total]').innerText(),'₹52.00');
    await page.locator('[name="pages"]').fill('0');assert.ok(await page.locator('[data-quote-error]').isVisible());
    await page.locator('[name="pages"]').fill('12');await page.locator('[name="copies"]').fill('1');
    await page.locator('.studio-steps summary').nth(1).click();assert.equal(await page.locator('.studio-steps details[open]').count(),1);
    await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:`docs/paper-studio/home-${width}.jpg`});
    if(width===1440)await page.screenshot({path:'docs/paper-studio/home-full.jpg',fullPage:true});
    for(const route of ['/order','/stationery','/shops','/customer','/customer/wallet','/customer/profile','/contact','/printing-prices','/page-that-does-not-exist']) {
      await page.goto(base+route,{waitUntil:'networkidle'});
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,route+' overflow '+width);
      if([1440,390].includes(width))await page.screenshot({path:`docs/paper-studio/${route.slice(1).replaceAll('/','-')}-${width}.jpg`});
      for(const img of await page.locator('img').all())assert.notEqual(await img.getAttribute('alt'),null,route+' image alt');
    }
    await page.close();
  }
  const page=await browser.newPage();await page.goto(base);
  const pdf=await PDFDocument.create();pdf.addPage();
  await page.locator('#doc').setInputFiles({name:'studio-check.pdf',mimeType:'application/pdf',buffer:Buffer.from(await pdf.save())});
  await page.waitForURL(/\/customer\/orders\/new\?draft=/);
  assert.ok(await page.locator('input[name="copies"]').count(),'Homepage upload enters real print settings');
  await page.goto(base+'/preview/role/guest');await page.goto(base);
  await page.locator('#doc').setInputFiles({name:'guest-check.pdf',mimeType:'application/pdf',buffer:Buffer.from(await pdf.save())});
  await page.waitForURL(/\/order\?draft=/);
  await page.close();
  const contact={model:'Help with my print order',name:'Local test',phone:'9000000000',email:'test@example.com',message:'Local test enquiry. No external message.',website:''};
  const send=body=>fetch(base+'/contact',{method:'POST',body:new URLSearchParams(body),redirect:'manual'});
  let res=await send({...contact,website:'spam.example'});assert.equal(res.status,303);assert.equal(fixture.snapshot().leads?.length||0,0);
  res=await send({...contact,email:'invalid'});assert.equal(res.status,400);assert.ok((await res.text()).includes('Local test enquiry'));
  res=await send(contact);assert.equal(res.status,303);assert.equal(fixture.snapshot().leads.length,1);
  const cookie=res.headers.get('set-cookie').split(';')[0];const thanks=await fetch(base+'/contact/thank-you',{headers:{cookie}});assert.ok((await thanks.text()).includes('data-contact-confirmed'));
  assert.ok(!(await (await fetch(base+'/contact/thank-you')).text()).includes('data-contact-confirmed'));
  await send({...contact,email:'bad'});await send({...contact,email:'bad'});res=await send(contact);assert.equal(res.status,429);
  const nojs=await browser.newPage({javaScriptEnabled:false});await nojs.goto(base);assert.ok(await nojs.locator('.studio-upload-submit').isVisible());await nojs.close();
  assert.deepEqual(errors,[]);
  console.log('Paper Studio passed: 4 viewport widths, 10 routes, live quote, real guest/account uploads, no 3D, image alt, contact spam/validation/rate limit/success, and no-JS fallback.');
}finally{await browser.close();await new Promise(r=>server.close(r));}
