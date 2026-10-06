// Server-rendered views — shared shell + role login.

export function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Bump when public/*.css or public/*.js changes — forces browsers past the 1h static cache.
export const ASSET_V = '20261006-colour-packs';

// Bind beside the form: uploads must not wait for deferred animation libraries.
export function uploadScript(auto = false) {
  return `<script>(function(){
    var input=document.getElementById('doc'), form=input.form, button=form.querySelector('[type="submit"]'), label=button.querySelector('span'), status=document.getElementById('fname'), original=label.textContent, busy=false, timer;
    status.setAttribute('role','status');
    function reset(){busy=false;clearTimeout(timer);form.removeAttribute('aria-busy');button.disabled=false;label.textContent=original;status.textContent=input.files[0]?input.files[0].name:'';}
    input.addEventListener('change',function(){
      input.setCustomValidity('');
      var file=input.files[0];status.textContent=file?file.name:'';
      if(!file)return;
      if(file.size>Number(form.dataset.maxMb)*1024*1024){input.setCustomValidity('Choose a file no larger than '+form.dataset.maxMb+' MB.');input.reportValidity();return;}
      ${auto ? 'form.requestSubmit();' : ''}
    });
    form.addEventListener('submit',function(event){
      if(busy){event.preventDefault();return;}
      busy=true;form.setAttribute('aria-busy','true');button.disabled=true;label.textContent='Uploading & counting pages…';status.textContent='Your file is uploading. Your price will appear when it is ready.';
      timer=setTimeout(function(){status.textContent='Still processing your file. Keep this page open; larger PDFs or a slow connection can take a little longer.';},8000);
    });
    window.addEventListener('pageshow',function(event){if(event.persisted)reset();});
  })();</script>`;
}

export const THEME_SCRIPTS = `<script src="/vendor/motion-12.23.24.js" defer></script><script src="/design-motion.js?v=${ASSET_V}" defer></script>`;
export function icon(name) {
  return `<svg class="ui-icon" width="20" height="20" aria-hidden="true"><use href="/icons.svg?v=${ASSET_V}#${name}"></use></svg>`;
}

export function greeting(name) {
  const h = new Date().getHours();
  const part = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
  return `Good ${part}, ${esc(name)}`;
}

const NAVS = {
  customer: [
    ['Home', '/customer'],
    ['Nearby shops', '/shops'],
    ['Print', '/customer/orders/new'],
    ['Stationery', '/stationery'],
    ['Orders', '/customer/orders'],
    ['Wallet', '/customer/wallet'],
    ['My Account', '/customer/profile'],
    ['Notifications', '/customer/notifications'],
    ['Cart', '/cart'],
    ['Purchases', '/customer/purchases'],
    ['Refer & Earn', '/customer/referrals'],
    ['Packs', '/customer/packs']
  ],
  admin: [
    ['Dashboard', '/admin'],
    ['Notifications', '/admin/notifications'],
    ['Orders', '/admin/orders'],
    ['Print Queue', '/admin/print-queue'],
    ['Stationery', '/admin/catalogue'],
    ['Purchases', '/admin/purchases'],
    ['Partner shops', '/admin/partners'],
    ['Delivery batches', '/admin/delivery'],
    ['Packs', '/admin/packs'],
    ['Referrals', '/admin/referrals'],
    ['Customers', '/admin/customers'],
    ['Pricing', '/admin/pricing'],
    ['Coupons', '/admin/coupons'],
    ['Analytics', '/admin/analytics'],
    ['Settings', '/admin/settings']
  ],
  partner: [['Shop orders', '/partner'], ['My stationery', '/partner/catalogue']],
  rider: [['Delivery trips', '/rider']]
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
    <p class="eyebrow">Confirm your delivery location</p>
    <p class="muted">Use your location or move the map to your address, then select the centre so the rider can find you.</p>
    <div class="delivery-map" data-delivery-map tabindex="0" aria-label="Select delivery destination on map"></div>
    <button type="button" class="rowlink" data-use-location>Use my current location</button><button type="button" class="rowlink" data-use-centre>Select map centre</button>
    <p class="field-hint" data-delivery-status role="status">Select your delivery location to continue.</p>
    <input type="hidden" name="deliveryLat"><input type="hidden" name="deliveryLng">
  </div>`;
}

export function layout({ title, user, active, body, extraCss, extraHead, focused = false, back }) {
  if (focused) return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><title>${esc(title)} — PrintKarr</title><meta name="robots" content="noindex,nofollow"><link rel="icon" href="/favicon.ico?v=${ASSET_V}"><link rel="preload" href="/fonts/dm-sans-latin.woff2" as="font" type="font/woff2" crossorigin><link rel="stylesheet" href="/design.css?v=${ASSET_V}"><link rel="stylesheet" href="/customer.css?v=${ASSET_V}"><link rel="stylesheet" href="/order-flow.css?v=${ASSET_V}">${extraCss && extraCss !== '/customer.css' ? `<link rel="stylesheet" href="${extraCss}?v=${ASSET_V}">` : ''}<link rel="stylesheet" href="/site-overhaul.css?v=${ASSET_V}">${(extraHead || '').replaceAll(' defer',' async')}<script src="/order-flow.js?v=${ASSET_V}" defer></script><script type="module" src="/print-options.js?v=${ASSET_V}"></script></head><body class="order-focus"><header class="order-header"><a class="order-back" href="${esc(back || (user ? '/customer' : '/'))}" aria-label="Go back">←</a><a class="pk-logo" href="/">Print<span class="b">Karr</span></a><a href="/contact">Help</a></header><main id="main" class="order-main">${body}</main><footer class="order-footer"><a href="/terms">Terms</a><a href="/privacy">Privacy</a><a href="/contact">Help</a></footer></body></html>`;
  const nav = NAVS[user.role] || [];
  const mobileIcons = { '/stationery': 'stack', '/customer': 'house', '/customer/orders/new': 'printer', '/customer/orders': 'receipt', '/customer/wallet': 'wallet', '/customer/profile': 'user-circle', '/customer/referrals': 'gift', '/customer/packs': 'stack', '/admin': 'squares-four', '/admin/orders': 'receipt', '/admin/print-queue': 'printer', '/admin/packs': 'stack', '/admin/referrals': 'gift', '/admin/customers': 'users', '/admin/pricing': 'tag', '/admin/coupons': 'tag', '/admin/analytics': 'chart-line-up', '/admin/settings': 'gear-six', '/shops':'map-pin', '/cart':'stack', '/customer/purchases':'receipt', '/customer/notifications':'bell', '/admin/notifications':'bell', '/admin/catalogue':'stack', '/admin/purchases':'receipt', '/admin/partners':'users', '/admin/delivery':'map-pin', '/partner':'printer', '/partner/catalogue':'stack', '/rider':'map-pin' };
  const side = nav
    .map(([label, href], index) => `${index === 0 ? '<span class="nav-section">' + (user.role === 'customer' ? 'Order &amp; deliver' : 'Workspace') + '</span>' : href === '/customer/wallet' || href === '/admin/packs' ? '<span class="nav-section">' + (user.role === 'customer' ? 'Your account' : 'Business') + '</span>' : ''}<a href="${href}" class="${href === active ? 'live' : ''}" ${['/customer/orders/new','/stationery','/customer/orders','/customer/profile'].includes(href) ? 'data-mobile-primary' : ''} ${href === active ? 'aria-current="page"' : ''}>${mobileIcons[href] ? `<span class="nav-icon" aria-hidden="true">${icon(mobileIcons[href])}</span>` : ''}<span>${esc(label)}</span></a>`)
    .join('');
  const fonts = `<link rel="preload" href="/fonts/dm-sans-latin.woff2" as="font" type="font/woff2" crossorigin>`;
  const icons = `<link rel="icon" href="/favicon.ico?v=${ASSET_V}"><link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png?v=${ASSET_V}"><link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png?v=${ASSET_V}"><link rel="apple-touch-icon" href="/apple-touch-icon.png?v=${ASSET_V}"><link rel="manifest" href="/site.webmanifest?v=${ASSET_V}">`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)} — PrintKarr</title>
<meta name="robots" content="noindex,nofollow">
${icons}
${fonts}
<link rel="stylesheet" href="/design.css?v=${ASSET_V}">
${extraCss ? `<link rel="stylesheet" href="${extraCss}?v=${ASSET_V}">` : ''}
${extraHead || ''}
<link rel="stylesheet" href="/site-overhaul.css?v=${ASSET_V}">
</head>
<body class="app-view app-${esc(user.role)}" data-page="${esc(active || '')}" data-notification-user="${esc(user.id)}" data-notification-role="${esc(user.role)}">
<div class="pk-page">
<div id="offlineBanner" style="display:none;position:fixed;top:0;left:0;right:0;z-index:9999;background:#c2410c;color:#fff;font-size:12px;text-align:center;padding:8px;letter-spacing:.06em">You are offline. Reconnect before submitting your order.</div>
<header class="pk-header"><div class="pk-header-inner">
  <div class="workspace-brand"><a class="pk-logo" href="/${esc(user.role)}" aria-label="PrintKarr home"><span class="w">Print</span><span class="b">Karr</span></a><span class="workspace-label">${({admin:'Operations',partner:'Shop workspace',rider:'Delivery workspace'})[user.role] || 'Your print desk'}</span></div>
  <div class="pk-header-cta">
    ${['customer','admin'].includes(user.role) ? `<a class="pk-contact" href="/${esc(user.role)}/notifications">Alerts <span data-notification-count aria-label="Unread notifications">0</span></a>` : ''}
    ${user.role === 'admin' ? '<button class="pk-contact" type="button" data-notification-sound aria-pressed="false">Enable sound</button>' : ''}
    <span class="account-name"><span class="account-avatar" aria-hidden="true">${esc(user.name?.charAt(0) || 'P')}</span>${esc(user.name)}</span>
    <details class="app-account-menu"><summary>Menu</summary><div class="app-account-popover">${user.role === 'customer' ? '<a href="/stationery">Stationery</a><a href="/cart">Cart</a><a href="/customer/purchases">Purchases</a><a href="/customer/profile">My Account &amp; addresses</a><a href="/customer/wallet">Wallet &amp; top-up</a><a href="/customer/referrals">Refer &amp; Earn</a><a href="/customer/packs">Semester packs</a>' : nav.map(([label, href]) => `<a href="${href}">${esc(label)}</a>`).join('')}<a href="/">Visit website</a><a href="/terms">Terms</a><a href="/privacy">Privacy</a><form method="POST" action="/logout"><button type="submit">Log out</button></form></div></details>
    <form method="POST" action="/logout" style="display:inline"><button class="pk-contact" type="submit">Log out</button></form>
  </div>
</div></header>
<div class="app-workspace"><aside class="app-sidebar"><p class="eyebrow">${user.role === 'customer' ? 'Your workspace' : 'Manage PrintKarr'}</p><nav class="snav" aria-label="Workspace">${side}</nav><a class="sidebar-print btn loud" href="${user.role === 'customer' ? '/customer/orders/new' : '/' + user.role}">${icon(user.role === 'customer' ? 'upload-simple' : 'squares-four')}${user.role === 'customer' ? 'New print' : 'Open workspace'}</a><a class="rowlink sidebar-website" href="/">Visit website ${icon('arrow-up-right')}</a></aside><main id="main" class="main"><div class="workspace-breadcrumb"><a href="/${esc(user.role)}">${({admin:'Operations',partner:'Shop workspace',rider:'Delivery workspace'})[user.role] || 'Your print desk'}</a><span aria-hidden="true">/</span><span>${esc(title)}</span></div>${body}</main></div>
<footer class="pk-footer"><div class="pk-footer-grid">
  <div><a class="pk-logo" href="/"><span class="w">Print</span><span class="b">Karr</span></a>
  <p class="muted" style="margin-top:16px;max-width:32rem;font-size:14px;line-height:1.6">Your everyday print desk. Upload, choose your prints and get them delivered.</p></div>
  <div><h4>Product</h4><ul><li><a href="/order">Print now</a></li><li><a href="/customer/orders">Track order</a></li><li><a href="/customer/wallet">Wallet</a></li></ul></div>
  <div><h4>Company</h4><ul><li><a href="/about">About</a></li><li><a href="/how-it-works">How it works</a></li><li><a href="/franchise">Franchise</a></li><li><a href="/contact">Contact</a></li></ul></div>
</div><div class="pk-footer-bottom"><p>© ${new Date().getFullYear()} PrintKarr · PrintKarr Technologies Private Limited</p><div style="display:flex;gap:16px"><a href="/terms">Terms</a><a href="/privacy">Privacy</a></div></div></footer>
</div>

<div class="toast" id="toast"></div>
${THEME_SCRIPTS}<script src="/shell.js?v=${ASSET_V}" defer></script>
<script src="/notifications.js?v=${ASSET_V}" defer></script>
<script>(function(){const b=document.getElementById('offlineBanner');function upd(){b.style.display=navigator.onLine?'none':'block';}window.addEventListener('online',upd);window.addEventListener('offline',upd);upd();window.kioskChime=function(){try{const c=new (window.AudioContext||window.webkitAudioContext)();const o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.value=880;g.gain.value=0.12;o.connect(g);g.connect(c.destination);o.start();setTimeout(()=>{o.frequency.value=1320;},120);setTimeout(()=>{g.gain.exponentialRampToValueAtTime(0.0001,c.currentTime+0.3);o.stop();},400);}catch{}};})();</script>
</body>
</html>`;
}

export function roleHome(user) {
  const next =
    user.role === 'customer'
      ? 'Ordering, tracking and wallet — upload, choose delivery and track your prints.'
      : 'Queue, print console and pricing — your delivery operations desk.';
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

export function pkPublicHead(title) {
  return `<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)} — PrintKarr</title>
<meta name="robots" content="noindex,nofollow">
<link rel="icon" href="/favicon.ico?v=${ASSET_V}">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png?v=${ASSET_V}">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png?v=${ASSET_V}">
<link rel="apple-touch-icon" href="/apple-touch-icon.png?v=${ASSET_V}">
<link rel="manifest" href="/site.webmanifest?v=${ASSET_V}">
<link rel="preload" href="/fonts/dm-sans-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/design.css?v=${ASSET_V}">
<link rel="stylesheet" href="/login.css?v=${ASSET_V}">
<link rel="stylesheet" href="/site-overhaul.css?v=${ASSET_V}">`;
}

export function pkPublicHeader(active = '') {
  const primary = [['/shops', 'Nearby shops'], ['/#how-it-works', 'How it works'], ['/printing-prices', 'Pricing'], ['/stationery', 'Stationery']];
  const mobile = [['/order', 'Print now'], ['/cart', 'Cart'], ['/customer/wallet', 'Wallet / Top-up'], ['/customer/profile', 'My Account'], ['/customer/orders', 'My Orders'], ...primary, ['/about', 'About'], ['/contact', 'Contact'], ['/blogs', 'Journal']];
  return `<header class="site-header"><div class="site-header-inner">
    <a class="pk-logo" href="/" aria-label="PrintKarr home"><span class="w">Print</span><span class="b">Karr</span></a>
    <nav class="site-links" aria-label="Primary">${primary.map(([href, label]) => `<a href="${href}" ${href === active ? 'aria-current="page"' : ''}>${label}</a>`).join('')}</nav>
    <nav class="header-actions" aria-label="Your account"><a href="/cart" class="account-link">Cart</a><a href="/customer/wallet" class="header-wallet" aria-label="Wallet &amp; top-up">${icon('wallet')}<span>Wallet</span></a><a href="/customer/profile" class="account-link">My Account</a><a href="/order" class="${['/stationery','/cart'].includes(active) ? 'account-link' : 'btn loud'}">Print now ${icon('arrow-up-right')}</a></nav>
    <details class="mobile-menu"><summary aria-label="Open navigation">Menu ${icon('arrow-down')}</summary><nav aria-label="Mobile navigation">${mobile.map(([href, label]) => `<a href="${href}" ${href === active ? 'aria-current="page"' : ''}>${label}</a>`).join('')}</nav></details>
  </div></header><nav class="customer-mobile-nav" aria-label="Customer pages">${[['/order', 'Print', 'printer'], ['/stationery', 'Stationery', 'stack'], ['/customer/orders', 'Orders', 'receipt'], ['/customer/profile', 'My Account', 'user-circle']].map(([href, label, glyph]) => `<a href="${href}" ${href === active ? 'aria-current="page"' : ''}>${icon(glyph)}<span>${label}</span></a>`).join('')}</nav>`;
}

export function pkPublicFooter() {
  return `<footer class="pk-footer"><div class="pk-footer-grid">
  <div><a class="pk-logo" href="/"><span class="w">Print</span><span class="b">Karr</span></a>
    <p class="muted" style="margin-top:16px;max-width:24rem;font-size:14px;line-height:1.6">Order prints online any time. Delivery in Vapi and Daman, with slots confirmed in checkout. School and college delivery across supported local coverage. Kiosks planned in Vapi.</p>
    </div>
  <div><h4>PrintKarr</h4><ul><li><a href="/printing-in-vapi">Printing in Vapi</a></li><li><a href="/printing-in-daman">Printing in Daman</a></li><li><a href="/printing-prices">Printing prices</a></li><li><a href="/how-it-works">How it works</a></li><li><a href="/about">Built in Vapi</a></li><li><a href="/blogs">Stories</a></li><li><a href="/contact">Contact</a></li></ul><h4 style="margin-top:24px">Partners</h4><ul><li><a href="/franchise">Kiosks · Coming soon</a></li><li><a href="/xerox">Become a shop partner</a></li></ul></div>
  <div><h4>Your print desk</h4><ul><li><a href="/order">Start a print</a></li><li><a href="/stationery">Shop stationery</a></li><li><a href="/customer/orders">Track your order</a></li><li><a href="/customer/wallet">Wallet / Top-up</a></li><li><a href="/customer/profile">My Account</a></li><li><a href="mailto:team@printkarr.in">team@printkarr.in</a></li></ul></div>
</div><div class="footer-wordmark" aria-hidden="true">PrintKarr.</div><div class="pk-footer-bottom"><p>© ${new Date().getFullYear()} PrintKarr · PrintKarr Technologies Private Limited</p><div style="display:flex;gap:16px"><a href="/terms">Terms &amp; Conditions</a><a href="/privacy">Privacy Policy</a></div></div></footer>`;
}

export function loginPage(error, googleOn) {
  return `<!DOCTYPE html>
<html lang="en">
<head>${pkPublicHead('Sign in')}</head>
<body class="signin-site"><div class="pk-page">
${pkPublicHeader()}
<main class="login-wrap customer-signin" id="main"><section class="signin-panel"><p class="eyebrow">YOUR EVERYDAY PRINT DESK</p>
  <h1 class="display rv">Your <em>print desk.</em></h1>
  <p class="muted rv signin-description">Sign in to track orders, top up your wallet, and manage your account.</p>
  ${error ? `<p class="login-err" role="alert">${esc(error)}</p>` : ''}
  ${googleOn ? `<a class="login-google" href="/auth/google"><img src="/icons/google.png" width="20" height="20" alt="">Continue with Google</a>` : '<p class="login-err" role="status">Google sign-in is temporarily unavailable. Please try again later.</p>'}
  <p class="signin-note">No new password to remember.</p>
  <a class="rowlink signin-guest" href="/order">Print without signing in ${icon('arrow-right')}</a></section><aside class="signin-visual"><img src="/images/print-desk-hero-v2.webp" width="1122" height="1402" alt="Printed notes ready for your next class"><h2>Your pages. Your place.</h2><p>School, college, home or office.<br>Prints and stationery, delivered locally.</p></aside>
</main>
${pkPublicFooter()}
</div>
${THEME_SCRIPTS}<script src="/shell.js?v=${ASSET_V}" defer></script>
</body></html>`;
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
<body class="signin-site"><div class="pk-page">
${pkPublicHeader()}
<main id="main" class="login-wrap" style="max-width:560px">
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
${THEME_SCRIPTS}<script src="/shell.js?v=${ASSET_V}" defer></script>
</body>
</html>`;
}

export function staffLoginPage(role, error) {
  const title = role === 'partner' ? 'Shop partner' : role === 'rider' ? 'Delivery rider' : 'Shop admin';
  const action = '/' + role + '/login';
  return `<!DOCTYPE html>
<html lang="en">
<head>
${pkPublicHead(title + ' login')}
</head>
<body class="signin-site"><div class="pk-page">
${pkPublicHeader()}
<main id="main" class="login-wrap" style="max-width:560px">
  <span class="pill rv">Staff access</span>
  <h1 class="display rv" style="font-size:clamp(2rem,6vw,3.6rem);margin-top:16px">${title}<br><em>login.</em></h1>
  ${error ? `<p class="login-err rv" role="alert">${esc(error)}</p>` : ''}
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
${THEME_SCRIPTS}<script src="/shell.js?v=${ASSET_V}" defer></script>
</body>
</html>`;
}
