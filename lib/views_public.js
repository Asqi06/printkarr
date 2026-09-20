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
      .fut { background: var(--ink); color: var(--paper); overflow-x: clip; }
      .fut-top { position: sticky; top: 0; z-index: 100; display: flex; justify-content: space-between; align-items: center; padding: 12px var(--pad); background: rgba(22,19,14,.92); backdrop-filter: blur(10px); border-bottom: 1px solid rgba(250,245,234,.18); }
      .fut-top .brand { color: var(--paper); }
      .fut-top .walchip { background: transparent; color: var(--paper); border-color: rgba(250,245,234,.4); }
      .fut-top .loginlink { color: var(--paper); }
      .fut-hero { position: relative; padding: clamp(40px,9vh,90px) var(--pad) 30px; background-image: linear-gradient(rgba(250,245,234,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(250,245,234,.05) 1px, transparent 1px); background-size: 44px 44px; animation: futdrift 24s linear infinite; }
      @keyframes futdrift { to { background-position: 44px 88px; } }
      .fut-kicker { font-family: var(--font-m); font-size: 11px; letter-spacing: .22em; text-transform: uppercase; color: var(--sun); display: flex; align-items: center; gap: 10px; }
      .fut-kicker i { width: 9px; height: 9px; border-radius: 50%; background: var(--leaf); animation: throb 1.6s infinite; }
      .fut-hero .display { color: var(--paper); font-size: clamp(3.2rem,13vw,8rem); }
      .fut-hero .display .outline { color: transparent; -webkit-text-stroke: 2px var(--tang); }
      .fut-sub { max-width: 46ch; color: rgba(250,245,234,.72); margin-top: 14px; font-size: 15px; }
      .fut-cta { display: inline-flex; margin-top: 24px; font-size: 15px; padding: 20px 34px; }
      .fut-status { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 26px; }
      .fut-status span { font-family: var(--font-m); font-size: 10px; letter-spacing: .1em; text-transform: uppercase; border: 1px solid rgba(250,245,234,.25); border-radius: 8px; padding: 8px 12px; color: rgba(250,245,234,.85); }
      .fut-status b { color: var(--sun); }
      .fut-ticker { overflow: hidden; border-top: 1px solid rgba(250,245,234,.18); border-bottom: 1px solid rgba(250,245,234,.18); background: var(--tang); color: var(--ink); padding: 10px 0; }
      .fut-ticker .track { display: flex; width: max-content; animation: mq 26s linear infinite; }
      .fut-ticker span { font-family: var(--font-m); font-weight: 700; font-size: 12px; letter-spacing: .12em; text-transform: uppercase; padding: 0 26px; white-space: nowrap; }
      .fut-steps { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; padding: 26px var(--pad); }
      .fut-steps div { border: 1px solid rgba(250,245,234,.22); border-radius: 14px; padding: 18px 14px; }
      .fut-steps b { font-family: var(--font-m); color: var(--tang); font-size: 12px; letter-spacing: .2em; }
      .fut-steps p { font-weight: 800; font-size: 1.05rem; margin-top: 8px; text-transform: uppercase; letter-spacing: -.01em; }
      .fut-steps small { color: rgba(250,245,234,.6); font-size: 12px; }
      .fut-bonus { display: block; margin: 0 var(--pad); border: 1px dashed rgba(250,245,234,.4); border-radius: 12px; padding: 13px 16px; font-family: var(--font-m); font-size: 11.5px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: var(--sun); text-decoration: none; }
      .fut-contact { margin: 22px var(--pad) 0; border: 1px solid rgba(250,245,234,.22); border-radius: 14px; padding: 18px; display: flex; flex-wrap: wrap; gap: 10px 26px; align-items: center; justify-content: space-between; }
      .fut-contact .num { font-weight: 900; font-size: 1.5rem; letter-spacing: -.02em; color: var(--paper); text-decoration: none; }
      .fut-contact small { font-family: var(--font-m); font-size: 10px; letter-spacing: .14em; text-transform: uppercase; color: rgba(250,245,234,.6); display: block; }
      @media (max-width: 640px) { .fut-steps { grid-template-columns: 1fr; } }
      @media (prefers-reduced-motion: reduce) { .fut-hero, .fut-ticker .track { animation: none !important; } }
    </style>`,
    body: `
    <div class="fut">
    <header class="fut-top">
      <a class="brand" href="/"><i></i>Print<em>karr</em></a>
      <div class="pub-top-r">
        <a class="walchip" href="/login">Wallet · Add money</a>
        <a class="loginlink" href="/login">Log in</a>
      </div>
    </header>
    <main class="fut-hero">
      <p class="fut-kicker rv"><i></i>Press online · Vapi — Sarigam — Bhilad</p>
      <h1 class="display rv">Feed the press.<br><span class="outline">Get it back.</span></h1>
      <p class="fut-sub rv">Upload a PDF, pay online, and pick it up hot off the Epson — assignments, notes and files at student prices, tracked live to your door or desk.</p>
      <a class="btn loud big fut-cta rv" href="/order"><span>Upload &amp; Print →</span></a>
      <div class="fut-status rv">
        <span><b>${pagesWeek}+</b> pages this week</span>
        <span>Queue: <b>${queueDepth}</b> jobs</span>
        <span>From <b>${rs(minRate)}</b>/page</span>
        <span>~<b>45 min</b> door-to-door</span>
      </div>
    </main>
    <div class="fut-ticker rv"><div class="track">
      <span>B&amp;W from ${rs(pricing.bw)}</span><span>Student rate ${rs(pricing.studentBw)}</span><span>Colour ${rs(pricing.color)}</span><span>Free pickup</span><span>Live tracking</span>
      <span>B&amp;W from ${rs(pricing.bw)}</span><span>Student rate ${rs(pricing.studentBw)}</span><span>Colour ${rs(pricing.color)}</span><span>Free pickup</span><span>Live tracking</span>
    </div></div>
    <div class="fut-steps">
      <div class="rv"><b>01 / FEED</b><p>Upload PDF</p><small>Pages counted instantly. No account, no waiting.</small></div>
      <div class="rv"><b>02 / FUSE</b><p>Pay online</p><small>Razorpay or wallet. Price locked before you pay.</small></div>
      <div class="rv"><b>03 / FETCH</b><p>Collect it</p><small>Counter pickup or rider drop, pinged at every stage.</small></div>
    </div>
    ${ladder ? `<a class="bonusband fut-bonus rv" style="background:none" href="/order">Top up ₹${ladder.min}, get ${ladder.pct}% bonus printing credit →</a>` : ''}
    <div class="fut-contact rv">
      <div><small>Talk to a human · Mon–Fri · 24 hours</small><a class="num" href="tel:+919016703180">+91 90167 03180</a></div>
      <a class="btn sun" href="https://wa.me/919016703180?text=${encodeURIComponent('Hi Printkarr! I need help with printing.')}" target="_blank" rel="noopener"><span>WhatsApp us →</span></a>
    </div>
    <p class="muted mono rv" style="font-size:11px;margin:22px var(--pad) 0;color:rgba(250,245,234,.5)">No signup needed to see your price. Phone number only at the end, to track your order.</p>
    <div style="height:110px"></div>
    </div>
    <a class="btn loud big pub-sticky" href="/order"><span>Upload &amp; Print →</span></a>`
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
