// Tiny shell runtime: reveal-on-scroll, toast, clock. No dependencies.
(function () {
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    });
  }, { threshold: 0.08 });
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

  document.querySelectorAll('.dock').forEach(function (dock) {
    if (reduceMotion) return;
    var icons = Array.prototype.slice.call(dock.querySelectorAll('.dock-icon'));
    dock.addEventListener('mousemove', function (e) {
      icons.forEach(function (ic) {
        var r = ic.getBoundingClientRect();
        var t = Math.max(0, 1 - Math.abs(e.clientX - (r.left + r.width / 2)) / 140);
        var s = 40 + (60 - 40) * t;
        ic.style.width = s + 'px';
        ic.style.height = s + 'px';
      });
    });
    dock.addEventListener('mouseleave', function () {
      icons.forEach(function (ic) { ic.style.width = ''; ic.style.height = ''; });
    });
  });

  if ('IntersectionObserver' in window) {
    var lio = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('lit'); lio.unobserve(en.target); }
      });
    }, { threshold: 0.55, rootMargin: '-8% 0px' });
    document.querySelectorAll('.pk-feed-row').forEach(function (el) { lio.observe(el); });
  } else {
    document.querySelectorAll('.pk-feed-row').forEach(function (el) { el.classList.add('lit'); });
  }

  function mkstop(grad, o, c, op) {
    var st = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    st.setAttribute('offset', o);
    st.setAttribute('stop-color', c);
    if (op !== undefined) st.setAttribute('stop-opacity', op);
    grad.appendChild(st);
  }

  document.querySelectorAll('.pk-flow').forEach(function (flow) {
    var NS = 'http://www.w3.org/2000/svg';
    var svg = flow.querySelector('svg.pk-beam');
    var nodes = Array.prototype.slice.call(flow.querySelectorAll('.pk-node'));
    if (!svg || nodes.length < 2) return;
    var defs = document.createElementNS(NS, 'defs');
    svg.appendChild(defs);
    var pairs = [];
    for (var bi = 0; bi + 1 < nodes.length; bi++) {
      var base = document.createElementNS(NS, 'path');
      base.setAttribute('stroke', '#808080');
      base.setAttribute('stroke-width', '2');
      base.setAttribute('stroke-opacity', '0.2');
      base.setAttribute('stroke-linecap', 'round');
      base.setAttribute('fill', 'none');
      svg.appendChild(base);
      var grad = document.createElementNS(NS, 'linearGradient');
      grad.setAttribute('id', 'pk-beam-g' + bi);
      grad.setAttribute('gradientUnits', 'userSpaceOnUse');
      mkstop(grad, '0%', '#6cc1fb', '0');
      mkstop(grad, '0%', '#6cc1fb');
      mkstop(grad, '32.5%', '#0d86e0');
      mkstop(grad, '100%', '#0d86e0', '0');
      defs.appendChild(grad);
      var pulse = document.createElementNS(NS, 'path');
      pulse.setAttribute('stroke', 'url(#pk-beam-g' + bi + ')');
      pulse.setAttribute('stroke-width', '2');
      pulse.setAttribute('stroke-linecap', 'round');
      pulse.setAttribute('fill', 'none');
      svg.appendChild(pulse);
      if (!reduceMotion) {
        var a1 = document.createElementNS(NS, 'animate');
        a1.setAttribute('attributeName', 'x1');
        a1.setAttribute('values', '10%;110%');
        a1.setAttribute('dur', '3s');
        a1.setAttribute('repeatCount', 'indefinite');
        grad.appendChild(a1);
        var a2 = document.createElementNS(NS, 'animate');
        a2.setAttribute('attributeName', 'x2');
        a2.setAttribute('values', '0%;100%');
        a2.setAttribute('dur', '3s');
        a2.setAttribute('repeatCount', 'indefinite');
        grad.appendChild(a2);
      }
      pairs.push({ base: base, pulse: pulse });
    }
    function beamSync() {
      var r = flow.getBoundingClientRect();
      svg.setAttribute('width', Math.round(r.width));
      svg.setAttribute('height', Math.round(r.height));
      svg.setAttribute('viewBox', '0 0 ' + Math.round(r.width) + ' ' + Math.round(r.height));
      for (var k = 0; k + 1 < nodes.length; k++) {
        var na = nodes[k].querySelector('.ball'), nb = nodes[k + 1].querySelector('.ball');
        if (!na || !nb) continue;
        var x1 = nodes[k].offsetLeft + na.offsetLeft + na.offsetWidth / 2;
        var y1 = nodes[k].offsetTop + na.offsetTop + na.offsetHeight / 2;
        var x2 = nodes[k + 1].offsetLeft + nb.offsetLeft + nb.offsetWidth / 2;
        var y2 = nodes[k + 1].offsetTop + nb.offsetTop + nb.offsetHeight / 2;
        var d = 'M ' + x1 + ',' + y1 + ' Q ' + ((x1 + x2) / 2) + ',' + y1 + ' ' + x2 + ',' + y2;
        pairs[k].base.setAttribute('d', d);
        pairs[k].pulse.setAttribute('d', d);
      }
    }
    beamSync();
    if ('ResizeObserver' in window) { new ResizeObserver(beamSync).observe(flow); }
    window.addEventListener('load', beamSync);
    flow.addEventListener('transitionend', function (e) { if (e.propertyName === 'transform') beamSync(); });
  });

  var CONF_COLORS = ['#1a5bff', '#4d86ff', '#6cc1fb', '#a4d9ff', '#ffffff'];
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
      var a = (-90 + (Math.random() - 0.5) * 65) * Math.PI / 180;
      var sp = 380 + Math.random() * 420;
      ps.push({
        x: ox, y: oy,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        w: 5 + Math.random() * 5, h: 8 + Math.random() * 7,
        r: Math.random() * Math.PI * 2, vr: (Math.random() - 0.5) * 12,
        c: CONF_COLORS[(Math.random() * CONF_COLORS.length) | 0],
        life: 1.5 + Math.random() * 0.9, age: 0,
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
        burstAt(en.target, parseInt(en.target.getAttribute('data-confetti'), 10) || 55);
      });
    }, { threshold: 0.35 });
    document.querySelectorAll('[data-confetti]').forEach(function (el) { cio.observe(el); });
  }
  document.querySelectorAll('[data-confetti-load]').forEach(function (el) {
    var n = parseInt(el.getAttribute('data-confetti-load'), 10) || 85;
    setTimeout(function () { burstAt(el, n); }, 350);
  });
})();
