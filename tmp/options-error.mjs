import {chromium} from 'file:///C:/Users/WELCOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const browser=await chromium.launch({channel:'msedge',headless:true}); const page=await browser.newPage();
page.on('pageerror',e=>console.log(e.stack)); await page.route('https://**/*',r=>r.abort());
await page.goto('http://127.0.0.1:3140/customer/options');
console.log(await page.evaluate(()=>({forms:[...document.forms].map(f=>({cls:f.className,elements:[...f.elements].map(e=>e.name)}))})));
await page.waitForTimeout(800);await browser.close();
