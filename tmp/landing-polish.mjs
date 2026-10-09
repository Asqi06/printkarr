import fs from 'node:fs';let p='public/cinema-scene.js',s=fs.readFileSync(p,'utf8');s=s.replace("groundGrid.material.opacity=.24;","groundGrid.material.opacity=0;").replace("groundGrid.material.opacity=.24*heroStrength;","groundGrid.material.opacity=0;").replace('landingY=3.8*(1-descent)+bounce','landingY=2.4*(1-descent)+bounce');fs.writeFileSync(p,s);
p='scripts/cinema-check.mjs';s=fs.readFileSync(p,'utf8');s=s.replace("  console.log('Hero',width,",`  const initialHeight=Number(await page.locator('.cinema-stage').getAttribute('data-kiosk-y'));
  await page.evaluate(()=>scrollTo({top:(document.querySelector('.arrival').offsetHeight-innerHeight)*.62,behavior:'instant'}));await page.waitForTimeout(1000);
  assert.ok(Number(await page.locator('.cinema-stage').getAttribute('data-kiosk-y'))<initialHeight-.5,'Scroll lowers the kiosk');
  assert.equal(await page.locator('.cinema-stage').getAttribute('data-landing-phase'),'1','Landing reaches ground contact');
  if(width===1440||width===390)await page.screenshot({path:'docs/cinematic-overhaul/kiosk-touchdown-'+width+'.jpg'});
  await page.evaluate(()=>scrollTo({top:(document.querySelector('.arrival').offsetHeight-innerHeight)*.96,behavior:'instant'}));await page.waitForTimeout(900);assert.equal(await page.locator('.cinema-stage').getAttribute('data-landing-phase'),'2');
  if(width===1440||width===390)await page.screenshot({path:'docs/cinematic-overhaul/kiosk-orbit-'+width+'.jpg'});
  console.log('Hero',width,`);s=s.replace("assert.ok(await fp.locator('.paper-fallback').first().isVisible());","assert.ok(await fp.locator('.hero-kiosk-fallback').isVisible());");s=s.replace('nativeHomepageUpload:true,errors','nativeHomepageUpload:true,kioskDescentLandingOrbit:true,errors');fs.writeFileSync(p,s);
