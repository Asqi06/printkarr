// Public printing flow and marketing pages — PrintKarr print studio.
// No login walls before price. Auth happens once, at OTP time.
import { esc, ASSET_V, THEME_SCRIPTS, icon, pkPublicHeader, pkPublicFooter, DELIVERY_MAP_HEAD, deliveryPicker } from './views.js';
import { deliverySlotsFields } from './views_order.js';
import { PACKS, BOOKING_FEE } from './packs.js';
import { PAGES, seoHead } from './seo.js';

const rs = (n) => '₹' + (Math.round(n * 100) / 100);
const PHONE = '+91 90167 03180';
const EMAIL = 'team@printkarr.in';

const topNav = pkPublicHeader;

function shell({ title, body, desc, active, extraHead, stickyCta, path = active, article = false }) {
  [title, desc] = PAGES[path] || [title, desc];
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)} — PrintKarr</title>
<link rel="icon" href="/favicon.ico?v=${ASSET_V}">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png?v=${ASSET_V}">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png?v=${ASSET_V}">
<link rel="apple-touch-icon" href="/apple-touch-icon.png?v=${ASSET_V}">
<link rel="manifest" href="/site.webmanifest?v=${ASSET_V}">
<meta name="description" content="${esc(desc || "PrintKarr — upload a PDF, choose what prints, and collect at a kiosk or get delivery around Vapi. See the full price before payment.")}">
${seoHead(path, title, desc, article)}
<meta name="theme-color" content="#2448EF">
<link rel="preload" href="/fonts/dm-sans-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/design.css?v=${ASSET_V}">
<link rel="stylesheet" href="/customer.css?v=${ASSET_V}">
<link rel="stylesheet" href="/qk-landing.css?v=${ASSET_V}">
${extraHead || ''}
</head>
<body class="public-site"><div class="pk-page">
${topNav(active)}
<a href="#main" style="position:absolute;left:-9999px" onfocus="this.style.left='16px';this.style.top='16px';this.style.zIndex=99;this.style.background='var(--navy)';this.style.color='#fff';this.style.padding='8px 16px';this.style.borderRadius='99px'" onblur="this.style.left='-9999px'">Skip to content</a>
<main id="main">${body}</main>
${stickyCta ? '<div class="sticky-cta"><a href="/order">Upload PDF &amp; Print →</a></div>' : ''}
${pkPublicFooter()}
</div>
<div class="toast" id="toast"></div>
${THEME_SCRIPTS}<script src="/shell.js?v=${ASSET_V}" defer></script>
</body>
</html>`;
}

export { topNav };

function stepsHtml() {
  const steps = [
    { n: '01', t: 'Start online', d: 'Open PrintKarr on your phone to begin a delivery order. Kiosk QR ordering will be available after the first Vapi kiosk opens.', tag: 'Open on your phone' },
    { n: '02', t: 'Upload the right PDF', d: 'Choose an assignment, admit card, ticket, form, or work document from your phone.', tag: 'Your document' },
    { n: '03', t: 'Choose exactly what prints', d: 'Select pages, copies, colour, and single or double-sided. Review the price before paying.', tag: 'Clear price first' },
    { n: '04', t: 'Get your prints delivered', d: 'Enter your address and review the delivery fee. Kiosk pickup will become available when a Vapi kiosk opens.', tag: 'Local delivery' },
  ];
  const pictures = ['step-1-qr', 'step-2-upload', 'step-3-settings', 'step-4-collect'];
  return `<div class="qk-steps">${steps.map((s, i) => `<article class="qk-step rv"><span class="qk-step-number">STEP ${s.n}</span><h3>${s.t}</h3><p>${s.d}</p><img src="/images/${pictures[i]}.webp" srcset="/images/${pictures[i]}-400.webp 400w, /images/${pictures[i]}-800.webp 800w, /images/${pictures[i]}.webp 1086w" sizes="(max-width:760px) 44vw, 25vw" width="1086" height="1448" decoding="async" alt="${s.t} on a phone" loading="lazy"></article>`).join('')}</div>`;
}

function hostBannerHtml() {
  return `<section class="pk-host rv"><div class="txt"><p class="eyebrow">CAMPUSES · HOSTELS · OFFICES · SHOPS</p><h2 class="display">Put printing<br>where people are.</h2><p class="sub">Have a space in Vapi? Host a PrintKarr kiosk.</p><a class="ihb" style="margin-top:24px" href="/contact"><span class="ihb-row"><span class="ihb-dot"></span><span class="ihb-t1">Talk to us</span></span><span class="ihb-t2" aria-hidden="true"><span>Talk to us</span><svg class="ihb-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span></a></div><div class="img"><img src="/images/host-cta.webp" srcset="/images/host-cta-480.webp 480w, /images/host-cta-768.webp 768w, /images/host-cta.webp 1152w" sizes="(max-width:760px) 85vw, 35vw" width="1152" height="1728" decoding="async" alt="Student requesting a print from her phone" loading="lazy"></div></section>`;
}

export function landing({ pricing }) {
  const minRate = Math.min(pricing.bw, pricing.studentBw);
  return shell({ active: '/', title: 'Printing in Vapi', extraHead: `<script src="/vendor/gsap-3.13.0.min.js" defer></script>`, body: `
  <div class="qk-home editorial-home">
    <section class="editorial-hero qk-container" aria-labelledby="home-title">
      <div class="hero-copy">
        <p class="hero-eyebrow">PRINT DELIVERY IN VAPI &amp; DAMAN</p>
        <h1 id="home-title">Good prints.<br><em>Zero fuss.</em></h1>
        <p class="hero-description">PrintKarr prints PDFs, assignments and everyday documents for local delivery in Vapi and Daman. Order online, any time; choose your delivery at checkout.</p>
        <nav class="home-account-actions hero-actions" aria-label="Quick access">
          <a class="btn loud big" href="/order">Upload &amp; print ${icon('arrow-up-right')}</a>
          <a class="btn solid big" href="/customer/wallet">Wallet / Top-up ${icon('wallet')}</a>
          <a class="hero-account" href="/customer/profile">My Account ${icon('arrow-right')}</a>
        </nav>
        <p class="hero-helper">PDFs &amp; photos. Clear pricing before you pay.</p>
      </div>
      <figure class="paper-scene" aria-label="Illustration of a crisp A4 document ready to print">
        <img class="hero-sheet" src="/images/print-desk-hero-v2.webp" width="1122" height="1402" alt="White sample documents printed in blue with the words Your next chapter" fetchpriority="high">
        <figcaption>Sample print <span>A4 · Made your way</span></figcaption>
      </figure>
    </section>
    <section class="print-marquee" aria-label="Print your everyday documents"><div class="marquee-window"><div class="marquee-track" aria-hidden="true">${Array.from({length:2}, () => `<div class="marquee-group"><span>Ideas into print</span>${icon('arrow-up-right')}<span class="marquee-outline">Assignments</span>${icon('file-text')}<span>Your next chapter</span>${icon('arrow-up-right')}<span class="marquee-outline">Everyday documents</span>${icon('file-text')}</div>`).join('')}</div></div><div class="marquee-caption qk-container"><p>Assignments, ideas, everyday documents. Made your way.</p><button type="button" aria-pressed="false">Pause motion</button></div></section>
    <div class="service-line qk-container"><span>Built for your day.</span><span>${icon('clock')} Order any time</span><span>${icon('file-text')} Choose every detail</span><span>${icon('map-pin')} Local delivery</span></div>
    <section class="qk-section qk-container process-section" id="how-it-works">
      <div class="section-intro"><p class="section-index">HOW IT WORKS</p><h2>Four steps.<br><em>All yours.</em></h2><p>Everything you need. Right on your phone.</p><a class="rowlink" href="/how-it-works">See how it works ${icon('arrow-up-right')}</a></div>
      <ol class="process-list">
        <li><span>01</span><div><h3>Upload your file</h3><p>A PDF, a photo, an assignment. Start with what you need printed.</p></div>${icon('upload-simple')}</li>
        <li><span>02</span><div><h3>Make it yours</h3><p>Choose pages, copies, colour and sides. See exactly what you’re paying for.</p></div>${icon('file-text')}</li>
        <li><span>03</span><div><h3>Choose your delivery</h3><p>Pick a campus batch slot or delivery to your address, then review the total.</p></div>${icon('map-pin')}</li>
        <li><span>04</span><div><h3>Pay. Print. Carry on.</h3><p>Use your wallet or the payment options at checkout. Track your order online.</p></div>${icon('check')}</li>
      </ol>
    </section>
    <section class="qk-section qk-container" id="features">
      <div class="section-heading"><h2>Your file.<br><em>Your way.</em></h2><p>Printing should fit into your day, not take it over.</p></div>
      <div class="feature-story">
        <div class="feature-portrait"><div><span class="section-index">FROM YOUR PHONE</span><h3>A print desk<br>in your pocket.</h3><p>One simple flow.<br>No app to install.</p></div><img src="/images/host-cta-cutout.webp" srcset="/images/host-cta-cutout-480.webp 480w, /images/host-cta-cutout-768.webp 768w, /images/host-cta-cutout.webp 1024w" sizes="(max-width:760px) 65vw, 25vw" width="1024" height="1536" decoding="async" alt="Student using her phone to order prints" loading="lazy"></div>
        <div class="feature-notes"><article>${icon('file-text')}<div><h3>Every page, your choice.</h3><p>Colour or B&amp;W. Single or double-sided. A few pages or the full document.</p></div></article><article>${icon('receipt')}<div><h3>A clear total, upfront.</h3><p>Printing and delivery are shown separately before you pay.</p></div></article><article>${icon('clock')}<div><h3>Ready when life happens.</h3><p>Take care of deadlines and everyday printing online, any time of day.</p></div></article></div>
      </div>
    </section>
    <section class="qk-section qk-container" id="pricing">
      <div class="section-heading pricing-heading"><div><p class="section-index">PRINT PRICES</p><h2>Small prices.<br><em>Big possibilities.</em></h2></div><p>See your exact total after you upload. Delivery and any extras are shown in checkout.</p></div>
      <div class="qk-prices"><article><span>A4 black &amp; white</span><strong>${rs(pricing.bw)}</strong><small>per page</small></article><article><span>A4 colour</span><strong>${rs(pricing.color)}</strong><small>per page</small></article><article><span>Student B&amp;W</span><strong>${rs(minRate)}</strong><small>per page, when eligible</small></article></div>
      <a class="rowlink" href="/order">Get your exact print price ${icon('arrow-up-right')}</a>
    </section>
    <section class="wallet-chapter" id="wallet"><div class="qk-container"><div><h2>One wallet.<br><em>More possibilities.</em></h2><p>Pick a wallet offer and keep your next print within easy reach. Bonus credit is usable on PrintKarr orders.</p><a class="btn" href="/customer/wallet">Explore wallet &amp; top up ${icon('arrow-up-right')}</a></div><div class="wallet-art" aria-hidden="true"><div class="wallet-art-card"><span>PRINTKARR / WALLET</span>${icon('wallet')}<strong>Ready for<br>your next idea.</strong><small>TOP UP · PRINT · REPEAT</small></div></div></div></section>
    <section class="qk-section qk-container" id="packs"><div class="section-heading"><h2>Plan ahead.<br><em>Print more.</em></h2><p>Explore semester print packs for your recurring college work. Delivery is charged per order.</p></div><div class="qk-pack-row">${PACKS.map(pack => `<a href="/customer/packs" class="qk-pack"><span>${esc(pack.name)}</span><strong>${rs(pack.price)}</strong><small>${pack.bw} B&amp;W · ${pack.color} colour pages</small><b>See pack details ${icon('arrow-up-right')}</b></a>`).join('')}</div></section>
    <section class="qk-section qk-container compare-section" id="compare"><h2>A better way<br><em>to get it on paper.</em></h2><div class="comparison-notes"><div><h3>At a traditional counter</h3><p>Travel to the shop, share your file, explain your settings, and wait to find out the price.</p></div><div><h3>With PrintKarr</h3><p>Upload online, choose your settings yourself, review the total, and select local delivery.</p></div></div></section>
    <section class="qk-section qk-container kiosk-chapter" id="kiosks"><div class="section-intro"><p class="section-index">COMING NEXT</p><h2>Printing.<br><em>Closer to you.</em></h2><p>Print delivery is available across Vapi and Daman, with selected college coverage in Sarigam and Bhilad.</p><p>Our first self-service kiosk is planned for Vapi; no pickup address has been announced yet.</p><a class="rowlink" href="/printing-in-vapi">Explore local printing ${icon('arrow-up-right')}</a></div><div class="kiosk-intro"><div class="kiosk-sticky"><div class="kiosk-figure"><img class="kiosk-image" src="/images/kiosk-hero.webp" srcset="/images/kiosk-hero-480.webp 480w, /images/kiosk-hero-768.webp 768w, /images/kiosk-hero.webp 921w" sizes="(max-width:760px) 75vw, 40vw" width="921" height="1708" decoding="async" alt="PrintKarr planned self-service kiosk" loading="lazy"></div><span class="kiosk-caption" aria-hidden="true">SELF-SERVICE KIOSK · PLANNED FOR VAPI</span></div></div></section>
    <section class="qk-section qk-container referral-section" id="referrals"><div><h2>Good things<br><em>get shared.</em></h2><p>Invite a friend. See the current rewards and your progress in your PrintKarr account.</p></div><a class="referral-link" href="/customer/referrals">${icon('gift')}<span>Refer &amp; Earn<small>Share a code. Get print credit.</small></span>${icon('arrow-up-right')}</a></section>
    <section class="qk-section qk-container qk-faq" id="faq"><div class="section-intro"><h2>Less guessing.<br><em>More printing.</em></h2><a class="rowlink" href="/contact">Still need a hand? ${icon('arrow-up-right')}</a></div><div class="qk-faq-list"><details><summary>Do I need an app?</summary><p>No. Upload a PDF or photo and place your order directly in your browser.</p></details><details><summary>How do I pay?</summary><p>Use your PrintKarr wallet or the payment options shown at checkout. You’ll see the total before placing your order.</p></details><details><summary>Can I collect from a kiosk today?</summary><p>Our first Vapi kiosk is planned. There is no public pickup address yet, so use delivery for current orders.</p></details><details><summary>Where do I find my account and wallet?</summary><p>Use My Account or Wallet in the navigation. On mobile, both are always in the bottom menu.</p></details></div></section>
    <section class="campus-invitation qk-container"><div><h2>Bring PrintKarr<br><em>to your people.</em></h2></div><a class="ihb" href="/contact"><span class="ihb-row"><span class="ihb-dot"></span><span class="ihb-t1">Let’s talk</span></span><span class="ihb-t2" aria-hidden="true">Let’s talk ${icon('arrow-up-right')}</span></a></section>
  </div>` });
}

export function orderPage({ draft, pricing, error, maxMb, surcharges = {}, campaign }) {
  const d = draft || null;
  const cfg = JSON.stringify({ bw: pricing.bw, color: pricing.color, fees: pricing.delivery, lateNightFee: surcharges.lateNightFee || 0, surgeFee: surcharges.surgeFee || 0, batchFree: campaign?.delivery.freeEnabled ?? true, batchMin: campaign?.delivery.freeMinOrder ?? 99, campuses: (campaign?.delivery.campuses || []).map((c) => ({ id: c.id, zone: c.zone })) });
  return shell({
    active: '/order',
    title: 'Print now',
    body: `
    <section class="pub-wrap">
      <ol class="print-progress" aria-label="Print steps"><li aria-current="step">01 Upload &amp; customise</li><li>02 Your details</li><li>03 Confirm &amp; pay</li></ol>
      <h1 class="display rv" style="font-size:clamp(2rem,6vw,3.6rem);margin-top:16px">Upload. Choose.<br><em>PrintKarr it.</em></h1>
      ${error ? `<p class="login-err rv" role="alert" style="margin-top:14px">${esc(error)}</p>` : ''}
      ${d ? `
      <div class="card rv filechip" style="background:var(--pale)"><b>${esc(d.document)}</b><span class="muted" style="font-size:12px">${d.fileType === 'image' ? '1 photo page' : `${d.pages} pages`} detected · <a class="rowlink" href="/order">Choose a different file</a></span></div>
      <form class="quick-order" method="POST" action="/order/options">
        <input type="hidden" name="draft" value="${d.id}">
        <div class="card rv quick-print">
          <p class="eyebrow">YOUR ${d.fileType === 'image' ? 'PHOTO' : 'PDF'}</p><p class="quick-print-default">${d.fileType === 'image' ? '1 photo page · A4' : `${d.pages} pages detected · A4`}</p>
          <div class="field"><label>Print type</label><div class="chips" id="f-type">
            <label class="chip-pick"><input type="radio" name="printType" value="bw" checked> B&amp;W · ${rs(pricing.bw)}/page</label>
            <label class="chip-pick"><input type="radio" name="printType" value="color"> Colour · ${rs(pricing.color)}/page</label></div></div>
          <div class="field"><label>Collect your print</label><div class="route-picks" id="f-area">
            <label class="pick"><input type="radio" name="area" value="Pickup" checked><span><b>Campus kiosk · ₹0 pickup</b><small>Collect when your order is ready</small></span></label>
            <label class="pick"><input type="radio" name="area" value="Vapi"><span><b>Deliver to me</b><small>Choose an area and pin your location next</small></span></label></div></div>
          <details class="order-more"><summary>Change settings or delivery area</summary><div class="order-more-body">
            <div class="grid c2"><div class="field"><label>Sides</label><div class="chips" id="f-sides"><label class="chip-pick"><input type="radio" name="sides" value="single" checked> Single</label><label class="chip-pick"><input type="radio" name="sides" value="double"> Double</label></div></div>
            <div class="field"><label>Copies</label><div class="stepper"><button type="button" id="cMinus" aria-label="Decrease copies">−</button><input id="copies" aria-label="Number of copies" name="copies" type="number" value="1" min="1" max="200" readonly><button type="button" id="cPlus" aria-label="Increase copies">+</button></div></div></div>
            ${d.fileType === 'image'
              ? '<p class="field-hint">One photo prints as one full page.</p>'
              : '<div class="field"><label for="range">Pages to print</label><input id="range" name="range" autocomplete="off" placeholder="All pages · or e.g. 1, 3-5" aria-describedby="range-hint"><p class="field-hint" id="range-hint">Leave empty for all pages. Enter one page or ranges separated by commas.<span class="err" id="range-err"></span></p></div>'}
            <div class="field"><label>Other delivery areas</label><div class="chips" id="f-areas-extra"><label class="chip-pick"><input type="radio" name="area" value="Sarigam"> Sarigam</label><label class="chip-pick"><input type="radio" name="area" value="Bhilad"> Bhilad</label><label class="chip-pick"><input type="radio" name="area" value="Daman"> Daman</label></div></div>

          </div></details>
        </div>
        <div class="card">${deliverySlotsFields(campaign)}</div>
        <div class="livetotal rv" id="liveTotal"><span>Calculating your print…</span><b>₹–</b></div>
        <p class="field-hint">For delivery, the exact fee appears after you pin your location and before payment.</p>
        <button class="btn loud big rv" type="submit" style="width:100%;margin:12px 0 40px"><span>Continue to details →</span></button>
      </form>
      <script>
      window.PK = ${cfg};
      (function(){
        var pages = ${d.pages};
        function val(name){ var el = document.querySelector('input[name="'+name+'"]:checked'); return el ? el.value : null; }
        function effPages(){
          var inp = document.getElementById('range');
          if (!inp) return pages;
          var errEl = document.getElementById('range-err');
          var v = (inp.value || '').trim();
          function bad(msg){ if (errEl) errEl.textContent = msg; inp.setCustomValidity(msg); return null; }
          if (!v) { if (errEl) errEl.textContent = ''; inp.setCustomValidity(''); return pages; }
          var set = {}, firstErr = '';
          v.split(',').forEach(function(part){
            var t = part.trim(); if (!t || firstErr) return;
            var m = t.match(/^(\\d+)(?:\\s*-\\s*(\\d+))?$/);
            if (!m) { firstErr = 'Can’t read "' + t + '" — use 1-12, 15-20.'; return; }
            var a = parseInt(m[1], 10), b = m[2] ? parseInt(m[2], 10) : a;
            if (a < 1 || b < 1 || a > pages || b > pages) { firstErr = 'Pages must be between 1 and ' + pages + '.'; return; }
            if (a > b) { var sw = a; a = b; b = sw; }
            for (var p = a; p <= b; p++) set[p] = 1;
          });
          if (firstErr) return bad(firstErr);
          var n = Object.keys(set).length;
          if (!n) return bad('Pick at least one page.');
          if (errEl) errEl.textContent = ''; inp.setCustomValidity('');
          return n;
        }
        function upd(){
          var type = val('printType') || 'bw';
          var copies = Math.max(1, Math.min(200, parseInt(document.getElementById('copies').value, 10) || 1));
          var area = (val('area') || 'sarigam').toLowerCase();
          var slot = document.getElementById('deliverySlot'), campusSelect = document.getElementById('campusId');
          var batch = slot && slot.value !== 'express';
          var campus = window.PK.campuses.find(function(c){return campusSelect && c.id === campusSelect.value;});
          if (batch && campus) area = campus.zone;
          var ep = effPages(); if (ep == null) ep = pages;
          var rate = type === 'color' ? window.PK.color : window.PK.bw;
          var sub = ep * copies * rate;
          var del = area === 'pickup' ? 0 : area === 'vapi' ? 10 : area === 'daman' ? 20 : Math.min(60, window.PK.fees[area] || 15);
          if (batch && window.PK.batchFree && sub >= window.PK.batchMin) del = 0;
          var el = document.querySelector('#liveTotal b');
          var late = area === 'pickup' ? 0 : window.PK.lateNightFee;
          var surge = window.PK.surgeFee;
          var total = Math.round((sub + del + late + surge) * 100) / 100;
          if (el) el.textContent = (area === 'pickup' ? 'Total ₹' : 'From ₹') + total.toLocaleString('en-IN');
          var sub2 = document.querySelector('#liveTotal span');
          if (sub2) sub2.textContent = 'Printing ₹' + sub.toLocaleString('en-IN') + (batch ? ' · campus batch from ₹' + del + ' (benefits checked at review)' : area === 'pickup' ? ' · pickup ₹0' : ' · delivery from ₹' + del + ' (exact fee after location)') + (late ? ' · late-night +₹' + late : '') + (surge ? ' · high-demand +₹' + surge : '');
        }
        document.getElementById('cMinus').addEventListener('click', function(){ var i = document.getElementById('copies'); i.value = Math.max(1, (parseInt(i.value, 10) || 1) - 1); upd(); });
        document.getElementById('cPlus').addEventListener('click', function(){ var i = document.getElementById('copies'); i.value = Math.min(200, (parseInt(i.value, 10) || 1) + 1); upd(); });
        document.querySelectorAll('#f-type input, #f-sides input, #f-area input, #f-areas-extra input, #deliverySlot, #campusId').forEach(function(i){ i.addEventListener('change', upd); });
        var rangeInp = document.getElementById('range');
        if (rangeInp) rangeInp.addEventListener('input', upd);
        upd();
      })();
      </script>`
      : `
      <form class="rv" method="POST" action="/order/upload" enctype="multipart/form-data" style="margin-top:18px">
        <label class="drop" for="doc"><span class="drop-arrow">↑</span><b>Choose a PDF or photo to print</b><span class="muted">Up to ${maxMb || 20} MB · price appears instantly</span></label>
        <input id="doc" name="doc" type="file" accept="application/pdf,.pdf,.png,.jpg,.jpeg" required class="file-input">
        <p class="muted" id="fname" style="font-size:12px;margin:10px 0"></p>
        <button class="btn loud big" type="submit" style="width:100%" data-upload-btn><span>Upload PDF &amp; See Price →</span></button>
        <p class="field-hint" style="text-align:center;margin-top:10px">Keep your original file. Order documents are removed after completion and the configured retention period.</p>
      </form>
      <script>document.getElementById('doc').addEventListener('change', function(e){ var f = e.target.files[0]; document.getElementById('fname').textContent = f ? '📄 ' + f.name : ''; if (f) { var b = document.querySelector('[data-upload-btn] span'); if (b) b.textContent = 'Reading PDF…'; e.target.form.submit(); } });</script>`}
    </section>`
  });
}

export function phonePage({ draft, error, referral }) {
  const batch = draft.selections?.deliveryMode === 'batch';
  return shell({
    active: '/order',
    title: 'Where to?',
    extraHead: draft.area === 'Pickup' ? '' : DELIVERY_MAP_HEAD,
    body: `
    <section class="pub-wrap">
      <span class="pill rv">Last step · 📄 ${esc(draft.document)} · ${draft.pages} pages</span>
      <h1 class="display rv" style="font-size:clamp(2rem,6vw,3.2rem);margin-top:16px">A few details.<br><em>Then you’re set.</em></h1>
      <p class="muted rv" style="margin:8px 0 16px;font-size:14px">The 6-digit verification code goes to your email. No passwords, ever.</p>
      ${error ? `<p class="login-err rv" role="alert">${esc(error)}</p>` : ''}
      <form class="card rv" method="POST" action="/order/otp-request">
        <input type="hidden" name="draft" value="${draft.id}">
        <div class="grid c2">
          <div class="field"><label for="nn">Your name</label><input id="nn" name="name" required placeholder="Ani" maxlength="60"></div>
          <div class="field"><label for="ee">Email address</label><input id="ee" name="email" type="email" required placeholder="you@example.com" maxlength="120"></div>
        </div>
        <div class="grid c2">
          <div class="field"><label for="pp">Phone for order updates</label><input id="pp" name="phone" ${batch ? 'required' : ''} inputmode="numeric" placeholder="98250 11111" maxlength="13"></div>
          <div class="field"><label for="pin">PIN${draft.area === 'Pickup' ? ' (optional)' : ''}</label><input id="pin" name="pin" ${batch ? `readonly value="${esc(draft.selections.campusPin)}"` : ''} ${draft.area === 'Pickup' ? '' : 'required'} inputmode="numeric" placeholder="${draft.area === 'Daman' ? '396210' : draft.area === 'Sarigam' ? '396155' : '396191'}" maxlength="10"></div>
        </div>
        <div class="field"><label for="aa">${draft.area === 'Pickup' ? 'Pickup note (optional)' : 'Full delivery address'}</label><input id="aa" name="address" ${batch ? `readonly value="${esc(draft.selections.campusAddress)}"` : ''} ${draft.area === 'Pickup' ? '' : 'required'} placeholder="Hostel block, room / house no, street" maxlength="200"></div>
        <div class="grid c2">
          <div class="field"><label>Area</label><input value="${esc(draft.area === 'Pickup' ? 'Collect at kiosk · no delivery' : draft.area || 'Vapi')}" disabled></div>
          <div class="field"><label for="ll">Landmark</label><input id="ll" name="landmark" placeholder="Near…" maxlength="100"></div>
        </div>
        ${batch ? `<p class="field-hint">${esc(draft.selections.slot)}. Delivery goes to the configured campus address.</p>` : draft.area === 'Pickup' ? '<p class="field-hint">You will collect this order at the kiosk. No rider will deliver it.</p>' : deliveryPicker(draft.area, draft.contact?.deliveryPoint)}
        <div class="field"><label for="ref">Friend's referral code (first order, optional)</label><input id="ref" name="referral" placeholder="K7Q2M4" maxlength="12" style="text-transform:uppercase" value="${esc(draft.contact?.referral || referral || '')}"></div>
        <button class="btn loud big" type="submit" style="width:100%"><span>Email me the code →</span></button>
      </form>
      <script>(function(){var f=document.querySelector('form[action="/order/otp-request"]');if(!f||f.dataset.spin)return;f.dataset.spin='1';f.addEventListener('submit',function(e){if(e.defaultPrevented)return;var b=f.querySelector('button[type="submit"]');if(b&&!b.disabled){b.setAttribute('disabled','true');var t=b.querySelector('span');if(t)t.textContent='Sending…';}});})();</script>
    </section>`
  });
}

export function collectPage({ order, customerName, state, message }) {
  const inner = state === 'ready' && order
    ? `<div class="card rv" style="margin-top:14px">
        <p class="eyebrow">Order #${esc(order.id)} · ${esc(order.document)}</p>
        <p style="font-weight:700;margin:8px 0">${order.pages} pages × ${order.copies} · ${order.printType === 'bw' ? 'B&W' : 'Color'}</p>
        <p class="muted" style="font-size:13px">Collecting for <b>${esc(customerName || 'the customer')}</b>. Only tap below with the prints in your hand.</p>
        <form method="POST" action="/c/${esc(order.collectToken)}/collect" style="margin-top:14px">
          <button class="btn loud big" type="submit" style="width:100%"><span>I collected my prints ✓</span></button>
        </form></div>`
    : `<div class="card rv" style="margin-top:14px"><p style="font-weight:700">${esc(message || 'This pickup link is no longer valid. Ask the kiosk counter for help.')}</p>
      <p style="margin-top:10px"><a class="rowlink" href="/order">Start a new print →</a></p></div>`;
  return shell({
    active: '/order',
    title: state === 'ready' ? 'Collect your prints' : state === 'collected' ? 'Pickup confirmed' : 'Pickup link',
    body: `
    <section class="pub-wrap" style="max-width:560px">
      <span class="pill rv">Kiosk pickup</span>
      <h1 class="display rv" style="font-size:clamp(2rem,6vw,3.2rem);margin-top:16px">${state === 'ready' ? 'Prints in hand?<br><em>One tap.</em>' : state === 'collected' ? 'Pickup <em>confirmed.</em>' : 'Link <em>expired.</em>'}</h1>
      ${inner}
    </section>`
  });
}

export function otpPage({ draft, email, demoCode, mailError, error }) {
  const sentNote = demoCode
    ? (mailError
      ? `<div class="card rv" style="margin-top:14px;background:var(--pale)"><b>Couldn't email the code (${esc(mailError)}) — use this one: ${esc(demoCode)}</b></div>`
      : `<div class="card rv" style="margin-top:14px;background:var(--pale)"><b>Email delivery isn't set up on this server yet — your code is ${esc(demoCode)}</b></div>`)
    : `<p class="muted rv" style="margin-top:10px;font-size:13px">Sent to ${esc(email)} just now — check your inbox &amp; spam.</p>`;
  return shell({
    active: '/order',
    title: 'Enter code',
    body: `
    <section class="pub-wrap" style="max-width:560px">
      <span class="pill rv">Almost printed · ${esc(email)}</span>
      <h1 class="display rv" style="font-size:clamp(2rem,6vw,3.2rem);margin-top:16px">The 6-digit<br><em>code.</em></h1>
      ${sentNote}
      ${error ? `<p class="login-err rv" role="alert" style="margin-top:12px">${esc(error)}</p>` : ''}
      <form class="card rv" style="margin-top:14px" method="POST" action="/order/otp-verify">
        <input type="hidden" name="draft" value="${draft.id}">
        <div class="field"><label for="cc">Code</label><input id="cc" name="code" required inputmode="numeric" autocomplete="one-time-code" placeholder="••••••" maxlength="6" style="font-size:1.6rem;letter-spacing:.4em;text-align:center"></div>
        <button class="btn loud big" type="submit" style="width:100%"><span>Confirm order →</span></button>
      </form>
      <form method="POST" action="/order/otp-request" style="margin-top:10px">
        <input type="hidden" name="draft" value="${draft.id}">
        <input type="hidden" name="resend" value="1">
        <button class="rowlink" type="submit">Resend code</button>
      </form>
      <script>var c = document.getElementById('cc'); c.focus(); c.addEventListener('input', function(){ if (c.value.replace(/\\D/g, '').length >= 6) c.form.submit(); });</script>
    </section>`
  });
}

/* ---------- marketing pages (workspace port) ---------- */

function pageWrap(inner) {
  return `<div class="interior-wrap">${inner}</div>`;
}

export function howItWorksPage() {
  return shell({
    active: '/how-it-works',
    title: 'How it works',
    body: pageWrap(`
      <div style="max-width:48rem;margin:0 auto;text-align:center"><span class="pill rv">How it works</span>
      <h1 class="display rv" style="font-size:clamp(2rem,5vw,3.4rem);margin-top:16px">From your screen.<br>Into your hands.</h1>
      <p class="muted rv" style="margin-top:12px">Order document prints online, any time. Delivery is available in Vapi and Daman, with availability and slots confirmed in checkout. Selected colleges in Sarigam and Bhilad require coverage confirmation.</p><a class="btn loud" style="margin-top:24px" href="/order">Start a print order ${icon('arrow-up-right')}</a></div>
      ${stepsHtml()}
      <div class="grid c3" style="margin-top:16px">
        <article class="card rv"><h3>Choose the exact pages</h3><p class="muted" style="margin-top:8px;font-size:14px">Preview your PDF, select pages and copies, then see the print price before you pay.</p></article>
        <article class="card rv"><h3>Order any time</h3><p class="muted" style="margin-top:8px;font-size:14px">Upload at night and select an available delivery slot. Cutoff times and campus eligibility apply; confirm urgent timing before paying.</p></article>
        <article class="card rv"><h3>Local delivery</h3><p class="muted" style="margin-top:8px;font-size:14px">Enter your delivery location and see the current fee before payment. Vapi kiosks are planned for future pickup.</p></article>
      </div>
      <div style="text-align:center;margin:32px 0"><a class="ihb rv" href="/order"><span class="ihb-row"><span class="ihb-dot"></span><span class="ihb-t1">Try it now</span></span><span class="ihb-t2" aria-hidden="true"><span>Try it now</span><svg class="ihb-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span></a></div>`)
  });
}

export function aboutPage() {
  return shell({
    active: '/about',
    title: 'About PrintKarr',
    body: pageWrap(`<section class="about-story">
      <blockquote class="about-quote rv">If groceries can reach us in minutes, why is printing still stuck behind a shutter at 9 pm? PrintKarr is our answer.<cite>— Anirudh Verma, Founder</cite></blockquote>
      <div class="about-intro"><span class="pill rv">About PrintKarr</span><h1 class="display story-title rv">Paper shouldn’t<br><em>have closing hours.</em></h1>
        <p class="rv">We started in Vapi, Gujarat, because an assignment, admit card, or business document cannot always wait until a shop opens.</p>
        <p class="rv">Today, PrintKarr accepts online orders around the clock for delivery in Vapi and Daman. Upload a PDF, choose your pages, and see the total before paying. Delivery availability and slots are confirmed in checkout; selected colleges in Sarigam and Bhilad require coverage confirmation.</p>
        <p class="rv">Our first self-service kiosk is planned for Vapi. Its public pickup location will be announced after launch.</p>
        <p class="rv">PrintKarr is operated by PrintKarr Technologies Private Limited. Our service is based in Vapi; delivery coverage does not mean we have a walk-in branch in every city. We show current print prices, delivery fees and available payment options before an order is placed.</p>
        <p class="rv">Customers can sign in with Google to track orders and manage their wallet. Bonus wallet credit is usable on PrintKarr orders and is non-withdrawable; offer eligibility and validity are shown with the offer. Campus batch delivery and address delivery have different availability and fee rules.</p>
        <p class="rv">Read our <a href="/printing-in-vapi">Vapi service guide</a>, <a href="/printing-in-daman">Daman delivery guide</a> and <a href="/printing-prices">printing prices</a>. For coverage or a deadline, contact <a href="tel:+919016703180">+91 90167 03180</a> or <a href="mailto:team@printkarr.in">team@printkarr.in</a>. WhatsApp is optional: the website handles the order flow.</p>
      </div>
      <div class="grid c2"><article class="card rv"><span class="qk-label">Our mission</span><h2>Printing when people need it.</h2><p>Make everyday printing easier with local delivery today and convenient Vapi kiosks after launch.</p></article><article class="card ink rv"><span class="qk-label">Our vision</span><h2>One print network, built with trust.</h2><p>Start with the Vapi pilot and grow a reliable print network for students, families, and businesses.</p></article></div>
    </section>`)
  });
}

export function franchisePage() {
  const models = [
    { t: 'Franchise-Owned', d: 'You own the kiosk. PrintKarr runs the platform.', you: ['No staff required', 'Provide space, power, internet', 'Refill paper & consumables'], us: ['Orders & payments', 'Support & maintenance', 'Software, backend, monitoring'], who: 'Entrepreneurs, retailers, investors' },
    { t: 'Space Partner', d: 'You provide the square footage. We handle the rest.', you: ['Space, power, internet', 'Keep the area accessible', 'That’s it'], us: ['Hardware deployment', 'Orders & payments', 'Support & monitoring'], who: 'Colleges, malls, offices, hostels, transit' },
    { t: 'Custom Partnership', d: 'White-label, multi-kiosk, or campus-wide integrations.', you: ['Location network', 'Brand or workflow needs', 'A named operator'], us: ['Custom hardware mix', 'Dedicated workflows', 'SLA & reporting'], who: 'Universities, enterprises, government' },
  ];
  return shell({
    active: '/franchise',
    title: 'Franchise — A small footprint.<br>A big opportunity.',
    body: pageWrap(`
      <section class="franchise-hero">
        <div><span class="pill rv">For campuses &amp; businesses</span>
          <h1 class="display rv">Bring printing <em>closer to everyone.</em></h1>
          <p class="muted rv">Host a PrintKarr kiosk or explore a franchise model for your location. We are starting with a planned Vapi pilot.</p>
          <a class="btn loud rv" href="#partner-form">Explore partnership ${icon('arrow-up-right')}</a>
        </div>
        <div class="kiosk-intro franchise-visual"><div class="kiosk-sticky"><div class="kiosk-figure"><img class="kiosk-image" src="/images/kiosk-hero.webp" srcset="/images/kiosk-hero-480.webp 480w, /images/kiosk-hero-768.webp 768w, /images/kiosk-hero.webp 921w" sizes="(max-width:760px) 75vw, 40vw" width="921" height="1708" decoding="async" alt="PrintKarr planned self-service kiosk" fetchpriority="high"></div><span class="kiosk-caption">SELF-SERVICE KIOSK · PLANNED FOR VAPI</span></div></div>
      </section>
      <section class="partnership-section">
        <div class="partnership-heading"><h2>Choose the model that fits.</h2><p class="muted">From a single location to a custom network.</p></div>
        <div class="grid c3 partnership-models">${models.map((m) => `<article class="card partner-model rv"><h3>${m.t}</h3><p class="muted model-description">${m.d}</p><div class="partner-roles"><div><h4>Your role</h4><ul>${m.you.map((x) => `<li>${x}</li>`).join('')}</ul></div><div><h4>Our role</h4><ul>${m.us.map((x) => `<li>${x}</li>`).join('')}</ul></div></div><p class="model-audience">Best for: ${m.who}</p></article>`).join('')}</div>
      </section>
      <section class="partnership-section">
        <div class="partnership-heading"><h2>A kiosk for your location.</h2><p class="muted">Compare capacity and the investment.</p></div>
        <div class="grid c2 partnership-hardware">
          <article class="card ink rv"><p class="eyebrow">PrintKarr PRO</p><h3 class="hardware-price">₹1,29,000 <small>+ GST</small></h3><p>High-footfall locations</p><span class="hardware-capacity">1,950-sheet capacity</span></article>
          <article class="card rv"><p class="eyebrow">PrintKarr MINI</p><h3 class="hardware-price">₹69,000 <small>+ GST</small></h3><p class="muted">Low / medium footfall</p><span class="hardware-capacity">650-sheet capacity</span></article>
        </div>
      </section>
      <section class="partnership-section partnership-apply" id="partner-form">
        <div class="partnership-heading"><h2>Let’s find your fit.</h2><p class="muted">Tell us who you are and where you’d like to bring PrintKarr.</p></div>
        <form class="card rv" method="POST" action="/contact">
          <input type="hidden" name="model" value="Campus / franchise partnership">
          <div class="grid c2"><div class="field"><label for="field-name">Name</label><input id="field-name" name="name" required autocomplete="name"></div><div class="field"><label for="field-phone">Phone</label><input id="field-phone" name="phone" type="tel" required autocomplete="tel"></div></div>
          <div class="field"><label for="field-email">Email</label><input id="field-email" name="email" type="email" required autocomplete="email"></div>
          <div class="field"><label for="field-city">City / campus</label><input id="field-city" name="city"></div>
          <button class="btn loud" type="submit">Submit enquiry ${icon('arrow-up-right')}</button>
        </form>
      </section>`)

  });
}

export function xeroxPage() {
  return shell({
    path: '/xerox',
    title: 'Xerox shops — the modern way',
    body: pageWrap(`
      <div class="xerox-hero"><div><span class="pill rv">For Xerox shops</span><h1 class="display rv">Your print shop.<br><em>Ready for what’s next.</em></h1><p class="muted rv">Explore a partnership for online document orders with customer-selected print settings. We confirm the proposed workflow, printer compatibility and responsibilities before onboarding.</p><a class="btn loud rv" href="/contact">Talk to us <span aria-hidden="true">↗</span></a></div><img class="rv" src="/images/kiosk-hero.webp" srcset="/images/kiosk-hero-480.webp 480w, /images/kiosk-hero-768.webp 768w, /images/kiosk-hero.webp 921w" sizes="(max-width:760px) 75vw, 40vw" width="921" height="1708" decoding="async" alt="PrintKarr planned kiosk concept" fetchpriority="high"></div>
      <div class="qk-subhead rv"><span class="qk-label">A simpler workflow</span><h2>Good for customers. Good for your counter.</h2></div>
      <div class="grid c3" style="margin-top:32px">
        <article class="card rv"><h3>Agree the workflow</h3><p class="muted" style="margin-top:8px;font-size:14px">Define order handling, opening hours, customer support and settlement terms before accepting jobs.</p></article>
        <article class="card rv"><h3>Clear print instructions</h3><p class="muted" style="margin-top:8px;font-size:14px">Customers choose colour, pages, sides and copies in the online flow. Confirm how your team will review and produce each job.</p></article>
        <article class="card rv"><h3>Check your equipment</h3><p class="muted" style="margin-top:8px;font-size:14px">Share printer models, supported sizes and connection details so compatibility can be checked.</p></article>
      </div>
      <article class="service-guide"><h2>What to include in your enquiry</h2><p>Tell us the shop’s city, your printer models, paper sizes, colour capabilities, opening hours and a contact person. Explain whether you want to fulfil document orders, host a proposed kiosk or explore a custom integration. Binding, lamination and specialist services need their own availability confirmation.</p><h2>Current service and planned expansion</h2><p>PrintKarr currently accepts online document orders for delivery in <a href="/printing-in-vapi">Vapi</a> and <a href="/printing-in-daman">Daman</a>, with selected campus arrangements. The first Vapi kiosk is planned and has no announced public pickup address. Read the <a href="/franchise">partnership models</a> and <a href="/blogs/running-a-printkarr-kiosk">kiosk planning guide</a> before committing space or equipment. Installation scope, commercial terms and maintenance responsibilities should be agreed with the team.</p></article>
      <div style="text-align:center;margin:32px 0"><a class="ihb rv" href="/contact"><span class="ihb-row"><span class="ihb-dot"></span><span class="ihb-t1">Onboard your shop</span></span><span class="ihb-t2" aria-hidden="true"><span>Onboard your shop</span><svg class="ihb-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span></a></div>`)
  });
}

export function contactPage({ sent } = {}) {
  return shell({
    active: '/contact',
    title: 'Contact — put a kiosk where the queues are',
    body: pageWrap(`<div style="display:grid;gap:32px" class="contact-grid"><div>
      <span class="pill rv">Contact</span>
      <h1 class="display rv" style="font-size:clamp(2rem,5vw,3rem);margin-top:16px">Let’s make<br>something happen.</h1>
      <ul class="rv" style="margin-top:24px;list-style:none;display:flex;flex-direction:column;gap:16px;font-size:14px">
        <li>📞 <a href="tel:+919016703180">${PHONE}</a> · <a href="https://wa.me/919016703180">WhatsApp</a><br><span class="muted">Online orders any time. Confirm delivery availability and slots in checkout.</span></li>
        <li>✉️ <a class="rowlink" href="mailto:${EMAIL}">${EMAIL}</a></li>
        <li>◍ PrintKarr Technologies Private Limited<br><span class="muted">Based in Vapi, Gujarat. Delivery across Vapi and Daman; selected colleges in Sarigam and Bhilad. Kiosk locations will be announced after launch.</span></li>
      </ul></div>
      <form class="card rv" method="POST" action="/contact">
        ${sent ? `<p class="pill" style="margin-bottom:12px">✓ Received. We’ll get back to you.</p>` : ''}
        <div class="field"><label for="field-model">How can we help?</label><select id="field-model" name="model" required><option value="" disabled selected>Choose one</option><option>Own a PrintKarr kiosk</option><option>Have a location to host</option><option>Need a custom solution</option><option>Onboard my Xerox shop</option><option>Request all-India print delivery</option><option>Just saying hello</option></select></div>
        <div class="grid c2"><div class="field"><label for="field-name">Name</label><input id="field-name" name="name" required></div><div class="field"><label for="field-phone">Phone</label><input id="field-phone" name="phone" required></div></div>
        <div class="field"><label for="field-email">Email</label><input id="field-email" name="email" type="email" required></div>
        <div class="field"><label for="field-message">Message</label><textarea id="field-message" name="message" rows="4"></textarea></div>
        <button class="btn loud" style="width:100%" type="submit"><span>Submit →</span></button>
      </form></div>
      <style>.contact-grid{grid-template-columns:1fr}@media(min-width:768px){.contact-grid{grid-template-columns:.9fr 1.1fr}}</style>`)
  });
}

export const POSTS = [
  {
    slug: 'prepare-documents-for-printing-vapi', title: 'How to prepare a PDF for printing in Vapi', modified: '2026-10-01',
    excerpt: 'Check PDF pages, margins, colour and delivery details before paying for assignments, resumes or everyday documents.',
    headings: ['Start with the final document', 'Check every page in the PDF', 'Match the page range to the file', 'Keep page size and margins deliberate', 'Choose colour and sides for the purpose', 'Review copies and the complete price', 'Choose delivery before your deadline', 'Inspect the finished print'],
    sources: [{ title: 'Adobe: adjusting PDF page size for printing', url: 'https://helpx.adobe.com/acrobat/desktop/print-documents/set-up-and-print-pdfs/page-size.html' }, { title: 'Adobe: printing PDFs in Acrobat Reader', url: 'https://helpx.adobe.com/reader/desktop/print-pdfs.html' }],
    body: [
      'Finish edits in the original document before exporting your PDF. Check names, roll numbers, dates, page headings and any information the recipient expects. A readable filename such as assignment-final.pdf helps you recognise the correct version at upload. Use the original document where possible rather than a screenshot of text; a screenshot may already contain blurred letters or missing edges.',
      'Open the exported PDF on the device you will use to order. Scroll through the cover, contents, diagrams, references and final page rather than checking only the first screen. Look for missing characters, shifted tables, accidental blank pages and images that have become hard to read. If something is wrong, correct the original document and export again before uploading.',
      'PDF page positions and the page numbers printed inside a report can differ. A cover may be the first page in the file even when the report starts numbering later. For example, a cover followed by ten numbered pages contains eleven PDF pages. Use the upload preview and detected page count to identify your selection, then check that the final selected range includes everything required.',
      'Choose the paper size required by your college, employer or document issuer. Check whether the PDF mixes portrait and landscape pages or different sizes. Adobe distinguishes fitting content to a printable area from printing at actual size; either choice can change the result. If exact scale matters, such as for a template, confirm that requirement with support before paying rather than assuming automatic fitting will preserve it.',
      'Black-and-white is often sufficient for ordinary text. Choose colour when a diagram, annotation or instruction depends on colours being distinguishable. Read the recipient’s rules before selecting single-sided or double-sided printing. A submission that requires single-sided pages should follow that rule even if duplex would use less paper. For a report read as a booklet, also check the intended page order.',
      'Review the number of copies separately from the page selection. Selecting ten pages and two copies requests twenty printed pages, while the number of physical sheets depends on the sides setting. Check the current printing charge and every delivery or applicable fee in the order summary. Wallet bonus terms and eligibility can differ from the amount you pay into your wallet, so read the displayed offer details.',
      'PrintKarr accepts online orders at any time, with delivery options depending on the location and available service. Vapi and Daman delivery and selected-campus batch slots are different arrangements. Enter your destination and choose an available option before checking out. If an assignment deadline is close, confirm that the promised timing works for you; online availability does not promise immediate physical delivery.',
      'After receiving the prints, compare the first and last pages, page order, copies, colour choice and legibility with your PDF. Keep your order reference and contact support promptly if the result differs from the selected settings. Retain your own original file for future corrections; PrintKarr’s print-file retention process is separate from your personal copy. The preparation checklist is useful even when you print elsewhere.'
    ]
  },
  {
    slug: 'admit-card-printing-checklist', title: 'Admit card printing: a checklist before exam day', modified: '2026-10-01',
    excerpt: 'Use the issuing authority’s instructions to check your admit card, print settings and deadline before ordering.',
    headings: ['Read the current official instructions', 'Download and verify the correct file', 'Check photographs and machine-readable codes', 'Choose the required print settings', 'Keep every required page', 'Leave time for delivery and inspection', 'Compare the print with the original', 'Pack the documents the authority asks for'],
    body: [
      'Start with the exam authority’s official website, admit card and current instructions for your specific examination. There is no universal rule requiring all admit cards to be colour, black-and-white, single-sided or accompanied by the same identity document. Follow the issuer’s stated requirements. If a coaching message or social post conflicts with the official instructions, ask the authority to resolve the difference before ordering.',
      'Download the admit card yourself from the official source and keep the original PDF available. Check that it belongs to the correct examination and session, and review your name, application details, examination centre and reporting information. A printing service cannot correct the authority’s record. If those details appear wrong, use the issuer’s support process rather than editing the admit card to make it look correct.',
      'Preview every page at a readable zoom. The photograph, signature area, barcode or QR code should not be obscured by cropping, annotations or a screenshot interface. A blurred download cannot be repaired simply by printing in colour. When something appears incomplete, download again from the official source or ask the issuing authority for guidance. Avoid redrawing codes or adding unrequested information.',
      'Select the paper size, colour and sides specified for the exam. If the instructions require an A4 colour single-sided print, choose those settings explicitly. Where the issuer does not specify a setting, choose a legible result and contact the authority if unsure about acceptance. Do not assume a document preview on a bright screen guarantees that a faint photograph or tiny text will print clearly.',
      'Check the complete file before choosing a page range. Some admit cards include instructions, declarations or additional pages that must be brought to the centre. A cover or instruction page can also change the PDF page positions. Select all required pages and the required number of copies; do not remove a page merely because it looks unrelated to the first-page admission details.',
      'Work backwards from the time you need to leave for the examination, including time to receive and inspect the print. PrintKarr accepts online orders at any time, but the available delivery options depend on your address and selected service. A participating campus morning slot is not automatically an urgent home-delivery service. Confirm timing with support before paying if the available option does not clearly meet your deadline.',
      'When the prints arrive, compare them with the saved PDF. Check your details, all page edges, photographs, codes, instructions and page order. If the job does not match your selected settings or text is unreadable, keep the order reference and contact support promptly. Leave enough time for a correction rather than discovering the issue while travelling to the centre.',
      'Read the authority’s checklist again when packing your bag. Bring only the photographs, original identity documents, declarations or other materials it requires, and complete signatures only where and when instructed. Keep digital backups for your own reference, but do not treat a phone copy as a substitute where a physical document is required. A PrintKarr print does not establish document validity or guarantee examination admission.'
    ]
  },
  {
    slug: 'running-a-printkarr-kiosk', title: 'PrintKarr kiosk planning: costs and responsibilities', modified: '2026-10-01',
    excerpt: 'Compare hardware, consumables, servicing and partnership responsibilities before requesting a kiosk proposal.',
    headings: ['Treat this as a proposed partnership', 'Separate hardware from operating costs', 'Choose a capacity for actual demand', 'List the recurring costs', 'Decide who owns each responsibility', 'Plan access, uptime and exceptions', 'Model demand without assuming returns', 'Ask for a location-specific proposal'],
    body: [
      'PrintKarr’s first self-service kiosk is planned for Vapi. This guide is a preparation checklist for a proposed kiosk partnership, not an operating-profit report from a live public installation. Delivery ordering is available separately. Before committing to a machine or a location, ask the team about pilot availability, the intended deployment process and which terms will apply to your proposal.',
      'The public partnership page lists indicative hardware reference prices of ₹1,29,000 plus GST for PrintKarr PRO and ₹69,000 plus GST for PrintKarr MINI. Those figures should not be read as an all-inclusive installation or operating quote. Ask what is included, what is optional, how taxes apply and whether delivery, setup, connectivity or other location requirements add costs.',
      'The published capacity references are 1,950 sheets for PRO and 650 sheets for MINI. Paper capacity is not the same as daily print throughput, guaranteed uptime or colour capability. Estimate the likely mix of short assignments and longer documents at your location, then ask which proposed hardware configuration fits it. Consider how often somebody could realistically refill paper during busy periods.',
      'Make a recurring-cost list before building a budget: paper, toner or ink, consumable replacements, electricity, internet connectivity, cleaning, servicing and any space cost. Actual amounts depend on equipment, suppliers, usage and the agreement. Obtain quotations rather than copying generic rent, electricity or commission numbers. Also ask how damaged sheets, unsuccessful jobs and unexpected component replacements are accounted for.',
      'PrintKarr describes franchise-owned, space-partner and custom partnership models. The public overview gives different responsibilities for hardware, space, consumables, support and the platform. Turn that overview into a written checklist for your own agreement. Identify who purchases refills, receives service alerts, attends the location, approves refunds and communicates with users when the machine cannot fulfil an order.',
      'Check power, network reliability, access permissions and physical placement with the building owner. A machine in a college corridor cannot serve users when that corridor is locked. Discuss accessible placement, safe cable routing and the response when internet, power or printing fails. Ask for the proposed service arrangement and escalation contacts instead of assuming that self-service means nobody needs to manage it.',
      'Estimate demand from a real location survey or existing print activity, using quieter days as well as deadline peaks. Separate projected paid orders from free or promotional printing. Compare expected revenue against consumables and the quoted agreement terms, and include a lower-demand scenario. A kiosk price or paper capacity does not establish a payback period, fixed income or guaranteed return.',
      'Use the partnership enquiry with your city, type of location, expected audience, available space, power and internet details. Ask for current pricing, deployment readiness, servicing terms, payment responsibilities and contract conditions in writing. Keep your investment decision tied to that proposal. Until a public kiosk launch and pickup location are announced, customer orders should use the available delivery service rather than travel to an assumed kiosk.'
    ]
  },
  {
    slug: 'replacing-xerox-queues', title: 'Online printing or a Xerox shop: how to choose', modified: '2026-10-01',
    excerpt: 'Compare document uploads, print settings, delivery and in-person services before choosing how to print.',
    headings: ['Start with the job you need done', 'Use online printing for a prepared document', 'Choose an in-person service when it helps', 'Compare the complete job price', 'Make the print settings explicit', 'Allow for delivery and collection time', 'Handle personal documents carefully', 'Know what PrintKarr offers today'],
    body: [
      'A prepared PDF and a damaged paper original are different printing jobs. Before choosing a provider, decide whether you need ordinary document printing, photocopying, scanning, binding, lamination or a specialist finish. An online document upload does not automatically offer every service associated with a Xerox shop. Checking this first prevents an order that cannot produce the result you actually need.',
      'Online ordering can be useful when the final file is already on your phone or computer. You can select pages, copies, colour and available sides, then review the summary before payment. It is especially helpful for repeatable document jobs such as assignments, resumes or forms. You still need to check the document carefully; a digital order will not correct spelling, missing pages or inaccurate information.',
      'An in-person shop may be the better fit if you need someone to inspect a physical original, discuss a binding finish or check paper options that an online flow does not list. Confirm the shop’s actual services and opening hours rather than assuming every counter has the same equipment. For a specialist requirement, ask for a sample or clear description of the intended result before committing to the whole job.',
      'Compare the complete job rather than only the advertised price per page. Page selection, copies, colour and sides can change the printing amount. Delivery, other applicable fees or a separate finishing service can change the total. A wallet bonus is order credit under displayed rules, not cash returned to you. Read any offer eligibility or expiry before treating it as a saving for your particular job.',
      'Make the instructions precise whichever provider you use. Identify pages by their positions in the PDF, check whether the recipient requires single-sided printing, and explain when colour is essential for a diagram. Confirm the number of copies separately. A short review of these details is easier than fixing a whole assignment that was printed in the wrong range or orientation.',
      'For delivery, select an option that reaches the correct address or participating campus within your deadline. For a shop visit, include travel, opening hours and collection arrangements. Online order placement at night does not guarantee that physical printing or delivery happens immediately. If the timing is urgent or unclear, confirm it with the provider before paying instead of relying on a broad availability slogan.',
      'Check your file for unrelated personal information before sharing it with any provider. Use the intended upload process, keep your own original and read the provider’s privacy information. If a document needs a signature or correction after printing, follow the recipient’s instructions. No general printing service can establish that an identity document, certificate or submitted form is legally valid.',
      'PrintKarr currently offers online document ordering and available delivery in Vapi and Daman, with selected-campus arrangements in Sarigam and Bhilad. Its first Vapi self-service kiosk is planned; there is no announced public pickup address. Start with the delivery options shown for your destination. If you need binding, lamination, walk-in collection or an unlisted specialist service, confirm availability with support rather than assuming the planned kiosk provides it today.'
    ]
  },
  {
    slug: 'colleges-24-7-print', title: 'Campus printing: delivery slots and kiosk planning', modified: '2026-10-01',
    excerpt: 'Plan student document delivery and evaluate a proposed campus kiosk without confusing ordering hours with access or delivery.',
    headings: ['Separate current delivery from a planned kiosk', 'Check whether your campus participates', 'Understand the slot and cutoff', 'Review fees and wallet conditions', 'Give complete handover information', 'Prepare files for the institution’s rules', 'Evaluate a kiosk with the campus team', 'Define responsibilities before a partnership'],
    body: [
      'Students often need printing around assignment and examination deadlines, but a useful service needs clear delivery arrangements as well as online ordering. PrintKarr accepts online document orders at any time. Selected-campus batch delivery is a current order option where enabled. Self-service kiosk deployment is a separate planned initiative, beginning with a Vapi pilot; it should not be described as an open machine at every college.',
      'Check the participating campuses and options shown in the order flow. General mentions of Sarigam or Bhilad do not mean every college or hostel in those areas is covered. If your campus is absent, ask support about your exact location before paying for a service that may not reach it. Do not choose another campus merely to obtain a slot or a delivery offer.',
      'Read the available delivery slot and the order cutoff together. A morning slot may require placing the order before an overnight cutoff; an afternoon option can have a different deadline. Use the current times shown for your chosen campus rather than an old promotion or a screenshot. Missing a cutoff can change the available slot, so check the order summary immediately before you confirm payment.',
      'Review printing charges, delivery fees and offer conditions separately. Free batch delivery can depend on eligibility or a minimum order, while express delivery remains a paid option when available. The first-wallet offer and other top-ups may add bonus credit under displayed rules. Bonus credit is non-withdrawable and may expire; a wallet purchase does not automatically entitle every order to free campus delivery.',
      'Provide a working contact number and select the correct campus delivery point. Keep track of the promised slot and follow the order status in your account. If the displayed point is unsuitable for your class timetable or hostel access, confirm another arrangement with support before checkout. A late-delivery wallet credit applies only under an enabled eligible guarantee and does not replace planning around a submission deadline.',
      'Check the assignment or examination instructions before uploading. Confirm the required pages, copies, colour, sides and any cover sheet with the institution’s rules. Export and inspect the final PDF rather than sending several unfinished versions. For a group assignment, decide who will receive the prints and verify the complete page range so a teammate’s section is not accidentally left out.',
      'A campus considering a kiosk should first identify the intended users, permitted access hours, expected demand and proposed location. Assess power, internet connectivity, safe placement, accessibility and how users will get help. A machine behind a locked building door cannot provide unrestricted access. Ask PrintKarr about the planned pilot and a location-specific proposal instead of assuming installation is immediately available.',
      'The public partnership overview offers franchise-owned, space-partner and custom models. Before agreeing, document who provides the space, hardware, consumables, maintenance access and student support. Ask how failed jobs, payments, refunds and service interruptions would be handled. Use the campus partnership enquiry for a proposal. Until a launch and pickup location are announced, students should select the actual delivery option offered for their campus.'
    ]
  },
];

export function blogsPage() {
  return shell({
    active: '/blogs',
    title: 'Journal — Notes from the print floor',
    body: pageWrap(`<div style="max-width:48rem;margin:0 auto;text-align:center"><span class="pill rv">Journal</span><h1 class="display rv" style="font-size:clamp(2rem,5vw,3rem);margin-top:16px">Notes from the print floor</h1></div>
    <div class="grid c3" style="margin-top:32px">${POSTS.map((p) => `<a class="card rv" href="/blogs/${p.slug}"><h2 style="font-size:18px">${p.title}</h2><p class="muted" style="margin-top:8px;font-size:14px">${p.excerpt}</p></a>`).join('')}</div>`)
  });
}

export function blogArticlePage(slug) {
  const post = POSTS.find((p) => p.slug === slug);
  if (!post) return shell({ title: 'Not found', body: pageWrap(`<h1 class="display">Story not found</h1><a class="rowlink" href="/blogs">Back to blogs</a>`) });
  return shell({
    path: '/blogs/' + post.slug,
    article: post,
    desc: post.excerpt,
    title: post.title,
    body: pageWrap(`<article class="service-guide"><nav class="guide-breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><a href="/blogs">Printing guides</a></nav><h1 class="display">${esc(post.title)}</h1><p class="muted">${esc(post.excerpt)}</p><p class="guide-byline">By <a href="/about">PrintKarr</a> · Reviewed <time datetime="${esc(post.modified)}">1 October 2026</time></p>${post.body.map((p, i) => `<section><h2>${esc(post.headings[i])}</h2><p>${esc(p)}</p></section>`).join('')}${post.sources ? `<section><h2>Further reading</h2><ul>${post.sources.map(s => `<li><a href="${esc(s.url)}">${esc(s.title)}</a></li>`).join('')}</ul></section>` : ''}<aside class="guide-next"><h2>Put your document into print.</h2><p>Check <a href="/printing-prices">current print prices</a>, <a href="/printing-in-vapi">Vapi delivery</a> or <a href="/printing-in-daman">Daman delivery</a>. For a deadline or campus address, <a href="/contact">confirm coverage and timing</a> before paying.</p><a class="btn loud" href="/order">Upload &amp; print ${icon('arrow-up-right')}</a></aside></article>`)
  });
}

export function termsPage() {
  return shell({
    path: '/terms',
    title: 'Terms & Conditions',
    body: pageWrap(`<article class="service-guide"><h1 class="display">Terms &amp; Conditions</h1><p>PrintKarr online document printing is operated by PrintKarr Technologies Private Limited, based in Vapi. Self-service kiosks are planned; no public kiosk pickup address has been announced.</p><h2>Print jobs and delivery</h2><p>You confirm you have the right to print the file you upload. Review your PDF, page range, copies, colour, sides and delivery details before placing the order. Online ordering is available any time; delivery availability and slots are shown in checkout. For a time-sensitive document or college address, confirm arrangements before paying.</p><h2>Files and account access</h2><p>Uploaded files are stored to process your order and supplied to the authorized print workflow. Eligible order files are removed after delivered, refunded or cancelled status and the configured retention period. Keep your original document; PrintKarr is not a permanent file archive. Read our <a href="/privacy">privacy information</a>.</p><h2>Payments, wallet and refunds</h2><p>Print fees are prepaid. Review printing, delivery and applicable fees in the final quote. Wallet bonus credit is non-withdrawable and usable only on PrintKarr orders; offer eligibility and expiry rules apply. Hardware failures and order issues should be reported to support for review and the appropriate refund process.</p><h2>Contact</h2><p>For an order issue, quote your order number to <a href="mailto:${EMAIL}">${EMAIL}</a> or <a href="tel:+919016703180">+91 90167 03180</a>.</p></article>`)
  });
}

export function privacyPage() {
  return shell({
    path: '/privacy',
    title: 'Privacy Policy',
    body: pageWrap(`<article class="service-guide"><h1 class="display">Privacy Policy</h1><p>PrintKarr Technologies Private Limited uses uploaded documents, account and contact details, delivery information and payment references to process print orders, provide support and maintain order and wallet records.</p><h2>Documents</h2><p>Uploads are sent over HTTPS on the live website. Files are stored on the service and made available to the authorized order and print workflow. Eligible order files are removed after delivered, refunded or cancelled status and the configured retention period, during a scheduled cleanup. Removal is not immediate when printing finishes. Keep your original file; draft or unfinished orders can have different retention.</p><h2>Accounts, payments and cookies</h2><p>Google sign-in identifies your customer account. Session cookies keep you signed in. Contact and delivery details support the order, while order history, payment references and wallet transactions are retained independently of uploaded files. Online card or UPI payment entry is handled by the available payment provider; PrintKarr uses payment references to confirm orders.</p><h2>Your requests</h2><p>For questions about information or a deletion request, contact <a href="mailto:${EMAIL}">${EMAIL}</a>. Include your account email or order number so the team can identify the relevant records; avoid attaching sensitive documents to the request. We review requests alongside order support and records that need to be retained.</p></article>`)
  });
}

export function vapiPage() {
  return shell({ path: '/printing-in-vapi', body: pageWrap(`
    <article class="service-guide">
      <nav class="guide-breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><span>Printing in Vapi</span></nav>
      <p class="eyebrow">PRINTKARR · LOCAL DOCUMENT PRINTING</p>
      <h1 class="display">Printing in Vapi.<br><em>Delivered to you.</em></h1>
      <p>Looking for a printing shop in Vapi? PrintKarr lets you order document prints online and have them delivered. Upload your file, choose the pages and settings, and review the price before you pay.</p>
      <div class="local-print-actions"><a class="btn loud" href="/order">Upload &amp; print →</a><a class="rowlink" href="https://wa.me/919016703180">WhatsApp 9016703180</a></div>
      <h2>What can you print?</h2>
      <p>Order black-and-white or colour document prints for college assignments, project reports, resumes, office documents, forms, tickets and admit cards. Select your page range and copies in the order flow. Follow your college, employer or exam authority’s requirements for paper and print settings.</p>
      <h2>Delivery areas and timing</h2>
      <ul><li><strong>Vapi:</strong> local delivery to the address you select, subject to checkout availability.</li><li><strong>Daman:</strong> see our <a href="/printing-in-daman">Daman document delivery guide</a> for address and timing checks.</li><li><strong>Sarigam and Bhilad:</strong> selected colleges only. Confirm your college and delivery arrangements before ordering.</li></ul>
      <p>Online ordering is available 24/7. Delivery uses available slots and service rules, rather than an immediate-delivery promise. Enter the correct address, PIN code and map point, then review the fee and slot. For a deadline or an address the checkout cannot accept, call <a href="tel:+919016703180">+91 90167 03180</a> before paying.</p>
      <h2>How much does printing cost?</h2>
      <p>See our <a href="/printing-prices">current A4 printing rates</a>. Your exact total depends on selected pages, copies, colour, sides and delivery. The quote shows printing, delivery and applicable fees before payment. <a href="/order">Upload your document to see your quote</a>; a displayed per-page rate is not an all-inclusive delivery charge.</p>
      <h2>Are PrintKarr kiosks open in Vapi?</h2>
      <p>Our first kiosk is planned in Vapi. No public kiosk pickup address has been announced yet. Please use delivery or <a href="/contact">contact us for launch updates</a>. Service coverage is not a direction to a walk-in store; do not travel to an assumed kiosk location.</p>
      <h2>How do I order?</h2>
      <ol><li>Upload your document and check its page count.</li><li>Select the pages, copies and print settings you need.</li><li>Select your delivery address or eligible campus slot and review the total.</li><li>Use your wallet or the available payment options, then place the order and follow it in your customer account.</li></ol>
      <h2>College assignments and morning delivery</h2>
      <p>For a campus batch, select the actual college and an available fixed delivery slot. Morning and afternoon slots, cutoff times, minimum orders and free-delivery eligibility can differ by campus and offer. Uploading at night does not guarantee a morning slot after its cutoff. An ordinary Vapi address does not automatically qualify for a college batch.</p>
      <h2>Wallet payment and file access</h2>
      <p>Google sign-in gives access to your order history and wallet. Purchased balance and promotional bonus credit can have different rules; bonus credit is non-withdrawable and usable on PrintKarr orders. Review the current offer and its validity before a top-up. You can complete an order on the website without a mandatory WhatsApp conversation.</p>
      <p>Keep the final PDF until you have checked the delivered print. Uploaded order files are removed after eligible completed, refunded or cancelled orders pass the configured retention period; the website is not a document archive. Read the <a href="/privacy">file-handling information</a> before uploading sensitive material.</p>
      <h2>Before you print</h2>
      <p>Check fonts, margins, cover pages and diagrams in the final PDF. Read our <a href="/blogs/prepare-documents-for-printing-vapi">document preparation guide</a> and <a href="/blogs/admit-card-printing-checklist">admit card checklist</a>.</p>
      <h2>Need help with a local order?</h2>
      <p><a href="tel:+919016703180">Call 9016703180</a>, <a href="https://wa.me/919016703180">message us on WhatsApp</a> or <a href="/contact">contact PrintKarr</a> to confirm college coverage, urgent delivery timing or kiosk partnership enquiries.</p>
    </article>`) });
}

export function damanPage() {
  return shell({ path:'/printing-in-daman', body:pageWrap(`<article class="service-guide">
    <nav class="guide-breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><span>Printing in Daman</span></nav>
    <p class="eyebrow">PRINTKARR · DAMAN DOCUMENT DELIVERY</p><h1 class="display">Printing in Daman.<br><em>Start from your phone.</em></h1>
    <p>PrintKarr offers online document printing with local delivery in Daman. The service is based in Vapi: upload your PDF or photo, choose black-and-white or colour printing, and confirm a Daman delivery address and available slot before paying.</p>
    <div class="local-print-actions"><a class="btn loud" href="/order">Upload &amp; print ${icon('arrow-up-right')}</a><a class="rowlink" href="/printing-prices">See printing prices</a></div>
    <h2>Confirm your Daman address first</h2><p>Enter a complete address, recipient contact number and PIN code, and check the map point when the order flow asks for it. These details help distinguish your destination from the service’s Vapi base. Review the available delivery option and its fee before placing the order. If checkout does not accept your location, contact <a href="tel:+919016703180">+91 90167 03180</a> before making a payment; a city-wide description does not confirm every individual address.</p>
    <h2>Documents for work, applications and everyday use</h2><p>Use the service for PDFs, resumes, forms, tickets, assignments, reports and admit cards. Select only the PDF pages you need and the correct number of copies. For diagrams or photographs that must retain colour, choose colour explicitly. Check the organisation’s instructions before selecting paper size, single-sided or double-sided output. A printed copy does not replace an original document when an application requires the original.</p>
    <h2>Can I order at night?</h2><p>Yes, online orders can be placed at any time. The delivery time depends on the available slot, location and order rules. We do not promise an immediate or overnight delivery simply because the website accepts an order. For an exam, travel departure or appointment, confirm the timing before payment and allow time to inspect the delivered pages.</p>
    <h2>Daman delivery and college batches are different</h2><p>A residential or business delivery in Daman is not automatically a campus batch. Fixed college slots and free-delivery offers apply only where the college and order qualify. Selected colleges in Sarigam and Bhilad require separate confirmation; availability there does not establish a Daman campus partnership. Choose the option that matches the actual destination rather than selecting a college to obtain a delivery benefit.</p>
    <h2>What does the order cost?</h2><p>Our <a href="/printing-prices">printing price guide</a> shows current per-page rates. Selected pages, copies, print settings, delivery and applicable fees determine the final total. Preview the quote before using wallet balance or the available online payment options. Promotional wallet credit is non-withdrawable and can have eligibility and expiry rules; review them before topping up.</p>
    <h2>Is there a Daman shop or pickup kiosk?</h2><p>No public Daman pickup address has been announced. PrintKarr’s first self-service kiosk is planned for Vapi, so this page describes delivery rather than directions to a Daman branch. Use <a href="/printing-in-vapi">the Vapi guide</a> for the current kiosk status and service-base information.</p>
    <h2>Before submitting and after delivery</h2><p>Open the final PDF, check every page and leave important text away from page edges. Use the <a href="/blogs/prepare-documents-for-printing-vapi">PDF preparation checklist</a> and <a href="/blogs/admit-card-printing-checklist">admit card guide</a> when relevant. Keep your original file and compare the delivery with your order settings. If you need help, quote the order number when you <a href="/contact">contact PrintKarr</a>. WhatsApp is optional; uploading, payment and order placement happen on the website.</p>
  </article>`) });
}

export function printPricesPage({ pricing }) {
  return shell({ path:'/printing-prices', body:pageWrap(`<article class="service-guide pricing-guide">
    <nav class="guide-breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><span>Printing prices</span></nav>
    <p class="eyebrow">A4 DOCUMENT PRINTING · VAPI &amp; DAMAN</p><h1 class="display">Clear prices.<br><em>Before you pay.</em></h1><p>These are PrintKarr’s current A4 document printing rates. The final quote includes your selected pages, copies and settings, plus delivery and applicable fees. Review that quote before placing an order.</p>
    <div class="local-print-actions"><a class="btn loud" href="/order">Get your exact quote ${icon('arrow-up-right')}</a></div>
    <div class="grid c3 guide-rates">${[['Black & white',pricing.bw],['Colour',pricing.color],['Student B&W',pricing.studentBw]].map(([label,value])=>`<section class="card"><h2>${label}</h2><strong>${rs(value)}</strong><p>per printed page${label==='Student B&W' ? ', when eligible' : ''}</p></section>`).join('')}</div>
    <h2>Pages, sheets and copies</h2><p>A PDF page and a physical sheet are different. A double-sided sheet can carry two printed document pages; it does not automatically halve the charge for the document content. Selecting ten document pages and two copies produces twenty printed pages. Review the detected page count, selected range and copies so you do not pay to print unwanted covers or blank pages.</p>
    <h2>Black-and-white, colour and student rates</h2><p>Use black-and-white for text-only documents when colour is not required. Select colour for diagrams, photographs or instructions that depend on it. Student pricing applies only when the account or order meets the eligibility shown by the service; it is not a blanket discount on every colour or delivery charge. Choose single-sided or double-sided printing according to your college, employer or exam authority’s requirements.</p>
    <h2>Delivery is quoted separately</h2><p>Per-page rates describe printing. Address delivery in <a href="/printing-in-vapi">Vapi</a> or <a href="/printing-in-daman">Daman</a>, eligible campus batches and express options can have different fees and availability. Free campus delivery, minimum order rules and cutoff times apply only where the checkout confirms eligibility. Enter the actual destination and inspect the full total; do not assume that a wallet bonus covers every delivery option.</p>
    <h2>Wallet credit and offers</h2><p>Your wallet can pay for PrintKarr orders. Current top-up offers and their bonus amounts appear on the <a href="/customer/wallet">wallet page</a>. Purchased balance and promotional credit have different rules: bonus credit is non-withdrawable, usable on PrintKarr orders and subject to any offer expiry. Membership passes, when enabled, are separate from ordinary top-ups. Review the terms shown for the specific offer before paying.</p>
    <h2>A quote tailored to your document</h2><p>Upload the final file, choose page ranges and copies, select print settings and delivery, then review the itemised quote. It shows the price for that order rather than an estimate for an unseen document. There is no mandatory WhatsApp step. Follow our <a href="/how-it-works">order guide</a> or <a href="/contact">contact support</a> if the destination or a time-sensitive request needs clarification.</p>
  </article>`) });
}
