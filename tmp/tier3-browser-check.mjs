import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createOrderPreview} from '../scripts/order-preview.mjs';
import {PDFDocument} from 'pdf-lib';
import {chromium} from 'file:///C:/Users/WELCOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const preview=createOrderPreview(), server=preview.app.listen(0,'127.0.0.1');
await new Promise(r=>server.once('listening',r));
const base='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({channel:'msedge',headless:true});
const errors=[];fs.mkdirSync('output/tier3',{recursive:true});
try {
  for(const width of [320,390,1440]) {
    const page=await browser.newPage({viewport:{width,height:900}});
    page.on('pageerror',e=>{if(e.message!=='Transition was aborted because of invalid state. ViewTransition opt-in disabled')errors.push(e.message);});
    await page.goto(base,{waitUntil:'networkidle'});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Home fits '+width);
    await page.locator('[name=bwPages]').fill('100');
    assert.equal(await page.locator('[data-quote-total]').innerText(),'₹190.00');
    await page.locator('[name=sides]').selectOption('double');
    assert.equal(await page.locator('[data-quote-total]').innerText(),'₹190.00','Front-back retains billable pages');
    await page.locator('[name=copies]').fill('2');
    assert.equal(await page.locator('[data-quote-total]').innerText(),'₹360.00');
    await page.screenshot({path:`output/tier3/home-${width}.png`,fullPage:true});
    const pdf=await PDFDocument.create();pdf.addPage();
    await page.locator('#doc').setInputFiles({name:'local-check.pdf',mimeType:'application/pdf',buffer:Buffer.from(await pdf.save())});
    await page.waitForURL(/\/customer\/orders\/new\?draft=/);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Options fit '+width);
    assert.equal(await page.locator('[name=sides][value=double]').count(),1);
    await page.screenshot({path:`output/tier3/options-${width}.png`,fullPage:true});
    await page.close();
  }
  const page=await browser.newPage({javaScriptEnabled:false,viewport:{width:390,height:900}});
  await page.goto(base);
  assert.match(await page.locator('[data-price-examples]').innerText(),/100 pages = ₹190/);
  assert.ok(await page.locator('.studio-upload-submit').isVisible());
  await page.close();assert.deepEqual(errors,[]);
  console.log('Tier-3 browser checks passed: 320/390/1440px, calculator, front-back billing, homepage upload, and useful no-JavaScript examples.');
} finally {await browser.close();await new Promise(r=>server.close(r));}
