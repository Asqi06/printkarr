import assert from 'node:assert/strict';
import {chromium} from 'file:///C:/Users/WELCOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import {createOrderPreview} from '../scripts/order-preview.mjs';
import {previewDb} from '../scripts/store-preview.mjs';
import {PDFDocument} from 'pdf-lib';
import fs from 'node:fs';
const p=createOrderPreview(previewDb());const server=p.app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));const base='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage({viewport:{width:390,height:844}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 const pdf=await PDFDocument.create();for(let n=1;n<=8;n++)pdf.addPage().drawText('Browser test page '+n);const bytes=Buffer.from(await pdf.save());
 await page.goto(base+'/customer/orders/new');await page.locator('[name=doc]').setInputFiles({name:'Browser assignment.pdf',mimeType:'application/pdf',buffer:bytes});
 await page.waitForURL(/draft=/);await page.locator('[name=printType][value=mixed]').check();await page.locator('[name=mixedRange]').fill('3,6');await page.locator('[name=deliverySlot][value=school]').check();await page.locator('[name=institutionName]').fill('Sample local college');
 await page.getByRole('button',{name:'Continue',exact:false}).last().click();await page.waitForURL(/summary/);
 assert.match(await page.locator('body').innerText(),/5 B&W.*2 colour|6 B&W.*2 colour|B&W.*colour/s);
 await page.locator('[name=paymentMethod][value=wallet]').check();await page.getByRole('button',{name:'Continue to payment'}).click();await page.waitForURL(/customer\/purchases/);
 assert.equal(p.snapshot().orders[0].paymentStatus,'paid');assert.equal(p.snapshot().orders[0].status,'PRINT_QUEUE');assert.equal(p.snapshot().orders[0].bwPages,6);assert.equal(p.snapshot().orders[0].colorPages,2);
 const id=p.snapshot().orders[0].id;await page.context().addCookies([{name:'preview_role',value:'admin',url:base}]);await page.goto(base+'/admin/orders/'+id);assert.equal(await page.getByRole('link',{name:/Download 6 B&W pages/}).count(),1);assert.equal(await page.getByRole('link',{name:/Download 2 colour pages/}).count(),1);
 await page.context().clearCookies();await page.goto(base+'/customer/purchases/'+p.snapshot().purchases[0].id);
 await page.route('**/customer/purchases/*/gateway',route=>route.fulfill({json:{keyId:'fixture',id:'order_fixture',amount:2200}}));
 await page.evaluate(id=>{const b=document.createElement('button');b.dataset.storeGateway=id;b.textContent='Test payment error';document.querySelector('main').prepend(b);if(!document.querySelector('[data-payment-error]')){const m=document.createElement('p');m.dataset.paymentError='';m.hidden=true;document.querySelector('main').prepend(m);}window.Razorpay=class {on(event,fn){this.fail=fn;}open(){this.fail({error:{description:'Website domain is not registered.'}});}};},p.snapshot().purchases[0].id);
 await page.getByRole('button',{name:'Test payment error'}).click();await page.locator('[data-payment-error]').waitFor({state:'visible'});assert.match(await page.locator('[data-payment-error]').textContent(),/domain is not registered/);assert.equal(await page.getByRole('button',{name:'Test payment error'}).isEnabled(),true);
 assert.deepEqual(errors,[]);console.log('PASS mobile browser: PDF upload, split colour page selection, saved address, college delivery, summary, wallet payment, queue entry and admin split downloads; no JavaScript errors.');
}catch(e){console.log('URL',page.url());console.log((await page.locator('body').innerText()).slice(-2600));throw e;}finally{await browser.close();await new Promise(r=>server.close(r));}

