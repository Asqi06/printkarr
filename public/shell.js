// Shared print controls, demonstration and feedback. Motion lives in design-motion.js.
(function () {
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

  document.querySelectorAll('[data-reviews]').forEach(function (section) {
    var rail = section.querySelector('.review-rail'), navigation = section.querySelector('.reviews-navigation');
    if (!rail) return;
    var buttons = navigation.querySelectorAll('button');
    function sync() {
      navigation.hidden = rail.scrollWidth <= rail.clientWidth + 2;
      buttons[0].disabled = rail.scrollLeft <= 2;
      buttons[1].disabled = rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 2;
    }
    buttons.forEach(function (button) {
      button.addEventListener('click', function () {
        var card = rail.querySelector('.review-note');
        rail.scrollBy({left: Number(button.dataset.reviewDirection) * (card.offsetWidth + parseFloat(getComputedStyle(rail).gap)), behavior: reduceMotion ? 'instant' : 'smooth'});
      });
    });
    rail.addEventListener('scroll', sync, {passive:true});
    window.addEventListener('resize', sync);
    sync();
  });

  document.querySelectorAll('[data-delivery-guide-area]').forEach(function (select) {
    select.addEventListener('change', function () {
      select.closest('.delivery-guide').querySelectorAll('[data-delivery-guide-zone]').forEach(function (block) {
        block.hidden = block.dataset.deliveryGuideZone !== select.value;
      });
    });
  });

  document.querySelectorAll('[data-print-quote]').forEach(function (quote) {
    var form = quote.closest('form'), cfg = JSON.parse(quote.dataset.pricing), pages = Number(quote.dataset.pages);
    function value(name) { var input = form.querySelector('[name="' + name + '"]:checked'); return input && input.value; }
    function update() {
      var range = form.querySelector('[name="range"]'), count = pages, error = '';
      if (range && range.value.trim()) {
        var selected = new Set();
        range.value.split(',').forEach(function (part) {
          if (!part.trim() || error) return;
          var match = part.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);
          if (!match) { error = 'Use page numbers such as 1, 3-5.'; return; }
          var first = Number(match[1]), last = Number(match[2] || match[1]);
          if (first < 1 || last < 1 || first > pages || last > pages) { error = 'Choose pages between 1 and ' + pages + '.'; return; }
          for (var i = Math.min(first, last); i <= Math.max(first, last); i++) selected.add(i);
        });
        count = selected.size;
        if (!count && !error) error = 'Pick at least one page.';
      }
      if (range) range.setCustomValidity(error);
      var hint = form.querySelector('#range-err'); if (hint) hint.textContent = error;
      if (error) { quote.querySelector('span').textContent = error; quote.querySelector('b').textContent = 'Check page range'; return; }
      var copies = Math.max(1, Math.min(200, parseInt(form.querySelector('[name="copies"]').value, 10) || 1));
      var slot = value('deliverySlot') || 'express', scheduled = slot.indexOf('local-') === 0;
      var address = form.querySelector('[name="addressId"]:checked'), area = form.querySelector('[name="area"],[name="nn_area"]');
      var zone = scheduled ? slot.split('-')[1] : (address && address.value !== '__new' ? address.dataset.area : area && area.value) || 'Vapi';
      zone = zone.toLowerCase();
      var print = count * copies * (value('printType') === 'color' ? cfg.color : cfg.bw);
      var delivery = slot === 'pickup' ? 0 : slot === 'college' ? 3 : slot === 'college-express' ? 25 : scheduled ? cfg.local[zone].fee : cfg.fees[zone];
      var late = slot === 'express' ? Number(cfg.lateNightFee || 0) : 0, surge = Number(cfg.surgeFee || 0);
      if (!Number.isFinite(print) || !Number.isFinite(delivery)) { quote.querySelector('b').textContent = 'Confirmed at review'; return; }
      quote.querySelector('span').textContent = 'Printing ₹' + print.toLocaleString('en-IN') + ' · delivery ₹' + delivery + (slot === 'college' ? ' (first delivery free; checked at review)' : '') + (late ? ' · late-night ₹' + late : '') + (surge ? ' · high-demand ₹' + surge : '');
      quote.querySelector('b').textContent = 'Estimate ₹' + (Math.round((print + delivery + late + surge) * 100) / 100).toLocaleString('en-IN');
    }
    form.addEventListener('input', update); form.addEventListener('change', update);
    ['cMinus', 'cPlus'].forEach(function (id) {
      var button = form.querySelector('#' + id); if (!button) return;
      button.addEventListener('click', function () { var copies = form.querySelector('[name="copies"]'); copies.value = Math.max(1, Math.min(200, (parseInt(copies.value, 10) || 1) + (id === 'cMinus' ? -1 : 1))); update(); });
    });
    update();
  });

  document.querySelectorAll('[data-wallet-offer]').forEach(function (link) {
    link.addEventListener('click', function () { try { sessionStorage.setItem('pk-wallet-offer', JSON.stringify({ id: link.dataset.walletOffer, at: Date.now() })); } catch {} });
  });
  var prompt = document.querySelectorAll('[data-wallet-prompt]')[0];
  if (prompt && typeof prompt.showModal === 'function') {
    var key = 'pk-wallet-prompt:' + prompt.dataset.promptKey, seen = 0;
    try { seen = Number(localStorage.getItem(key) || sessionStorage.getItem(key)); } catch {}
    function remember() { try { localStorage.setItem(key, String(Date.now())); } catch { try { sessionStorage.setItem(key, String(Date.now())); } catch {} } }
    prompt.querySelectorAll('[data-wallet-dismiss]').forEach(function (button) { button.addEventListener('click', function () { prompt.close(); }); });
    prompt.addEventListener('close', remember);
    prompt.addEventListener('click', function (event) { var box = prompt.getBoundingClientRect(); if (event.target === prompt && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) prompt.close(); });
    prompt.addEventListener('change', function () {
      var selected = prompt.querySelector('[name="wallet-prompt-offer"]:checked');
      prompt.querySelector('[data-prompt-amount]').textContent = '₹' + selected.dataset.amount;
      prompt.querySelector('[data-prompt-total]').textContent = '₹' + (Number(selected.dataset.amount) + Number(selected.dataset.bonus));
      var link = prompt.querySelector('[data-prompt-link]'); link.dataset.walletOffer = selected.value; link.href = '/customer/wallet?offer=' + encodeURIComponent(selected.value);
    });
    prompt.querySelector('[data-prompt-link]').addEventListener('click', remember);
    if (!seen || Date.now() - seen >= 7 * 864e5) { prompt.showModal(); remember(); }
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
