// Public printing flow and marketing pages — PrintKarr print studio.
// No login walls before price. Auth happens once, at OTP time.
import { esc, ASSET_V, pkPublicHeader, pkPublicFooter, DELIVERY_MAP_HEAD, deliveryPicker } from './views.js';
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
<meta name="theme-color" content="#1746E0">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="/design.css?v=${ASSET_V}">
<link rel="stylesheet" href="/customer.css?v=${ASSET_V}">
${extraHead || ''}
</head>
<body><div class="pk-page">
${topNav(active)}
<a href="#main" style="position:absolute;left:-9999px" onfocus="this.style.left='16px';this.style.top='16px';this.style.zIndex=99;this.style.background='var(--navy)';this.style.color='#fff';this.style.padding='8px 16px';this.style.borderRadius='99px'" onblur="this.style.left='-9999px'">Skip to content</a>
<main id="main">${body}</main>
${stickyCta ? '<div class="sticky-cta"><a href="/order">Upload PDF &amp; Print →</a></div>' : ''}
${pkPublicFooter()}
</div>
<div class="toast" id="toast"></div>
<script src="/shell.js?v=${ASSET_V}" defer></script>
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
  const pictures = ['step-1-qr.jpg', 'step-2-upload.jpg', 'step-3-settings.jpg', 'step-4-collect.jpg'];
  const rows = steps.map((s, i) => `<details class="pk-feed-row rv" name="print-guide" ${i === 0 ? 'open' : ''}><summary><span class="pk-feed-ic">${s.n}</span><b>${s.t}</b><span class="step-toggle" aria-hidden="true">↗</span></summary><div class="step-detail"><img src="/images/${pictures[i]}" alt="${s.t}" loading="lazy"><p>${s.d}</p><span class="tag">${s.tag}</span></div></details>`).join('');
  return `<div class="pk-feed">${rows}</div>`;
}

function hostBannerHtml() {
  return `<section class="pk-host rv"><div class="txt"><p class="eyebrow">CAMPUSES · HOSTELS · OFFICES · SHOPS</p><h2 class="display">Put printing<br>where people are.</h2><p class="sub">Have a space in Vapi? Host a PrintKarr kiosk.</p><a class="ihb" style="margin-top:24px" href="/contact"><span class="ihb-row"><span class="ihb-dot"></span><span class="ihb-t1">Talk to us</span></span><span class="ihb-t2" aria-hidden="true"><span>Talk to us</span><svg class="ihb-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span></a></div><div class="img"><img src="/images/host-cta.jpg" alt="Student requesting a print from her phone" loading="lazy"></div></section>`;
}

export function landing({ pricing, maxMb }) {
  const minRate = Math.min(pricing.bw, pricing.studentBw);
  const mb = maxMb || 20;
  const packs = PACKS.map((pack) => `<a class="pack-offer${pack.id === 'M' ? ' featured' : ''}" href="/customer/packs">
    <span class="eyebrow">${pack.id === 'M' ? 'MOST POPULAR · ' : ''}${esc(pack.name.replace('Semester Pack ', ''))}</span>
    <strong>${rs(pack.price)}</strong><span>${pack.bw} B&amp;W · ${pack.color} colour · ${pack.files} files</span>
    <small>${rs(BOOKING_FEE)} today · ${rs(pack.price - BOOKING_FEE)} later</small><b>See pack details →</b>
  </a>`).join('');
  return shell({ active: '/', stickyCta: true, title: 'Printing in Vapi', body: `
    <div class="marketing-wrap conversion-home">
      <section class="studio-hero" aria-labelledby="home-title">
        <div class="hero-copy">
          <p class="eyebrow"><span class="status-dot"></span> 24×7 PRINTING · BUILT IN VAPI</p>
          <h1 id="home-title">Printing in Vapi.<br><em>Delivered to you.</em></h1>
          <p class="hero-description">Upload your PDF. Choose what prints. Get 24/7 delivery across Vapi and Daman. <a href="/printing-in-vapi">Explore local printing →</a></p>
          <div class="hero-actions"><a class="btn loud big" href="/order">Print now <span aria-hidden="true">→</span></a><a class="text-link" href="#how-it-works">See how it works ↓</a></div>
          <div class="hero-proof"><span>No signup to start</span><span>B&amp;W from <b>${rs(minRate)}</b>/page</span><span>Full price before payment</span></div>
          <p class="paper-flow" aria-label="From PDF to paper">PDF <span>→</span> PRINT <span>→</span> PICKUP / DELIVERY</p>
        </div>
        <form class="hero-upload rv" method="POST" action="/order/upload" enctype="multipart/form-data">
          <div class="upload-paper"><span class="eyebrow">YOUR NEXT PRINT</span><span class="paper-glyph" aria-hidden="true">PDF</span><b>Drop your PDF here.</b><small>No app. No account to begin.</small></div>
          <label class="drop" for="hero-doc"><b>Choose a PDF or photo</b><span class="muted">Up to ${mb} MB · price shown after upload</span></label>
          <input id="hero-doc" name="doc" type="file" accept="application/pdf,.pdf,.png,.jpg,.jpeg" required class="file-input">
          <button class="btn loud big" type="submit" style="width:100%"><span>Upload and see price →</span></button>
          <p class="field-hint" style="text-align:center">Your PDF is kept private and deleted after printing.</p>
        </form>
      </section>
      <div class="urgency-strip" aria-label="When to use PrintKarr"><span>Assignment tomorrow?</span><span>Admit card today?</span><span>Xerox shop closed?</span><b>PrintKarr it.</b></div>
      <section class="home-section" id="how-it-works"><div class="home-section-head"><p class="eyebrow">01 / FOUR MOVES</p><h2>Upload. Pay.<br><em>Paper.</em></h2><p class="muted">The whole print, from your phone. No explaining your PDF at a counter.</p></div>
        <ol class="home-steps"><li><span>01</span><b>Upload a PDF</b></li><li><span>02</span><b>Choose pages and see the total</b></li><li><span>03</span><b>Pay online</b></li><li><span>04</span><b>Collect or get delivery</b></li></ol>
      </section>
      <section class="home-section" id="try-it"><div class="home-section-head"><p class="eyebrow">02 / SEE HOW IT WORKS</p><h2>Your print,<br><em>before you pay.</em></h2><p class="muted">Try this example. Your actual PDF gets its exact price after upload.</p></div>
        <div class="print-example" data-print-example data-bw="${pricing.bw}" data-color="${pricing.color}">
          <div class="example-sheet"><span class="eyebrow">PDF PREVIEW · EXAMPLE</span><span class="example-pdf">PDF</span><b>assignment-final.pdf</b><small>23 pages · A4 · single sided</small><div class="sheet-lines" aria-hidden="true"><i></i><i></i><i></i><i></i></div></div>
          <div class="example-controls"><p class="eyebrow">SETTINGS</p><h3>Make it yours.</h3>
            <fieldset><legend>Print type</legend><label><input type="radio" name="example-type" value="bw" checked> B&amp;W</label><label><input type="radio" name="example-type" value="color"> Colour</label></fieldset>
            <fieldset><legend>Collect</legend><label><input type="radio" name="example-route" value="pickup" checked> Kiosk pickup · ₹0</label><label><input type="radio" name="example-route" value="delivery"> Delivery · priced after address</label></fieldset>
            <div class="example-bill"><div><span>23 pages × <span data-example-rate>${rs(pricing.bw)}</span></span><b data-example-print>${rs(23 * pricing.bw)}</b></div><div><span data-example-route-label>Pickup</span><b data-example-fee>₹0</b></div><div class="example-total"><span data-example-total-label>Total</span><b data-example-total>${rs(23 * pricing.bw)}</b></div></div>
            <a class="btn loud big" href="/order">Print my PDF →</a>
          </div>
        </div>
      </section>
      <section class="home-section" id="pricing"><div class="home-section-head"><p class="eyebrow">03 / CLEAR PRICES</p><h2>Know the total<br><em>before paying.</em></h2></div><div class="price-tiles">
        <div><span>B&amp;W · A4</span><strong>${rs(pricing.bw)}<small>/page</small></strong></div><div><span>Colour · A4</span><strong>${rs(pricing.color)}<small>/page</small></strong></div><div><span>Kiosk pickup</span><strong>₹0<small>pickup fee</small></strong></div></div>
        <p class="muted price-note">Delivery is calculated from your selected location. Printing, delivery and any applicable fees are itemised before payment.</p>
      </section>
      <section class="kiosk-feature" id="kiosks"><div><p class="eyebrow">04 / THE KIOSK</p><h2>The Xerox shop.<br><em>Without the shop.</em></h2><p>Our first self-service kiosk is planned in Vapi, with more Vapi locations to follow. Today, you can order print delivery online.</p><p class="kiosk-steps">UPLOAD <span>→</span> CHOOSE <span>→</span> PAY <span>→</span> DELIVERY</p><a class="btn loud big" href="/order">Order print delivery →</a><small>No app required · kiosk locations coming soon</small></div><img src="/images/kiosk-hero.png" alt="Illustration of a planned PrintKarr self-service printing kiosk" loading="lazy"></section>
      <section class="home-section" id="packs"><div class="home-section-head"><p class="eyebrow">05 / SEMESTER PACKS</p><h2>You’re going to<br><em>print anyway.</em></h2><p class="muted">Pick a pack for the term. ${rs(BOOKING_FEE)} secures it; pay the remainder later. Packs cover printing, while delivery is charged per order.</p></div><div class="pack-offers">${packs}</div></section>
      <section class="home-section" id="referrals"><div class="referral-feature"><div><p class="eyebrow">06 / SHARE PRINTKARR</p><h2>Your friend has<br><em>a deadline too.</em></h2><p>Give them your code for a first-order discount. You earn a reward after their eligible paid print. See the current offer in your account.</p><a class="btn solid big" href="/customer/referrals">Get my referral code →</a></div><div class="referral-note" aria-hidden="true">PDF hai?<br><strong>Paper bana<br>denge.</strong><span>PRINTKARR / VAPI</span></div></div></section>
      <section class="home-section" id="faq"><div class="home-section-head"><p class="eyebrow">GOOD TO KNOW</p><h2>Before you<br><em>upload.</em></h2></div><div class="faq">
        <details><summary>Do I need to sign up first?</summary><p>No. Upload and choose your settings first. We ask for your details when you’re ready to place the order.</p></details>
        <details><summary>When will I see the full price?</summary><p>After you choose your print settings and, for delivery, select your location. Printing and delivery appear separately before payment.</p></details>
        <details><summary>Can I print one page of a larger PDF?</summary><p>Yes. Open Change settings after upload and enter the page number you want.</p></details>
        <details><summary>How do I collect my print?</summary><p>Delivery is available across Vapi and Daman. Kiosk pickup is planned for Vapi; contact us for launch updates before travelling to a pickup location.</p></details>
      </div></section>
      <section class="home-final rv"><h2 class="display">Need it on paper?<br><em>PrintKarr it.</em></h2><a class="btn loud big" href="/order">Upload your PDF →</a><p class="muted">Built in Vapi. Starting with the prints people need today.</p></section>
    </div>
    <script>document.getElementById('hero-doc').addEventListener('change',function(e){if(e.target.files[0])e.target.form.submit()});(function(){var box=document.querySelector('[data-print-example]');var rate=box.querySelector('[data-example-rate]'),amount=box.querySelector('[data-example-print]'),fee=box.querySelector('[data-example-fee]'),total=box.querySelector('[data-example-total]'),label=box.querySelector('[data-example-total-label]'),routeLabel=box.querySelector('[data-example-route-label]');function rupee(n){return '₹'+n.toLocaleString('en-IN')}box.addEventListener('change',function(){var color=box.querySelector('[name="example-type"]:checked').value==='color',delivery=box.querySelector('[name="example-route"]:checked').value==='delivery',r=Number(box.dataset[color?'color':'bw']);rate.textContent=rupee(r);amount.textContent=rupee(23*r);fee.textContent=delivery?'Calculated at checkout':'₹0';routeLabel.textContent=delivery?'Delivery':'Pickup';label.textContent=delivery?'Printing subtotal':'Total';total.textContent=rupee(23*r)})})();</script>` });
}

export function orderPage({ draft, pricing, error, maxMb, surcharges = {} }) {
  const d = draft || null;
  const cfg = JSON.stringify({ bw: pricing.bw, color: pricing.color, fees: pricing.delivery, lateNightFee: surcharges.lateNightFee || 0, surgeFee: surcharges.surgeFee || 0 });
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
            <div class="field"><label>When</label><div class="chips" id="f-slot"><label class="chip-pick"><input type="radio" name="slot" value="ASAP" checked> ASAP</label><label class="chip-pick"><input type="radio" name="slot" value="Evening"> This evening</label><label class="chip-pick"><input type="radio" name="slot" value="Morning"> Tomorrow morning</label></div></div>
          </div></details>
        </div>
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
          var ep = effPages(); if (ep == null) ep = pages;
          var rate = type === 'color' ? window.PK.color : window.PK.bw;
          var sub = ep * copies * rate;
          var del = area === 'pickup' ? 0 : area === 'vapi' ? 10 : area === 'daman' ? 20 : Math.min(60, window.PK.fees[area] || 15);
          var el = document.querySelector('#liveTotal b');
          var late = area === 'pickup' ? 0 : window.PK.lateNightFee;
          var surge = window.PK.surgeFee;
          var total = Math.round((sub + del + late + surge) * 100) / 100;
          if (el) el.textContent = (area === 'pickup' ? 'Total ₹' : 'From ₹') + total.toLocaleString('en-IN');
          var sub2 = document.querySelector('#liveTotal span');
          if (sub2) sub2.textContent = 'Printing ₹' + sub.toLocaleString('en-IN') + (area === 'pickup' ? ' · pickup ₹0' : ' · delivery from ₹' + del + ' (exact fee after location)') + (late ? ' · late-night +₹' + late : '') + (surge ? ' · high-demand +₹' + surge : '');
        }
        document.getElementById('cMinus').addEventListener('click', function(){ var i = document.getElementById('copies'); i.value = Math.max(1, (parseInt(i.value, 10) || 1) - 1); upd(); });
        document.getElementById('cPlus').addEventListener('click', function(){ var i = document.getElementById('copies'); i.value = Math.min(200, (parseInt(i.value, 10) || 1) + 1); upd(); });
        document.querySelectorAll('#f-type input, #f-sides input, #f-area input, #f-areas-extra input').forEach(function(i){ i.addEventListener('change', upd); });
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
        <p class="field-hint" style="text-align:center;margin-top:10px">Your document stays private — automatically deleted after printing.</p>
      </form>
      <script>document.getElementById('doc').addEventListener('change', function(e){ var f = e.target.files[0]; document.getElementById('fname').textContent = f ? '📄 ' + f.name : ''; if (f) { var b = document.querySelector('[data-upload-btn] span'); if (b) b.textContent = 'Reading PDF…'; e.target.form.submit(); } });</script>`}
    </section>`
  });
}

export function phonePage({ draft, error, referral }) {
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
          <div class="field"><label for="pp">Phone for order updates</label><input id="pp" name="phone" inputmode="numeric" placeholder="98250 11111" maxlength="13"></div>
          <div class="field"><label for="pin">PIN${draft.area === 'Pickup' ? ' (optional)' : ''}</label><input id="pin" name="pin" ${draft.area === 'Pickup' ? '' : 'required'} inputmode="numeric" placeholder="${draft.area === 'Daman' ? '396210' : draft.area === 'Sarigam' ? '396155' : '396191'}" maxlength="10"></div>
        </div>
        <div class="field"><label for="aa">${draft.area === 'Pickup' ? 'Pickup note (optional)' : 'Full delivery address'}</label><input id="aa" name="address" ${draft.area === 'Pickup' ? '' : 'required'} placeholder="Hostel block, room / house no, street" maxlength="200"></div>
        <div class="grid c2">
          <div class="field"><label>Area</label><input value="${esc(draft.area === 'Pickup' ? 'Collect at kiosk · no delivery' : draft.area || 'Vapi')}" disabled></div>
          <div class="field"><label for="ll">Landmark</label><input id="ll" name="landmark" placeholder="Near…" maxlength="100"></div>
        </div>
        ${draft.area === 'Pickup' ? '<p class="field-hint">You will collect this order at the kiosk. No rider will deliver it.</p>' : deliveryPicker(draft.area, draft.contact?.deliveryPoint)}
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
    title: state === 'ready' ? 'Collect your prints' : 'Pickup link',
    body: `
    <section class="pub-wrap" style="max-width:560px">
      <span class="pill rv">Kiosk pickup</span>
      <h1 class="display rv" style="font-size:clamp(2rem,6vw,3.2rem);margin-top:16px">${state === 'ready' ? 'Prints in hand?<br><em>One tap.</em>' : 'Link <em>expired.</em>'}</h1>
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
      <p class="muted rv" style="margin-top:12px">Place print and delivery orders 24/7 across Vapi and Daman. Selected colleges in Sarigam and Bhilad are covered after confirmation by phone.</p></div>
      ${stepsHtml()}
      <div class="grid c3" style="margin-top:16px">
        <article class="card rv"><h3>Choose the exact pages</h3><p class="muted" style="margin-top:8px;font-size:14px">Preview your PDF, select pages and copies, then see the print price before you pay.</p></article>
        <article class="card rv"><h3>Vapi, all day and night</h3><p class="muted" style="margin-top:8px;font-size:14px">Order prints and local delivery 24/7 across Vapi. Midnight deadlines don’t have to wait for shops to open.</p></article>
        <article class="card rv"><h3>Local delivery</h3><p class="muted" style="margin-top:8px;font-size:14px">Enter your delivery location and see the current fee before payment. Vapi kiosks are planned for future pickup.</p></article>
      </div>
      <div style="text-align:center;margin:32px 0"><a class="ihb rv" href="/order"><span class="ihb-row"><span class="ihb-dot"></span><span class="ihb-t1">Try it now</span></span><span class="ihb-t2" aria-hidden="true"><span>Try it now</span><svg class="ihb-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span></a></div>`)
  });
}

export function aboutPage() {
  return shell({
    active: '/about',
    title: 'About PrintKarr',
    body: pageWrap(`<div style="max-width:48rem;margin:0 auto">
      <span class="pill rv">About PrintKarr</span>
      <h1 class="display story-title">Paper shouldn’t<br><em>have closing hours.</em></h1><blockquote class="display rv" style="font-size:clamp(1.5rem,4vw,2.4rem);margin-top:24px;line-height:1.3">“If groceries can reach us in minutes, why is printing still stuck behind a shutter at 9 pm? PrintKarr is our answer.”</blockquote>
      <p class="rv" style="margin-top:12px;font-size:14px;font-weight:700;color:var(--primary)">— Anirudh Verma, Founder</p>
      <div class="muted rv" style="margin-top:32px;display:flex;flex-direction:column;gap:16px;font-size:16px;line-height:1.7">
        <p>We started in Vapi, Gujarat, because an assignment, admit card, or business brochure cannot always wait until a shop opens. PrintKarr takes print delivery orders across Vapi and Daman 24/7, including after midnight.</p>
        <p>Upload a PDF, choose your pages, and see the total before paying. Delivery covers Vapi and Daman, plus selected colleges in Sarigam and Bhilad. Our first Vapi kiosk is planned; its pickup location will be announced after launch.</p>
      </div>
      <div class="grid c2" style="margin-top:32px">
        <article class="card rv" style="background:var(--pale)"><h2>Our mission</h2><p class="muted" style="margin-top:8px;font-size:14px">Make printing accessible when and where people need it: 24/7 delivery now and convenient Vapi kiosks after launch.</p></article>
        <article class="card ink rv"><h2>Our vision</h2><p style="margin-top:8px;font-size:14px;opacity:.75">Start with our Vapi pilot, then build a trusted print network across India—so students, families, and businesses can get important paper without losing time searching for an open shop.</p></article>
      </div></div>`)
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
      <div style="max-width:48rem;margin:0 auto;text-align:center"><span class="pill rv">Franchise &amp; Partnerships</span>
      <h1 class="display rv" style="font-size:clamp(2rem,5vw,3.4rem);margin-top:16px">A small footprint.<br>A big opportunity.</h1>
      <p class="muted rv" style="margin-top:12px">Passive or active income through automated instant printing, backed by a fully managed stack.</p></div>
      <div class="grid c3" style="margin-top:32px">${models.map((m) => `<article class="card rv"><h2 style="font-size:20px">${m.t}</h2><p class="muted" style="margin-top:8px;font-size:14px">${m.d}</p><p class="eyebrow" style="margin-top:16px">Your role</p><ul style="margin-top:8px;font-size:14px;padding-left:18px">${m.you.map((x) => `<li>${x}</li>`).join('')}</ul><p class="eyebrow" style="margin-top:12px">Our role</p><ul style="margin-top:8px;font-size:14px;padding-left:18px">${m.us.map((x) => `<li>${x}</li>`).join('')}</ul><p class="muted" style="margin-top:16px;font-size:12px">Best for: ${m.who}</p></article>`).join('')}</div>
      <div class="grid c2" style="margin-top:16px">
        <article class="card ink rv"><p class="eyebrow" style="color:var(--blue-bright)">PrintKarr PRO</p><h3 class="display" style="font-size:2rem;margin-top:8px">₹1,29,000 + GST</h3><p style="opacity:.7;font-size:14px;margin-top:8px">High-footfall locations · 1,950-sheet capacity</p></article>
        <article class="card rv"><p class="eyebrow">PrintKarr MINI</p><h3 class="display" style="font-size:2rem;margin-top:8px">₹69,000 + GST</h3><p class="muted" style="font-size:14px;margin-top:8px">Low / medium footfall · 650-sheet capacity</p></article>
      </div>
      <div class="card rv" style="margin-top:16px"><h2 class="display" style="font-size:1.5rem">Apply to partner</h2>
        <form method="POST" action="/contact" style="margin-top:16px"><div class="grid c2"><div class="field"><label for="field-name">Name</label><input id="field-name" name="name" required></div><div class="field"><label for="field-phone">Phone</label><input id="field-phone" name="phone" required></div></div><div class="field"><label for="field-email">Email</label><input id="field-email" name="email" type="email" required></div><div class="field"><label for="field-city">City / campus</label><input id="field-city" name="city"></div><button class="btn loud" type="submit"><span>Submit →</span></button></form></div>`)
  });
}

export function xeroxPage() {
  return shell({
    path: '/xerox',
    title: 'Xerox shops — the modern way',
    body: pageWrap(`
      <div style="max-width:48rem;margin:0 auto;text-align:center"><span class="pill rv">Xerox shops</span>
      <h1 class="display rv" style="font-size:clamp(2rem,5vw,3.4rem);margin-top:16px">Your print shop.<br>Ready for what’s next.</h1>
      <p class="muted rv" style="margin-top:12px">Customers pick you, upload, and pay online. You unlock the job with an OTP — no file on your desktop.</p></div>
      <div class="grid c3" style="margin-top:32px">
        <article class="card rv"><h3>Track orders &amp; earnings</h3><p class="muted" style="margin-top:8px;font-size:14px">Prints, popular jobs, payouts in one dashboard.</p></article>
        <article class="card rv"><h3>Zero rework</h3><p class="muted" style="margin-top:8px;font-size:14px">Colour, pages, copies set by the customer before they pay.</p></article>
        <article class="card rv"><h3>Any printer</h3><p class="muted" style="margin-top:8px;font-size:14px">Every brand you own is supported. We sit on top, not instead.</p></article>
      </div>
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
        <li>📞 <a href="tel:+919016703180">${PHONE}</a> · <a href="https://wa.me/919016703180">WhatsApp</a><br><span class="muted">Print delivery: 24 hours, every day</span></li>
        <li>✉️ <a class="rowlink" href="mailto:${EMAIL}">${EMAIL}</a></li>
        <li>◍ PrintKarr Technologies Private Limited<br><span class="muted">Based in Vapi, Gujarat. Delivery across Vapi and Daman; selected colleges in Sarigam and Bhilad. Kiosk locations will be announced after launch.</span></li>
      </ul></div>
      <form class="card rv" method="POST" action="/contact">
        ${sent ? `<p class="pill" style="margin-bottom:12px">✓ Received. We’ll reply within one business day.</p>` : ''}
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
  { slug: 'prepare-documents-for-printing-vapi', title: 'How to prepare a PDF for printing in Vapi', excerpt: 'A practical checklist for assignments, resumes and everyday documents before you order print delivery.', body: ['Export your document as a PDF to keep fonts, spacing and page breaks consistent. Open that PDF once on your phone and check every page, including the cover and any blank pages.', 'Choose only the pages you need. PDF page numbers can differ from the page numbers printed inside an assignment: count the cover as the first PDF page when reviewing your selection.', 'Use black-and-white for text when colour is unnecessary. Choose colour for diagrams that depend on colour to be understood. Confirm whether your college or office requires single-sided pages before selecting double-sided printing.', 'Check names, roll numbers, signatures and margins before uploading. Keep small text readable and avoid screenshots of text when you have the original document.', 'PrintKarr delivers across Vapi and Daman, 24/7. Selected colleges in Sarigam and Bhilad are covered: call or WhatsApp 9016703180 to confirm your campus. Review print settings, delivery details and the final price before payment; confirm the delivery timing when a deadline matters.'] },
  { slug: 'admit-card-printing-checklist', title: 'Admit card printing: a checklist before exam day', excerpt: 'Check the exam instructions, page size and legibility before ordering an admit card print in Vapi.', body: ['Download the admit card from the issuing authority and read its printing instructions. Requirements for colour, paper size, photographs and signatures vary by exam; those instructions take priority.', 'Preview all pages. Check that your name, exam centre, reporting time, photograph and any barcode or QR code are clear. Do not crop away instructions or resize a code until it becomes unreadable.', 'Choose the required pages and number of copies. If the authority asks for a colour or single-sided print, select those settings explicitly. Keep the original PDF available until you have checked the delivered print.', 'Order ahead of your reporting time. PrintKarr offers 24/7 delivery across Vapi and Daman, but delivery duration depends on the order and location. Call or WhatsApp 9016703180 to confirm timing for urgent requests.', 'After delivery, inspect the print against the PDF and carry any identity documents required by the exam authority. Printing a document does not establish its validity or guarantee admission.'] },
  { slug: 'running-a-printkarr-kiosk', title: 'What it actually costs to run a PrintKarr kiosk every month', excerpt: 'Four square feet, a socket, and a predictable stack of paper.', body: ['A PrintKarr kiosk needs just four square feet. College corridors, lobbies, libraries are all fair game.', 'Space typically ₹1,500–₹2,000/month. Electricity under ₹750. Internet under ₹600. Paper and ink scale with volume. Platform commission 10% — only when the machine earns.'] },
  { slug: 'replacing-xerox-queues', title: 'Why self-service printing is replacing the xerox queue', excerpt: 'The shop didn’t vanish. The waiting did.', body: ['Traditional counters still matter for binding and photos. They fail at 11.40 pm: a PDF, on paper, now.', 'Encrypted upload, prepaid settings, OTP collect. The file is never a USB, never a WhatsApp folder.'] },
  { slug: 'colleges-24-7-print', title: 'How campuses install 24/7 print without a night shift', excerpt: 'Hostels don’t close. Assignments don’t wait.', body: ['A hosted machine sits in a corridor with CCTV and power. Students scan, pay, collect. No attendant.', 'Administrators like the audit trail. Students like that it works on Sunday.'] },
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
    article: true,
    desc: post.excerpt,
    title: post.title,
    body: `<article style="max-width:42rem;margin:0 auto;padding:110px 16px 60px"><a class="rowlink" href="/blogs">← Journal</a><h1 class="display" style="font-size:clamp(1.8rem,4vw,2.6rem);margin-top:16px">${esc(post.title)}</h1><p class="muted" style="margin-top:12px">${esc(post.excerpt)}</p><div style="margin-top:24px;display:flex;flex-direction:column;gap:16px;line-height:1.7">${post.body.map((p) => `<p>${esc(p)}</p>`).join('')}</div><p style="margin-top:24px">By the PrintKarr team · <a href="/printing-in-vapi">Printing and delivery in Vapi</a> · <a href="/contact">Contact us</a></p></article>`
  });
}

export function termsPage() {
  return shell({
    path: '/terms',
    title: 'Terms & Conditions',
    body: `<article style="max-width:42rem;margin:0 auto;padding:110px 16px 60px;font-size:14px;line-height:1.7;color:var(--muted)"><h1 class="display" style="color:var(--ink);font-size:2.4rem">Terms &amp; Conditions</h1><p style="margin-top:24px">PrintKarr kiosks and the companion web flow are provided by PrintKarr Technologies Private Limited. By scanning a kiosk QR, uploading a document, or applying as a partner, you agree to these terms.</p><h2 class="display" style="color:var(--ink);font-size:1.3rem;margin-top:32px">Print jobs</h2><p>You confirm you have the right to print the file you upload. Jobs are encrypted, processed to complete the print, and deleted afterwards.</p><h2 class="display" style="color:var(--ink);font-size:1.3rem;margin-top:24px">Payments &amp; refunds</h2><p>Print fees are prepaid. Hardware misfires are refunded after a kiosk health check.</p></article>`
  });
}

export function privacyPage() {
  return shell({
    path: '/privacy',
    title: 'Privacy Policy',
    body: `<article style="max-width:42rem;margin:0 auto;padding:110px 16px 60px;font-size:14px;line-height:1.7;color:var(--muted)"><h1 class="display" style="color:var(--ink);font-size:2.4rem">Privacy Policy</h1><p style="margin-top:24px">We collect the minimum needed: file bytes for the life of the job, contact details if you submit a form, payment tokens handled by our processor.</p><h2 class="display" style="color:var(--ink);font-size:1.3rem;margin-top:32px">Documents</h2><p>Uploaded files are encrypted, never written to shop desktops, and deleted after print or expiry.</p><h2 class="display" style="color:var(--ink);font-size:1.3rem;margin-top:24px">Contact</h2><p>Privacy questions: ${EMAIL}.</p></article>`
  });
}

export function vapiPage() {
  return shell({ path: '/printing-in-vapi', body: pageWrap(`
    <article style="max-width:52rem;margin:auto;line-height:1.7">
      <p class="eyebrow">PRINTKARR · LOCAL DOCUMENT PRINTING</p>
      <h1 class="display">Printing in Vapi, delivered 24/7</h1>
      <p>Looking for a printing shop in Vapi? PrintKarr lets you order document prints online and have them delivered. Upload your file, choose the pages and settings, and review the price before you pay.</p>
      <p><a class="btn loud" href="/order">Upload &amp; print →</a> <a class="rowlink" href="https://wa.me/919016703180">WhatsApp 9016703180</a></p>
      <h2>What can you print?</h2>
      <p>Order black-and-white or colour document prints for college assignments, project reports, resumes, office documents, forms, tickets and admit cards. Select your page range and copies in the order flow. Follow your college, employer or exam authority’s requirements for paper and print settings.</p>
      <h2>Delivery areas and hours</h2>
      <ul><li><strong>Vapi:</strong> delivery across the city, 24 hours a day, seven days a week.</li><li><strong>Daman:</strong> delivery across Daman, 24/7.</li><li><strong>Sarigam and Bhilad:</strong> selected colleges only. Call or WhatsApp to confirm your college and delivery arrangements.</li></ul>
      <p>Enter your delivery location when ordering and review the fee. For a deadline or an address the checkout cannot accept, call <a href="tel:+919016703180">+91 90167 03180</a> before paying. Being open 24/7 does not mean every order has an immediate delivery time.</p>
      <h2>How much does printing cost?</h2>
      <p>The current price depends on your selected pages, copies and print settings. The order flow shows printing, delivery and applicable fees before payment. <a href="/order">Upload your document to see your quote</a>.</p>
      <h2>Are PrintKarr kiosks open in Vapi?</h2>
      <p>Our first kiosk is planned in Vapi, followed by additional locations in Vapi. No public kiosk pickup address has been announced yet. Please use delivery or contact us for launch updates.</p>
      <h2>How do I order?</h2>
      <ol><li>Upload your document and check its page count.</li><li>Select the pages, copies and print settings you need.</li><li>Add your delivery location and review the total.</li><li>Complete checkout and follow your order in your customer account.</li></ol>
      <h2>Before you print</h2>
      <p>Check fonts, margins, cover pages and diagrams in the final PDF. Read our <a href="/blogs/prepare-documents-for-printing-vapi">document preparation guide</a> and <a href="/blogs/admit-card-printing-checklist">admit card checklist</a>.</p>
      <h2>Need help with a local order?</h2>
      <p><a href="tel:+919016703180">Call 9016703180</a>, <a href="https://wa.me/919016703180">message us on WhatsApp</a> or <a href="/contact">contact PrintKarr</a> to confirm college coverage, urgent delivery timing or kiosk partnership enquiries.</p>
    </article>`) });
}
