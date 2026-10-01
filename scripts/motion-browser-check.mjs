// Read-only fixture browser check; never submits a form or touches live accounts.
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';
import {mkdir} from 'node:fs/promises';
const base='http://127.0.0.1:3100';
const browser=await puppeteer.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
const errors=[];
await mkdir('docs/motion-preview',{recursive:true});
try {
  for (const width of [320,390,1440]) {
    const page=await browser.newPage();
    page.on('pageerror',error=>errors.push(error.message));
    page.on('request',request=>{if(/kiosk-3d|\/models\/|\/vendor\/three-/.test(request.url())) errors.push('Unexpected 3D asset: '+request.url());});
    await page.setViewport({width,height:900});
    await page.evaluateOnNewDocument(()=>window.addEventListener('pagereveal',event=>{
      window.transitionResult={active:!!event.viewTransition};
      if(event.viewTransition) event.viewTransition.ready.then(()=>window.transitionResult.ready=true).catch(error=>window.transitionResult.error=error.message);
    }));
    await page.goto(base,{waitUntil:'networkidle0'});
    assert.equal(await page.evaluate(()=>typeof Motion.animate),'function');
    await page.$eval('.print-marquee',node=>node.scrollIntoView({block:'center',behavior:'instant'}));
    await page.mouse.move(0,0);
    await page.waitForFunction(()=>document.querySelector('.print-marquee').classList.contains('is-visible'));
    assert.equal(await page.$eval('.marquee-track',node=>getComputedStyle(node).animationPlayState),'running');
    await page.click('.marquee-caption button');
    assert.equal(await page.$eval('.marquee-caption button',node=>node.getAttribute('aria-pressed')),'true');
    assert.equal(await page.$eval('.marquee-track',node=>getComputedStyle(node).animationPlayState),'paused');
    await page.click('.marquee-caption button'); await page.mouse.move(0,0);
    assert.equal(await page.$eval('.marquee-track',node=>getComputedStyle(node).animationPlayState),'running');
    await page.screenshot({path:`docs/motion-preview/marquee-${width}.png`});
    await page.$eval('#how-it-works',node=>node.scrollIntoView({block:'center',behavior:'instant'}));
    await page.waitForFunction(()=>Array.from(document.querySelectorAll('.process-list li')).some(node=>node.getAnimations().length));
    await new Promise(resolve=>setTimeout(resolve,900));
    assert.equal(await page.$eval('.process-list li',node=>getComputedStyle(node).opacity),'1');
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await page.$eval('.qk-faq-list details',node=>node.scrollIntoView({block:'center',behavior:'instant'}));
    await page.click('.qk-faq-list summary');
    assert.equal(await page.$eval('.qk-faq-list details',node=>node.open),true);
    await Promise.all([page.waitForNavigation({waitUntil:'domcontentloaded'}),page.click('.pk-footer a[href="/printing-prices"]')]);
    await page.waitForFunction(()=>window.transitionResult?.ready||window.transitionResult?.error||window.transitionResult?.active===false);
    assert.equal(await page.evaluate(()=>window.transitionResult.ready),true,`Native cross-document transition must start at ${width}px: ${JSON.stringify(await page.evaluate(()=>({transition:window.transitionResult,reduced:matchMedia('(prefers-reduced-motion: reduce)').matches,rules:Array.from(document.styleSheets).flatMap(sheet=>Array.from(sheet.cssRules).filter(rule=>rule.cssText.startsWith('@view-transition')).map(rule=>rule.cssText))})))}`);
    await Promise.all([page.waitForNavigation({waitUntil:'domcontentloaded'}),page.goBack()]);
    assert.equal(new URL(page.url()).pathname,'/');
    for (const route of ['/customer','/customer/wallet','/admin','/admin/orders','/franchise','/xerox','/login','/admin/login']) {
      await page.goto(base+route,{waitUntil:'networkidle0'});
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${route} overflows at ${width}`);
      assert.equal(await page.$$eval('h1',nodes=>nodes.length),1);
      if (route==='/franchise'||route==='/xerox') {
        assert.equal(await page.$$eval('canvas',nodes=>nodes.length),0);
        assert.ok(await page.$eval('img[src="/images/kiosk-hero.webp"]',node=>node.complete&&node.naturalWidth>0));
      }
    }
    await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
    await page.goto(base,{waitUntil:'networkidle0'});
    assert.equal(await page.$eval('.marquee-track',node=>getComputedStyle(node).animationName),'none');
    assert.equal(await page.$eval('.marquee-caption button',node=>getComputedStyle(node).display),'none');
    await Promise.all([page.waitForNavigation({waitUntil:'networkidle0'}),page.click('.pk-footer a[href="/printing-prices"]')]);
    assert.equal(await page.evaluate(()=>window.transitionResult?.active),false,'Reduced motion skips cross-document effects');
    await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'no-preference'}]);
    await page.goto(base,{waitUntil:'networkidle0'});
    await page.$eval('#wallet',node=>node.scrollIntoView({block:'center',behavior:'instant'}));
    await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
    assert.equal(await page.$eval('.wallet-art-card',node=>getComputedStyle(node).transform),'none');
    await page.close();
    console.log(`${width}px: marquee pause/resume, distinct entrances, FAQ, native navigation/back, workspace layouts and reduced motion passed.`);
  }
  assert.deepEqual(errors,[]);
} finally { await browser.close(); }
