// Rider views — dashboard (§20), orders (§21), workflow (§22),
// navigate sim (§23), proof (§24), earnings (§25), profile.
import { layout, esc, greeting, LEAFLET_HEAD } from './views.js';
import { friendly } from './views_customer.js';

const rs = (n) => '₹' + (Math.round(n * 100) / 100);
const badge = (s) => `<span class="badge b-${s}">${friendly(s)}</span>`;
export const has = (order, key) => (order.tracking || []).some((t) => t.key === key);

export function riderDashboard(user, { pending, doneToday, earnedToday, next }) {
  const card = next
    ? `<div class="card ink rv">
        <p class="eyebrow" style="color:rgba(250,245,234,.6)">Next delivery · #${esc(next.id)}</p>
        <div class="stat" style="margin:8px 0"><div class="v">${esc(next.short)}</div></div>
        <p class="mono" style="font-size:11px">${esc(next.addr)} · ${badge(next.status)}</p>
        <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap">
          <a class="btn sun" href="/rider/orders/${next.id}/navigate"><span>Navigate →</span></a>
          <a class="btn loud" href="/rider/orders/${next.id}"><span>Open job →</span></a>
        </div>
      </div>`
    : `<div class="card sun rv"><div class="stat"><div class="v">Clear</div><div class="k">No pending drops. Chai time.</div></div></div>`;
  return layout({
    title: 'Dashboard', user, extraCss: '/customer.css', active: '/rider',
    body: `
    <p class="eyebrow rv">Rider dashboard</p>
    <h1 class="display rv" style="font-size:clamp(2rem,6vw,4rem)">${greeting(user.name).replace(/, ([^,]+)$/, ', <em>$1</em>')}</h1>
    <div class="grid c3" style="margin:18px 0">
      <div class="card rv"><div class="stat"><div class="v">${pending}</div><div class="k">Pending drops</div></div></div>
      <div class="card rv"><div class="stat"><div class="v">${doneToday}</div><div class="k">Delivered today</div></div></div>
      <div class="card sun rv"><div class="stat"><div class="v">${rs(earnedToday)}</div><div class="k">Today's earnings</div></div></div>
    </div>
    ${card}`
  });
}

export function riderOrders(user, { tab, counts, orders }) {
  const tabs = ['assigned', 'active', 'completed'].map((t) =>
    `<a class="chip ${t === tab ? 'on' : ''}" href="/rider/orders?tab=${t}">${t[0].toUpperCase() + t.slice(1)} · ${counts[t]}</a>`).join('');
  const cards = orders.map((o) => `
    <a class="card rv" href="/rider/orders/${o.id}">
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:center">
        <b class="mono">#${esc(o.id)}</b>${badge(o.status)}
      </div>
      <div class="sumrow"><span>Pickup</span><span>Printkarr Hub</span></div>
      <div class="sumrow"><span>Drop</span><span>${esc(o.short)}</span></div>
      <div class="sumrow"><span>Customer</span><span>${esc(o.cname)}</span></div>
      <div class="sumrow total"><span>Collect</span><span>${rs(o.total)}</span></div>
    </a>`).join('') || '<div class="card"><p class="muted">Nothing here. The hub will call.</p></div>';
  return layout({
    title: 'Orders', user, extraCss: '/customer.css', active: '/rider/orders',
    body: `
    <p class="eyebrow rv">My jobs</p>
    <h1 class="display rv" style="font-size:clamp(2rem,6vw,3.6rem)">The <em>route.</em></h1>
    <div class="chips rv" style="margin:16px 0">${tabs}</div>
    <div class="grid c2">${cards}</div>`
  });
}

export function riderDetail(user, order, customer, address) {
  let action = '';
  if (order.status === 'RIDER_ASSIGNED') {
    if (!has(order, 'accepted')) {
      action = `<form method="POST" action="/rider/orders/${order.id}/accept"><button class="btn loud big" style="width:100%" type="submit"><span>Accept order</span></button></form>`;
    } else if (!has(order, 'at-pickup')) {
      action = `<div style="display:flex;gap:8px;flex-wrap:wrap"><a class="btn solid" href="/rider/orders/${order.id}/navigate"><span>Navigate →</span></a>
        <form method="POST" action="/rider/orders/${order.id}/at-pickup"><button class="btn sun" type="submit"><span>At pickup</span></button></form></div>`;
    } else {
      action = `<form method="POST" action="/rider/orders/${order.id}/picked-up"><button class="btn loud big" style="width:100%" type="submit"><span>Mark as picked up</span></button></form>`;
    }
  } else if (order.status === 'PICKED_UP') {
    action = `<form method="POST" action="/rider/orders/${order.id}/start-delivery"><button class="btn loud big" style="width:100%" type="submit"><span>Start delivery →</span></button></form>`;
  } else if (order.status === 'OUT_FOR_DELIVERY') {
    if (!has(order, 'arrived')) {
      action = `<div style="display:flex;gap:8px;flex-wrap:wrap"><a class="btn solid" href="/rider/orders/${order.id}/navigate"><span>Navigate →</span></a>
        <form method="POST" action="/rider/orders/${order.id}/arrived"><button class="btn sun" type="submit"><span>Arrived at door</span></button></form></div>`;
    } else {
      action = `<form method="POST" action="/rider/orders/${order.id}/deliver">
        <p class="eyebrow">Confirm delivery</p>
        <div style="display:flex;flex-direction:column;gap:8px;margin:10px 0">
          <label class="pick"><input type="radio" name="handover" value="customer" checked> Customer received</label>
          <label class="pick"><input type="radio" name="handover" value="security"> Left at security / reception</label>
        </div>
        <div class="field"><label for="proof">Note (optional)</label><input id="proof" name="note" placeholder="Gate code, floor, who took it…"></div>
        <button class="btn loud big" style="width:100%" type="submit"><span>Confirm delivery ✓</span></button></form>`;
    }
  } else {
    action = `<p class="muted">This job is <b>${friendly(order.status).toLowerCase()}</b>. Nothing to do.</p>`;
  }
  return layout({
    title: `Job ${order.id}`, user, extraCss: '/customer.css', active: '/rider/orders',
    body: `
    <p class="eyebrow rv"><a href="/rider/orders" style="text-decoration:none">← Jobs</a></p>
    <h1 class="display rv" style="font-size:clamp(2rem,6vw,3.6rem)">Job <em>#${esc(order.id)}</em></h1>
    <div class="rv" style="margin:10px 0 18px">${badge(order.status)}</div>
    <div class="grid c2">
      <div class="card rv"><p class="eyebrow">Drop</p>
        <p style="font-weight:700;margin:8px 0">${esc(customer.name)} · ${esc(customer.phone)}</p>
        <p class="muted">${esc(address.address)}, ${esc(address.area)} ${esc(address.pin)}</p>
        <div class="sumrow" style="margin-top:10px"><span>📄 ${esc(order.document)}</span><span>${order.pages}p × ${order.copies}</span></div>
        <div class="sumrow total"><span>Collect</span><span>${rs(order.total)}</span></div>
      </div>
      <div class="card rv"><p class="eyebrow">Workflow</p><div style="margin-top:10px">${action}</div></div>
    </div>`
  });
}

export function navigatePage(user, order, address, customer, est) {
  return layout({
    title: 'Navigate', user, extraCss: '/customer.css', extraHead: LEAFLET_HEAD, active: '/rider/orders',
    body: `
    <p class="eyebrow rv"><a href="/rider/orders/${order.id}" style="text-decoration:none">← Job #${esc(order.id)}</a></p>
    <h1 class="display rv" style="font-size:clamp(2rem,6vw,3.6rem)">Follow the <em>dots.</em></h1>
    <div class="card ink rv" style="margin-top:18px">
      <p class="eyebrow" style="color:rgba(250,245,234,.6)">Simulated route · demo</p>
      <div class="routeline">
        <div class="rstop"><span class="pip done"></span><div><b>Printkarr Hub</b><br><span class="muted" style="color:rgba(250,245,234,.6)">Sarigam — pickup</span></div></div>
        <div class="rroad mono">┆ ${est.km} km · ~${est.mins} min ┆</div>
        <div class="rstop"><span class="pip now"></span><div><b>${esc(address.address)}</b><br><span style="color:rgba(250,245,234,.6)">${esc(address.area)} ${esc(address.pin)}</span></div></div>
      </div>
      <div class="sumrow" style="border-color:rgba(250,245,234,.25)"><span>Customer</span><span>${esc(customer.name)} · ${esc(customer.phone)}</span></div>
      <div class="sumrow" style="border:none"><span>Collect on delivery</span><span>${rs(order.total)}</span></div>
    </div>
    <div id="ridemap" class="rv" style="height:280px;border:2px solid var(--ink);border-radius:12px;margin-top:14px;z-index:0"></div>
    <div class="rv" style="margin-top:10px"><button id="shareBtn" class="btn sun" type="button"><span>◎ Share live location</span></button></div>
    <p class="mono muted rv" id="share-status" style="font-size:10px;margin-top:6px">Your customer watches this map live. GPS needs HTTPS (or localhost) + permission.</p>
    <script>
    (function(){
      var st = document.getElementById('share-status'), btn = document.getElementById('shareBtn');
      var watch = null, lastSent = 0, map = null, meM = null;
      function say(t){ if (st) st.textContent = t; }
      if (!('geolocation' in navigator)) { say('No GPS on this device.'); btn.disabled = true; return; }
      var mtries = 0;
      function addTiles(mp, cfg){
        var main = L.tileLayer(cfg.map.tiles, { attribution: cfg.map.attribution, maxZoom: 19 });
        var errs = 0, swapped = false;
        main.on('tileerror', function(){
          if (swapped || ++errs < 3) return; swapped = true;
          try { mp.removeLayer(main); } catch (e) {}
          L.tileLayer(cfg.map.tilesFallback, { attribution: cfg.map.attributionFallback, maxZoom: 19 }).addTo(mp);
        });
        main.addTo(mp);
      }
      (function bootMap(){
        if (typeof L !== 'undefined') {
          fetch('/api/config').then(function(r){ return r.json(); }).then(function(cfg){
            map = L.map('ridemap', { scrollWheelZoom: false }).setView([cfg.map.hub.lat, cfg.map.hub.lng], 13);
            addTiles(map, cfg);
            L.marker([cfg.map.hub.lat, cfg.map.hub.lng]).addTo(map).bindPopup('Printkarr Hub');
          }).catch(function(){});
          return;
        }
        if (++mtries < 40) setTimeout(bootMap, 200);
      })();
      function send(la, ln){
        fetch('/api/rider/location', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lat: la, lng: ln, orderId: '${order.id}' }) })
          .then(function(r){ if (r.ok) { lastSent = Date.now(); say('Sharing live • just now'); } });
      }
      setInterval(function(){ if (watch !== null && lastSent) say('Sharing live • updated ' + Math.round((Date.now() - lastSent) / 1000) + 's ago'); }, 5000);
      btn.addEventListener('click', function(){
        if (watch !== null) {
          navigator.geolocation.clearWatch(watch); watch = null;
          btn.querySelector('span').textContent = '◎ Share live location'; say('Sharing paused.'); return;
        }
        watch = navigator.geolocation.watchPosition(function(p){
          var la = p.coords.latitude, ln = p.coords.longitude;
          if (map) {
            if (!meM) { meM = L.marker([la, ln]).addTo(map).bindPopup('You — the customer sees this dot'); map.setView([la, ln], 14); }
            else meM.setLatLng([la, ln]);
          }
          send(la, ln);
        }, function(){ say('Location blocked — allow permission and tap again.'); watch = null; },
        { enableHighAccuracy: true, maximumAge: 8000, timeout: 15000 });
        btn.querySelector('span').textContent = '■ Stop sharing';
        say('Acquiring GPS…');
      });
    })();
    </script>`
  });
}

export function earningsPage(user, { today, week, count, rows }) {
  const list = rows.map((t) => `
    <div class="sumrow"><span>Delivery #${esc(t.orderId)}</span><span>+${rs(t.amount)} · <span class="at" style="display:inline">${esc(new Date(t.at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }))}</span></span></div>`
  ).join('') || '<p class="muted">No deliveries yet — earnings land here per drop.</p>';
  return layout({
    title: 'Earnings', user, extraCss: '/customer.css', active: '/rider/earnings',
    body: `
    <p class="eyebrow rv">My earnings</p>
    <h1 class="display rv" style="font-size:clamp(2.6rem,8vw,5rem)">${rs(today)}<em> today.</em></h1>
    <div class="grid c3" style="margin:18px 0">
      <div class="card sun rv"><div class="stat"><div class="v">${rs(week)}</div><div class="k">This week</div></div></div>
      <div class="card rv"><div class="stat"><div class="v">${count}</div><div class="k">Completed deliveries</div></div></div>
      <div class="card ink rv"><div class="stat"><div class="v"><em>₹15</em></div><div class="k">Base demo rate / drop</div></div></div>
    </div>
    <div class="card rv"><p class="eyebrow">Breakdown</p><div style="margin-top:8px">${list}</div></div>`
  });
}

export function riderProfile(user) {
  return layout({
    title: 'Profile', user, extraCss: '/customer.css', active: '/rider/profile',
    body: `
    <p class="eyebrow rv">Rider profile</p>
    <h1 class="display rv" style="font-size:clamp(2rem,6vw,3.6rem)">${esc(user.name).split(' ')[0]}<em>'s rig.</em></h1>
    <div class="card rv" style="margin-top:18px">
      <div class="sumrow"><span>Name</span><span>${esc(user.name)}</span></div>
      <div class="sumrow"><span>Phone</span><span>${esc(user.phone || '—')}</span></div>
      <div class="sumrow"><span>Email</span><span class="mono" style="font-size:12px">${esc(user.email)}</span></div>
      <div class="sumrow"><span>Status</span><span>${user.online ? '● Online' : '○ Offline'}</span></div>
      <form method="POST" action="/rider/online" style="margin-top:12px">
        <input type="hidden" name="online" value="${user.online ? 'off' : 'on'}">
        <button class="btn ${user.online ? 'ghost' : 'sun'}" type="submit"><span>Go ${user.online ? 'offline' : 'online'}</span></button>
      </form>
    </div>`
  });
}
