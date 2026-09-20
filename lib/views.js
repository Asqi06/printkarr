// Server-rendered views — shared shell (PRD §4) + role login (§3).
// Every page carries the Demo Mode band; nav differs per role.

export function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

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
  rider: [
    ['Dashboard', '/rider'],
    ['Orders', '/rider/orders'],
    ['Earnings', '/rider/earnings'],
    ['Profile', '/rider/profile']
  ],
  admin: [
    ['Dashboard', '/admin'],
    ['Orders', '/admin/orders'],
    ['Print Queue', '/admin/print-queue'],
    ['Riders', '/admin/riders'],
    ['Customers', '/admin/customers'],
    ['Pricing', '/admin/pricing'],
    ['Coupons', '/admin/coupons'],
    ['Analytics', '/admin/analytics'],
    ['Settings', '/admin/settings']
  ]
};

const ROLE_TAG = {
  customer: 'Ordering · tracking · wallet',
  rider: 'Deliveries · earnings',
  admin: 'Control tower · printing · riders'
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
  const bottom = nav
    .map(([label, href]) => `<a href="${href}" class="${href === active ? 'live' : ''}"><span class="big">✷</span>${esc(label)}</a>`)
    .join('');
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)} — Printkarr</title>
<link rel="stylesheet" href="/design.css">
${extraCss ? `<link rel="stylesheet" href="${extraCss}">` : ''}
${extraHead || ''}
</head>
<body>
<div class="demoband"><span class="dot"></span> Demo Mode — ${esc(ROLE_TAG[user.role] || '')} · no real payments, prints or deliveries</div>
<div class="shell">
  <aside class="side">
    <a class="brand" href="/${esc(user.role)}"><i></i>Print<em>karr</em></a>
    <p class="eyebrow" style="margin-top:14px">${esc(user.role)} · ${esc(user.name)}</p>
    <nav class="snav">${side}</nav>
    <form method="POST" action="/logout" style="margin-top:auto;padding-top:16px">
      <button class="btn ghost" type="submit" style="width:100%">Log out →</button>
    </form>
  </aside>
  <main class="main">${body}</main>
</div>
<nav class="bottomnav">${bottom}</nav>
<div class="toast" id="toast"></div>
<script src="/shell.js" defer></script>
</body>
</html>`;
}

export function roleHome(user) {
  const next =
    user.role === 'customer'
      ? 'Ordering, tracking and wallet land in Phase 2.'
      : user.role === 'rider'
        ? 'Deliveries and earnings land in Phase 3.'
        : 'Queues, riders and pricing land in Phase 4.';
  const ctas =
    user.role === 'customer'
      ? `<a class="btn loud big" href="/customer/orders"><span>+ New Print Order</span></a>`
      : user.role === 'rider'
        ? `<a class="btn loud big" href="/rider/orders"><span>Today's deliveries</span></a>`
        : `<a class="btn loud big" href="/admin/orders"><span>Open order queue</span></a>`;
  return layout({
    title: 'Dashboard',
    user,
    active: `/${user.role}`,
    body: `
      <p class="eyebrow rv">Dashboard</p>
      <h1 class="display rv" style="font-size:clamp(2.2rem,6vw,4.4rem)">${greeting(user.name).replace(/, ([^,]+)$/, ', <em>$1</em>')}</h1>
      <p class="muted rv" style="margin:12px 0 22px;max-width:52ch">${esc(next)} This shell — sidebar, Demo Mode band, mobile nav — is Phase 1. Everything below is a live placeholder.</p>
      <div class="rv">${ctas}</div>
      <div class="grid c3" style="margin-top:22px">
        <div class="card sun rv"><div class="stat"><div class="v">P1</div><div class="k">Auth + shell · live</div></div></div>
        <div class="card rv"><div class="stat"><div class="v">${esc(user.role)}</div><div class="k">Signed in as ${esc(user.email)}</div></div></div>
        <div class="card ink rv"><div class="stat"><div class="v"><em>Demo</em></div><div class="k">Mock data · simulated flows</div></div></div>
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
  { role: 'customer', name: 'Customer', glyph: '◍', email: 'customer@demo.printkarr.in', password: 'customer123', blurb: 'Order prints, track delivery, wallet.' },
  { role: 'rider', name: 'Rider', glyph: '➤', email: 'rider@demo.printkarr.in', password: 'rider123', blurb: 'Pickups, drops, earnings.' },
  { role: 'admin', name: 'Printer / Admin', glyph: '▣', email: 'admin@demo.printkarr.in', password: 'admin123', blurb: 'Queues, riders, pricing.' }
];

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
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Log in — Printkarr</title>
<link rel="stylesheet" href="/design.css">
<link rel="stylesheet" href="/login.css">
</head>
<body>
<div class="demoband"><span class="dot"></span> Demo Mode — no real payments, prints or deliveries</div>
<main class="login-wrap">
  <p class="eyebrow rv">Printkarr · Vapi — Sarigam — Bhilad</p>
  <h1 class="display rv">Print.<br>Deliver. <em>Done.</em></h1>
  ${demoOn
    ? `<p class="muted rv" style="margin:10px 0 24px">Choose a role — each card fills the demo login instantly.</p>`
    : `<p class="muted rv" style="margin:10px 0 24px">Sign in with your shop account, or continue with Google.</p>`}
  ${error ? `<p class="login-err rv" role="alert">${esc(error)}</p>` : ''}
  ${demoOn ? `<div class="demo-grid">${cards}</div>` : ''}
  ${googleOn ? `<a class="btn loud big rv" style="width:100%;margin-bottom:14px" href="/auth/google"><span>Continue with Google →</span></a>` : ''}
  <form class="login-form rv" method="POST" action="/login">
    <div class="field"><label for="email">Email</label><input id="email" name="email" type="email" required autocomplete="username" placeholder="you@example.in"></div>
    <div class="field"><label for="password">Password</label><input id="password" name="password" type="password" required autocomplete="current-password" placeholder="••••••••"></div>
    <button class="btn loud big" type="submit" style="width:100%"><span>Sign in →</span></button>
  </form>
  <form class="login-form rv" style="margin-top:14px" method="POST" action="/login/otp-request">
    <p class="eyebrow" style="margin-bottom:10px">No password? Use your phone</p>
    <div class="field"><label for="otpphone">Mobile number</label><input id="otpphone" name="phone" required inputmode="numeric" placeholder="98250 11111" maxlength="13"></div>
    <button class="btn sun big" type="submit" style="width:100%"><span>Text me a code →</span></button>
  </form>
  <p class="muted mono rv" style="font-size:11px;margin-top:18px">Rider? <a class="rowlink" href="/rider/login">Rider login</a> · Shop staff? <a class="rowlink" href="/admin/login">Admin login</a></p>
</main>
<div class="toast" id="toast"></div>
<script src="/shell.js" defer></script>
<script>
document.querySelectorAll('.demo-card').forEach(function (c) {
  c.addEventListener('click', function () {
    document.getElementById('email').value = c.dataset.email;
    document.getElementById('password').value = c.dataset.pass;
    toast('Demo account filled — hit Enter the demo');
  });
});
</script>
</body>
</html>`;
}

export function loginOtpPage(phone, demoCode, error) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Enter code — Printkarr</title>
<link rel="stylesheet" href="/design.css">
<link rel="stylesheet" href="/login.css">
</head>
<body>
<div class="demoband"><span class="dot"></span> Demo Mode — no real payments, prints or deliveries</div>
<main class="login-wrap" style="max-width:560px">
  <p class="eyebrow rv">Customer login · ${esc(phone)}</p>
  <h1 class="display rv" style="font-size:clamp(2rem,6vw,3.4rem)">The 6-digit<br><em>code.</em></h1>
  ${demoCode ? `<div class="card sun rv" style="margin-top:14px"><b class="mono">Demo mode — your code is ${esc(demoCode)}</b></div>` : `<p class="muted rv" style="margin-top:10px;font-size:13px">Sent by SMS just now.</p>`}
  ${error ? `<p class="login-err rv" role="alert">${esc(error)}</p>` : ''}
  <form class="card rv" style="margin-top:14px" method="POST" action="/login/otp-verify">
    <input type="hidden" name="phone" value="${esc(phone)}">
    <div class="field"><label for="cc">Code</label><input id="cc" name="code" required inputmode="numeric" autocomplete="one-time-code" placeholder="••••••" maxlength="6" style="font-size:1.6rem;letter-spacing:.4em;text-align:center"></div>
    <button class="btn loud big" type="submit" style="width:100%"><span>Sign in →</span></button>
  </form>
  <p class="muted mono rv" style="font-size:11px;margin-top:12px"><a class="rowlink" href="/login">← Back to login</a></p>
</main>
<div class="toast" id="toast"></div>
<script src="/shell.js" defer></script>
</body>
</html>`;
}

export function staffLoginPage(role, error) {
  const title = role === 'rider' ? 'Rider' : 'Shop admin';
  const action = role === 'rider' ? '/rider/login' : '/admin/login';
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${title} login — Printkarr</title>
<link rel="stylesheet" href="/design.css">
<link rel="stylesheet" href="/login.css">
</head>
<body>
<div class="demoband"><span class="dot"></span> Demo Mode — no real payments, prints or deliveries</div>
<main class="login-wrap" style="max-width:560px">
  <p class="eyebrow rv">Staff access</p>
  <h1 class="display rv" style="font-size:clamp(2rem,6vw,3.6rem)">${title}<br><em>login.</em></h1>
  ${error ? `<p class="login-err rv" role="alert">${esc(error)}</p>` : ''}
  <form class="login-form rv" style="margin-top:18px" method="POST" action="${action}">
    <div class="field"><label for="email">Email</label><input id="email" name="email" type="email" required autocomplete="username"></div>
    <div class="field"><label for="password">Password</label><input id="password" name="password" type="password" required autocomplete="current-password"></div>
    <button class="btn loud big" type="submit" style="width:100%"><span>Sign in →</span></button>
  </form>
  <p class="muted mono rv" style="font-size:11px;margin-top:12px">Customer? <a class="rowlink" href="/login">Customer login</a></p>
</main>
<div class="toast" id="toast"></div>
<script src="/shell.js" defer></script>
</body>
</html>`;
}
