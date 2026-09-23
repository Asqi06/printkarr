// Server-rendered views — shared shell + role login.

export function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Bump when public/*.css or public/*.js changes — forces browsers past the 1h static cache.
export const ASSET_V = '20260923q';

export function greeting(name) {
  const h = new Date().getHours();
  const part = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
  return `Good ${part}, ${esc(name)}`;
}

const NAVS = {
  customer: [
    ['Dashboard', '/customer'],
    ['Orders', '/customer/orders'],
    ['Wallet', '/customer/wallet'],
    ['Profile', '/customer/profile']
  ],
  admin: [
    ['Dashboard', '/admin'],
    ['Orders', '/admin/orders'],
    ['Print Queue', '/admin/print-queue'],
    ['Customers', '/admin/customers'],
    ['Pricing', '/admin/pricing'],
    ['Coupons', '/admin/coupons'],
    ['Analytics', '/admin/analytics'],
    ['Settings', '/admin/settings']
  ]
};

const ROLE_TAG = {
  customer: 'Ordering · tracking · wallet',
  admin: 'Kiosk control · printing · pickup'
};

export const LEAFLET_HEAD = `
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css">
<script src="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js" defer></script>
<script>
window.addEventListener('load', function () {
  if (typeof L !== 'undefined') return;
  var l = document.createElement('link'); l.rel = 'stylesheet';
  l.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'; document.head.appendChild(l);
  var s = document.createElement('script'); s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
  document.head.appendChild(s);
});
</script>`;

export function layout({ title, user, active, body, extraCss, extraHead }) {
  const nav = NAVS[user.role] || [];
  const side = nav
    .map(([label, href]) => `<a href="${href}" class="${href === active ? 'live' : ''}">${esc(label)}</a>`)
    .join('');
  const dockItems = user.role === 'customer'
    ? [['/customer', 'Dashboard'], ['/customer/orders', 'Orders'], ['/customer/wallet', 'Wallet'], ['/customer/profile', 'Profile']]
    : [['/admin', 'Dashboard'], ['/admin/orders', 'Orders'], ['/admin/print-queue', 'Print Queue'], ['/admin/settings', 'Settings']];
  const dock = dockItems
    .map(([href, label]) => `<a href="${href}" class="${href === active ? 'live' : ''}">${esc(label)}</a>`)
    .join('');
  const bottom = nav
    .map(([label, href]) => `<a href="${href}" class="${href === active ? 'live' : ''}"><span class="big">●</span>${esc(label)}</a>`)
    .join('');
  const fonts = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)} — PrintKarr</title>
${fonts}
<link rel="stylesheet" href="/design.css?v=${ASSET_V}">
${extraCss ? `<link rel="stylesheet" href="${extraCss}?v=${ASSET_V}">` : ''}
${extraHead || ''}
</head>
<body>
<div class="pk-page">
<div id="offlineBanner" style="display:none;position:fixed;top:0;left:0;right:0;z-index:9999;background:#c2410c;color:#fff;font-size:12px;text-align:center;padding:8px;letter-spacing:.06em">⚠ Offline — orders will sync when back online</div>
<header class="pk-header"><div class="pk-header-inner">
  <a class="pk-logo" href="/${esc(user.role)}" aria-label="PrintKarr home"><span class="w">Print</span><span class="b">Karr</span></a>
  <div class="pk-header-cta">
    <span class="pill" style="background:var(--paper)">${esc(user.role)} · ${esc(user.name)}</span>
    <form method="POST" action="/logout" style="display:inline"><button class="pk-contact" type="submit">Log out</button></form>
  </div>
</div></header>
<main class="main">
  <nav class="snav">${side}</nav>
  ${body}
</main>
<nav class="pk-dock" aria-label="Primary">${dock}</nav>
<footer class="pk-footer"><div class="pk-footer-grid">
  <div><a class="pk-logo" href="/"><span class="w">Print</span><span class="b">Karr</span></a>
  <p class="muted" style="margin-top:16px;max-width:32rem;font-size:14px;line-height:1.6">India's first &amp; only self-service printing vending kiosk. Instant, private, 24/7 — no shop, no queue, no USB.</p></div>
  <div><h4>Product</h4><ul><li><a href="/order">Print now</a></li><li><a href="/customer/orders">Track order</a></li><li><a href="/customer/wallet">Wallet</a></li></ul></div>
  <div><h4>Company</h4><ul><li><a href="/about">About</a></li><li><a href="/how-it-works">How it works</a></li><li><a href="/franchise">Franchise</a></li><li><a href="/contact">Contact</a></li></ul></div>
</div><div class="pk-footer-bottom"><p>© ${new Date().getFullYear()} PrintKarr · PrintKarr Technologies Private Limited</p><div style="display:flex;gap:16px"><a href="/terms">Terms</a><a href="/privacy">Privacy</a></div></div></footer>
</div>
<nav class="bottomnav">${bottom}</nav>
<div class="toast" id="toast"></div>
<script src="/shell.js?v=${ASSET_V}" defer></script>
<script>(function(){const b=document.getElementById('offlineBanner');function upd(){b.style.display=navigator.onLine?'none':'block';}window.addEventListener('online',upd);window.addEventListener('offline',upd);upd();window.kioskChime=function(){try{const c=new (window.AudioContext||window.webkitAudioContext)();const o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.value=880;g.gain.value=0.12;o.connect(g);g.connect(c.destination);o.start();setTimeout(()=>{o.frequency.value=1320;},120);setTimeout(()=>{g.gain.exponentialRampToValueAtTime(0.0001,c.currentTime+0.3);o.stop();},400);}catch{}};})();</script>
</body>
</html>`;
}

export function roleHome(user) {
  const next =
    user.role === 'customer'
      ? 'Ordering, tracking and wallet — add funds, upload, collect at the kiosk.'
      : 'Queue, print console and pricing — the kiosk control tower.';
  const ctas =
    user.role === 'customer'
      ? `<a class="btn loud big" href="/customer/orders"><span>+ New Print Order</span></a>`
      : `<a class="btn loud big" href="/admin/orders"><span>Open order queue</span></a>`;
  return layout({
    title: 'Dashboard',
    user,
    active: `/${user.role}`,
    body: `
      <p class="eyebrow rv">Dashboard</p>
      <h1 class="display rv" style="font-size:clamp(2.2rem,6vw,4.4rem)">${greeting(user.name).replace(/, ([^,]+)$/, ', <em>$1</em>')}</h1>
      <p class="muted rv" style="margin:12px 0 22px;max-width:52ch">${esc(next)}</p>
      <div class="rv">${ctas}</div>
      <div class="grid c3" style="margin-top:22px">
        <div class="card rv" style="background:var(--pale)"><div class="stat"><div class="v">Live</div><div class="k">Auth + shell · online</div></div></div>
        <div class="card rv"><div class="stat"><div class="v" style="font-size:1.4rem">${esc(user.role)}</div><div class="k">Signed in as ${esc(user.email)}</div></div></div>
        <div class="card ink rv"><div class="stat"><div class="v"><em>24/7</em></div><div class="k">Kiosk · self-service</div></div></div>
      </div>`
  });
}

export function stubPage(user, active, title, phaseNote) {
  return layout({
    title,
    user,
    active,
    body: `
      <p class="eyebrow rv">${esc(title)}</p>
      <h1 class="display rv" style="font-size:clamp(2rem,6vw,4rem)">On the press.<br><em>${esc(phaseNote)}</em></h1>
      <p class="muted rv" style="margin:12px 0 22px">This screen is part of the upcoming phase. The shell, session and nav are already live.</p>
      <a class="btn solid rv" href="/${esc(user.role)}"><span>← Back to dashboard</span></a>`
  });
}

const DEMOS = [
  { role: 'customer', name: 'Customer', glyph: '◍', email: 'customer@demo.printkarr.in', password: 'customer123', blurb: 'Order prints, track pickup, wallet.' },
  { role: 'admin', name: 'Printer / Admin', glyph: '▣', email: 'admin@demo.printkarr.in', password: 'admin123', blurb: 'Queues, printing, pickup & pricing.' }
];

function pkPublicHead(title) {
  return `<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)} — PrintKarr</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="/design.css?v=${ASSET_V}">
<link rel="stylesheet" href="/login.css?v=${ASSET_V}">`;
}

function pkPublicHeader() {
  return `<header class="pk-topnav-wrap">
  <div class="pk-mbar">
    <a class="pk-logo" href="/" aria-label="PrintKarr home"><span class="w">Print</span><span class="b">Karr</span></a>
    <span class="pk-mbar-cta"><a class="pk-contact" href="/contact">Contact us</a><a class="btn loud" href="/order"><span>Print now</span></a></span>
  </div>
  <nav class="pk-topnav" aria-label="Primary">
  <a href="/about">About Us</a>
  <a href="/how-it-works">Features</a>
  <a href="/" class="home"><span style="color:var(--navy)">Print</span><span>Karr</span></a>
  <a href="/franchise">Franchise</a>
  <a href="/contact" class="contact-link">Contact us</a>
  <a href="/order" class="cta">Print now</a>
</nav></header>`;
}

function pkPublicFooter() {
  return `<footer class="pk-footer"><div class="pk-footer-grid">
  <div><a class="pk-logo" href="/"><span class="w">Print</span><span class="b">Karr</span></a>
  <p class="muted" style="margin-top:16px;max-width:32rem;font-size:14px">India's first &amp; only self-service printing vending kiosk. Instant, private, 24/7.</p>
  <a class="btn loud" style="margin-top:16px" href="/order"><span>Print now →</span></a></div>
  <div><h4>Navigation</h4><ul><li><a href="/how-it-works">How it works</a></li><li><a href="/franchise">Franchise</a></li><li><a href="/contact">Contact Us</a></li><li><a href="/blogs">Blogs</a></li></ul></div>
  <div><h4>Social</h4><ul><li><a href="https://x.com">Twitter / X</a></li><li><a href="https://instagram.com">Instagram</a></li><li><a href="https://linkedin.com">LinkedIn</a></li></ul></div>
</div><div class="pk-footer-bottom"><p>© ${new Date().getFullYear()} PrintKarr · PrintKarr Technologies Private Limited</p><div style="display:flex;gap:16px"><a href="/terms">Terms</a><a href="/privacy">Privacy</a></div></div></footer>`;
}

export function loginPage(error, googleOn, demoOn = true) {
  const cards = DEMOS.map(
    (d) => `
    <button type="button" class="demo-card rv" data-email="${d.email}" data-pass="${d.password}">
      <span class="demo-glyph">${d.glyph}</span>
      <span class="demo-role">${d.name}</span>
      <span class="demo-blurb">${d.blurb}</span>
      <span class="demo-mail mono">${d.email} · ${d.password}</span>
      <span class="demo-use">Use this account →</span>
    </button>`
  ).join('');
  return `<!DOCTYPE html>
<html lang="en">
<head>
${pkPublicHead('Log in')}
</head>
<body><div class="pk-page">
${pkPublicHeader()}
<main class="login-wrap">
  <span class="pill rv">PrintKarr · Self-service kiosk</span>
  <h1 class="display rv" style="margin-top:16px">Meet <em>PrintKarr</em>,<br>print in 60 seconds.</h1>
  <p class="muted rv" style="margin:12px 0 24px;max-width:36rem">${demoOn ? 'Choose a role — each card fills the demo login instantly.' : 'Sign in with your shop account, or continue with Google.'}</p>
  ${error ? `<p class="login-err rv" role="alert">${esc(error)}</p>` : ''}
  ${demoOn ? `<div class="demo-grid">${cards}</div>` : ''}
  ${googleOn ? `<a class="btn loud big rv" style="width:100%;margin-bottom:14px" href="/auth/google"><span>Continue with Google →</span></a>` : ''}
  <form class="login-form rv" method="POST" action="/login/code-request">
    <p class="eyebrow">No password? Use your email</p>
    <p class="muted" style="font-size:13px;margin:6px 0 12px">Ordered before as a guest? We'll email you a 6-digit code — no password needed.</p>
    <div class="field"><label for="codeEmail">Email</label><input id="codeEmail" name="email" type="email" required autocomplete="email" placeholder="you@example.com"></div>
    <button class="btn loud big" type="submit" style="width:100%"><span>Email me a code →</span></button>
  </form>
  <script>(function(){var f=document.querySelector('form[action="/login/code-request"]');if(!f||f.dataset.spin)return;f.dataset.spin='1';f.addEventListener('submit',function(){var b=f.querySelector('button[type="submit"]');if(b&&!b.disabled){b.setAttribute('disabled','true');var t=b.querySelector('span');if(t)t.textContent='Sending…';}});})();</script>
  <p class="muted rv" style="font-size:12px;margin:18px 0 10px">Have a password from a demo account? Use it below.</p>
  <form class="login-form rv" method="POST" action="/login">
    <div class="field"><label for="email">Email</label><input id="email" name="email" type="email" required autocomplete="username" placeholder="you@example.in"></div>
    <div class="field"><label for="password">Password</label><input id="password" name="password" type="password" required autocomplete="current-password" placeholder="••••••••"></div>
    <button class="btn loud big" type="submit" style="width:100%"><span>Sign in →</span></button>
  </form>
  <p class="muted rv" style="font-size:12px;margin-top:18px">Shop staff? <a class="rowlink" href="/admin/login">Admin login</a> · <a class="rowlink" href="/order">Print without login →</a></p>
</main>
${pkPublicFooter()}
</div>
<div class="toast" id="toast"></div>
<script src="/shell.js?v=${ASSET_V}" defer></script>
<script>
document.querySelectorAll('.demo-card').forEach(function (c) {
  c.addEventListener('click', function () {
    document.getElementById('email').value = c.dataset.email;
    document.getElementById('password').value = c.dataset.pass;
    toast('Demo account filled — hit Sign in');
  });
});
</script>
</body>
</html>`;
}

export function loginOtpPage(email, demoCode, mailError, error) {
  const sentNote = demoCode
    ? (mailError
      ? `<div class="card rv" style="margin-top:14px;background:var(--pale)"><b>Couldn't email the code (${esc(mailError)}) — use this one: ${esc(demoCode)}</b></div>`
      : `<div class="card rv" style="margin-top:14px;background:var(--pale)"><b>Email delivery isn't set up on this server yet — your code is ${esc(demoCode)}</b></div>`)
    : `<p class="muted rv" style="margin-top:10px;font-size:13px">Sent to ${esc(email)} just now — check your inbox &amp; spam.</p>`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
${pkPublicHead('Enter code')}
</head>
<body><div class="pk-page">
${pkPublicHeader()}
<main class="login-wrap" style="max-width:560px">
  <span class="pill rv">Customer login · ${esc(email)}</span>
  <h1 class="display rv" style="font-size:clamp(2rem,6vw,3.4rem);margin-top:16px">The 6-digit<br><em>code.</em></h1>
  ${sentNote}
  ${error ? `<p class="login-err rv" role="alert">${esc(error)}</p>` : ''}
  <form class="card rv" style="margin-top:14px" method="POST" action="/login/code-verify">
    <input type="hidden" name="email" value="${esc(email)}">
    <div class="field"><label for="cc">Code</label><input id="cc" name="code" required inputmode="numeric" autocomplete="one-time-code" placeholder="••••••" maxlength="6" style="font-size:1.6rem;letter-spacing:.4em;text-align:center"></div>
    <button class="btn loud big" type="submit" style="width:100%"><span>Sign in →</span></button>
  </form>
  <p class="muted rv" style="font-size:12px;margin-top:12px"><a class="rowlink" href="/login">← Back to login</a></p>
</main>
${pkPublicFooter()}
</div>
<div class="toast" id="toast"></div>
<script src="/shell.js?v=${ASSET_V}" defer></script>
</body>
</html>`;
}

export function staffLoginPage(role, error, googleOn = false) {
  const title = 'Shop admin';
  const action = '/admin/login';
  return `<!DOCTYPE html>
<html lang="en">
<head>
${pkPublicHead(title + ' login')}
</head>
<body><div class="pk-page">
${pkPublicHeader()}
<main class="login-wrap" style="max-width:560px">
  <span class="pill rv">Staff access</span>
  <h1 class="display rv" style="font-size:clamp(2rem,6vw,3.6rem);margin-top:16px">${title}<br><em>login.</em></h1>
  ${error ? `<p class="login-err rv" role="alert">${esc(error)}</p>` : ''}
  ${googleOn ? `<a class="btn solid big rv" style="width:100%;margin:14px 0" href="/auth/google"><span>Continue with Google →</span></a>` : ''}
  <form class="login-form rv" style="margin-top:18px" method="POST" action="${action}">
    <div class="field"><label for="email">Email</label><input id="email" name="email" type="email" required autocomplete="username"></div>
    <div class="field"><label for="password">Password</label><input id="password" name="password" type="password" required autocomplete="current-password"></div>
    <button class="btn loud big" type="submit" style="width:100%"><span>Sign in →</span></button>
  </form>
  <p class="muted rv" style="font-size:12px;margin-top:12px">Customer? <a class="rowlink" href="/login">Customer login</a></p>
</main>
${pkPublicFooter()}
</div>
<div class="toast" id="toast"></div>
<script src="/shell.js?v=${ASSET_V}" defer></script>
</body>
</html>`;
}
