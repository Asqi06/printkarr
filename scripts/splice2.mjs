// One-off: rewrite landing() as the white+electric-blue 3D-hero design. DELETE AFTER USE.
import fs from 'node:fs';
const p = 'E:/prntkr/lib/views_public.js';
const lines = fs.readFileSync(p, 'utf8').split('\n');
const start = lines.findIndex((l) => l.indexOf('export function landing(') === 0);
const end = lines.findIndex((l) => l.indexOf('export function orderPage(') === 0);
console.log('splice 1-based lines', start + 1, '..', end);
const body = `export function landing({ pricing, maxMb }) {
  const minRate = Math.min(pricing.bw, pricing.studentBw);
  return shell({
    active: '/',
    title: 'QwikPrint — Smart Printing Kiosk',
    desc: 'Self-service kiosk: upload a PDF from your phone, pay online, collect prints or get delivery across Vapi. Open 24/7, no app needed.',
    extraHead: '<link rel="stylesheet" href="/qp-landing.css?v=${ASSET_V}">',
    body: \`
    <div class="qp">
      <section class="qp-hero">
        <p class="qp-pill rv">India's First Smartest Print &amp; Go</p>
        <h1 class="qp-h1 rv">Meet <em>QwikPrint</em>. Your Anytime,<br>Anywhere <em>Instant Printing Kiosk</em></h1>
        <div class="qp-cta rv"><a class="qp-btn" href="/contact">Contact Us</a><a class="qp-btn ghost" href="/franchise">Start a Franchise</a></div>
        <div class="qp-stage rv" id="qp-stage">
          <img class="qp-fallback" src="/images/kiosk-hero.png" alt="QwikPrint self-service printing kiosk" fetchpriority="high">
          <div class="qp-badges" aria-hidden="true">
            <span class="qp-badge b1">100% Secured Documents</span>
            <span class="qp-badge b2">24/7 Availability</span>
            <span class="qp-badge b3">No App Needed</span>
            <span class="qp-badge b4">UPI Payments</span>
            <span class="qp-badge b5">Kiosk Pickup</span>
            <span class="qp-badge b6">From Rs2/page</span>
          </div>
        </div>
        <p class="qp-scroll" aria-hidden="true"><span></span>SCROLL</p>
      </section>
      <div class="qp-ticker" aria-label="QwikPrint highlights"><div class="qp-mq"><span>Contactless Prints</span><span>Instant Print</span><span>Zero Queues</span><span>24/7 Service</span><span>Encrypted Files</span><span>Smart Printing</span></div><div class="qp-mq" aria-hidden="true"><span>Contactless Prints</span><span>Instant Print</span><span>Zero Queues</span><span>24/7 Service</span><span>Encrypted Files</span><span>Smart Printing</span></div></div>
      <div class="qp-ticker flip" aria-hidden="true"><div class="qp-mq rev"><span>Zero Queues</span><span>Contactless Prints</span><span>Instant Print</span><span>Encrypted Files</span><span>24/7 Service</span><span>Smart Printing</span></div><div class="qp-mq rev" aria-hidden="true"><span>Zero Queues</span><span>Contactless Prints</span><span>Instant Print</span><span>Encrypted Files</span><span>24/7 Service</span><span>Smart Printing</span></div></div>
      <section class="qp-section" id="how">
        <p class="qp-pill rv">How to print</p>
        <h2 class="qp-h2 rv">How to Print using a <em>QwikPrint kiosk?</em></h2>
        <p class="qp-sub rv">Fast. Secure. Completely contactless.</p>
        <div class="qp-steps">
          <article class="qp-step rv"><p class="qp-stepn">STEP 1</p><div class="qp-mock"><img src="/qr.png" alt="Scan this code with your phone camera"></div><h3>Scan the Kiosk QR</h3><p>Scan with your phone camera.</p></article>
          <article class="qp-step rv"><p class="qp-stepn">STEP 2</p><div class="qp-mock qp-mock-up">Drop your PDF here</div><h3>Upload Your Document</h3><p>Choose a file from your phone. PDF, PNG or JPG.</p></article>
          <article class="qp-step rv"><p class="qp-stepn">STEP 3</p><div class="qp-mock qp-mock-opt"><b>B&amp;W</b><b>Color</b></div><h3>Set Print Preference</h3><p>Pages, copies, color and single or double-sided.</p></article>
          <article class="qp-step rv"><p class="qp-stepn">STEP 4</p><div class="qp-mock qp-mock-ready">Ready &#10003;</div><h3>Pay &amp; Collect</h3><p>Pay online, then collect with your OTP.</p></article>
        </div>
      </section>
      <section class="qp-section" id="features">
        <p class="qp-pill rv">Features</p>
        <h2 class="qp-h2 rv">So, why <em>QwikPrint</em> is the best way to print?</h2>
        <p class="qp-sub rv">Smarter printing for busy people.</p>
        <div class="qp-feats">
          <article class="qp-feat rv"><span class="qp-ic">&#128274;</span><h3>Your Documents Are Completely Safe</h3><p>Files are encrypted, never shared, and auto-deleted after printing.</p></article>
          <article class="qp-feat rv"><span class="qp-ic">&#9889;</span><h3>Fast Kiosk Printing</h3><p>No shop queues. Upload, pay, and collect in minutes.</p></article>
          <article class="qp-feat rv"><span class="qp-ic">&#127769;</span><h3>Always Available, 24/7</h3><p>Midnight assignment or morning admit card. The kiosk never closes.</p></article>
          <article class="qp-feat rv"><span class="qp-ic">&#9632;</span><h3>Self-Service Printing</h3><p>No waiting in line. Print directly from your phone, anytime.</p></article>
          <article class="qp-feat rv"><span class="qp-ic">&#9989;</span><h3>100% Contactless</h3><p>No shared pen drives or shop PCs. Just scan, upload and print.</p></article>
          <article class="qp-feat rv"><span class="qp-ic">&#127891;</span><h3>Perfect for Students</h3><p>Assignments, notes and admit cards from \u20B92/page.</p></article>
        </div>
      </section>
      <section class="qp-section" id="compare">
        <p class="qp-pill rv">QwikPrint vs Traditional</p>
        <h2 class="qp-h2 rv">And, why QwikPrint <em>stands out?</em></h2>
        <p class="qp-sub rv">Self-service printing vs. traditional print shops.</p>
        <div class="qp-cmp rv">
          <div class="qp-col old"><h3>Traditional Print Shops</h3><ul><li>Limited working hours</li><li>Long queues and delayed service</li><li>Files sit on shop PCs and pen drives</li><li>Requires staff interaction</li></ul></div>
          <div class="qp-col new"><h3>QwikPrint</h3><ul><li>Open 24/7, every day</li><li>No queues. Print in minutes</li><li>Encrypted files, auto-deleted after printing</li><li>No pen drives, no waiting, no staff needed</li></ul></div>
        </div>
      </section>
      <section class="qp-section" id="presence">
        <p class="qp-pill rv">Where to find us</p>
        <h2 class="qp-h2 rv">Across Vapi,<br><em>Growing Every Day</em></h2>
        <p class="qp-sub rv">Self-service printing across Vapi: Chala, Sarigam, Bhilad and Daman, with kiosk pickup and local delivery.</p>
        <div class="qp-stats">
          <div class="qp-stat rv"><b>4</b><span>Areas Served</span></div>
          <div class="qp-stat rv"><b>24/7</b><span>Always Open</span></div>
          <div class="qp-stat rv"><b>\u20B92</b><span>Starting Price</span></div>
        </div>
        <div class="qp-chips rv"><span>Vapi</span><span>Sarigam</span><span>Bhilad</span><span>Daman</span><span>Kiosk pickup</span></div>
      </section>
      <section class="qp-fr rv">
        <div><h2>Want to offer <em>24/7 printing</em> to students, employees, or visitors?</h2><p>Host a QwikPrint kiosk in your college, office or shop.</p><a class="qp-btn glow" href="/franchise">Request Installation</a></div>
        <img src="/images/host-cta.jpg" alt="Student printing from her phone" loading="lazy">
      </section>
    </div>
    <script type="module" src="/qp-3d.js?v=\${ASSET_V}"></script>\`
  });
}
`;
const next = lines.slice(end - 1);
fs.writeFileSync(p, lines.slice(0, start).join('\n') + '\n' + body + next.join('\n'));
console.log('landing rewritten');
