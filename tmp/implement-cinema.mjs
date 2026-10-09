import fs from 'node:fs';
const f='lib/views_public.js';let s=fs.readFileSync(f,'utf8');const start=s.indexOf('export function landing('),end=s.indexOf('\nexport function orderPage',start);
fs.writeFileSync('tmp/previous-landing.txt',s.slice(start,end));
const hero=`export function landing({ pricing, maxMb = 20, campaign = campaignDefaults(), walletOffers = [], reviews = [] }) {
  return shell({ active:'/',title:'From pixels to paper',extraHead: \`<link rel="stylesheet" href="/cinema.css?v=\${ASSET_V}"><script type="module" src="/cinema.js?v=\${ASSET_V}"></script>\`,body: \`
  <div class="cinema-home">
    <section class="arrival cinema-container story-chapter" data-chapter="0" aria-labelledby="home-title">
      <div class="arrival-copy"><p class="cinema-eyebrow"><span class="blue-mark"></span> PRINTKARR / BEYOND PAPER</p>
        <h1 id="home-title">Your notes.<br>Your essentials.<br><span>At your door.</span></h1>
        <p class="arrival-description">Upload your files, choose your prints,<br class="desktop-break"> and leave the trip to us.</p>
        <div class="hero-actions"><a class="btn loud big cinema-magnet" href="/order">Upload &amp; Print \${icon('arrow-up-right')}</a><a class="cinema-text-link" href="#how-it-works">Explore PrintKarr \${icon('arrow-down')}</a></div>
        <p class="hero-small">PDF, JPG &amp; PNG · No sign-in needed to start.<br>Full price before payment.</p>
        <a class="arrival-shop-link" href="/shops">Find nearby shops \${icon('arrow-up-right')}</a>
      </div>
      <div class="scene-slot arrival-art" data-scene="0"><div class="paper-fallback" aria-hidden="true"><div class="fallback-sheet back-sheet"></div><div class="fallback-sheet"><span>PRINTKARR / A4</span><b>Ideas,<br>made<br><em>real.</em></b><div class="paper-rule"></div><small>FROM PIXELS TO PAPER.</small><i></i></div></div><div class="scene-host" aria-hidden="true"></div><p class="scene-caption"><span>01 / A DIGITAL BEGINNING</span><span class="scene-hint">A little movement. A new perspective.</span></p></div>
      <div class="arrival-bottom"><a href="#how-it-works">\${icon('arrow-down')} Scroll to explore</a><span>YOUR LOCAL PRINT DESK. REIMAGINED.</span><span>VAPI, INDIA</span></div>
    </section>
  </div>\`});
}
`;
s=s.slice(0,start)+hero+s.slice(end);fs.writeFileSync(f,s);
let shared=fs.readFileSync('lib/views.js','utf8').replace("export const ASSET_V = '20261008-direct-checkout';","export const ASSET_V = '20261009-cinematic-paper';");
shared=shared.replace("const primary = [['/shops', 'Nearby shops'], ['/#how-it-works', 'How it works'], ['/printing-prices', 'Pricing'], ['/stationery', 'Stationery']];","const primary = [['/order', 'Print'], ['/shops', 'Nearby Shops'], ['/stationery', 'Stationery'], ['/#how-it-works', 'How It Works'], ['/#kiosk', 'Kiosk']];");
shared=shared.replace("...primary, ['/about'","...primary, ['/printing-prices', 'Pricing'], ['/customer/packs', 'Semester packs'], ['/customer/referrals', 'Refer & Earn'], ['/about'");
fs.writeFileSync('lib/views.js',shared);
