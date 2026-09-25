// Public printing flow and marketing pages — PrintKarr print studio.
// No login walls before price. Auth happens once, at OTP time.
import { esc, ASSET_V, pkPublicHeader, pkPublicFooter, DELIVERY_MAP_HEAD, deliveryPicker } from './views.js';

const rs = (n) => '₹' + (Math.round(n * 100) / 100);
const PHONE = '+91 90167 03180';
const EMAIL = 'team@printkarr.in';

const topNav = pkPublicHeader;

function shell({ title, body, desc, active, extraHead }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)} — PrintKarr</title>
<meta name="description" content="${esc(desc || "PrintKarr — 24/7 printing and delivery across Vapi and Daman, with print delivery available across India. Scan, upload, and choose how your pages reach you.")}">
<meta name="theme-color" content="#1557ff">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="/design.css?v=${ASSET_V}">
<link rel="stylesheet" href="/customer.css?v=${ASSET_V}">
${extraHead || ''}
</head>
<body><div class="pk-page">
${topNav(active)}
<a href="#main" style="position:absolute;left:-9999px" onfocus="this.style.left='16px';this.style.top='16px';this.style.zIndex=99;this.style.background='var(--navy)';this.style.color='#fff';this.style.padding='8px 16px';this.style.borderRadius='99px'" onblur="this.style.left='-9999px'">Skip to content</a>
<main id="main">${body}</main>
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
    { n: '01', t: 'Scan the Kiosk QR', d: 'Each PrintKarr machine has its own unique QR — scan it with your mobile camera.', tag: 'Scan with camera' },
    { n: '02', t: 'Upload the right PDF', d: 'Choose an assignment, admit card, ticket, form, or work document from your phone.', tag: 'Your document' },
    { n: '03', t: 'Choose exactly what prints', d: 'Select pages, copies, colour, and single or double-sided. Review the price before paying.', tag: 'Clear price first' },
    { n: '04', t: 'Pick up or get it delivered', d: 'Collect securely with your OTP at a kiosk, or choose a delivery option available for your area.', tag: 'Pickup · delivery' },
  ];
  const pictures = ['step-1-qr.jpg', 'step-2-upload.jpg', 'step-3-settings.jpg', 'step-4-collect.jpg'];
  const rows = steps.map((s, i) => `<details class="pk-feed-row rv" name="print-guide" ${i === 0 ? 'open' : ''}><summary><span class="pk-feed-ic">${s.n}</span><b>${s.t}</b><span class="step-toggle" aria-hidden="true">↗</span></summary><div class="step-detail"><img src="/images/${pictures[i]}" alt="${s.t}" loading="lazy"><p>${s.d}</p><span class="tag">${s.tag}</span></div></details>`).join('');
  return `<div class="pk-feed">${rows}</div>`;
}

function hostBannerHtml() {
  return `<section class="pk-host rv"><div class="txt"><p class="eyebrow">CAMPUSES · HOSTELS · OFFICES · SHOPS</p><h2 class="display">Put printing<br>where people are.</h2><p class="sub">Have a space in Vapi? Host a PrintKarr kiosk.</p><a class="ihb" style="margin-top:24px" href="/contact"><span class="ihb-row"><span class="ihb-dot"></span><span class="ihb-t1">Talk to us</span></span><span class="ihb-t2" aria-hidden="true"><span>Talk to us</span><svg class="ihb-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span></a></div><div class="img"><img src="/images/host-cta.jpg" alt="Student requesting a print from her phone" loading="lazy"></div></section>`;
}

export function landing({ pricing }) {
  const minRate = Math.min(pricing.bw, pricing.studentBw);
  return shell({ active: '/', title: 'Print now. Anywhere in Vapi.', body: `
    <div class="marketing-wrap home-v2">
      <section class="studio-hero">
        <div class="hero-copy">
          <p class="eyebrow"><span class="status-dot"></span> CHALA, VAPI · GUJARAT 396191</p>
          <h1>Need it<br><em>on paper?</em><span class="headline-star" aria-hidden="true">✳</span></h1>
          <p class="hero-description">Upload now. Print 24/7. Get it delivered across Vapi, even after midnight.</p>
          <div class="hero-actions"><a class="btn loud big" href="/order">Start printing <span aria-hidden="true">↗</span></a><a class="text-link" href="/how-it-works">How it works →</a></div>
          <div class="hero-proof"><span><b>${rs(minRate)}</b> / page onwards</span><span>Full price shown before payment</span></div>
        </div>
        <div class="hero-art" data-print-demo>
          <span class="art-label">YOUR PRINT POINT IN VAPI</span>
          <div class="art-circle" aria-hidden="true"></div>
          <img src="/images/kiosk-hero.png" alt="PrintKarr self-service printing kiosk" fetchpriority="high" class="studio-kiosk">
          <div class="paper-note"><span class="eyebrow">OPEN WHEN YOU NEED IT</span><b>24 / 7<br>VAPI</b><span class="note-line"></span><span class="paper-check" aria-hidden="true">↗</span></div>
          <button type="button" class="art-sticker demo-trigger">Try a little print <span aria-hidden="true">↗</span></button><div class="demo-sheet" aria-hidden="true"><span>PRINTKARR / SAMPLE 001</span><b>HELLO,<br>PAPER.</b><i>Big ideas start here.</i><div class="sheet-bars"></div></div><p class="demo-status" role="status">Tap to see the kiosk in action. Just a demo!</p>
          <span class="art-caption">SCAN → UPLOAD → PRINT → GO</span>
        </div>
      </section>
      <div class="home-ticker" aria-label="PrintKarr services"><span>OPEN 24 / 7</span><span>VAPI + DAMAN DELIVERY</span><span>KIOSK PICKUP</span><span>INDIA-WIDE SHIPPING</span></div>
      <section class="home-section" id="what-we-print"><div class="home-section-head"><p class="eyebrow">01 / MADE FOR YOUR DEADLINE</p><h2>Whatever needs<br><em>printing, prints.</em></h2></div><div class="home-use-grid">
        <a class="home-use home-use-student rv" href="/order"><span class="home-use-num">01 / STUDENTS</span><strong>Deadline<br>tonight?</strong><span class="home-use-detail">Assignments · notes · admit cards</span><span class="home-use-arrow" aria-hidden="true">↗</span></a>
        <a class="home-use home-use-everyday rv" href="/order"><span class="home-use-num">02 / EVERYDAY</span><strong>Need the<br>paper copy?</strong><span class="home-use-detail">Tickets · forms · important documents</span><span class="home-use-arrow" aria-hidden="true">↗</span></a>
        <a class="home-use home-use-business rv" href="/order"><span class="home-use-num">03 / BUSINESS</span><strong>Make it<br>look real.</strong><span class="home-use-detail">Brochures · pamphlets · handouts</span><span class="home-use-arrow" aria-hidden="true">↗</span></a>
      </div></section>
      <section class="home-section"><div class="home-section-head"><p class="eyebrow">02 / FROM FILE TO FINISHED</p><h2>Four moves. <em>Done.</em></h2></div><ol class="home-steps"><li><span>01</span><b>Scan or start online</b></li><li><span>02</span><b>Upload a PDF</b></li><li><span>03</span><b>Choose pages &amp; pay</b></li><li><span>04</span><b>Collect or get delivery</b></li></ol><a class="text-link" href="/how-it-works">See how it works →</a></section>
      <section class="home-section"><div class="home-section-head"><p class="eyebrow">SEMESTER PACKS · SAVE VS MARKET</p><h2>College bundle.<br><em>Pay ₹199, print all term.</em></h2><p class="muted" style="margin-top:8px;max-width:56ch">₹329 → 130 B&W + 10 color + 2 files (market ₹470) · ₹499 → 250 B&W + 15 color + 4 files (market ₹800) · ₹725 → 400 B&W + 20 color + 5 files (market ₹1000). Secure with ₹199, pay the rest in installments. Quota + balance live on your dashboard.</p></div><div class="home-use-grid">
        <a class="home-use rv" href="/login"><span class="home-use-num">₹329 · SAVE ₹141</span><strong>130 + 10<br>sides + files</strong><span class="home-use-detail">2 free files · market ₹470</span><span class="home-use-arrow" aria-hidden="true">↗</span></a>
        <a class="home-use rv" href="/login"><span class="home-use-num">₹499 · SAVE ₹301</span><strong>250 + 15<br>sides + files</strong><span class="home-use-detail">4 free files · market ₹800</span><span class="home-use-arrow" aria-hidden="true">↗</span></a>
        <a class="home-use rv" href="/login"><span class="home-use-num">₹725 · SAVE ₹275</span><strong>400 + 20<br>sides + files</strong><span class="home-use-detail">5 free files · market ₹1000</span><span class="home-use-arrow" aria-hidden="true">↗</span></a>
      </div><a class="text-link" href="/login">Secure a pack with ₹199 →</a></section>
      <section class="home-route"><div class="home-route-heading"><p class="eyebrow">03 / CHOOSE YOUR ROUTE</p><h2>Printed here.<br><em>Where you need it.</em></h2></div><div class="home-route-list">
        <a href="/order"><span class="route-index">01</span><span><b>Pick up at a kiosk</b><small>Scan, pay, collect with your OTP.</small></span><span aria-hidden="true">↗</span></a>
        <a href="/order"><span class="route-index">02</span><span><b>Delivered across Vapi &amp; Daman</b><small>Distance-based delivery from ₹10, capped at ₹60 before night or demand fees.</small></span><span aria-hidden="true">↗</span></a>
        <a href="/contact"><span class="route-index">03</span><span><b>Sent across India</b><small>Ask us about print delivery. ₹45–₹90 by distance.</small></span><span aria-hidden="true">↗</span></a>
      </div></section>
      <section class="home-origin"><div><p class="eyebrow">FROM CHALA, VAPI · 396191</p><h2>Start local.<br><em>Print everywhere.</em></h2></div><div><p>Our mission is simple: make essential printing available when people actually need it. We’re starting in Vapi and building a network of kiosks and delivery for the rest of India.</p><a class="text-link" href="/about">Meet PrintKarr →</a></div></section>
      ${hostBannerHtml()}
    </div>` });
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
      <h1 class="display rv" style="font-size:clamp(2rem,6vw,3.6rem);margin-top:16px">Your next print<br><em>starts here.</em></h1>
      ${error ? `<p class="login-err rv" role="alert" style="margin-top:14px">${esc(error)}</p>` : ''}
      ${d ? `
      <div class="card rv filechip" style="background:var(--pale)"><b>📄 ${esc(d.document)}</b><span class="muted" style="font-size:12px">${d.pages} pages detected · <a class="rowlink" href="/order">different file?</a></span></div>
      <form method="POST" action="/order/options">
        <input type="hidden" name="draft" value="${d.id}">
        <div class="card rv">
          <div class="grid c2">
            <div class="field"><label>Print</label><div class="chips" id="f-type">
              <label class="chip-pick"><input type="radio" name="printType" value="bw" checked> B&W ₹${pricing.bw}</label>
              <label class="chip-pick"><input type="radio" name="printType" value="color"> Color ₹${pricing.color}</label></div></div>
            <div class="field"><label>Sides</label><div class="chips" id="f-sides">
              <label class="chip-pick"><input type="radio" name="sides" value="single"> Single</label>
              <label class="chip-pick"><input type="radio" name="sides" value="double" checked> Double</label></div></div>
          </div>
          <div class="grid c2">
            <div class="field"><label>Copies</label>
              <div class="stepper"><button type="button" id="cMinus" aria-label="Decrease copies">−</button><input id="copies" aria-label="Number of copies" name="copies" type="number" value="1" min="1" max="200" readonly><button type="button" id="cPlus" aria-label="Increase copies">+</button></div></div>
            <div class="field"><label for="range">Pages</label><input id="range" name="range" autocomplete="off" placeholder="e.g. 1-5, 8, 10-12" aria-describedby="range-hint"><p class="field-hint" id="range-hint">Choose exactly what prints: single pages (<b>8</b>) or ranges (<b>1-5</b>), separated by commas — e.g. <b>1-5, 8, 10-12</b>. Leave empty to print all ${d.pages} pages.<span class="err" id="range-err"></span></p></div>
          </div>
          <div class="field"><label>How will you get your prints?</label><div class="chips" id="f-area">
            <label class="chip-pick"><input type="radio" name="area" value="Sarigam"> Sarigam</label>
            <label class="chip-pick"><input type="radio" name="area" value="Vapi" checked> Vapi</label>
            <label class="chip-pick"><input type="radio" name="area" value="Bhilad"> Bhilad</label>
            <label class="chip-pick"><input type="radio" name="area" value="Daman"> Daman</label>
            <label class="chip-pick"><input type="radio" name="area" value="Pickup"> Collect at kiosk · no delivery</label></div></div>
          <div class="field"><label>When</label><div class="chips" id="f-slot">
            <label class="chip-pick"><input type="radio" name="slot" value="ASAP" checked> ASAP</label>
            <label class="chip-pick"><input type="radio" name="slot" value="Evening"> This evening</label>
            <label class="chip-pick"><input type="radio" name="slot" value="Morning"> Tomorrow morning</label></div></div>
        </div>
        <div class="livetotal rv" id="liveTotal"><span>Estimate · final delivery fee after you pin your address</span><b>₹–</b></div>
        <p class="field-hint">Delivery rises with distance and is capped at ₹60 before any night or high-demand fee. Your exact total appears before payment.</p>
        <button class="btn loud big rv" type="submit" style="width:100%;margin:12px 0 40px"><span>Continue →</span></button>
      </form>
      <script>
      window.PK = ${cfg};
      (function(){
        var pages = ${d.pages};
        function val(name){ var el = document.querySelector('input[name="'+name+'"]:checked'); return el ? el.value : null; }
        function effPages(){
          var inp = document.getElementById('range');
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
          if (el) el.textContent = '₹' + total.toLocaleString('en-IN');
          var sub2 = document.querySelector('#liveTotal span');
          if (sub2) sub2.textContent = ep + ' pages × ' + copies + ' · ' + (type === 'bw' ? 'B&W' : 'Color') + (area === 'pickup' ? ' · kiosk collection' : ' · delivery from ₹' + del) + (late ? ' · late-night +₹' + late : '') + (surge ? ' · high-demand +₹' + surge : '');
        }
        document.getElementById('cMinus').addEventListener('click', function(){ var i = document.getElementById('copies'); i.value = Math.max(1, (parseInt(i.value, 10) || 1) - 1); upd(); });
        document.getElementById('cPlus').addEventListener('click', function(){ var i = document.getElementById('copies'); i.value = Math.min(200, (parseInt(i.value, 10) || 1) + 1); upd(); });
        document.querySelectorAll('#f-type input, #f-sides input, #f-area input').forEach(function(i){ i.addEventListener('change', upd); });
        document.getElementById('range').addEventListener('input', upd);
        upd();
      })();
      </script>`
      : `
      <form class="rv" method="POST" action="/order/upload" enctype="multipart/form-data" style="margin-top:18px">
        <label class="drop" for="doc"><span class="drop-arrow">↑</span><b>Choose a PDF to print</b><span class="muted">Up to ${maxMb || 20} MB · price appears instantly</span></label>
        <input id="doc" name="doc" type="file" accept="application/pdf,.pdf" required class="file-input">
        <p class="muted" id="fname" style="font-size:12px;margin:10px 0"></p>
        <button class="btn loud big" type="submit" style="width:100%"><span>Upload & see my price →</span></button>
      </form>
      <script>document.getElementById('doc').addEventListener('change', function(e){ var f = e.target.files[0]; document.getElementById('fname').textContent = f ? '📄 ' + f.name : ''; if (f) e.target.form.submit(); });</script>`}
    </section>`
  });
}

export function phonePage({ draft, error }) {
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
        <button class="btn loud big" type="submit" style="width:100%"><span>Email me the code →</span></button>
      </form>
      <script>(function(){var f=document.querySelector('form[action="/order/otp-request"]');if(!f||f.dataset.spin)return;f.dataset.spin='1';f.addEventListener('submit',function(e){if(e.defaultPrevented)return;var b=f.querySelector('button[type="submit"]');if(b&&!b.disabled){b.setAttribute('disabled','true');var t=b.querySelector('span');if(t)t.textContent='Sending…';}});})();</script>
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
      <p class="muted rv" style="margin-top:12px">In Vapi, place print and delivery orders 24/7—including midnight assignments or an admit card you need by morning. For locations beyond the pilot, request our all-India print delivery.</p></div>
      ${stepsHtml()}
      <div class="grid c3" style="margin-top:16px">
        <article class="card rv"><h3>Choose the exact pages</h3><p class="muted" style="margin-top:8px;font-size:14px">Preview your PDF, select pages and copies, then see the print price before you pay.</p></article>
        <article class="card rv"><h3>Vapi, all day and night</h3><p class="muted" style="margin-top:8px;font-size:14px">Order prints and local delivery 24/7 across Vapi. Midnight deadlines don’t have to wait for shops to open.</p></article>
        <article class="card rv"><h3>From your kiosk to all India</h3><p class="muted" style="margin-top:8px;font-size:14px">Collect with an OTP, request hyperlocal delivery in Vapi, or arrange all-India print delivery from ₹45–₹90 by distance.</p></article>
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
        <p>We started in Chala, Vapi, Gujarat 396191, because an assignment, admit card, or business brochure cannot always wait until a shop opens. PrintKarr takes print and Vapi delivery orders 24/7, including after midnight.</p>
        <p>Upload a PDF, choose your pages, and see the total before paying. Collect at a kiosk, get delivery across Vapi, or ask us about sending prints across India.</p>
      </div>
      <div class="grid c2" style="margin-top:32px">
        <article class="card rv" style="background:var(--pale)"><h2>Our mission</h2><p class="muted" style="margin-top:8px;font-size:14px">Make printing accessible when and where people need it: 24/7 in Vapi, convenient kiosks for urgent local jobs, and delivery when a kiosk is out of reach.</p></article>
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
        <li>📞 <b>${PHONE}</b><br><span class="muted">Mon–Fri · 24 hours</span></li>
        <li>✉️ <a class="rowlink" href="mailto:${EMAIL}">${EMAIL}</a></li>
        <li>◍ PrintKarr Technologies Private Limited<br><span class="muted">Chala, Vapi, Gujarat 396191</span></li>
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
    title: post.title,
    body: `<article style="max-width:42rem;margin:0 auto;padding:110px 16px 60px"><a class="rowlink" href="/blogs">← Journal</a><h1 class="display" style="font-size:clamp(1.8rem,4vw,2.6rem);margin-top:16px">${esc(post.title)}</h1><p class="muted" style="margin-top:12px">${esc(post.excerpt)}</p><div style="margin-top:24px;display:flex;flex-direction:column;gap:16px;line-height:1.7">${post.body.map((p) => `<p>${esc(p)}</p>`).join('')}</div></article>`
  });
}

export function termsPage() {
  return shell({
    title: 'Terms & Conditions',
    body: `<article style="max-width:42rem;margin:0 auto;padding:110px 16px 60px;font-size:14px;line-height:1.7;color:var(--muted)"><h1 class="display" style="color:var(--ink);font-size:2.4rem">Terms &amp; Conditions</h1><p style="margin-top:24px">PrintKarr kiosks and the companion web flow are provided by PrintKarr Technologies Private Limited. By scanning a kiosk QR, uploading a document, or applying as a partner, you agree to these terms.</p><h2 class="display" style="color:var(--ink);font-size:1.3rem;margin-top:32px">Print jobs</h2><p>You confirm you have the right to print the file you upload. Jobs are encrypted, processed to complete the print, and deleted afterwards.</p><h2 class="display" style="color:var(--ink);font-size:1.3rem;margin-top:24px">Payments &amp; refunds</h2><p>Print fees are prepaid. Hardware misfires are refunded after a kiosk health check.</p></article>`
  });
}

export function privacyPage() {
  return shell({
    title: 'Privacy Policy',
    body: `<article style="max-width:42rem;margin:0 auto;padding:110px 16px 60px;font-size:14px;line-height:1.7;color:var(--muted)"><h1 class="display" style="color:var(--ink);font-size:2.4rem">Privacy Policy</h1><p style="margin-top:24px">We collect the minimum needed: file bytes for the life of the job, contact details if you submit a form, payment tokens handled by our processor.</p><h2 class="display" style="color:var(--ink);font-size:1.3rem;margin-top:32px">Documents</h2><p>Uploaded files are encrypted, never written to shop desktops, and deleted after print or expiry.</p><h2 class="display" style="color:var(--ink);font-size:1.3rem;margin-top:24px">Contact</h2><p>Privacy questions: ${EMAIL}.</p></article>`
  });
}
