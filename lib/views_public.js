// Public printing flow and marketing pages — PrintKarr print studio.
// No login walls before price. Auth happens once, at OTP time.
import { esc, ASSET_V, pkPublicHeader, pkPublicFooter } from './views.js';

const rs = (n) => '₹' + (Math.round(n * 100) / 100);
const PHONE = '+91 90167 03180';
const EMAIL = 'team@printkarr.in';

const topNav = pkPublicHeader;

function shell({ title, body, desc, active }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)} — PrintKarr</title>
<meta name="description" content="${esc(desc || "PrintKarr — India's 24/7 self-service instant printing kiosk. Scan, upload, print in under 60 seconds.")}">
<meta name="theme-color" content="#1557ff">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="/design.css?v=${ASSET_V}">
<link rel="stylesheet" href="/customer.css?v=${ASSET_V}">
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
    { n: '02', t: 'Upload Your Document', d: 'Choose your file from phone, laptop, or Drive. No sign-up required.', tag: 'No sign-up' },
    { n: '03', t: 'Set Print Preference', d: 'Set copies, B&W or colour, duplex, and orientation before you pay.', tag: 'B&W · Colour · Duplex' },
    { n: '04', t: 'Get Your Print Instantly', d: 'Enter the 4-digit OTP or scan the dynamic QR to collect your print.', tag: '4-digit OTP' },
  ];
  const pictures = ['step-1-qr.jpg', 'step-2-upload.jpg', 'step-3-settings.jpg', 'step-4-collect.jpg'];
  const rows = steps.map((s, i) => `<details class="pk-feed-row rv" name="print-guide" ${i === 0 ? 'open' : ''}><summary><span class="pk-feed-ic">${s.n}</span><b>${s.t}</b><span class="step-toggle" aria-hidden="true">↗</span></summary><div class="step-detail"><img src="/images/${pictures[i]}" alt="${s.t}" loading="lazy"><p>${s.d}</p><span class="tag">${s.tag}</span></div></details>`).join('');
  return `<div class="pk-feed">${rows}</div>`;
}

function featuresHtml() {
  const cards = [
    ['01', 'Your documents. Your business.', 'Files are encrypted, never shared, and auto-deleted after printing. Only you can access them.'],
    ['02', 'Less waiting, more doing.', 'From scanning the kiosk QR to collecting your print — lightning-fast and seamless.'],
    ['03', 'For the last-minute moments.', 'Print even when shops are shut — early mornings, late nights, weekends, holidays.'],
    ['04', 'Your own little print desk.', 'No shop visits. No waiting in line. Print directly from your phone — anytime.'],
    ['05', 'Leave the USB at home.', 'No shared devices, no pen drives, no staff needed. Just scan, upload & print.'],
    ['06', 'For wherever life takes you.', 'Last-minute assignment, ticket, or ID proof? PrintKarr has your back.'],
  ];
  return `<div class="pk-features">${cards.map(([i, t, d]) => `<article class="pk-feature rv"><span class="fic">${i === '01' ? '⌁' : i === '02' ? '↗' : i === '03' ? '◷' : i === '04' ? '✳' : i === '05' ? '↥' : '✦'}</span><h3>${t}</h3><p>${d}</p></article>`).join('')}</div>`;
}

function hostBannerHtml() {
  return `<section class="pk-host rv"><div class="txt"><h2 class="display" style="font-size:clamp(1.6rem,3.5vw,2.4rem)">A little space.<br>A lot of possibility.</h2><p class="sub">Turn a corner of your campus or workplace into everyone’s favourite print spot. We’ll help you get started.</p><a class="ihb" style="margin-top:24px" href="/contact"><span class="ihb-row"><span class="ihb-dot"></span><span class="ihb-t1">Request Installation</span></span><span class="ihb-t2" aria-hidden="true"><span>Request Installation</span><svg class="ihb-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span></a></div><div class="img"><img src="/images/host-cta.jpg" alt="Student requesting a print from her phone" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block"></div></section>`;
}

export function landing({ pagesWeek, pricing, queueDepth }) {
  const minRate = Math.min(pricing.bw, pricing.studentBw);
  return shell({ active: '/', title: 'Big ideas. Fresh prints.', body: `
    <div class="marketing-wrap">
      <section class="studio-hero">
        <div class="hero-copy">
          <p class="eyebrow"><span class="status-dot"></span> YOUR NEIGHBOURHOOD PRINT KIOSK</p>
          <h1>Big ideas.<br><em>Fresh prints.</em><span class="headline-star" aria-hidden="true">✳</span></h1>
          <p class="hero-description">From “I need this printed” to paper in your hands. Upload your PDF, choose your finish, and collect at the kiosk. Easy as that.</p>
          <div class="hero-actions"><a class="btn loud big" href="/order">Let’s print something <span aria-hidden="true">↗</span></a><a class="text-link" href="/how-it-works">See how it works <span aria-hidden="true">→</span></a></div>
          <div class="hero-proof"><span><b>${rs(minRate)}</b> / page onwards</span><span>No app to download</span></div>
        </div>
        <div class="hero-art" data-print-demo>
          <span class="art-label">THE LITTLE KIOSK WITH BIG PRINT ENERGY</span>
          <div class="art-circle" aria-hidden="true"></div>
          <img src="/images/kiosk-hero.png" alt="PrintKarr self-service printing kiosk" fetchpriority="high" class="studio-kiosk">
          <div class="paper-note"><span class="eyebrow">THE PLAN</span><b>Upload.<br>Print.<br>Carry on.</b><span class="note-line"></span><span class="note-line short"></span><span class="paper-check" aria-hidden="true">↗</span></div>
          <button type="button" class="art-sticker demo-trigger">Try a little print <span aria-hidden="true">↗</span></button><div class="demo-sheet" aria-hidden="true"><span>PRINTKARR / SAMPLE 001</span><b>HELLO,<br>PAPER.</b><i>Big ideas start here.</i><div class="sheet-bars"></div></div><p class="demo-status" role="status">Tap to see the kiosk in action. Just a demo!</p>
          <span class="art-caption">SCAN → UPLOAD → PRINT → GO</span>
        </div>
      </section>
      <div class="service-strip"><span>Assignments &amp; notes</span><span>Tickets &amp; forms</span><span>Work &amp; big ideas</span><span>Black &amp; white or full colour</span></div>
      <section class="pk-section"><div class="section-heading"><div><p class="eyebrow">01 / FROM SCREEN TO SHEET</p><h2>A little upload.<br>A whole lot simpler.</h2></div><p class="sub">Your phone does the work.<br>The kiosk takes care of the paper.</p></div>${stepsHtml()}</section>
      <section class="pk-section"><div class="section-heading"><div><p class="eyebrow">02 / MADE FOR REAL LIFE</p><h2>Printing that fits<br>around your day.</h2></div><a class="text-link" href="/order">Start your print →</a></div>${featuresHtml()}</section>
      <section class="location-panel"><div><p class="eyebrow">A LOCAL START. A BIGGER IDEA.</p><h2>Hey Vapi,<br>meet your new<br><em>print spot.</em></h2><p>Our first kiosk brings self-service printing closer to your campus, your work, and your everyday.</p><a class="btn solid" href="/contact">Ask about our kiosk ↗</a></div><div class="location-stats"><span class="location-code">VAPI, GUJARAT / 01</span><div><b data-tick="${pagesWeek}">${pagesWeek}</b><span>pages printed this week</span></div><div><b>${queueDepth}</b><span>jobs currently in the queue</span></div><p>One city today. More possibilities tomorrow.</p></div></section>
      ${hostBannerHtml()}
      <section class="faq-section"><div><p class="eyebrow">BEFORE YOU HIT PRINT</p><h2>Good questions.<br>Simple answers.</h2></div><div><details><summary>Do I need to install an app?</summary><p>No. Open PrintKarr in your browser or scan the kiosk QR code. Upload your PDF to get started.</p></details><details><summary>Can I check the price before paying?</summary><p>Yes. Upload your PDF, choose pages, copies and colour, and see the total before confirming your order.</p></details><details><summary>What can I print?</summary><p>Upload a PDF for documents, notes, forms and tickets. Choose black and white or colour, with single or double-sided printing.</p></details><details><summary>Need a hand with an order?</summary><p><a href="/contact">Contact the PrintKarr team</a> with your order number and we’ll help you out.</p></details></div></section>
    </div>` });
}

export function orderPage({ draft, pricing, error, maxMb }) {
  const d = draft || null;
  const cfg = JSON.stringify({ bw: pricing.bw, color: pricing.color, fees: pricing.delivery, freeAbove: pricing.freeAbove });
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
          <div class="field"><label>Deliver to</label><div class="chips" id="f-area">
            <label class="chip-pick"><input type="radio" name="area" value="Pickup" checked> Pickup · FREE</label>
            <label class="chip-pick"><input type="radio" name="area" value="Sarigam"> Sarigam</label>
            <label class="chip-pick"><input type="radio" name="area" value="Vapi"> Vapi</label>
            <label class="chip-pick"><input type="radio" name="area" value="Bhilad"> Bhilad</label></div></div>
          <div class="field"><label>When</label><div class="chips" id="f-slot">
            <label class="chip-pick"><input type="radio" name="slot" value="ASAP" checked> ASAP</label>
            <label class="chip-pick"><input type="radio" name="slot" value="Evening"> This evening</label>
            <label class="chip-pick"><input type="radio" name="slot" value="Morning"> Tomorrow morning</label></div></div>
        </div>
        <div class="livetotal rv" id="liveTotal"><span>Live total</span><b>₹–</b></div>
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
          var fee = window.PK.fees[area] != null ? window.PK.fees[area] : 15;
          var del = sub >= window.PK.freeAbove ? 0 : fee;
          var el = document.querySelector('#liveTotal b');
          if (el) el.textContent = '₹' + Math.round(sub + del);
          var sub2 = document.querySelector('#liveTotal span');
          if (sub2) sub2.textContent = ep + ' pages × ' + copies + ' · ' + (type === 'bw' ? 'B&W' : 'Color') + (del === 0 ? ' · FREE delivery' : '');
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
          <div class="field"><label for="pp">Phone (optional, for pickup updates)</label><input id="pp" name="phone" inputmode="numeric" placeholder="98250 11111" maxlength="13"></div>
          <div class="field"><label for="pin">PIN</label><input id="pin" name="pin" required inputmode="numeric" placeholder="396155" maxlength="10"></div>
        </div>
        <div class="field"><label for="aa">Full address</label><input id="aa" name="address" required placeholder="Hostel block, room / house no, street" maxlength="200"></div>
        <div class="grid c2">
          <div class="field"><label>Area</label><input value="${esc(draft.area || 'Sarigam')}" disabled></div>
          <div class="field"><label for="ll">Landmark</label><input id="ll" name="landmark" placeholder="Near…" maxlength="100"></div>
        </div>
        <button class="btn loud big" type="submit" style="width:100%"><span>Email me the code →</span></button>
      </form>
      <script>(function(){var f=document.querySelector('form[action="/order/otp-request"]');if(!f||f.dataset.spin)return;f.dataset.spin='1';f.addEventListener('submit',function(){var b=f.querySelector('button[type="submit"]');if(b&&!b.disabled){b.setAttribute('disabled','true');var t=b.querySelector('span');if(t)t.textContent='Sending…';}});})();</script>
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
      <p class="muted rv" style="margin-top:12px">PrintKarr never asks you to stand at a counter, share a pen drive, or wait for a shop to open. The kiosk is the shop.</p></div>
      ${stepsHtml()}
      <div class="grid c3" style="margin-top:16px">
        <article class="card rv"><h3>No app required</h3><p class="muted" style="margin-top:8px;font-size:14px">The kiosk QR opens a lightweight web flow. Camera in, document out.</p></article>
        <article class="card rv"><h3>Pay on the phone</h3><p class="muted" style="margin-top:8px;font-size:14px">UPI and cards, encrypted end to end. The kiosk never stores a payment method.</p></article>
        <article class="card rv"><h3>Collect with OTP</h3><p class="muted" style="margin-top:8px;font-size:14px">A rotating 4-digit code or on-screen QR releases the job. Nobody else can.</p></article>
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
      <h1 class="display story-title">Big ideas deserve<br><em>a place to print.</em></h1><blockquote class="display rv" style="font-size:clamp(1.5rem,4vw,2.4rem);margin-top:24px;line-height:1.3">“If groceries can reach us in minutes, why is printing still stuck behind a shutter at 9 pm? PrintKarr is our answer.”</blockquote>
      <p class="rv" style="margin-top:12px;font-size:14px;font-weight:700;color:var(--primary)">— Anirudh Verma, Founder</p>
      <div class="muted rv" style="margin-top:32px;display:flex;flex-direction:column;gap:16px;font-size:16px;line-height:1.7">
        <p>PrintKarr is India’s self-service printing kiosk, built to make document printing instant, private, and available any hour of the day.</p>
        <p>The idea came from a problem we lived: rushing to print assignments, tickets, and affidavits only to find the shop closed, overcrowded, or asking for a USB we didn’t carry.</p>
        <p>With encrypted file handling, auto-delete after print, and a machine that never takes a lunch break — this is how printing should work in a digital-first India.</p>
      </div>
      <div class="grid c2" style="margin-top:32px">
        <article class="card rv" style="background:var(--pale)"><h2>Mission</h2><p class="muted" style="margin-top:8px;font-size:14px">Fully automated, staff-free printing in every campus, transit hub, and workplace that still depends on a xerox counter.</p></article>
        <article class="card ink rv"><h2>Vision</h2><p style="margin-top:8px;font-size:14px;opacity:.75">India’s largest network of smart printing kiosks — the default place you go when a document needs to exist on paper, now.</p></article>
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
        <li>◍ PrintKarr Technologies Private Limited<br><span class="muted">14, 100 Feet Road, Indiranagar, Bengaluru 560038</span></li>
      </ul></div>
      <form class="card rv" method="POST" action="/contact">
        ${sent ? `<p class="pill" style="margin-bottom:12px">✓ Received. We’ll reply within one business day.</p>` : ''}
        <div class="field"><label for="field-model">How would you like to partner?</label><select id="field-model" name="model" required><option value="" disabled selected>Choose one</option><option>Own a PrintKarr kiosk</option><option>Have a location to host</option><option>Need a custom solution</option><option>Onboard my Xerox shop</option><option>Just saying hello</option></select></div>
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
