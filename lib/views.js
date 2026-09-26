// Server-rendered views — shared shell + role login.

export function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Bump when public/*.css or public/*.js changes — forces browsers past the 1h static cache.
export const ASSET_V = '20260926-conversion';

export function greeting(name) {
  const h = new Date().getHours();
  const part = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
  return `Good ${part}, ${esc(name)}`;
}

const NAVS = {
  customer: [
    ['Print', '/customer/orders/new'],
    ['Orders', '/customer/orders'],
    ['Credits', '/customer/wallet'],
    ['Packs', '/customer/packs'],
    ['Account', '/customer/profile']
  ],
  admin: [
    ['Dashboard', '/admin'],
    ['Orders', '/admin/orders'],
    ['Print Queue', '/admin/print-queue'],
    ['Packs', '/admin/packs'],
    ['Referrals', '/admin/referrals'],
    ['Customers', '/admin/customers'],
    ['Pricing', '/admin/pricing'],
    ['Coupons', '/admin/coupons'],
    ['Analytics', '/admin/analytics'],
    ['Settings', '/admin/settings']
  ]
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

export const DELIVERY_MAP_HEAD = `${LEAFLET_HEAD}<script src="/delivery-map.js?v=${ASSET_V}" defer></script>`;

export function deliveryPicker(area = '', point = null) {
  return `<div class="delivery-picker" data-delivery-picker data-area="${esc(area)}" data-lat="${esc(point?.lat || '')}" data-lng="${esc(point?.lng || '')}">
    <p class="eyebrow">Exact delivery point</p>
    <p class="muted">Tap the map where the rider should bring your prints. The delivery fee uses this point.</p>
    <div class="delivery-map" data-delivery-map aria-label="Select delivery destination on map"></div>
    <button type="button" class="rowlink" data-use-location>Use my current location</button>
    <p class="field-hint" data-delivery-status role="status">Select a point to calculate delivery.</p>
    <input type="hidden" name="deliveryLat"><input type="hidden" name="deliveryLng">
  </div>`;
}

export function layout({ title, user, active, body, extraCss, extraHead }) {
  const nav = NAVS[user.role] || [];
  const side = nav
    .map(([label, href]) => `<a href="${href}" class="${href === active ? 'live' : ''}" ${href === active ? 'aria-current="page"' : ''}>${esc(label)}</a>`)
    .join('');
  const fonts = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>`;
  const icons = `<link rel="icon" href="/favicon.ico?v=${ASSET_V}"><link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png?v=${ASSET_V}"><link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png?v=${ASSET_V}"><link rel="apple-touch-icon" href="/apple-touch-icon.png?v=${ASSET_V}"><link rel="manifest" href="/site.webmanifest?v=${ASSET_V}">`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)} — PrintKarr</title>
${icons}
${fonts}
<link rel="stylesheet" href="/design.css?v=${ASSET_V}">
${extraCss ? `<link rel="stylesheet" href="${extraCss}?v=${ASSET_V}">` : ''}
${extraHead || ''}
</head>
<body class="app-view">
<div class="pk-page">
<div id="offlineBanner" style="display:none;position:fixed;top:0;left:0;right:0;z-index:9999;background:#c2410c;color:#fff;font-size:12px;text-align:center;padding:8px;letter-spacing:.06em">⚠ Offline — orders will sync when back online</div>
<header class="pk-header"><div class="pk-header-inner">
  <a class="pk-logo" href="/${esc(user.role)}" aria-label="PrintKarr home"><span class="brand-mark" aria-hidden="true">p.</span><span class="w">Print</span><span class="b">Karr</span></a>
  <div class="pk-header-cta">
    <span class="pill" style="background:var(--paper)">${esc(user.role)} · ${esc(user.name)}</span>
    <form method="POST" action="/logout" style="display:inline"><button class="pk-contact" type="submit">Log out</button></form>
  </div>
</div></header>
<div class="app-workspace"><aside class="app-sidebar"><p class="eyebrow">${user.role === 'customer' ? 'Your print desk' : 'Kiosk workspace'}</p><nav class="snav" aria-label="Workspace">${side}</nav><a class="sidebar-print btn loud" href="${user.role === 'customer' ? '/customer/orders/new' : '/admin/qr'}">${user.role === 'customer' ? '+ New print' : 'Kiosk QR code ↗'}</a><p class="sidebar-note">A little less admin.<br>A little more printing.</p><a class="rowlink" href="/">Visit website ↗</a></aside><main id="main" class="main">${body}</main></div>
<footer class="pk-footer"><div class="pk-footer-grid">
  <div><a class="pk-logo" href="/"><span class="w">Print</span><span class="b">Karr</span></a>
  <p class="muted" style="margin-top:16px;max-width:32rem;font-size:14px;line-height:1.6">Your everyday print desk. Upload, customise, and collect — with a little less waiting.</p></div>
  <div><h4>Product</h4><ul><li><a href="/order">Print now</a></li><li><a href="/customer/orders">Track order</a></li><li><a href="/customer/wallet">Wallet</a></li></ul></div>
  <div><h4>Company</h4><ul><li><a href="/about">About</a></li><li><a href="/how-it-works">How it works</a></li><li><a href="/franchise">Franchise</a></li><li><a href="/contact">Contact</a></li></ul></div>
</div><div class="pk-footer-bottom"><p>© ${new Date().getFullYear()} PrintKarr · PrintKarr Technologies Private Limited</p><div style="display:flex;gap:16px"><a href="/terms">Terms</a><a href="/privacy">Privacy</a></div></div></footer>
</div>

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
<link rel="icon" href="/favicon.ico?v=${ASSET_V}">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png?v=${ASSET_V}">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png?v=${ASSET_V}">
<link rel="apple-touch-icon" href="/apple-touch-icon.png?v=${ASSET_V}">
<link rel="manifest" href="/site.webmanifest?v=${ASSET_V}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="/design.css?v=${ASSET_V}">
<link rel="stylesheet" href="/login.css?v=${ASSET_V}">`;
}

export function pkPublicHeader(active = '') {
  const links = [['/order', 'Print'], ['/#pricing', 'Prices'], ['/#kiosks', 'Kiosks'], ['/#packs', 'Semester Packs'], ['/#referrals', 'Refer & Earn'], ['/customer/orders', 'Track Order']];
  return `<header class="site-header"><div class="site-header-inner">
    <a class="pk-logo" href="/" aria-label="PrintKarr home"><span class="brand-mark" aria-hidden="true">p.</span><span class="w">Print</span><span class="b">Karr</span></a>
    <nav class="site-links" aria-label="Primary">${links.map(([href, label]) => `<a href="${href}" ${href === active ? 'aria-current="page"' : ''}>${label}</a>`).join('')}</nav>
    <div class="header-actions"><a class="account-link" href="/login">My orders</a><a class="btn loud" href="/order">Print now <span aria-hidden="true">→</span></a></div>
    <details class="mobile-menu"><summary aria-label="Open navigation">Menu <span aria-hidden="true">＋</span></summary><nav aria-label="Mobile navigation">${links.map(([href, label]) => `<a href="${href}" ${href === active ? 'aria-current="page"' : ''}>${label}</a>`).join('')}<a href="/login">Account</a></nav></details>
  </div></header>`;
}

export function pkPublicFooter() {
  return `<footer class="pk-footer"><div class="pk-footer-grid">
  <div><a class="pk-logo" href="/"><span class="w">Print</span><span class="b">Karr</span></a>
    <p class="muted" style="margin-top:16px;max-width:24rem;font-size:14px;line-height:1.6">Printing, kiosk pickup, and 24/7 delivery across Vapi. Starting in Chala, Gujarat 396191.</p>
    </div>
  <div><h4>PrintKarr</h4><ul><li><a href="/how-it-works">How it works</a></li><li><a href="/about">Built in Vapi</a></li><li><a href="/blogs">Stories</a></li><li><a href="/contact">Contact</a></li></ul><h4 style="margin-top:24px">Partners</h4><ul><li><a href="/franchise">For colleges &amp; businesses</a></li><li><a href="/xerox">For Xerox shops</a></li></ul></div>
  <div><h4>Your print desk</h4><ul><li><a href="/order">Start a print</a></li><li><a href="/customer/orders">Track your order</a></li><li><a href="/login">My account</a></li><li><a href="mailto:team@printkarr.in">team@printkarr.in</a></li></ul></div>
</div><div class="pk-footer-bottom"><p>© ${new Date().getFullYear()} PrintKarr · PrintKarr Technologies Private Limited</p><div style="display:flex;gap:16px"><a href="/terms">Terms &amp; Conditions</a><a href="/privacy">Privacy Policy</a></div></div></footer>`;
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
  <h1 class="display rv" style="margin-top:16px">Welcome to your<br><em>print desk.</em></h1>
  <p class="muted rv" style="margin:12px 0 24px;max-width:36rem">Sign in to see your prints, track orders, and manage your account.</p>
  ${error ? `<p class="login-err rv" role="alert">${esc(error)}</p>` : ''}
  <form class="login-form rv" method="POST" action="/login/code-request">
    <p class="muted" style="font-size:13px;margin:0 0 14px">Use your email and we’ll send a one-time sign-in code. Guest print accounts work too.</p>
    <div class="field"><label for="codeEmail">Email</label><input id="codeEmail" name="email" type="email" required autocomplete="email" placeholder="you@example.com"></div>
    <button class="btn loud big" type="submit" style="width:100%"><span>Email me a sign-in code →</span></button>
  </form>
  <script>(function(){var f=document.querySelector('form[action="/login/code-request"]');if(!f||f.dataset.spin)return;f.dataset.spin='1';f.addEventListener('submit',function(){var b=f.querySelector('button[type="submit"]');if(b&&!b.disabled){b.setAttribute('disabled','true');var t=b.querySelector('span');if(t)t.textContent='Sending…';}});})();</script>
  ${googleOn ? `<div class="login-divider"><span>or</span></div><a class="btn solid login-google" href="/auth/google">Continue with Google <span aria-hidden="true">↗</span></a>` : ''}
  <details class="login-password-options">
    <summary>Have a password? Sign in with it</summary>
    <form class="login-form" method="POST" action="/login">
      <div class="field"><label for="email">Email</label><input id="email" name="email" type="email" required autocomplete="username" placeholder="you@example.in"></div>
      <div class="field"><label for="password">Password</label><input id="password" name="password" type="password" required autocomplete="current-password" placeholder="••••••••"></div>
      <button class="btn loud big" type="submit" style="width:100%"><span>Sign in →</span></button>
    </form>
  </details>
  ${demoOn ? `<details class="login-demo-options"><summary>Explore with a demo account</summary><div class="demo-grid">${cards}</div></details>` : ''}
  <p class="muted rv login-footnote">Shop staff? <a class="rowlink" href="/admin/login">Admin login</a> · <a class="rowlink" href="/order">Print without login →</a></p>
</main>
${pkPublicFooter()}
</div>
<div class="toast" id="toast"></div>
<script src="/shell.js?v=${ASSET_V}" defer></script>
<script>
document.querySelectorAll('.demo-card').forEach(function (c) {
  c.addEventListener('click', function () {
    document.querySelector('.login-password-options').open = true;
    document.querySelector('.login-demo-options').open = false;
    document.getElementById('email').value = c.dataset.email;
    document.getElementById('password').value = c.dataset.pass;
    document.querySelector('.login-password-options').scrollIntoView({ block: 'center' });
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
