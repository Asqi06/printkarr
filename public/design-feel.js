// PrintKarr UI feels — Grofers/Sushi-inspired interaction layer.
// 1) dark-light theme toggle with a View-Transitions circle reveal
// 2) optional WebAudio tap feedback on buttons ("feel" layer, off by default)
// 3) SMIL-free skeleton shimmer for the notification count while it loads.
// Public marketing pages (`.public-site`, `.signin-site`, `.store-view`)
// stay light and toggle-free by design; app surfaces opt in via CSS scope.
(function () {
  'use strict';
  var root = document.documentElement;
  var app = document.body.classList.contains('app-view') || document.body.classList.contains('order-focus');
  function store(key, value) { try { localStorage.setItem(key, value); } catch (e) {} }
  function stored(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }

  /* ---------- theme ---------- */
  var osDark = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  function osTheme() { return osDark && osDark.matches ? 'dark' : 'light'; }
  var THEME_COLOR = { light: '#2448EF', dark: '#0c1224' };
  function paintMeta(theme) {
    if (!app) return; // marketing pages keep their own static theme-color
    var meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      (document.head || root).appendChild(meta);
    }
    meta.setAttribute('content', THEME_COLOR[theme] || THEME_COLOR.light);
  }
  function resolveTheme() {
    var saved = stored('pk-theme');
    return saved === 'dark' || saved === 'light' ? saved : osTheme();
  }
  var currentTheme = root.getAttribute('data-theme') || resolveTheme();
  function applyTheme(theme) {
    currentTheme = theme === 'dark' ? 'dark' : 'light';
    root.setAttribute('data-theme', currentTheme);
    paintMeta(currentTheme);
    syncControls();
  }
  function reducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  function circleReveal(x, y, next) {
    if (!app || !document.startViewTransition || reducedMotion()) { next(); return; }
    var radius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );
    root.style.setProperty('--vt-x', x + 'px');
    root.style.setProperty('--vt-y', y + 'px');
    root.style.setProperty('--vt-r', radius + 'px');
    var transition = document.startViewTransition(function () { next(); });
    transition.finished.finally(function () {
      root.classList.remove('vt-theme');
    });
    root.classList.add('vt-theme');
  }
  function toggleTheme(x, y) {
    var target = currentTheme === 'dark' ? 'light' : 'dark';
    store('pk-theme', target);
    circleReveal(x || window.innerWidth / 2, y || window.innerHeight / 2, function () {
      applyTheme(target);
    });
  }
  if (osDark && osDark.addEventListener) {
    osDark.addEventListener('change', function () {
      if (!stored('pk-theme')) applyTheme(osTheme());
    });
  }
  window.addEventListener('storage', function (event) {
    if (event.key === 'pk-theme' && event.newValue) applyTheme(event.newValue);
  });
  window.addEventListener('beforeprint', function () {
    if (!root.dataset.printTheme && currentTheme === 'dark') {
      root.dataset.printTheme = 'dark';
      root.setAttribute('data-theme', 'light');
      paintMeta('light');
    }
  });
  window.addEventListener('afterprint', function () {
    if (root.dataset.printTheme) {
      delete root.dataset.printTheme;
      applyTheme(resolveTheme());
    }
  });

  /* ---------- tap sounds (opt in) ---------- */
  var ctx = null, lastTick = 0;
  var soundOn = stored('pk-feel-sound') === '1';
  function audio() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function beep(kind) {
    var clip = kind === 'pop' ? { type: 'triangle', from: 560, to: 330, ms: 110, peak: 0.07 } : { type: 'sine', from: 1750, to: 1150, ms: 75, peak: 0.05 };
    var now = ctx.currentTime, osc = ctx.createOscillator(), gain = ctx.createGain(), filter = ctx.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = 6200;
    osc.type = clip.type;
    osc.frequency.setValueAtTime(clip.from, now);
    osc.frequency.exponentialRampToValueAtTime(clip.to, now + clip.ms / 1000);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(clip.peak, now + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + clip.ms / 1000 + 0.02);
    osc.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
    osc.start(now); osc.stop(now + clip.ms / 1000 + 0.05);
    osc.onended = function () { try { osc.disconnect(); gain.disconnect(); filter.disconnect(); } catch (e) {} };
  }
  function tickSound(kind) {
    var now = Date.now();
    if (now - lastTick < 45) return;
    if (document.hidden || typeof window.AudioContext === 'undefined' && typeof window.webkitAudioContext === 'undefined') return;
    lastTick = now;
    try { audio(); beep(kind); } catch (e) { /* audio is a feel, never a failure */ }
  }
  var FEEL_SELECTOR = '.btn, button:not([data-feel-own]), .pick, .rowlink, summary';
  function feelFrom(event) {
    if (!app || !soundOn) return null;
    var target = event.target;
    if (target && target.closest) {
      var hit = target.closest(FEEL_SELECTOR);
      if (hit && !hit.disabled && !hit.getAttribute('aria-busy')) return hit;
    }
    return null;
  }
  document.addEventListener('pointerdown', function (event) {
    if (event.button === 0 || event.pointerType !== 'mouse') {
      if (feelFrom(event)) tickSound('tick');
    }
  }, { capture: true, passive: true });
  document.addEventListener('keydown', function (event) {
    if ((event.key === 'Enter' || event.key === ' ') && !event.repeat && feelFrom(event)) tickSound('tick');
  }, { capture: true });

  /* ---------- floating controls ---------- */
  var SUN = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.5"/><path d="M12 2.5v2.6M12 18.9v2.6M2.5 12h2.6M18.9 12h2.6M5.2 5.2l1.9 1.9M16.9 16.9l1.9 1.9M18.8 5.2l-1.9 1.9M7.1 16.9l-1.9 1.9"/></svg>';
  var MOON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.6 14.2A8.9 8.9 0 0 1 9.8 3.4a8.9 8.9 0 1 0 10.8 10.8Z"/></svg>';
  var HI = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11.5 4 6.8 9.9a1 1 0 0 0 .78 1.63h2v3.4a1 1 0 0 0 1 1h2.4a1 1 0 0 0 1-1v-3.42h2a1 1 0 0 0 1-1H14"/><path d="M11.5 4 22 10.3"/></svg>';
  var MUTE = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6.5 9H3v6h3.5L11 19z"/><path d="m16 9 5 6m0-6-5 6"/></svg>';
  var PILL = document.createElement('div');
  PILL.className = 'pk-feel';
  PILL.setAttribute('role', 'group');
  PILL.setAttribute('aria-label', 'Display and tap-sound preferences');
  var themeBtn = document.createElement('button');
  themeBtn.type = 'button';
  themeBtn.className = 'pk-feel-btn';
  themeBtn.setAttribute('data-feel-own', '');
  var soundBtn = document.createElement('button');
  soundBtn.type = 'button';
  soundBtn.className = 'pk-feel-btn';
  soundBtn.setAttribute('data-feel-own', '');
  function syncControls() {
    var dark = currentTheme === 'dark';
    themeBtn.innerHTML = dark ? SUN : MOON;
    themeBtn.setAttribute('aria-pressed', String(dark));
    themeBtn.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
    themeBtn.title = themeBtn.getAttribute('aria-label');
    soundBtn.innerHTML = soundOn ? HI : MUTE;
    soundBtn.setAttribute('aria-pressed', String(soundOn));
    soundBtn.setAttribute('aria-label', soundOn ? 'Mute tap feedback' : 'Play tap feedback sounds');
    soundBtn.title = soundBtn.getAttribute('aria-label');
  }
  themeBtn.addEventListener('click', function (event) {
    var rect = themeBtn.getBoundingClientRect();
    var x = event.clientX || rect.left + rect.width / 2;
    var y = event.clientY || rect.top + rect.height / 2;
    toggleTheme(x, y);
  });
  soundBtn.addEventListener('click', function () {
    soundOn = !soundOn;
    store('pk-feel-sound', soundOn ? '1' : '0');
    syncControls();
    if (soundOn) tickSound('pop');
  });
  syncControls();
  if (app) {
    PILL.append(themeBtn, soundBtn);
    document.body.appendChild(PILL);
  }
  applyTheme(currentTheme);

  /* ---------- notification-count skeleton ---------- */
  var counters = document.querySelectorAll('[data-notification-count]');
  if (counters.length && window.MutationObserver) {
    var settled = false, observer;
    var settle = function () {
      if (settled) return;
      settled = true;
      if (observer) observer.disconnect();
      counters.forEach(function (counter) { counter.classList.remove('pk-skeleton'); });
    };
    observer = new MutationObserver(settle);
    counters.forEach(function (counter) {
      counter.classList.add('pk-skeleton');
      observer.observe(counter, { childList: true, characterData: true, subtree: true });
    });
    setTimeout(settle, 10000);
  }

  /* tiny QA surface */
  window.PKFeel = {
    theme: function () { return currentTheme; },
    setTheme: function (theme) { store('pk-theme', theme); applyTheme(theme); },
    sound: function () { return soundOn; },
    setSound: function (on) { soundOn = !!on; store('pk-feel-sound', on ? '1' : '0'); syncControls(); }
  };
})();
