// Shared interactions: reveals, print illustration, kiosk demo, and feedback. No dependencies.
(function () {
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.qk-home .qk-section, .qk-home .qk-host').forEach(function (el) { el.classList.add('rv'); });
  document.querySelectorAll('.rv').forEach(function (el) { io.observe(el); });

  var t;
  window.toast = function (msg) {
    var el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(t);
    t = setTimeout(function () { el.classList.remove('show'); }, 2400);
  };

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var glass = document.querySelector && document.querySelector('.public-site .site-header-inner');
  if (glass && window.ResizeObserver && window.CSS && window.CSS.supports('backdrop-filter', 'url(#liquid-glass-refraction)') && !window.matchMedia('(prefers-reduced-transparency: reduce)').matches && !window.matchMedia('(forced-colors: active)').matches) {
    var map = document.getElementById('liquid-glass-map');
    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');
    var lastSize = '';
    if (map && context) {
      function refractPill() {
        var w = Math.round(glass.clientWidth - 2), h = Math.round(glass.clientHeight - 2);
        if (w < h || h < 2 || lastSize === w + 'x' + h) return;
        lastSize = w + 'x' + h;
        canvas.width = w; canvas.height = h;
        var image = context.createImageData(w, h), data = image.data;
        var radius = h / 2, bezel = Math.min(22, radius - 1);
        // Keep the strongest (42px blue) channel below a unit slope, so the lens cannot fold back on itself.
        var amplitude = Math.min(115, bezel * 0.28 * 255 / 42);
        for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
          var px = x + 0.5, py = y + 0.5;
          var vx = px - Math.max(radius, Math.min(px, w - radius));
          var vy = py - radius;
          var distance = Math.hypot(vx, vy), depth = radius - distance;
          var strength = depth > 0 && depth < bezel ? Math.pow(Math.sin(Math.PI * depth / bezel), 2) : 0;
          var i = (y * w + x) * 4;
          data[i] = 128 + (distance ? vx / distance : 0) * strength * amplitude;
          data[i + 1] = 128 + (distance ? vy / distance : 0) * strength * amplitude;
          data[i + 2] = 0; data[i + 3] = 255;
        }
        context.putImageData(image, 0, 0);
        map.setAttribute('href', canvas.toDataURL('image/png'));
        map.setAttribute('width', w);
        map.setAttribute('height', h);
        glass.closest('.site-header').classList.add('liquid-ready');
      }
      new window.ResizeObserver(refractPill).observe(glass);
      refractPill();
      if (!reduceMotion && window.matchMedia('(hover: hover)').matches) {
        glass.addEventListener('pointermove', function (event) {
          var bounds = glass.getBoundingClientRect();
          glass.style.setProperty('--glass-x', ((event.clientX - bounds.left) / bounds.width * 100).toFixed(1) + '%');
          glass.style.setProperty('--glass-y', ((event.clientY - bounds.top) / bounds.height * 100).toFixed(1) + '%');
        });
        glass.addEventListener('pointerleave', function () {
          glass.style.removeProperty('--glass-x'); glass.style.removeProperty('--glass-y');
        });
      }
    }
  }

  // Finite, user-triggered animation: no printing requests are made by this demo.
  document.querySelectorAll('[data-print-demo]').forEach(function (demo) {
    var button = demo.querySelector('.demo-trigger');
    var status = demo.querySelector('.demo-status');
    button.addEventListener('click', function () {
      if (button.disabled) return;
      button.disabled = true;
      demo.classList.remove('is-printed');
      demo.classList.add('is-printing');
      status.textContent = 'A little ink. A little paper. Here it comes…';
      setTimeout(function () {
        demo.classList.remove('is-printing');
        demo.classList.add('is-printed');
        button.disabled = false;
        button.textContent = 'Print it again ↗';
        status.textContent = 'Fresh off the press! Sample only — no real print job.';
      }, reduceMotion ? 0 : 1600);
    });
  });

  document.querySelectorAll('form').forEach(function (form) {
    if (!form.querySelector('input[name="printType"]') || form.classList.contains('quick-order')) return;
    var look = document.createElement('div');
    look.className = 'print-look';
    look.innerHTML = '<div class="print-look-paper" aria-hidden="true"></div><div><b>Your print, your way.</b><p role="status"></p><small>Settings illustration · not a document preview</small></div>';
    form.prepend(look);
    function updateLook() {
      var colour = form.querySelector('input[name="printType"]:checked');
      var sides = form.querySelector('input[name="sides"]:checked');
      var copies = form.querySelector('[name="copies"]');
      var orientation = form.querySelector('[name="orientation"]');
      var isColour = colour && colour.value === 'color';
      var isDouble = sides && sides.value === 'double';
      look.classList.toggle('color', !!isColour);
      look.classList.toggle('double', !!isDouble);
      look.classList.toggle('landscape', !!orientation && orientation.value === 'landscape');
      look.querySelector('p').textContent = (isColour ? 'Full colour' : 'Black & white') + ' · ' + (isDouble ? 'Double-sided' : 'Single-sided') + ' · Copies: ' + (copies ? copies.value : '1');
    }
    form.addEventListener('input', updateLook);
    form.addEventListener('change', updateLook);
    form.addEventListener('click', updateLook);
    updateLook();
  });

  if (!reduceMotion && window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.pk-feature').forEach(function (card) {
      card.addEventListener('pointermove', function (event) {
        var bounds = card.getBoundingClientRect();
        card.style.setProperty('--px', (event.clientX - bounds.left) + 'px');
        card.style.setProperty('--py', (event.clientY - bounds.top) + 'px');
      });
    });
  }
  if (!reduceMotion) {
    document.querySelectorAll('.rv').forEach(function (el) {
      if (el.getBoundingClientRect().top > window.innerHeight) el.classList.add('reveal-ready');
    });
  }

  document.querySelectorAll('[data-tick]').forEach(function (el) {
    var value = parseFloat(el.getAttribute('data-tick')) || 0;
    var startAttr = parseFloat(el.getAttribute('data-tick-from'));
    var start0 = isNaN(startAttr) ? 0 : startAttr;
    var down = el.getAttribute('data-tick-dir') === 'down';
    var dec = parseInt(el.getAttribute('data-tick-decimals') || '0', 10) || 0;
    var delayMs = (parseFloat(el.getAttribute('data-tick-delay') || '0') || 0) * 1000;
    var from = down ? value : start0;
    var target = down ? start0 : value;
    function fmt(n) {
      return Intl.NumberFormat('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(Number(n.toFixed(dec)));
    }
    if (reduceMotion) { el.textContent = fmt(target); return; }
    var x = from, v = 0, raf = 0, timer = 0, last = 0;
    function step(now) {
      var dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      v += (-100 * (x - target) - 60 * v) * dt;
      x += v * dt;
      el.textContent = fmt(x);
      if (Math.abs(x - target) < 0.5 * Math.pow(10, -dec) && Math.abs(v) < 0.05) { el.textContent = fmt(target); return; }
      raf = requestAnimationFrame(step);
    }
    var tio = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) return;
      tio.disconnect();
      timer = setTimeout(function () { last = performance.now(); raf = requestAnimationFrame(step); }, delayMs);
    });
    tio.observe(el);
  });

  var CONF_COLORS = ['#1746E0', '#FF6B00', '#75b8ff', '#ffffff', '#1238B8'];
  function burst(nx, ny, count) {
    if (reduceMotion) return;
    var cv = document.createElement('canvas');
    cv.className = 'confetti-canvas';
    document.body.appendChild(cv);
    var ctx = cv.getContext('2d');
    if (!ctx) { cv.parentNode.removeChild(cv); return; }
    var pr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(window.innerWidth * pr);
    cv.height = Math.round(window.innerHeight * pr);
    var ox = nx * window.innerWidth, oy = ny * window.innerHeight;
    var ps = [];
    for (var i = 0; i < count; i++) {
      var a = (-90 + (Math.random() - 0.5) * 100) * Math.PI / 180;
      var sp = 380 + Math.random() * 420;
      ps.push({
        x: ox, y: oy,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        w: 5 + Math.random() * 5, h: 8 + Math.random() * 7,
        r: Math.random() * Math.PI * 2, vr: (Math.random() - 0.5) * 12,
        c: CONF_COLORS[(Math.random() * CONF_COLORS.length) | 0],
        life: 1.8 + Math.random() * 1, age: 0,
        sd: Math.random() * 6.2832,
        dot: Math.random() < 0.3
      });
    }
    var last = performance.now();
    function tick(now) {
      var dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.save();
      ctx.scale(pr, pr);
      var alive = false;
      for (var k = 0; k < ps.length; k++) {
        var p = ps[k];
        p.age += dt;
        if (p.age >= p.life) continue;
        alive = true;
        p.vy += 1050 * dt;
        p.vx *= (1 - 1.6 * dt);
        p.vy *= (1 - 0.4 * dt);
        p.x += p.vx * dt;
        p.x += Math.sin(p.age * 5 + p.sd) * 24 * dt;
        p.y += p.vy * dt;
        p.r += p.vr * dt;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.r);
        ctx.globalAlpha = p.age > p.life - 0.4 ? Math.max((p.life - p.age) / 0.4, 0) : 1;
        ctx.fillStyle = p.c;
        if (p.dot) { ctx.beginPath(); ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2); ctx.fill(); }
        else { ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); }
        ctx.restore();
      }
      ctx.restore();
      if (alive) { requestAnimationFrame(tick); }
      else if (cv.parentNode) { cv.parentNode.removeChild(cv); }
    }
    requestAnimationFrame(tick);
  }
  function burstAt(el, count) {
    var r = el.getBoundingClientRect();
    var fx = (r.left + r.width / 2) / (window.innerWidth || 1);
    var fy = (r.top + r.height / 2) / (window.innerHeight || 1);
    burst(Math.min(Math.max(fx, 0.05), 0.95), Math.min(Math.max(fy, 0.1), 0.9), count);
  }
  if ('IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return;
        cio.unobserve(en.target);
        burstAt(en.target, parseInt(en.target.getAttribute('data-confetti'), 10) || 70);
      });
    }, { threshold: 0.35 });
    document.querySelectorAll('[data-confetti]').forEach(function (el) { cio.observe(el); });
  }
  document.querySelectorAll('[data-confetti-load]').forEach(function (el) {
    var n = parseInt(el.getAttribute('data-confetti-load'), 10) || 85;
    setTimeout(function () { burstAt(el, n); }, 350);
  });
})();
