import fs from 'node:fs';
const p='scripts/site-coverage-check.mjs';let s=fs.readFileSync(p,'utf8');
s=s.replace("    fs.writeFileSync('docs/paper-studio/page-coverage.json'",`    for(const width of [320,768,1024]) {
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
    fs.writeFileSync('docs/paper-studio/page-coverage.json'`);
fs.writeFileSync(p,s);
