// Live inbox and opt-in admin audio, using native browser APIs.
(function () {
  var user = document.body.dataset.notificationUser, role = document.body.dataset.notificationRole;
  if (!user) return;
  var context, sound = false, seen = null, stopped = false, polling = false, timer;
  var soundButtons = document.querySelectorAll('[data-notification-sound]');
  var inbox = document.querySelector('[data-notification-list]');
  var status = document.querySelector('[data-notification-status]');
  var tone = document.querySelector('[data-notification-tone]');
  var storageKey = 'pk-alerts:' + user, styleKey = 'pk-alert-tone:' + user;
  function read(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; } }
  function write(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }
  function soundState() { soundButtons.forEach(function (button) { button.textContent = sound ? 'Mute sound' : 'Enable sound'; button.setAttribute('aria-pressed', String(sound)); }); }
  async function enableSound() {
    try {
      var Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) throw new Error('Unavailable');
      context ||= new Audio();
      await context.resume(); sound = context.state === 'running'; soundState();
      if (!sound && status) status.textContent = 'Sound is blocked. Try enabling it again.';
    } catch { if (window.toast) window.toast('Sound is unavailable in this browser. Website alerts still work.'); }
  }
  function chime(kind) {
    if (!sound || context?.state !== 'running') return;
    var style = read(styleKey, 'chime'), base = style === 'soft' ? 440 : style === 'bell' ? 1046 : 660;
    var notes = kind === 'order' ? [base, base * 1.5, base * 2] : kind === 'wallet' ? [base * 1.25, base * 1.5] : [base];
    notes.forEach(function (frequency, i) {
      var oscillator = context.createOscillator(), gain = context.createGain(), start = context.currentTime + i * 0.18;
      oscillator.type = 'sine'; oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0, start); gain.gain.linearRampToValueAtTime(0.1, start + 0.015); gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.3);
      oscillator.connect(gain); gain.connect(context.destination); oscillator.start(start); oscillator.stop(start + 0.32);
      oscillator.onended = function () { oscillator.disconnect(); gain.disconnect(); };
    });
  }
  soundButtons.forEach(function (button) { button.addEventListener('click', async function () { if (sound) { sound = false; soundState(); } else { await enableSound(); chime('order'); } }); });
  if (tone) { tone.value = read(styleKey, 'chime'); tone.addEventListener('change', function () { write(styleKey, tone.value); chime('order'); }); }
  document.querySelectorAll('[data-notification-test]').forEach(function (button) { button.addEventListener('click', async function () { await enableSound(); chime('order'); }); });
  async function markRead(body) {
    try {
      var response = await fetch('/api/notifications/read', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!response.ok) throw new Error('Unread');
      clearTimeout(timer); await poll(); return true;
    } catch { if (status) status.textContent = 'Could not mark notifications as read. Please retry.'; return false; }
  }
  document.querySelectorAll('[data-notification-read-all]').forEach(function (button) { button.addEventListener('click', function () { markRead({ all: true }); }); });
  function render(data) {
    document.querySelectorAll('[data-notification-count]').forEach(function (counter) { counter.textContent = data.unread; });
    if (!inbox) return;
    inbox.replaceChildren();
    data.notes.forEach(function (note) {
      var row = document.createElement('div'); row.className = 'sumrow';
      var content = document.createElement('div'), link = document.createElement('a'), time = document.createElement('small');
      // Older notifications have no target; keep all links on this origin.
      link.href = typeof note.href === 'string' && /^\/(?!\/)/.test(note.href) ? note.href : '/' + role + '/notifications';
      link.textContent = note.text; link.className = 'rowlink';
      time.textContent = new Date(note.at).toLocaleString('en-IN'); time.style.display = 'block';
      content.append(link, time); row.append(content);
      if (!note.read) {
        var button = document.createElement('button'); button.type = 'button'; button.className = 'rowlink'; button.textContent = 'Mark read';
        button.addEventListener('click', function () { markRead({ id: note.id }); }); row.append(button);
      }
      inbox.append(row);
    });
    status.textContent = data.notes.length ? data.unread + ' unread · showing the latest 50 notifications.' : 'No notifications yet.';
  }
  async function poll() {
    if (stopped || polling) return;
    polling = true;
    try {
      var response = await fetch('/api/notifications', { cache: 'no-store' });
      if (response.status === 401) { stopped = true; if (status) status.textContent = 'Please sign in again to see notifications.'; return; }
      if (!response.ok) throw new Error('Offline');
      var data = await response.json(); render(data);
      var claimed = read(storageKey, []);
      var fresh = seen ? data.notes.filter(function (n) { return !n.read && !seen.has(n.id) && !claimed.includes(n.id); }) : [];
      seen = new Set(data.notes.map(function (n) { return n.id; }));
      if (fresh.length) {
        if (window.toast) window.toast(fresh[0].text);
        if (role === 'admin' && sound && context?.state === 'running') {
          write(storageKey, claimed.concat(fresh.map(function (n) { return n.id; })).slice(-100));
          chime(fresh.find(function (n) { return n.kind === 'order'; })?.kind || fresh[0].kind);
        }
      }
    } catch { if (status) status.textContent = 'Connection interrupted. Alerts will retry automatically.'; }
    finally { polling = false; clearTimeout(timer); if (!stopped) timer = setTimeout(poll, 5000); }
  }
  poll();
  window.addEventListener('pagehide', function () { stopped = true; clearTimeout(timer); if (context) context.close().catch(function () {}); });
  window.addEventListener('pageshow', function (event) { if (event.persisted) { context = null; sound = false; soundState(); stopped = false; poll(); } });
})();
