// Public conversion funnel: minimal landing + one-scroll guest ordering.
// No login walls before price. Auth happens once, at OTP time.
import { esc } from './views.js';

const rs = (n) => '₹' + (Math.round(n * 100) / 100);

function shell({ title, body, extra }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)} — Printkarr</title>
<link rel="stylesheet" href="/design.css">
<link rel="stylesheet" href="/customer.css">
${extra || ''}
</head>
<body>
${body}
<div class="toast" id="toast"></div>
<script src="/shell.js" defer></script>
</body>
</html>`;
}

const topbar = `
<header class="pub-top">
  <a class="brand" href="/"><i></i>Print<em>karr</em></a>
  <div class="pub-top-r">
    <a class="walchip" href="/login">Wallet ₹0 · Add money</a>
    <a class="loginlink" href="/login">Log in</a>
  </div>
</header>`;

export function landing({ pagesWeek, pricing, queueDepth }) {
  const minRate = Math.min(pricing.bw, pricing.studentBw);
  const ladder = [...(pricing.topupBonus || [])].sort((a, b) => b.min - a.min)[0];
  return shell({
    title: 'Print it. We bring it.',
    extra: `<style>
      .landing { background: var(--paper); overflow-x: clip; }
      .landing-top { position: sticky; top: 0; z-index: 100; display: flex; justify-content: space-between; align-items: center; padding: 12px var(--pad); background: rgba(250,245,234,.88); backdrop-filter: blur(10px); border-bottom: 1.5px solid var(--line); }
      .hero-min { max-width: 1080px; margin: 0 auto; padding: clamp(32px,7vh,68px) var(--pad) 20px; display: grid; grid-template-columns: 1.15fr .85fr; gap: clamp(22px,4vw,52px); align-items: center; }
      .hero-kicker { font-family: var(--font-m); font-size: 10.5px; letter-spacing: .22em; text-transform: uppercase; color: var(--muted); display: flex; gap: 10px; align-items: center; }
      .hero-kicker i { width: 8px; height: 8px; border-radius: 50%; background: var(--leaf); animation: throb 1.6s infinite; }
      .hero-min .display { font-size: clamp(3.2rem,7.5vw,6rem); line-height: .88; letter-spacing: -.04em; }
      .hero-min .display em { color: var(--tang); font-style: italic; }
      .hero-sub { max-width: 40ch; color: var(--ink-2); margin-top: 14px; font-size: 15.5px; line-height: 1.6; }
      .hero-cta { display: inline-flex; margin-top: 22px; font-size: 15px; padding: 19px 30px; border-radius: 999px; box-shadow: 5px 5px 0 var(--ink); transition: transform .18s var(--ez-out), box-shadow .18s; }
      .hero-cta:hover { transform: translate(1px,1px); box-shadow: 3px 3px 0 var(--ink); }
      .hero-cta span::after { content: ' →'; transition: transform .2s; display: inline-block; }
      .hero-cta:hover span::after { transform: translateX(4px); }
      .hero-help { font-family: var(--font-m); font-size: 11px; color: var(--muted); margin-top: 12px; }
      .hero-trust { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 18px; }
      .hero-trust span { font-family: var(--font-m); font-size: 10px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; border: 1.5px solid var(--line-soft); border-radius: 999px; padding: 8px 13px; background: #fff; }
      .hero-trust b { color: var(--ink); }
      .hero-art { position: relative; aspect-ratio: 1.08; border: 1.5px solid var(--ink); border-radius: 22px; background: var(--paper-2); overflow: hidden; transform: rotate(-.5deg); box-shadow: 0 12px 30px rgba(22,19,14,.08); }
      .hero-art .sheet { position: absolute; left: 50%; top: 50%; width: 60%; aspect-ratio: .74; background: var(--paper); border: 1.5px solid var(--ink); border-radius: 12px; box-shadow: 8px 8px 0 rgba(0,0,0,.06); }
      .hero-art .sheet.s1 { transform: translate(-52%,-52%) rotate(-7deg); opacity: .9; }
      .hero-art .sheet.s2 { transform: translate(-48%,-48%) rotate(5deg); background: #fff; }
      .hero-art .sheet.s3 { transform: translate(-50%,-42%) rotate(-1deg); display: flex; align-items: center; justify-content: center; font-family: var(--font-m); font-weight: 700; font-size: 11.5px; letter-spacing: .04em; color: var(--ink-2); }
      .sticker { position: absolute; font-family: var(--font-m); font-weight: 700; font-size: 11px; letter-spacing: .06em; text-transform: uppercase; border: 1.5px solid var(--ink); border-radius: 999px; padding: 8px 11px; }
      .sticker.y { background: var(--sun); left: 14px; top: 16px; animation: wiggle 3s ease-in-out infinite; box-shadow: 3px 3px 0 var(--ink); }
      .sticker.o { background: var(--tang); color: var(--paper); right: 14px; bottom: 16px; animation: wiggle 3.4s ease-in-out infinite .7s; box-shadow: 3px 3px 0 var(--ink); }
      @keyframes wiggle { 0%,100% { transform: rotate(-2deg) translateY(0)} 50% { transform: rotate(2deg) translateY(-5px)} }
      .steps-min { max-width: 1080px; margin: 18px auto 0; padding: 0 var(--pad); display: grid; grid-template-columns: repeat(3,1fr); gap: 14px; }
      .steps-min .step { border: 1.5px solid var(--line); border-radius: 18px; padding: 18px 16px; background: #fff; transition: transform .22s var(--ez-out), box-shadow .22s; }
      .steps-min .step:nth-child(2){ transform: rotate(.35deg); }
      .steps-min .step:nth-child(3){ transform: rotate(-.3deg); background: var(--paper); }
      .steps-min .step:hover { transform: translateY(-4px) rotate(0deg); box-shadow: 0 10px 24px rgba(22,19,14,.08); }
      .steps-min .n { font-family: var(--font-m); font-size: 10px; letter-spacing: .18em; color: var(--tang); font-weight: 700; }
      .steps-min h3 { font-weight: 900; text-transform: uppercase; letter-spacing: -.02em; margin-top: 8px; font-size: 1.02rem; }
      .steps-min p { color: var(--muted); font-size: 13px; margin-top: 6px; line-height: 1.5; }
      .bonus-min { display: flex; justify-content: space-between; align-items: center; gap: 12px; max-width: 1080px; margin: 16px auto 0; padding: 14px 16px; border: 1.5px dashed var(--ink); border-radius: 14px; font-family: var(--font-m); font-size: 11.5px; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; text-decoration: none; background: var(--sun); color: var(--ink); }
      .contact-min { max-width: 1080px; margin: 16px auto 0; padding: 16px; border: 1.5px solid var(--line); border-radius: 16px; display: flex; flex-wrap: wrap; gap: 12px 24px; align-items: center; justify-content: space-between; background: #fff; }
      .contact-min .num { font-weight: 900; font-size: 1.4rem; letter-spacing: -.02em; text-decoration: none; color: var(--ink); }
      .contact-min small { font-family: var(--font-m); font-size: 10px; letter-spacing: .14em; text-transform: uppercase; color: var(--muted); display: block; }
      @media (max-width: 860px){ .hero-min{ grid-template-columns: 1fr; } .hero-art{ order: -1; max-width: 480px; margin: 0 auto; } .steps-min{ grid-template-columns: 1fr; } }
      @media (prefers-reduced-motion: reduce){ .sticker{ animation: none !important; } }
    </style>`,
    body: `
    <div class="landing">
    <header class="landing-top">
      <a class="brand" href="/"><i></i>Print<em>karr</em></a>
      <div class="pub-top-r">
        <a class="walchip" href="/login">Wallet · Add money</a>
        <a class="loginlink" href="/login">Log in</a>
      </div>
    </header>
    <main class="hero-min">
      <div>
        <p class="hero-kicker rv"><i></i>Vapi — Sarigam — Bhilad · press online</p>
        <h1 class="display rv">Print it.<br><em>We bring it.</em></h1>
        <p class="hero-sub rv">Upload a PDF. See price instantly. Pay online. Pick up hot off the Epson — assignments & notes at student prices.</p>
        <a class="btn loud big hero-cta rv" href="/order"><span>Upload PDF — see price →</span></a>
        <p class="hero-help rv">No account first. Phone only at the end to track your order.</p>
        <div class="hero-trust rv">
          <span><b>${pagesWeek}+</b> pages this week</span>
          <span><b>${queueDepth}</b> in queue</span>
          <span>From <b>${rs(minRate)}</b>/page</span>
        </div>
      </div>
      <div class="hero-art rv" aria-hidden="true">
        <div class="sheet s1"></div>
        <div class="sheet s2"></div>
        <div class="sheet s3">📄 your file here →</div>
        <span class="sticker y">₹2 / page</span>
        <span class="sticker o">45 min</span>
      </div>
    </main>
    <section class="steps-min">
      <div class="step rv"><div class="n">01 — FEED</div><h3>Upload PDF</h3><p>Pages counted instantly. No waiting.</p></div>
      <div class="step rv"><div class="n">02 — FUSE</div><h3>Pay online</h3><p>Razorpay or wallet. Price locked.</p></div>
      <div class="step rv"><div class="n">03 — FETCH</div><h3>Collect it</h3><p>Counter pickup, pinged at every stage.</p></div>
    </section>
    ${ladder ? `<a class="bonus-min rv" href="/order"><span>Top up ₹${ladder.min} → get ${ladder.pct}% bonus credit</span><span>→</span></a>` : ''}
    <div class="contact-min rv">
      <div><small>Talk to a human · Mon–Fri · 24 hours</small><a class="num" href="tel:+919016703180">+91 90167 03180</a></div>
      <a class="btn sun" href="https://wa.me/919016703180?text=${encodeURIComponent('Hi Printkarr! I need help with printing.')}" target="_blank" rel="noopener"><span>WhatsApp us →</span></a>
    </div>
    <p class="muted mono rv" style="font-size:11px; max-width:1080px; margin: 14px auto 30px; padding: 0 var(--pad); color: var(--muted)">No signup needed to see your price. One clear next step: upload.</p>
    </div>`
  });
}

export function orderPage({ draft, pricing, error, maxMb }) {
  const d = draft || null;
  const cfg = JSON.stringify({
    bw: pricing.bw, color: pricing.color,
    fees: pricing.delivery, freeAbove: pricing.freeAbove
  });
  return shell({
    title: 'Print now',
    body: `
    ${topbar}
    <main class="pub-wrap">
      <p class="eyebrow rv"><a href="/" style="text-decoration:none">← Home</a></p>
      <h1 class="display rv" style="font-size:clamp(2.2rem,7vw,4rem)">Thirty seconds<br><em>to printed.</em></h1>
      ${error ? `<p class="login-err rv" role="alert">${esc(error)}</p>` : ''}
      ${d ? `
      <div class="card sun rv filechip"><b>📄 ${esc(d.document)}</b><span class="mono" style="font-size:11px">${d.pages} pages detected · <a href="/order">different file?</a></span></div>
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
              <div class="stepper"><button type="button" id="cMinus">−</button><input id="copies" name="copies" type="number" value="1" min="1" max="200" readonly><button type="button" id="cPlus">+</button></div></div>
            <div class="field"><label for="range">Pages (optional)</label><input id="range" name="range" placeholder="All ${d.pages}, or 1-12"></div>
          </div>
          <div class="field"><label>Deliver to</label><div class="chips" id="f-area">
            <label class="chip-pick"><input type="radio" name="area" value="Pickup" checked> Classroom pickup · FREE</label>
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
        function upd(){
          var type = val('printType') || 'bw';
          var copies = Math.max(1, Math.min(200, parseInt(document.getElementById('copies').value, 10) || 1));
          var area = (val('area') || 'sarigam').toLowerCase();
          var rate = type === 'color' ? window.PK.color : window.PK.bw;
          var sub = pages * copies * rate;
          var fee = window.PK.fees[area] != null ? window.PK.fees[area] : 15;
          var del = sub >= window.PK.freeAbove ? 0 : fee;
          var el = document.querySelector('#liveTotal b');
          if (el) el.textContent = '₹' + Math.round(sub + del);
          var sub2 = document.querySelector('#liveTotal span');
          if (sub2) sub2.textContent = pages + ' pages × ' + copies + ' · ' + (type === 'bw' ? 'B&W' : 'Color') + (del === 0 ? ' · FREE delivery' : '');
        }
        document.getElementById('cMinus').addEventListener('click', function(){ var i = document.getElementById('copies'); i.value = Math.max(1, (parseInt(i.value, 10) || 1) - 1); upd(); });
        document.getElementById('cPlus').addEventListener('click', function(){ var i = document.getElementById('copies'); i.value = Math.min(200, (parseInt(i.value, 10) || 1) + 1); upd(); });
        document.querySelectorAll('#f-type input, #f-sides input, #f-area input').forEach(function(i){ i.addEventListener('change', upd); });
        upd();
      })();
      </script>`
      : `
      <form class="rv" method="POST" action="/order/upload" enctype="multipart/form-data" style="margin-top:18px">
        <label class="drop" for="doc"><span class="drop-arrow">↑</span><b>Tap to pick your PDF</b><span class="muted">Up to ${maxMb || 20} MB · price appears instantly</span></label>
        <input id="doc" name="doc" type="file" accept="application/pdf,.pdf" required hidden>
        <p class="mono muted" id="fname" style="font-size:11px;margin:10px 0"></p>
        <button class="btn loud big" type="submit" style="width:100%"><span>See my price →</span></button>
      </form>
      <script>document.getElementById('doc').addEventListener('change', function(e){ var f = e.target.files[0]; document.getElementById('fname').textContent = f ? '📄 ' + f.name : ''; if (f) e.target.form.submit(); });</script>`}
    </main>`
  });
}

export function phonePage({ draft, error }) {
  return shell({
    title: 'Where to?',
    body: `
    ${topbar}
    <main class="pub-wrap">
      <p class="eyebrow rv">Last step · 📄 ${esc(draft.document)} · ${draft.pages} pages</p>
      <h1 class="display rv" style="font-size:clamp(2rem,6vw,3.4rem)">Where should it<br><em>reach you?</em></h1>
      <p class="muted rv" style="margin:8px 0 16px;font-size:13.5px">Phone number is only for order tracking. No passwords, ever.</p>
      ${error ? `<p class="login-err rv" role="alert">${esc(error)}</p>` : ''}
      <form class="card rv" method="POST" action="/order/otp-request">
        <input type="hidden" name="draft" value="${draft.id}">
        <div class="grid c2">
          <div class="field"><label for="nn">Your name</label><input id="nn" name="name" required placeholder="Ani" maxlength="60"></div>
          <div class="field"><label for="pp">Phone (10-digit mobile)</label><input id="pp" name="phone" required inputmode="numeric" placeholder="98250 11111" maxlength="13"></div>
        </div>
        <div class="field"><label for="aa">Full address</label><input id="aa" name="address" required placeholder="Hostel block, room / house no, street" maxlength="200"></div>
        <div class="grid c3">
          <div class="field"><label>Area</label><input value="${esc(draft.area || 'Sarigam')}" disabled></div>
          <div class="field"><label for="ll">Landmark</label><input id="ll" name="landmark" placeholder="Near…" maxlength="100"></div>
          <div class="field"><label for="pin">PIN</label><input id="pin" name="pin" required inputmode="numeric" placeholder="396155" maxlength="10"></div>
        </div>
        <button class="btn loud big" type="submit" style="width:100%"><span>Text me the code →</span></button>
      </form>
    </main>`
  });
}

export function otpPage({ draft, phone, demoCode, error }) {
  return shell({
    title: 'Enter code',
    body: `
    ${topbar}
    <main class="pub-wrap" style="max-width:560px">
      <p class="eyebrow rv">Almost printed · ${esc(phone)}</p>
      <h1 class="display rv" style="font-size:clamp(2rem,6vw,3.4rem)">The 6-digit<br><em>code.</em></h1>
      ${demoCode ? `<div class="card sun rv" style="margin-top:14px"><b class="mono">Demo mode — your code is ${esc(demoCode)}</b></div>` : `<p class="muted rv" style="margin-top:10px;font-size:13px">Sent by SMS just now.</p>`}
      ${error ? `<p class="login-err rv" role="alert">${esc(error)}</p>` : ''}
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
    </main>`
  });
}
