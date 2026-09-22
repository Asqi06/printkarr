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
    <span class="pk-mbar-cta"><a class="pk-contact" href="/contact">Contact us</a><a class="btn loud" href="/order"><span>Print now</span></a></span>
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
    <a class="btn loud" style="margin-top:12px" href="/xerox"><span>View details →</span></a></div>
  <div><h4>Navigation</h4><ul><li><a href="/xerox">Xerox Shops</a></li><li><a href="/how-it-works">How it works</a></li><li><a href="/franchise">Franchise</a></li><li><a href="/contact">Contact Us</a></li><li><a href="/blogs">Blogs</a></li></ul></div>
  <div><h4>Social</h4><ul><li><a href="https://x.com">Twitter / X</a></li><li><a href="https://instagram.com">Instagram</a></li><li><a href="https://maps.google.com">Google Business</a></li><li><a href="https://linkedin.com">LinkedIn</a></li></ul></div>
</div><div class="pk-footer-bottom"><p>© ${new Date().getFullYear()} PrintKarr · PrintKarr Technologies Private Limited</p><div style="display:flex;gap:16px"><a href="/terms">Terms &amp; Conditions</a><a href="/privacy">Privacy Policy</a></div></div></footer>
</div>
<div class="toast" id="toast"></div>
<script src="/shell.js?v=${ASSET_V}" defer></script>
</body>
</html>`;
}

const topbar = topNav('');
export { topNav };

function stepsHtml() {
  const steps = [
    { n: 'STEP 1', t: 'Scan the Kiosk QR', d: 'Each PrintKarr machine has its own unique QR — scan it with your mobile camera.' },
    { n: 'STEP 2', t: 'Upload Your Document', d: 'Choose your file from phone, laptop, or Drive. No sign-up required.' },
    { n: 'STEP 3', t: 'Set Print Preference', d: 'Set copies, B&W or colour, duplex, and orientation before you pay.' },
    { n: 'STEP 4', t: 'Get Your Print Instantly', d: 'Enter the 4-digit OTP or scan the dynamic QR to collect your print.' },
  ];
  return `<div class="pk-steps">${steps.map((s) => `<article class="pk-step rv"><p class="n">${s.n}</p><h3>${s.t}</h3><p>${s.d}</p></article>`).join('')}</div>`;
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
  return `<section class="pk-host rv"><div class="txt"><h2 class="display" style="font-size:clamp(1.6rem,3.5vw,2.4rem)">Want to offer 24/7 printing to students, employees, or visitors?</h2><p class="sub">Host your own PrintKarr machine in your college, hostel, co-working space or public area.</p><a class="btn loud" style="margin-top:24px" href="/contact"><span>Request Installation →</span></a></div><div class="img"><img src="/images/host-cta.jpg" alt="Student requesting a print from her phone" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block"></div></section>`;
}

export function landing({ pagesWeek, pricing, queueDepth }) {
  const minRate = Math.min(pricing.bw, pricing.studentBw);
  return shell({
    active: '/',
    title: 'Meet PrintKarr — Anytime, Anywhere Instant Printing Kiosk',
    body: `
    <div style="max-width:72rem;margin:0 auto;padding:110px 16px 0">
      <section class="pk-hero rv"><div class="grid-veil" style="position:absolute;inset:0;opacity:.7"></div>
        <div class="pk-hero-inner">
          <span class="pill">✦ India's First, Smartest, Fastest &amp; Only</span>
          <h1 class="display" style="margin-top:20px">Meet <span class="blue">PrintKarr</span>, Your Anytime, Anywhere Instant Printing Kiosk</h1>
          <p class="muted" style="margin-top:12px">${pagesWeek}+ pages this week · ${queueDepth} in queue · from ${rs(minRate)}/page</p>
          <div class="pk-hero-ctas"><a class="btn loud big" href="/order"><span>Print now — see price →</span></a><a class="btn big" href="/franchise"><span>Start a Franchise</span></a></div>
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
      <section class="pk-section" style="text-align:left"><div style="display:grid;gap:40px;align-items:center"><div><span class="pill rv">◍ Where To Find Us</span><h2 class="display rv" style="text-align:left">Now printing in Vapi,<br><span class="blue">growing every day</span></h2><p class="muted rv" style="margin-top:16px;max-width:28rem;font-size:14px">Our first self-service kiosk is live in Vapi, Gujarat — bringing instant printing closer to where people need it most.</p><div class="pk-stats"><div class="pk-stat rv"><span class="sic">◍</span><p class="num">1</p><p class="lab">Active Kiosk</p></div><div class="pk-stat rv"><span class="sic">▦</span><p class="num">1</p><p class="lab">City — Vapi</p></div><div class="pk-stat rv"><span class="sic">○</span><p class="num">1</p><p class="lab">State — Gujarat</p></div></div></div></div></section>
      ${hostBannerHtml()}
      <section class="card rv" style="margin:24px 0 8px;display:flex;flex-wrap:wrap;gap:12px 24px;align-items:center;justify-content:space-between"><div><p class="eyebrow">Talk to a human</p><a style="font-family:var(--font-d);font-weight:600;font-size:1.4rem;text-decoration:none" href="tel:+919016703180">${PHONE}</a></div><a class="btn" href="https://wa.me/919016703180?text=${encodeURIComponent('Hi Printkarr! I need help with printing.')}" target="_blank" rel="noopener"><span>WhatsApp us →</span></a></section>
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
          renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
          renderer.setClearColor(0x000000, 0);
          if (THREE.SRGBColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;
          if (THREE.ACESFilmicToneMapping) { renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.12; }
          renderer.domElement.className = 'kiosk-canvas';
          stage.appendChild(renderer.domElement);
          var scene = new THREE.Scene();
          var camera = new THREE.PerspectiveCamera(34, 1, 0.1, 60);
          camera.position.set(0, 0.5, 8.8);
          camera.lookAt(0, 0.15, 0);
          scene.add(new THREE.HemisphereLight(0xffffff, 0xdfe7f5, 0.7));
          scene.add(new THREE.AmbientLight(0xffffff, 0.3));
          var key = new THREE.DirectionalLight(0xffffff, 1.5); key.position.set(4, 7, 6); scene.add(key);
          var fill = new THREE.DirectionalLight(0xd6e4ff, 0.6); fill.position.set(-5, 2.5, 4); scene.add(fill);
          var front = new THREE.DirectionalLight(0xffffff, 0.45); front.position.set(0, 1.5, 8); scene.add(front);
          var rim = new THREE.DirectionalLight(0xffffff, 0.7); rim.position.set(-1, 4, -6); scene.add(rim);
          var sc = document.createElement('canvas'); sc.width = sc.height = 128;
          var g2 = sc.getContext('2d');
          var gr = g2.createRadialGradient(64, 64, 8, 64, 64, 62);
          gr.addColorStop(0, 'rgba(12,28,51,0.5)'); gr.addColorStop(1, 'rgba(12,28,51,0)');
          g2.fillStyle = gr; g2.fillRect(0, 0, 128, 128);
          var shadow = new THREE.Mesh(
            new THREE.PlaneGeometry(3.6, 1.3),
            new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), transparent: true, opacity: 0.55, depthWrite: false })
          );
          shadow.rotation.x = -Math.PI / 2; shadow.position.y = -1.9; scene.add(shadow);
          var rig = new THREE.Group(); scene.add(rig);
          var baseY = 0, raf = 0, loaded = false, firstFrame = true;
          function render() {
            raf = 0;
            if (!loaded) return;
            var p = progress();
            var pe = Math.min(p / 0.55, 1);
            var e = pe * pe * (3 - 2 * pe);
            rig.rotation.y = -0.16 + e * 0.58;
            var es = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
            rig.scale.setScalar(0.97 + Math.sin(es * Math.PI) * 0.06);
            rig.position.y = baseY + 0.45 - e * 0.12;
            shadow.material.opacity = 0.5 - e * 0.18;
            renderer.render(scene, camera);
            if (firstFrame) { firstFrame = false; if (fallback) fallback.style.display = 'none'; }
          }
          function requestRender() { if (!raf) raf = requestAnimationFrame(render); }
          function resize() {
            var w = stage.clientWidth || 1, h = stage.clientHeight || 1;
            camera.aspect = w / h; camera.updateProjectionMatrix();
            renderer.setSize(w, h, false);
            requestRender();
          }
          function toMatte(root) {
            root.traverse(function (child) {
              if (!child.isMesh || !child.material) return;
              var list = Array.isArray(child.material) ? child.material : [child.material];
              var conv = list.map(function (m) {
                var n = new THREE.MeshLambertMaterial();
                if (m.color) n.color.copy(m.color);
                if (m.map) n.map = m.map;
                if (m.emissive) n.emissive.copy(m.emissive);
                if (m.emissiveMap) n.emissiveMap = m.emissiveMap;
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
            inner.scale.setScalar(3.9 / Math.max(size.x, size.y, size.z));
            rig.add(inner);
            toMatte(inner);
            var b2 = new THREE.Box3().setFromObject(rig);
            baseY = -1.9 - b2.min.y;
            shadow.position.y = baseY + b2.min.y + 0.45 - 0.03;
            loaded = true;
            resize();
            if (reduce) { render(); }
            else { window.addEventListener('scroll', requestRender, { passive: true }); requestRender(); }
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
      <div style="text-align:center;margin:32px 0"><a class="btn loud big rv" href="/order"><span>Try it now →</span></a></div>`)
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
      <div style="text-align:center;margin:32px 0"><a class="btn loud big rv" href="/contact"><span>Onboard your shop →</span></a></div>`)
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
