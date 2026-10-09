import assert from 'node:assert/strict';
import { PDFDocument } from 'pdf-lib';
import { chromium } from 'file:///C:/Users/WELCOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import { createOrderPreview } from '../scripts/order-preview.mjs';
import { previewDb } from '../scripts/store-preview.mjs';
const seed=previewDb();seed.settings.campaign.firstPrint.enabled=false;
const preview=createOrderPreview(seed), server=preview.app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
const base='http://127.0.0.1:'+server.address().port;
const pdf=await PDFDocument.create();for(let i=0;i<20;i++)pdf.addPage();const bytes=await pdf.save();
const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[];
try{
 for(const width of [320,390,1440]){
  preview.reset();const context=await browser.newContext({reducedMotion:'reduce',viewport:{width,height:900}}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/customer/orders/new?fresh=1');await page.locator('input[type=file]').setInputFiles({name:'Fictional notes.pdf',mimeType:'application/pdf',buffer:Buffer.from(bytes)});
  await page.locator('[data-print-quote]').waitFor();console.log('Initial quote',width,await page.locator('[data-print-quote]').textContent());
  await page.locator('.order-section .order-more').first().evaluate(e=>e.open=true);await page.locator('[name=printType][value=mixed]').check();await page.locator('[name=mixedRange]').fill('11-12');
  assert.match(await page.locator('[data-print-assignment]').textContent(),/18 B&W.*2 colour.*44/);
  await page.locator('[data-print-quote] button').click();await page.waitForURL('**/summary?*');
  console.log('Review',width,await page.locator('.order-totals').textContent());assert.match(await page.locator('.order-totals').textContent(),/63/);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Review fits viewport');await page.screenshot({path:'tmp/pricing-review-'+width+'.png',fullPage:true});
  await page.locator('[name=paymentMethod][value=cod]').check();await page.locator('[data-print-payment] .order-continue button').click();await page.waitForURL('**/customer/purchases/*#cash-choice');
  const cash=page.locator('#cash-choice');assert.equal(await cash.evaluate(e=>e.open),true);assert.match(await cash.textContent(),/73/);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Cash choice fits viewport');await page.screenshot({path:'tmp/pricing-cash-'+width+'.png',fullPage:true});
  await cash.locator('[name=confirmCash]').check();await cash.locator('button').click();await page.waitForURL(url=>!url.hash && url.pathname.includes('/customer/purchases/'));
  assert.match(await page.locator('.receipt-actions').textContent(),/Cash order confirmed/);assert.equal(preview.snapshot().purchases[0].total,73);assert.equal(preview.snapshot().wallets[0].balance,1000);await context.close();
 }
 preview.reset();const context=await browser.newContext({reducedMotion:'reduce',viewport:{width:390,height:900}}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/customer/orders/new?fresh=1');await page.locator('input[type=file]').setInputFiles({name:'Wallet notes.pdf',mimeType:'application/pdf',buffer:Buffer.from(bytes)});await page.locator('[data-print-quote]').waitFor();await page.locator('[data-print-quote] button').click();await page.waitForURL('**/summary?*');
 await page.locator('[name=next][value=wallet]').click();await page.waitForURL('**/customer/wallet?purchase=*');assert.equal(preview.snapshot().purchases[0].status,'CREATED');assert.match(await page.locator('.wallet-checkout-note').textContent(),/checkout is saved/);
 await page.locator('#demoTopup').evaluate(e=>e.requestSubmit());await page.waitForURL(url=>url.pathname.includes('/customer/purchases/'));assert.equal(preview.snapshot().purchases[0].status,'CREATED');assert.ok(preview.snapshot().wallets[0].balance>1000);await context.close();
 assert.deepEqual(errors,[]);console.log('Browser pricing/COD pass at 390 and 1440px, no overflow or JavaScript errors. Fictional cash only.');
}finally{await browser.close();await new Promise(r=>server.close(r));}
