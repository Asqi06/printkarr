import {chromium} from 'file:///C:/Users/WELCOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage({viewport:{width:1440,height:980},reducedMotion:'reduce'});await page.route('https://**/*',r=>r.abort());
page.on('pageerror',e=>console.log(e.stack));
for(let i=0;i<20;i++){await page.goto('http://127.0.0.1:3140/customer/options',{waitUntil:'domcontentloaded'});await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(70);}
await browser.close();
