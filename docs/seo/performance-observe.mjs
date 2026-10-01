// Read-only browser lab observations; no forms are submitted.
import puppeteer from 'puppeteer-core';
import { mkdir, writeFile } from 'node:fs/promises';
const target = process.argv[2] || 'https://printkarr.in';
const label = process.argv[3] || 'live';
await mkdir('docs/seo/screenshots', { recursive:true });
const browser = await puppeteer.launch({ executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless:true, args:['--no-sandbox', '--enable-unsafe-swiftshader'], timeout:20000 });
const observations = [];
try {
  for (const width of [390,1440]) for (const route of ['/','/how-it-works','/franchise','/printing-in-vapi']) {
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    await page.setViewport({ width, height:width===390?844:1000, deviceScaleFactor:1 });
    const failures = [], errors = [];
    page.on('requestfailed', request => failures.push({ url:request.url(), error:request.failure()?.errorText }));
    page.on('pageerror', error => errors.push(String(error)));
    await page.evaluateOnNewDocument(() => {
      window.lab = { lcp:null, cls:0, shifts:[], longTasks:[] };
      new PerformanceObserver(list => { for(const e of list.getEntries()) window.lab.lcp={time:e.startTime,size:e.size,url:e.url,tag:e.element?.tagName,text:e.element?.textContent?.slice(0,80)}; }).observe({type:'largest-contentful-paint',buffered:true});
      new PerformanceObserver(list => { for(const e of list.getEntries()) if(!e.hadRecentInput) { window.lab.cls += e.value; window.lab.shifts.push({time:e.startTime,value:e.value,nodes:e.sources?.map(s=>({tag:s.node?.tagName,cls:s.node?.className}))}); } }).observe({type:'layout-shift',buffered:true});
      new PerformanceObserver(list => { for(const e of list.getEntries()) window.lab.longTasks.push({time:e.startTime,duration:e.duration}); }).observe({type:'longtask',buffered:true});
    });
    try {
      const response = await page.goto(target+route, {waitUntil:'networkidle0',timeout:45000});
      await page.evaluate(()=>document.fonts.ready);
      await new Promise(resolve=>setTimeout(resolve,1500));
      const data = await page.evaluate(() => {
        const rect = el => { const r=el.getBoundingClientRect();return {left:r.left,top:r.top,width:r.width,height:r.height,bottom:r.bottom}; };
        const nav = performance.getEntriesByType('navigation')[0];
        return {
          title:document.title,h1:[...document.querySelectorAll('h1')].map(el=>({text:el.textContent,rect:rect(el)})),viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,
          mainCtas:[...document.querySelectorAll('main a.btn,main a.ihb')].slice(0,4).map(el=>({text:el.textContent,href:el.getAttribute('href'),rect:rect(el)})),
          images:[...document.images].map(el=>({src:el.currentSrc,alt:el.getAttribute('alt'),width:el.getAttribute('width'),height:el.getAttribute('height'),loading:el.loading,fetchPriority:el.fetchPriority,loaded:el.complete&&el.naturalWidth>0,naturalWidth:el.naturalWidth,naturalHeight:el.naturalHeight,rect:rect(el)})),
          lab:window.lab,navigation:{ttfb:nav.responseStart-nav.requestStart,domContentLoaded:nav.domContentLoadedEventEnd,load:nav.loadEventEnd,encodedBodySize:nav.encodedBodySize,transferSize:nav.transferSize},
          resources:performance.getEntriesByType('resource').map(e=>({url:e.name,type:e.initiatorType,start:e.startTime,duration:e.duration,transferSize:e.transferSize,encodedBodySize:e.encodedBodySize})),
          smallText:[...document.querySelectorAll('main p, main li, main a')].filter(el=>parseFloat(getComputedStyle(el).fontSize)<12).slice(0,15).map(el=>({text:el.textContent.slice(0,70),fontSize:getComputedStyle(el).fontSize}))
        };
      });
      const slug=route==='/'?'homepage':route.slice(1);
      const screenshot=`docs/seo/screenshots/${label}-${slug}-${width}.png`;
      await page.screenshot({path:screenshot,fullPage:false});
      observations.push({url:target+route,width,status:response.status(),headers:response.headers(),screenshot,failures,errors,...data});
      console.log(JSON.stringify({url:target+route,width,status:response.status(),cls:data.lab.cls,lcp:data.lab.lcp?.time,transfer:data.resources.reduce((sum,e)=>sum+e.transferSize,0),overflow:data.scrollWidth>width,failures:failures.length}));
    } catch(error) { observations.push({url:target+route,width,error:String(error),failures,errors});console.log(String(error)); }
    await context.close();
  }
} finally { await browser.close(); }
await writeFile(`docs/seo/${label}-browser-observations.json`,JSON.stringify({analyzedAt:new Date().toISOString(),environment:'Headless Edge, unthrottled lab, cold page context, device pixel ratio 1; no field CWV or Lighthouse score',observations},null,2));
