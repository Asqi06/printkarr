// Public conversion funnel + marketing pages — Grok workspace design port.
// No login walls before price. Auth happens once, at OTP time.
import { esc, ASSET_V } from './views.js';

const rs = (n) => '₹' + (Math.round(n * 100) / 100);
const PHONE = '+91 90167 03180';
const EMAIL = 'team@printkarr.in';

function topNav(active) {
  const a = (href) => href === active ? 'live' : '';
  return `
<header class="pk-topnav-wrap">
  <div class="pk-mbar">
    <a class="pk-logo" href="/" aria-label="PrintKarr home"><span class="w">Print</span><span class="b">Karr</span></a>
    <span class="pk-mbar-cta"><a class="pk-contact" href="/contact">Contact us</a><a class="ihb" href="/order"><span class="ihb-row"><span class="ihb-dot"></span><span class="ihb-t1">Print now</span></span><span class="ihb-t2" aria-hidden="true"><span>Print now</span><svg class="ihb-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span></a></span>
  </div>
  <nav class="pk-topnav" aria-label="Primary">
  <a href="/about" class="${a('/about')}">About Us</a>
  <a href="/how-it-works" class="${a('/how-it-works')}">Features</a>
  <a href="/" class="home"><span style="color:var(--navy)">Print</span><span>Karr</span></a>
  <a href="/franchise" class="${a('/franchise')}">Franchise</a>
  <a href="/contact" class="contact-link ${a('/contact')}">Contact us</a>
  <a href="/order" class="cta">Print now</a>
</nav></header>`;
}

function shell({ title, body, desc, active }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)} — PrintKarr</title>
<meta name="description" content="${esc(desc || "PrintKarr — India's 24/7 self-service instant printing kiosk. Scan, upload, print in under 60 seconds.")}">
<meta name="theme-color" content="#071833">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="/design.css?v=${ASSET_V}">
<link rel="stylesheet" href="/customer.css?v=${ASSET_V}">
</head>
<body><div class="pk-page">
${topNav(active)}
<a href="#main" style="position:absolute;left:-9999px" onfocus="this.style.left='16px';this.style.top='16px';this.style.zIndex=99;this.style.background='var(--navy)';this.style.color='#fff';this.style.padding='8px 16px';this.style.borderRadius='99px'" onblur="this.style.left='-9999px'">Skip to content</a>
<main id="main">${body}</main>
<footer class="pk-footer"><div class="pk-footer-grid">
  <div><a class="pk-logo" href="/"><span class="w">Print</span><span class="b">Karr</span></a>
    <p class="muted" style="margin-top:16px;max-width:24rem;font-size:14px;line-height:1.6">India's first &amp; only self-service printing vending kiosk. Instant, private, 24/7 — no shop, no queue, no USB.</p>
    <p style="margin-top:16px;font-size:14px">Have a Xerox shop? Join the modern way of running a print desk.</p>
    <a class="ihb" style="margin-top:12px" href="/xerox"><span class="ihb-row"><span class="ihb-dot"></span><span class="ihb-t1">View details</span></span><span class="ihb-t2" aria-hidden="true"><span>View details</span><svg class="ihb-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span></a></div>
  <div><h4>Navigation</h4><ul><li><a href="/xerox">Xerox Shops</a></li><li><a href="/how-it-works">How it works</a></li><li><a href="/franchise">Franchise</a></li><li><a href="/contact">Contact Us</a></li><li><a href="/blogs">Blogs</a></li></ul></div>
  <div><h4>Social</h4><ul><li><a href="https://x.com">Twitter / X</a></li><li><a href="https://instagram.com">Instagram</a></li><li><a href="https://maps.google.com">Google Business</a></li><li><a href="https://linkedin.com">LinkedIn</a></li></ul></div>
</div><div class="pk-footer-bottom"><p>© ${new Date().getFullYear()} PrintKarr · PrintKarr Technologies Private Limited</p><div style="display:flex;gap:16px"><a href="/terms">Terms &amp; Conditions</a><a href="/privacy">Privacy Policy</a></div></div></footer>
</div>
<nav class="dock" aria-label="Quick actions"><a class="dock-icon" href="/" aria-label="Home" title="Home"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></a><a class="dock-icon" href="/order" aria-label="Price estimator" title="Price estimator"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><line x1="16" x2="16" y1="14" y2="18"/><path d="M16 10h.01"/><path d="M12 10h.01"/><path d="M8 10h.01"/><path d="M12 14h.01"/><path d="M8 14h.01"/><path d="M12 18h.01"/><path d="M8 18h.01"/></svg></a><a class="dock-icon" href="/customer/orders" aria-label="Track order" title="Track order"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/><path d="M12 22V12"/><path d="m3.3 7 8.703 5.34a2 2 0 0 0 1.994 0L20.7 7"/><path d="m7.5 4.27 9 5.15"/></svg></a><span class="dock-sep" aria-hidden="true"></span><a class="dock-icon" href="https://wa.me/919016703180?text=${encodeURIComponent('Hi Printkarr! I need help with printing.')}" target="_blank" rel="noopener" aria-label="WhatsApp us" title="WhatsApp us"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg></a></nav>
<div class="toast" id="toast"></div>
<script src="/shell.js?v=${ASSET_V}" defer></script>
</body>
</html>`;
}

const topbar = topNav('');
export { topNav };

function stepsHtml() {
  const steps = [
    { n: '01', t: 'Scan the Kiosk QR', d: 'Each PrintKarr machine has its own unique QR — scan it with your mobile camera.', tag: 'Scan with camera' },
    { n: '02', t: 'Upload Your Document', d: 'Choose your file from phone, laptop, or Drive. No sign-up required.', tag: 'No sign-up' },
    { n: '03', t: 'Set Print Preference', d: 'Set copies, B&W or colour, duplex, and orientation before you pay.', tag: 'B&W · Colour · Duplex' },
    { n: '04', t: 'Get Your Print Instantly', d: 'Enter the 4-digit OTP or scan the dynamic QR to collect your print.', tag: '4-digit OTP' },
  ];
  const rows = steps.map((s, i) => `<article class="pk-feed-row rv" style="--d:${(0.05 + i * 0.1).toFixed(2)}s"><span class="pk-feed-ic">${s.n}</span><span class="pk-feed-tx"><b>${s.t}<i>· STEP ${i + 1}</i></b><p>${s.d}</p></span><span class="tag">${s.tag}</span></article>`).join('');
  const nodes = [
    { t: 'User Phone', icon: '<rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/>' },
    { t: 'WhatsApp / Upload', icon: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>' },
    { t: 'Cloud Processing', icon: '<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>' },
    { t: 'Kiosk', icon: '<path d="M6 9V3h12v6"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/>' },
  ];
  const flow = `<p class="pk-flow-cap rv">Your file’s journey</p><div class="pk-flow rv"><svg class="pk-beam" aria-hidden="true"></svg><div class="pk-flow-row">${nodes.map((n) => `<div class="pk-node"><span class="ball"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${n.icon}</svg></span><span>${n.t}</span></div>`).join('')}</div></div>`;
  return `<div class="pk-feed">${rows}</div>${flow}`;
}

function featuresHtml() {
  const cards = [
    ['🔒', 'Your Documents Are Completely Safe', 'Files are encrypted, never shared, and auto-deleted after printing. Only you can access them.'],
    ['⏱', 'Print in Under 60 Seconds', 'From scanning the kiosk QR to collecting your print — lightning-fast and seamless.'],
    ['◷', 'Always Available — 24/7', 'Print even when shops are shut — early mornings, late nights, weekends, holidays.'],
    ['★', 'India’s Only Self-Service Print Solution', 'No shop visits. No waiting in line. Print directly from your phone — anytime.'],
    ['▣', '100% Contactless & Hassle-Free', 'No shared devices, no pen drives, no staff needed. Just scan, upload & print.'],
    ['◍', 'Perfect for Students, Professionals & Travellers', 'Last-minute assignment, ticket, or ID proof? PrintKarr has your back.'],
  ];
  return `<div class="pk-features">${cards.map(([i, t, d]) => `<article class="pk-feature rv"><span class="fic">${i}</span><h3>${t}</h3><p>${d}</p></article>`).join('')}</div>`;
}

function compareHtml() {
  const left = ['Limited working hours', 'Long queues and delayed service', 'Files often visible to shop staff', 'Shopkeepers often download to print', 'Requires staff interaction'];
  const right = ['24×7 access', 'Instant prints under 60 seconds', 'Private, encrypted & auto-deleted', 'No one downloads your file', 'No human interaction needed'];
  return `<div class="pk-compare rv"><div><h3 style="color:var(--muted)">Traditional Print Shops</h3><ul>${left.map((t) => `<li><span class="x">✕</span><span class="muted">${t}</span></li>`).join('')}</ul></div><div class="right"><h3 style="color:var(--primary)">PrintKarr</h3><ul>${right.map((t) => `<li><span class="c">✓</span><span>${t}</span></li>`).join('')}</ul></div></div>`;
}

function hostBannerHtml() {
  return `<section class="pk-host rv"><div class="txt"><h2 class="display" style="font-size:clamp(1.6rem,3.5vw,2.4rem)">Want to offer 24/7 printing to students, employees, or visitors?</h2><p class="sub">Host your own PrintKarr machine in your college, hostel, co-working space or public area.</p><a class="ihb" style="margin-top:24px" href="/contact"><span class="ihb-row"><span class="ihb-dot"></span><span class="ihb-t1">Request Installation</span></span><span class="ihb-t2" aria-hidden="true"><span>Request Installation</span><svg class="ihb-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span></a></div><div class="img"><img src="/images/host-cta.jpg" alt="Student requesting a print from her phone" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block"></div></section>`;
}

export function landing({ pagesWeek, pricing, queueDepth }) {
  const minRate = Math.min(pricing.bw, pricing.studentBw);
  return shell({
    active: '/',
    title: 'Meet PrintKarr — Anytime, Anywhere Instant Printing Kiosk',
    body: `
    <div style="max-width:72rem;margin:0 auto;padding:110px 16px 0">
      <section class="pk-hero rv"><svg class="igp" aria-hidden="true"><g class="igp-cells"></g></svg>
        <div class="pk-hero-inner">
          <span class="pill">✦ India's First, Smartest, Fastest &amp; Only</span>
          <h1 class="display" style="margin-top:20px">Meet <span class="blue sparkles">PrintKarr</span>, Your Anytime, Anywhere Instant Printing Kiosk</h1>
          <p class="muted" style="margin-top:12px"><span data-tick="${pagesWeek}">${pagesWeek}</span>+ pages this week · ${queueDepth} in queue · from ${rs(minRate)}/page</p>
          <div class="pk-hero-ctas"><a class="ihb" href="/order"><span class="ihb-row"><span class="ihb-dot"></span><span class="ihb-t1">Print now — see price</span></span><span class="ihb-t2" aria-hidden="true"><span>Print now — see price</span><svg class="ihb-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span></a><a class="ihb" href="/franchise"><span class="ihb-row"><span class="ihb-dot"></span><span class="ihb-t1">Start a Franchise</span></span><span class="ihb-t2" aria-hidden="true"><span>Start a Franchise</span><svg class="ihb-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span></a></div>
          <p class="muted" style="font-size:12px;margin-top:12px">No account first. Upload a PDF, see price instantly, phone only at the end.</p>
        </div>
        <div class="float-badge" style="left:8%;top:42%;animation-delay:0s;animation-duration:5.6s"><span class="ic">🛡</span><span class="lb">100% Secured Documents</span></div>
        <div class="float-badge" style="right:8%;top:38%;animation-delay:-1.8s;animation-duration:6.4s"><span class="ic">⏱</span><span class="lb">Print Under 60 Seconds</span></div>
        <div class="float-badge" style="left:12%;top:62%;animation-delay:-3.6s;animation-duration:7.1s"><span class="ic">◷</span><span class="lb">24/7 Availability</span></div>
        <div class="pk-kiosk pk-kiosk3d" id="kiosk3d" data-obj="/models/kiosk.obj?v=${ASSET_V}" data-mtl="/models/kiosk.mtl?v=${ASSET_V}" data-fbx="/models/kiosk.fbx?v=${ASSET_V}"><img class="kiosk-img" data-kiosk-fallback src="/images/kiosk-hero.png" alt="PrintKarr self-service printing kiosk" loading="eager" onerror="this.remove()"></div>
      </section>
      <section class="pk-section"><span class="pill rv">◍ How to Use?</span><h2 class="display rv">How to Print using a<br><span class="blue">PrintKarr</span> kiosk?</h2><p class="sub rv">Fast. Secure. Completely Contactless.</p>${stepsHtml()}</section>
      <section class="pk-section"><span class="pill rv">⚡ Features</span><h2 class="display rv">So, Why PrintKarr is the best<br>way to print?</h2><p class="sub rv">Smarter Printing for a Busy World</p>${featuresHtml()}</section>
      <section class="pk-section"><span class="pill rv">⎙ Smarter vs Traditional</span><h2 class="display rv">And, why <span class="blue">PrintKarr</span> stands out?</h2><p class="sub rv">Self-Service Printing vs. Traditional Print Shops</p>${compareHtml()}</section>
      <section class="pk-section" style="text-align:left"><div style="display:grid;gap:40px;align-items:center"><div><span class="pill rv">◍ Where To Find Us</span><h2 class="display rv" style="text-align:left">Now printing in Vapi,<br><span class="blue">growing every day</span></h2><p class="muted rv" style="margin-top:16px;max-width:28rem;font-size:14px">Our first self-service kiosk is live in Vapi, Gujarat — bringing instant printing closer to where people need it most.</p><div class="pk-stats"><div class="pk-stat rv"><span class="sic">◍</span><p class="num" data-tick="1">1</p><p class="lab">Active Kiosk</p></div><div class="pk-stat rv"><span class="sic">▦</span><p class="num" data-tick="1">1</p><p class="lab">City — Vapi</p></div><div class="pk-stat rv"><span class="sic">○</span><p class="num" data-tick="1">1</p><p class="lab">State — Gujarat</p></div></div></div></div></section>
      ${hostBannerHtml()}
      <section class="card rv" style="margin:24px 0 8px;display:flex;flex-wrap:wrap;gap:12px 24px;align-items:center;justify-content:space-between"><div><p class="eyebrow">Talk to a human</p><a style="font-family:var(--font-d);font-weight:600;font-size:1.4rem;text-decoration:none" href="tel:+919016703180">${PHONE}</a></div><a class="ihb" href="https://wa.me/919016703180?text=${encodeURIComponent('Hi Printkarr! I need help with printing.')}" target="_blank" rel="noopener"><span class="ihb-row"><span class="ihb-dot"></span><span class="ihb-t1">WhatsApp us</span></span><span class="ihb-t2" aria-hidden="true"><span>WhatsApp us</span><svg class="ihb-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span></a></section>
      <script type="importmap">
      {"imports":{"three":"https://unpkg.com/three@0.160.0/build/three.module.js","three/addons/":"https://unpkg.com/three@0.160.0/examples/jsm/"}}
      </script>
      <script type="module">
      (function () {
        var stage = document.getElementById('kiosk3d');
        if (!stage) return;
        var fallback = stage.querySelector('[data-kiosk-fallback]');
        function showFallback() { if (fallback) fallback.style.display = ''; }
        var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        function progress() {
          var r = stage.getBoundingClientRect();
          var vh = window.innerHeight || 1;
          var p = (vh - r.top) / (vh + r.height);
          return Math.min(1, Math.max(0, p));
        }
        Promise.all([import('three'), import('three/addons/loaders/FBXLoader.js'), import('three/addons/loaders/OBJLoader.js'), import('three/addons/loaders/MTLLoader.js')]).then(function (mods) {
          var THREE = mods[0];
          var FBXLoader = mods[1].FBXLoader;
          var OBJLoader = mods[2].OBJLoader;
          var MTLLoader = mods[3].MTLLoader;
          var renderer;
          try {
            renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
          } catch (e) { showFallback(); return; }
          var pr = Math.min(window.devicePixelRatio || 1, 2);
          if (pr < 1.5) pr = 1.5;
          renderer.setPixelRatio(pr);
          renderer.setClearColor(0x000000, 0);
          if (THREE.SRGBColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;
          if (THREE.ACESFilmicToneMapping) { renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.16; }
          renderer.domElement.className = 'kiosk-canvas';
          stage.appendChild(renderer.domElement);
          var scene = new THREE.Scene();
          var camera = new THREE.PerspectiveCamera(34, 1, 0.1, 60);
          camera.position.set(0, 0.5, 9.3);
          camera.lookAt(0, 0.15, 0);
          scene.add(new THREE.HemisphereLight(0xffffff, 0xdfe7f5, 0.85));
          scene.add(new THREE.AmbientLight(0xffffff, 0.4));
          var key = new THREE.DirectionalLight(0xffffff, 1.95); key.position.set(4, 7, 6); scene.add(key);
          var fill = new THREE.DirectionalLight(0xd6e4ff, 0.75); fill.position.set(-5, 2.5, 4); scene.add(fill);
          var front = new THREE.DirectionalLight(0xffffff, 0.6); front.position.set(0, 1.5, 8); scene.add(front);
          var rim = new THREE.DirectionalLight(0xffffff, 0.85); rim.position.set(-1, 4, -6); scene.add(rim);
          var sc = document.createElement('canvas'); sc.width = sc.height = 128;
          var g2 = sc.getContext('2d');
          var gr = g2.createRadialGradient(64, 64, 8, 64, 64, 62);
          gr.addColorStop(0, 'rgba(12,28,51,0.5)'); gr.addColorStop(1, 'rgba(12,28,51,0)');
          g2.fillStyle = gr; g2.fillRect(0, 0, 128, 128);
          var shadow = new THREE.Mesh(
            new THREE.PlaneGeometry(4.1, 1.5),
            new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), transparent: true, opacity: 0.55, depthWrite: false })
          );
          shadow.rotation.x = -Math.PI / 2; shadow.position.y = -1.9; scene.add(shadow);
          var rig = new THREE.Group(); scene.add(rig);
          var baseY = 0, raf = 0, loaded = false, firstFrame = true;
          var t0 = 0, loopOn = false, loopRaf = 0, inView = false;
          function frame(now) {
            var p = progress();
            var pe = Math.min(p / 0.55, 1);
            var e = 1 - Math.pow(1 - pe, 3);
            var sway = 0, bob = 0;
            if (!reduce && t0) {
              var t = (now - t0) / 1000;
              sway = Math.sin(t * 0.42) * 0.075;
              bob = Math.sin(t * 0.85) * 0.035;
              key.position.set(4 + Math.sin(t * 0.3) * 1.7, 7 + Math.sin(t * 0.55) * 0.5, 6 + Math.cos(t * 0.3) * 1.3);
            }
            rig.rotation.y = -0.18 + e * 0.76 + sway;
            var scl = p < 0.55
              ? 1 - 0.04 * (p / 0.55)
              : 0.96 + 0.10 * (1 - Math.pow(1 - (p - 0.55) / 0.45, 3));
            rig.scale.setScalar(scl);
            rig.position.y = baseY + 0.15 - e * 0.10 + bob;
            shadow.material.opacity = 0.5 - e * 0.15;
            renderer.render(scene, camera);
            if (firstFrame) { firstFrame = false; if (fallback) fallback.style.display = 'none'; }
          }
          function render() { raf = 0; if (!loaded) return; frame(performance.now()); }
          function requestRender() { if (!raf && !loopRaf) raf = requestAnimationFrame(render); }
          function tick() { loopRaf = 0; if (!loopOn || !loaded) return; frame(performance.now()); loopRaf = requestAnimationFrame(tick); }
          function startIdle() { if (reduce || loopOn) return; loopOn = true; if (!loopRaf) loopRaf = requestAnimationFrame(tick); }
          function stopIdle() { loopOn = false; if (loopRaf) { cancelAnimationFrame(loopRaf); loopRaf = 0; } }
          function syncIdle() { if (inView && !document.hidden) startIdle(); else stopIdle(); }
          function resize() {
            var w = stage.clientWidth || 1, h = stage.clientHeight || 1;
            camera.aspect = w / h; camera.updateProjectionMatrix();
            renderer.setSize(w, h, false);
            requestRender();
          }
          var maxAniso = renderer.capabilities.getMaxAnisotropy ? renderer.capabilities.getMaxAnisotropy() : 1;
          function fixTex(t) {
            if (!t) return;
            t.anisotropy = maxAniso;
            if (THREE.SRGBColorSpace) t.colorSpace = THREE.SRGBColorSpace;
            t.needsUpdate = true;
          }
          function toMatte(root) {
            root.traverse(function (child) {
              if (!child.isMesh || !child.material) return;
              var list = Array.isArray(child.material) ? child.material : [child.material];
              var conv = list.map(function (m) {
                var n = new THREE.MeshLambertMaterial();
                if (m.color) n.color.copy(m.color);
                if (m.map) n.map = m.map;
                fixTex(n.map);
                if (m.emissive) n.emissive.copy(m.emissive);
                if (m.emissiveMap) n.emissiveMap = m.emissiveMap;
                fixTex(n.emissiveMap);
                n.transparent = !!m.transparent;
                n.opacity = m.opacity !== undefined ? m.opacity : 1;
                n.side = m.side;
                return n;
              });
              child.material = Array.isArray(child.material) ? conv : conv[0];
            });
          }
          function setup(root) {
            var box = new THREE.Box3().setFromObject(root);
            var size = new THREE.Vector3(); box.getSize(size);
            var center = new THREE.Vector3(); box.getCenter(center);
            var inner = new THREE.Group();
            inner.add(root);
            root.position.set(-center.x, -center.y, -center.z);
            inner.scale.setScalar(4.25 / Math.max(size.x, size.y, size.z));
            rig.add(inner);
            toMatte(inner);
            var b2 = new THREE.Box3().setFromObject(rig);
            baseY = -1.9 - b2.min.y;
            shadow.position.y = baseY + b2.min.y + 0.15 - 0.03;
            loaded = true;
            t0 = performance.now();
            resize();
            if (reduce) { render(); return; }
            window.addEventListener('scroll', requestRender, { passive: true });
            if ('IntersectionObserver' in window) {
              new IntersectionObserver(function (es) { inView = es[0].isIntersecting; syncIdle(); }, { threshold: 0.05 }).observe(stage);
            } else { inView = true; }
            document.addEventListener('visibilitychange', syncIdle);
            syncIdle();
            requestRender();
          }
          function loadFbx() {
            new FBXLoader().load(stage.getAttribute('data-fbx'), setup, undefined, function () { showFallback(); });
          }
          function loadObj() {
            var objUrl = stage.getAttribute('data-obj');
            if (!objUrl) { loadFbx(); return; }
            var oloader = new OBJLoader();
            new MTLLoader().load(stage.getAttribute('data-mtl'), function (mats) {
              mats.preload();
              oloader.setMaterials(mats);
              oloader.load(objUrl, setup, undefined, function () { loadFbx(); });
            }, undefined, function () { loadFbx(); });
          }
          loadObj();
          window.addEventListener('resize', resize);
          if ('ResizeObserver' in window) { new ResizeObserver(resize).observe(stage); }
          resize();
        }).catch(function () { showFallback(); });
        var igp = document.querySelector('.pk-hero .igp-cells');
        if (igp) {
          var IH = '', ii, jj;
          for (ii = 0; ii < 80; ii++) {
            for (jj = 0; jj < 80; jj++) {
              IH += '<rect class="igp-cell" x="' + (jj * 20) + '" y="' + (ii * 20) + '" width="20" height="20"/>';
            }
          }
          igp.innerHTML = IH;
        }
        var spk = document.querySelector('.sparkles');
        if (spk) {
          var blues = ['#4d86ff', '#a4d9ff'];
          for (var qi = 0; qi < 6; qi++) {
            var q = document.createElement('span');
            q.className = 'sparkle';
            q.setAttribute('aria-hidden', 'true');
            q.style.left = (Math.random() * 100) + '%';
            q.style.top = (Math.random() * 100) + '%';
            q.style.animationDelay = (Math.random() * 2) + 's';
            q.style.setProperty('--ss', (Math.random() + 0.3).toFixed(2));
            q.innerHTML = '<svg viewBox="0 0 21 21" width="21" height="21"><path d="M9.82531 0.843845C10.0553 0.215178 10.9446 0.215178 11.1746 0.843845L11.8618 2.72026C12.4006 4.19229 12.3916 6.39157 13.5 7.5C14.6084 8.60843 16.8077 8.59935 18.2797 9.13822L20.1561 9.82534C20.7858 10.0553 20.7858 10.9447 20.1561 11.1747L18.2797 11.8618C16.8077 12.4007 14.6084 12.3916 13.5 13.5C12.3916 14.6084 12.4006 16.8077 11.8618 18.2798L11.1746 20.1562C10.9446 20.7858 10.0553 20.7858 9.82531 20.1562L9.13819 18.2798C8.59932 16.8077 8.60843 14.6084 7.5 13.5C6.39157 12.3916 4.19225 12.4007 2.72023 11.8618L0.843814 11.1747C0.215148 10.9447 0.215148 10.0553 0.843814 9.82534L2.72023 9.13822C4.19225 8.59935 6.39157 8.60843 7.5 7.5C8.60843 6.39157 8.59932 4.19229 9.13819 2.72026L9.82531 0.843845Z" fill="' + blues[qi % 2] + '"/></svg>';
            spk.appendChild(q);
          }
        }
      })();
      </script>
    </div>`
  });
}

export function orderPage({ draft, pricing, error, maxMb }) {
  const d = draft || null;
  const cfg = JSON.stringify({ bw: pricing.bw, color: pricing.color, fees: pricing.delivery, freeAbove: pricing.freeAbove });
  return shell({
    active: '/order',
    title: 'Print now',
    body: `
    ${topbar}
    <main class="pub-wrap">
      <span class="pill rv">◍ Print in 60 seconds</span>
      <h1 class="display rv" style="font-size:clamp(2rem,6vw,3.6rem);margin-top:16px">Thirty seconds<br><em>to printed.</em></h1>
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
              <div class="stepper"><button type="button" id="cMinus">−</button><input id="copies" name="copies" type="number" value="1" min="1" max="200" readonly><button type="button" id="cPlus">+</button></div></div>
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
        <label class="drop" for="doc"><span class="drop-arrow">↑</span><b>Tap to pick your PDF</b><span class="muted">Up to ${maxMb || 20} MB · price appears instantly</span></label>
        <input id="doc" name="doc" type="file" accept="application/pdf,.pdf" required hidden>
        <p class="muted" id="fname" style="font-size:12px;margin:10px 0"></p>
        <button class="btn loud big" type="submit" style="width:100%"><span>See my price →</span></button>
      </form>
      <script>document.getElementById('doc').addEventListener('change', function(e){ var f = e.target.files[0]; document.getElementById('fname').textContent = f ? '📄 ' + f.name : ''; if (f) e.target.form.submit(); });</script>`}
    </main>`
  });
}

export function phonePage({ draft, error }) {
  return shell({
    active: '/order',
    title: 'Where to?',
    body: `
    ${topbar}
    <main class="pub-wrap">
      <span class="pill rv">Last step · 📄 ${esc(draft.document)} · ${draft.pages} pages</span>
      <h1 class="display rv" style="font-size:clamp(2rem,6vw,3.2rem);margin-top:16px">Where should it<br><em>reach you?</em></h1>
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
    </main>`
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
    ${topbar}
    <main class="pub-wrap" style="max-width:560px">
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
    </main>`
  });
}

/* ---------- marketing pages (workspace port) ---------- */

function pageWrap(inner) {
  return `<div style="max-width:72rem;margin:0 auto;padding:110px 16px 20px">${inner}</div>`;
}

export function howItWorksPage() {
  return shell({
    active: '/how-it-works',
    title: 'How it works — Four taps. One print. Sixty seconds.',
    body: pageWrap(`
      <div style="max-width:48rem;margin:0 auto;text-align:center"><span class="pill rv">How it works</span>
      <h1 class="display rv" style="font-size:clamp(2rem,5vw,3.4rem);margin-top:16px">Four taps. One print. Sixty seconds.</h1>
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
      <blockquote class="display rv" style="font-size:clamp(1.5rem,4vw,2.4rem);margin-top:24px;line-height:1.3">“If groceries can reach us in minutes, why is printing still stuck behind a shutter at 9 pm? PrintKarr is our answer.”</blockquote>
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
    title: 'Franchise — Own the kiosk. We run the platform.',
    body: pageWrap(`
      <div style="max-width:48rem;margin:0 auto;text-align:center"><span class="pill rv">Franchise &amp; Partnerships</span>
      <h1 class="display rv" style="font-size:clamp(2rem,5vw,3.4rem);margin-top:16px">Own the kiosk. We run the platform.</h1>
      <p class="muted rv" style="margin-top:12px">Passive or active income through automated instant printing, backed by a fully managed stack.</p></div>
      <div class="grid c3" style="margin-top:32px">${models.map((m) => `<article class="card rv"><h2 style="font-size:20px">${m.t}</h2><p class="muted" style="margin-top:8px;font-size:14px">${m.d}</p><p class="eyebrow" style="margin-top:16px">Your role</p><ul style="margin-top:8px;font-size:14px;padding-left:18px">${m.you.map((x) => `<li>${x}</li>`).join('')}</ul><p class="eyebrow" style="margin-top:12px">Our role</p><ul style="margin-top:8px;font-size:14px;padding-left:18px">${m.us.map((x) => `<li>${x}</li>`).join('')}</ul><p class="muted" style="margin-top:16px;font-size:12px">Best for: ${m.who}</p></article>`).join('')}</div>
      <div class="grid c2" style="margin-top:16px">
        <article class="card ink rv"><p class="eyebrow" style="color:var(--blue-bright)">PrintKarr PRO</p><h3 class="display" style="font-size:2rem;margin-top:8px">₹1,29,000 + GST</h3><p style="opacity:.7;font-size:14px;margin-top:8px">High-footfall locations · 1,950-sheet capacity</p></article>
        <article class="card rv"><p class="eyebrow">PrintKarr MINI</p><h3 class="display" style="font-size:2rem;margin-top:8px">₹69,000 + GST</h3><p class="muted" style="font-size:14px;margin-top:8px">Low / medium footfall · 650-sheet capacity</p></article>
      </div>
      <div class="card rv" style="margin-top:16px"><h2 class="display" style="font-size:1.5rem">Apply to partner</h2>
        <form method="POST" action="/contact" style="margin-top:16px"><div class="grid c2"><div class="field"><label>Name</label><input name="name" required></div><div class="field"><label>Phone</label><input name="phone" required></div></div><div class="field"><label>Email</label><input name="email" type="email" required></div><div class="field"><label>City / campus</label><input name="city"></div><button class="btn loud" type="submit"><span>Submit →</span></button></form></div>`)
  });
}

export function xeroxPage() {
  return shell({
    title: 'Xerox shops — the modern way',
    body: pageWrap(`
      <div style="max-width:48rem;margin:0 auto;text-align:center"><span class="pill rv">Xerox shops</span>
      <h1 class="display rv" style="font-size:clamp(2rem,5vw,3.4rem);margin-top:16px">The modern way of running a Xerox shop</h1>
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
      <h1 class="display rv" style="font-size:clamp(2rem,5vw,3rem);margin-top:16px">Let’s put a kiosk where the queues are.</h1>
      <ul class="rv" style="margin-top:24px;list-style:none;display:flex;flex-direction:column;gap:16px;font-size:14px">
        <li>📞 <b>${PHONE}</b><br><span class="muted">Mon–Fri · 24 hours</span></li>
        <li>✉️ <a class="rowlink" href="mailto:${EMAIL}">${EMAIL}</a></li>
        <li>◍ PrintKarr Technologies Private Limited<br><span class="muted">14, 100 Feet Road, Indiranagar, Bengaluru 560038</span></li>
      </ul></div>
      <form class="card rv" method="POST" action="/contact">
        ${sent ? `<p class="pill" style="margin-bottom:12px">✓ Received. We’ll reply within one business day.</p>` : ''}
        <div class="field"><label>How would you like to partner?</label><select name="model" required><option value="" disabled selected>Choose one</option><option>Own a PrintKarr kiosk</option><option>Have a location to host</option><option>Need a custom solution</option><option>Onboard my Xerox shop</option><option>Just saying hello</option></select></div>
        <div class="grid c2"><div class="field"><label>Name</label><input name="name" required></div><div class="field"><label>Phone</label><input name="phone" required></div></div>
        <div class="field"><label>Email</label><input name="email" type="email" required></div>
        <div class="field"><label>Message</label><textarea name="message" rows="4"></textarea></div>
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
