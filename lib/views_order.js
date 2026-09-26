// Customer order wizard (§6–13), wallet (§17), profile (§18–19).
import { layout, esc, DELIVERY_MAP_HEAD, deliveryPicker } from './views.js';

const rs = (n) => '₹' + (Math.round(n * 100) / 100);

function documentPreview(url, pages, range, fileType) {
  const isImage = fileType === 'image';
  const selected = range ? range.split(',').map((part) => {
    const match = part.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (!match) return esc(part);
    const first = Number(match[1]), last = Number(match[2] || match[1]);
    return first === last ? String(first) : `${Math.min(first, last)}–${Math.max(first, last)}`;
  }).join(', ') : (isImage ? 'this photo' : `all ${esc(pages)} pages`);
  const selection = range ? `pages ${selected}${pages ? ` of ${esc(pages)}` : ''}` : selected;
  const frame = isImage
    ? `<img title="Photo preview" src="${esc(url)}" alt="Photo to print" loading="lazy" style="display:block;width:100%;height:auto;max-height:560px;object-fit:contain;background:#fff;border:1px solid #d6dfec;border-radius:8px">`
    : `<iframe title="PDF page preview" src="${esc(url)}#toolbar=1&amp;navpanes=0" loading="lazy"></iframe>`;
  return `<details class="document-preview">
    <summary><span>Preview your ${isImage ? 'photo' : 'PDF'}</span><small>${isImage ? 'One photo, one page' : 'Check the actual pages before printing'}</small></summary>
    <div class="document-preview-body">
      <p class="document-preview-pages">Printing <b>${selection}</b></p>
      ${frame}
      <a href="${esc(url)}" target="_blank" rel="noopener">Open ${isImage ? 'photo' : 'PDF'} in a new tab ↗</a>
    </div>
  </details>`;
}

export function uploadStep(user) {
  return layout({
    title: 'New order', user, extraCss: '/customer.css', active: '/customer/orders/new',
    body: `
    <p class="eyebrow rv">Create new order · step 1 of 3</p>
    <h1 class="display rv" style="font-size:clamp(2rem,6vw,3.6rem)">Feed the <em>press.</em></h1>
    <form class="card rv" style="margin-top:18px" method="POST" action="/customer/orders/new/upload" enctype="multipart/form-data">
      <label class="drop" for="doc"><span class="drop-arrow">↑</span><b>Upload file</b><span class="muted">PDF, PNG or JPG up to 50 MB · pages counted instantly</span></label>
      <input id="doc" name="doc" type="file" accept="application/pdf,.pdf,.png,.jpg,.jpeg" required class="file-input">
      <p class="mono muted" id="fname" style="font-size:11px;margin:10px 0"></p>
      <button class="btn loud big" type="submit" style="width:100%"><span>Count my pages →</span></button>
    </form>
    <script>document.getElementById('doc').addEventListener('change',e=>{document.getElementById('fname').textContent=e.target.files[0]?('📄 '+e.target.files[0].name):'';});</script>`
  });
}

export function optionsStep(user, draft, addresses) {
  const addrRadios = addresses.map((a) => `
    <label class="pick"><input type="radio" name="addressId" value="${a.id}" data-area="${esc(a.area)}" data-lat="${esc(a.lat || '')}" data-lng="${esc(a.lng || '')}" ${a.isDefault ? 'checked' : ''} required>
    <b>${esc(a.label)}</b> — ${esc(a.address)}, ${esc(a.area)} ${esc(a.pin)}</label>`).join('');
  return layout({
    title: 'Print options', user, extraCss: '/customer.css', extraHead: DELIVERY_MAP_HEAD, active: '/customer/orders/new',
    body: `
    <p class="eyebrow rv">Step 2 of 3 · ${draft.fileType === 'image' ? '🖼️' : '📄'} ${esc(draft.document)} · ${draft.fileType === 'image' ? '1 photo page' : `${draft.pages} pages`}</p>
    <h1 class="display rv" style="font-size:clamp(2rem,6vw,3.6rem)">How should <em>it print?</em></h1>
    <form method="POST" action="/customer/orders/new/confirm" style="margin-top:18px">
      <input type="hidden" name="draft" value="${draft.id}">
      <div class="card rv">
        <p class="eyebrow">Pages to print</p>
        ${draft.fileType === 'image'
          ? '<p class="field-hint">One photo prints as one full page — pick colour and copies below.</p>'
          : '<div class="field" style="margin-top:8px"><input id="range" name="range" autocomplete="off" aria-label="Pages to print" aria-describedby="range-hint" placeholder="e.g. 1-5, 8, 10-12"><p class="field-hint" id="range-hint">Choose exactly what prints: single pages (<b>8</b>) or ranges (<b>1-5</b>), separated by commas — e.g. <b>1-5, 8, 10-12</b>. Leave empty to print all ' + draft.pages + ' pages.</p></div>'}
        <div class="grid c2">
          <div class="field"><label>Print type</label><div class="chips">
            <label class="chip-pick"><input type="radio" name="printType" value="bw" checked> B&W</label>
            <label class="chip-pick"><input type="radio" name="printType" value="color"> Color</label></div></div>
          <div class="field"><label>Sides</label><div class="chips">
            <label class="chip-pick"><input type="radio" name="sides" value="single" checked> Single</label>
            <label class="chip-pick"><input type="radio" name="sides" value="double"> Double</label></div></div>
        </div>
        <div class="grid c2">
          <div class="field"><label for="copies">Copies</label><input id="copies" aria-label="Number of copies" name="copies" type="number" value="1" min="1" max="200"></div>
          <div class="field"><label>Paper</label><input value="A4" disabled></div>
        </div>
        <div class="grid c2">
          <div class="field"><label for="orientation">Orientation</label><select id="orientation" name="orientation"><option value="auto">Auto</option><option value="portrait">Portrait</option><option value="landscape">Landscape</option></select></div>
          <div class="field"><label for="binding">Binding</label><select id="binding" name="binding"><option value="none">None</option><option value="staple">Staple</option><option value="spiral">Spiral binding</option></select></div>
        </div>
        <div class="field"><label for="notes">Notes for the printer</label><textarea id="notes" name="notes" rows="2" placeholder="Please staple after page 10."></textarea></div>
      </div>
      <div class="card rv" style="margin-top:14px">
        <p class="eyebrow">Deliver to or collect at a kiosk</p>
        <div style="margin-top:8px;display:flex;flex-direction:column;gap:8px">${addrRadios}</div>
        <details style="margin-top:10px" ${addresses.length ? '' : 'open'}><summary class="rowlink">+ New address</summary>
          <div class="grid c2" style="margin-top:10px">
            <div class="field"><label>Name</label><input name="nn_name"></div>
            <div class="field"><label>Phone</label><input name="nn_phone"></div>
          </div>
          <div class="field"><label>Address</label><input name="nn_address"></div>
          <div class="grid c3">
            <div class="field"><label>Area</label><select name="nn_area"><option>Vapi</option><option>Sarigam</option><option>Bhilad</option><option>Daman</option><option>Kiosk pickup</option></select></div>
            <div class="field"><label>Landmark</label><input name="nn_landmark"></div>
            <div class="field"><label>PIN</label><input name="nn_pin"></div>
          </div>
          <label class="pick"><input type="radio" name="addressId" value="__new" ${addresses.length ? '' : 'checked'}> Use this new address</label>
        </details>
        ${deliveryPicker()}
      </div>
      <div class="card rv" style="margin-top:14px">
        <p class="eyebrow">Delivery slot</p>
        <div class="chips" style="margin-top:8px">
          <label class="chip-pick"><input type="radio" name="slotKind" value="ASAP"> ASAP</label>
          <label class="chip-pick"><input type="radio" name="slotKind" value="Today" checked> Today</label>
          <label class="chip-pick"><input type="radio" name="slotKind" value="Schedule"> Schedule</label>
        </div>
        <div class="field" style="margin-top:10px;max-width:280px"><label for="slotTime">Time</label>
          <select id="slotTime" name="slotTime"><option>5:00 PM</option><option>5:30 PM</option><option selected>6:30 PM</option><option>7:00 PM</option></select></div>
      </div>
      <button class="btn loud big rv" type="submit" style="width:100%;margin-top:16px"><span>Review order →</span></button>
    </form>`
  });
}

export function summaryStep(user, draft, s, q, packCover = null, ref = { code: '', error: null }) {
  return layout({
    title: 'Review', user, extraCss: '/customer.css', active: '/customer/orders/new',
    body: `
    <p class="eyebrow rv">Step 3 of 3 · review</p>
    <h1 class="display rv" style="font-size:clamp(2rem,6vw,3.6rem)">Look <em>right?</em></h1>
    <div class="card rv" style="margin-top:18px">
      <p class="eyebrow">Order summary</p>
      <p style="font-weight:700;margin:8px 0">📄 ${esc(draft.document)}</p>
      ${documentPreview(`/customer/orders/new/${encodeURIComponent(draft.id)}/preview.pdf`, draft.pages, s.range, draft.fileType)}
      <div class="sumrow"><span>${s.effPages} pages × ${s.copies}</span><span>${rs(q.subtotal + (q.studentDiscount || 0))}</span></div>
      <div class="sumrow"><span>${s.printType === 'bw' ? 'B&W' : 'Color'} · ${s.sides} · ${s.orientation} · ${s.binding}</span></div>
      ${q.studentDiscount ? `<div class="sumrow disc"><span>Student discount</span><span>−${rs(q.studentDiscount)}</span></div>` : ''}
      ${packCover ? `<div class="sumrow disc"><span>Semester pack ${esc(packCover.packName)} · ${s.effPages * s.copies} sides covered</span><span>−${rs(q.subtotal)}</span></div>` : ''}
      ${ref.discount ? `<div class="sumrow disc"><span>Friend referral ${esc(ref.code)}</span><span>−${rs(ref.discount)}</span></div>` : ''}
      <div class="sumrow"><span>${s.zone === 'pickup' ? 'Kiosk collection' : `Delivery · ${esc(s.zoneLabel)} · approx. ${q.deliveryKm} km from base`}</span><span>${q.deliveryFee === 0 ? '<span class="freebadge">FREE</span>' : rs(q.deliveryFee)}</span></div>
      ${q.lateNightFee ? `<div class="sumrow"><span>Late-night delivery</span><span>${rs(q.lateNightFee)}</span></div>` : ''}
      ${q.surgeFee ? `<div class="sumrow"><span>High-demand fee</span><span>${rs(q.surgeFee)}</span></div>` : ''}
      <div class="sumrow total"><span>Total</span><span>${rs(q.total)}</span></div>
      <form method="POST" action="/customer/orders/new/place" style="margin-top:14px">
        <input type="hidden" name="draft" value="${draft.id}">
        ${packCover ? '' : `<div class="field"><label for="coupon">Coupon code (optional)</label><input id="coupon" name="coupon" placeholder="WELCOME50" style="text-transform:uppercase"></div>`}
        <div class="field"><label for="referral">Friend's referral code (first order, optional)</label><input id="referral" name="referral" placeholder="K7Q2M4" value="${esc(ref.code)}" style="text-transform:uppercase" maxlength="12"></div>
        ${ref.error ? `<p class="login-err" role="alert">${esc(ref.error)}</p>` : ''}
        <button class="btn loud big" type="submit" style="width:100%"><span>Confirm order →</span></button>
      </form>
    </div>`
  });
}

export function payStep(user, order, opts = {}) {
  const isOwner = !!opts.isOwner;
  const printSubtotal = Math.max(0, Number(order.subtotal ?? (Number(order.total || 0) - Number(order.deliveryFee || 0) - Number(order.lateNightFee || 0) - Number(order.surgeFee || 0) + Number(order.couponDiscount || 0) + Number(order.referralDiscount || 0) + Number(order.packDiscount || 0))) + Number(order.discount || 0));
  const rzp = opts.razorpay
    ? `<label class="pick"><input type="radio" name="method" value="razorpay" checked> Card / UPI via Razorpay — live</label>`
    : '';
  const wa = opts.waUrl
    ? `<a class="btn ghost rv" style="width:100%;margin-top:10px" href="${opts.waUrl}" target="_blank" rel="noopener"><span>✆ Send this order on WhatsApp →</span></a>`
    : '';
  return layout({
    title: 'Payment', user, extraCss: '/customer.css', active: '/customer/orders/new',
    body: `
    <p class="eyebrow rv">Payment · order #${esc(order.id)}</p>
    <h1 class="display rv" style="font-size:clamp(2rem,6vw,3.6rem)">Settle <em>${rs(order.total)}.</em></h1>
    <section class="checkout-layout" aria-label="Order receipt and payment">
    <div class="receipt-printer" aria-label="Printed order summary">
      <div class="printer-slot"><span></span></div>
      <div class="receipt-output">
      <article class="receipt-paper">
        <p class="receipt-brand">PRINTKARR <span>·</span> ORDER RECEIPT</p>
        <h2>Ready to print</h2>
        <p class="receipt-id">ORDER #${esc(order.id)}</p>
        <div class="receipt-rule"></div>
        <p class="receipt-document">▤ &nbsp;${esc(order.document || 'Print order')}</p>
        ${documentPreview(`/customer/orders/${encodeURIComponent(order.id)}/preview.pdf`, order.filePages, order.pageRange, order.fileType)}
        ${order.pages ? `<div class="sumrow"><span>${esc(order.pages)} pages${order.copies > 1 ? ` × ${esc(order.copies)} copies` : ''}</span><span>${order.printType === 'color' ? 'Color' : 'B&W'}</span></div>` : ''}
        <div class="sumrow"><span>Print subtotal</span><span>${rs(printSubtotal)}</span></div>
        ${order.discount ? `<div class="sumrow disc"><span>Student discount</span><span>−${rs(order.discount)}</span></div>` : ''}
        ${order.packDiscount ? `<div class="sumrow disc"><span>Semester pack ${esc(order.packSubId || '')}</span><span>−${rs(order.packDiscount)}</span></div>` : ''}
        ${order.referralDiscount ? `<div class="sumrow disc"><span>Friend referral ${esc(order.referralCode || '')}</span><span>−${rs(order.referralDiscount)}</span></div>` : ''}
        ${order.couponDiscount ? `<div class="sumrow disc"><span>Coupon · ${esc(order.couponCode || '')}</span><span>−${rs(order.couponDiscount)}</span></div>` : ''}
        ${order.deliveryFee ? `<div class="sumrow"><span>Delivery${order.deliveryZone ? ` · ${esc(order.deliveryZone)} · approx. ${esc(order.deliveryKm)} km` : ''}</span><span>${rs(order.deliveryFee)}</span></div>` : ''}
        ${order.lateNightFee ? `<div class="sumrow"><span>Late-night delivery</span><span>${rs(order.lateNightFee)}</span></div>` : ''}
        ${order.surgeFee ? `<div class="sumrow"><span>High-demand fee</span><span>${rs(order.surgeFee)}</span></div>` : ''}
        <div class="sumrow total"><span>Due now</span><span>${rs(order.total)}</span></div>
        <div class="receipt-perf" aria-hidden="true"></div>
        <p class="receipt-thanks">Thanks for printing with us ✦</p>
      </article>
      </div>
    </div>
    <form class="card checkout-payment" method="POST" action="/customer/orders/${order.id}/pay" id="payForm">
      <p class="eyebrow">Payment method</p>
      <div style="display:flex;flex-direction:column;gap:8px;margin:10px 0 18px">
        ${rzp}
        ${opts.livePay ? '' : `<label class="pick"><input type="radio" name="method" value="upi"${opts.razorpay ? '' : ' checked'}> UPI — simulated</label>`}
        <label class="pick"><input type="radio" name="method" value="wallet"${opts.livePay && !opts.razorpay ? ' checked' : ''}> Wallet ${user.walletBalance != null ? `(₹${user.walletBalance} available)` : ''}</label>
        ${opts.walletTopup ? `<label class="pick hot"><input type="radio" name="method" value="wallet_topup"> Add ${rs(opts.walletTopup.short)} &amp; pay ${rs(order.total)} — one tap${opts.walletTopup.bonus ? ` (incl. ${rs(opts.walletTopup.bonus)} bonus)` : ''}</label>` : ''}
      </div>
      <button class="btn loud big" type="submit" style="width:100%"><span>Pay ${rs(order.total)}</span></button>
      <p class="muted mono" style="font-size:10px;margin-top:10px">${opts.livePay ? 'Live mode: real payments only.' : (opts.razorpay ? 'Razorpay is live. Other methods are simulated.' : 'Demo: no money moves. Success is simulated.')}</p>
    </form>
    </section>
    ${isOwner ? `<form method="POST" action="/customer/orders/${order.id}/demo-pay" style="margin-top:10px"><button class="btn ghost" type="submit" style="width:100%;border-style:dashed"><span>◆ Demo Pay — test print (owner only, no charge)</span></button></form><p class="muted mono" style="font-size:10px;margin-top:6px">Visible only to you. Bypasses Razorpay to verify the Epson.</p>` : ''}
    ${wa}
    ${opts.razorpay ? `
    <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
    <script>
    document.getElementById('payForm').addEventListener('submit', function (e) {
      var m = document.querySelector('input[name="method"]:checked');
      if (!m || m.value !== 'razorpay') return; // simulated methods post normally
      e.preventDefault();
      var btn = e.target.querySelector('button[type="submit"]');
      function fail(msg) {
        toast(msg);
        if (btn) btn.removeAttribute('disabled');
      }
      if (typeof Razorpay === 'undefined') {
        fail('Payment window blocked — disable your ad-blocker for checkout.razorpay.com, or pick another method.');
        return;
      }
      if (btn) btn.setAttribute('disabled', 'true');
      fetch('/api/razorpay/order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId: '${esc(order.id)}' }) })
        .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
        .then(function (x) {
          if (!x.ok) { fail(x.d.error || 'Gateway hiccup — pick another method.'); return; }
          try {
            var rz = new Razorpay({
              key: x.d.keyId, amount: x.d.amount, currency: 'INR',
              order_id: x.d.rzpOrderId, name: 'Printkarr', description: 'Order ${esc(order.id)}',
              modal: { ondismiss: function () { if (btn) btn.removeAttribute('disabled'); } },
              handler: function (resp) {
                var f = document.createElement('form');
                f.method = 'POST'; f.action = '/customer/orders/${esc(order.id)}/razorpay-verify';
                [['razorpay_order_id', resp.razorpay_order_id], ['razorpay_payment_id', resp.razorpay_payment_id], ['razorpay_signature', resp.razorpay_signature]]
                  .forEach(function (kv) { var i = document.createElement('input'); i.type = 'hidden'; i.name = kv[0]; i.value = kv[1]; f.appendChild(i); });
                document.body.appendChild(f); f.submit();
              }
            });
            rz.on('payment.failed', function () { fail('Payment failed — try again.'); });
            rz.open();
          } catch (err) { fail('Could not open the payment window — check connection and try again.'); }
        })
        .catch(function () { fail('Gateway unreachable — pick another method.'); });
    });
    </script>` : ''}`
  });
}

export function walletPage(user, wallet, tx, pricing, opts = {}) {
  const livePay = !!opts.livePay, rzpOn = !!opts.razorpay;
  const tiers = [...((pricing || {}).topupBonus || [])].sort((a, b) => a.min - b.min);
  const ladder = tiers.length ? `<div class="ladder">${tiers.map((t, i) =>
    `<div class="tier ${i === tiers.length - 1 ? 'best' : ''}"><span>Add ₹${t.min}+</span><b>+${t.pct}% bonus</b></div>`).join('')}
    <p class="nudge" id="topNudge"></p></div>` : '';
  const rows = tx.map((t) => `
    <div class="sumrow"><span>${t.amount > 0 ? '+' : ''}${rs(t.amount)} · ${esc(t.label)}</span><span class="at">${esc(new Date(t.at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }))}</span></div>`
  ).join('') || '<p class="muted">No transactions yet.</p>';
  return layout({
    title: 'Wallet', user, extraCss: '/customer.css', active: '/customer/wallet',
    body: `
    <p class="eyebrow rv">Wallet</p>
    <h1 class="display rv" style="font-size:clamp(2.6rem,8vw,5rem)">₹${Math.round(wallet.balance)}</h1>
    ${opts.cash > 0 ? `<a class="card promo rv" href="/customer/referrals" style="text-decoration:none;display:block;margin-top:12px"><p class="eyebrow">Previous cash earnings</p><div class="stat"><div class="v">${rs(opts.cash)}<em> cash</em></div><div class="k">View withdrawal options →</div></div></a>` : ''}
    ${rzpOn ? `<div class="card rv" style="margin:16px 0">
      <p class="eyebrow">Add real money</p>
      <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;align-items:end">
        <div class="field" style="margin:0"><label for="amount">Amount (₹10 – ₹10,000)</label>
          <input id="amount" name="amount" type="number" value="200" min="10" max="10000" style="max-width:160px"></div>
        <div class="field" style="margin:0"><label for="rzp-ref">Referral (first top-up ${rs(opts.refMin || 79)}+, +${rs(opts.refBonus || 10)})</label>
          <input id="rzp-ref" type="text" placeholder="K7Q2M4" maxlength="12" style="text-transform:uppercase;max-width:130px"></div>
        <button class="btn sun" type="button" id="topupBtn"><span>+ Add via Razorpay</span></button>
      </div>
      <p class="muted mono" style="font-size:10px;margin-top:8px">Ladder bonus applies on top. Charged for real.</p>
    </div>
    ${!livePay ? `<p class="muted mono" style="font-size:10px">Demo build: card is test mode.</p>` : ''}` : ''}
    ${!rzpOn && !livePay ? `<form class="rv" method="POST" action="/customer/wallet/add" style="margin:16px 0;display:flex;gap:8px;flex-wrap:wrap;align-items:end">
      <div class="field" style="margin:0"><label for="amount">Add money (demo)</label>
        <div style="display:flex;gap:8px"><input id="amount" name="amount" type="number" value="200" min="10" max="10000" style="max-width:140px">
        <button class="btn sun" type="submit"><span>+ Add</span></button></div></div>
      <div class="field" style="margin:0"><label for="wref">Referral (first top-up ${rs(opts.refMin || 79)}+, +${rs(opts.refBonus || 10)})</label>
        <input id="wref" name="referral" placeholder="K7Q2M4" maxlength="12" style="text-transform:uppercase;max-width:130px"></div>
    </form>
    ${opts.refErr ? `<p class="login-err rv" role="alert">${esc(opts.refErr)}</p>` : ''}` : ''}
    ${!rzpOn && livePay ? '<p class="muted mono rv" style="font-size:11px;margin:16px 0">Top-ups unavailable — gateway not configured. Pay per order instead.</p>' : ''}
    ${ladder}
    <script>
    (function(){
      var tiers = ${JSON.stringify(tiers)}, inp = document.getElementById('amount'), n = document.getElementById('topNudge');
      if (!inp || !n) return;
      function upd(){
        var v = parseInt(inp.value, 10) || 0;
        var next = tiers.filter(function(t){ return v < t.min; }).sort(function(a, b){ return a.min - b.min; })[0];
        var cur = tiers.filter(function(t){ return v >= t.min; }).sort(function(a, b){ return b.min - a.min; })[0];
        n.textContent = next ? ('Add ₹' + (next.min - v) + ' more to unlock +' + next.pct + '% bonus') : (cur ? ('Locked in: +' + cur.pct + '% bonus ✷') : '');
      }
      inp.addEventListener('input', upd); upd();
    })();
    </script>
    ${rzpOn ? `
    <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
    <script>
    document.getElementById('topupBtn').addEventListener('click', function () {
      var btn = this;
      var amount = Math.max(10, Math.min(10000, Math.round(Number(document.getElementById('amount').value) || 0)));
      var refEl = document.getElementById('rzp-ref');
      var referral = refEl ? refEl.value.trim().toUpperCase().slice(0, 12) : '';
      if (typeof Razorpay === 'undefined') { toast('Payment window blocked — disable your ad-blocker for checkout.razorpay.com.'); return; }
      btn.setAttribute('disabled', 'true');
      fetch('/api/wallet/topup-order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: amount, referral: referral }) })
        .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
        .then(function (x) {
          if (!x.ok) { toast(x.d.error || 'Gateway hiccup — try again.'); btn.removeAttribute('disabled'); return; }
          try {
            var rz = new Razorpay({
              key: x.d.keyId, amount: x.d.amount, currency: 'INR',
              order_id: x.d.rzpOrderId, name: 'Printkarr', description: 'Wallet top-up',
              modal: { ondismiss: function () { btn.removeAttribute('disabled'); } },
              handler: function (resp) {
                var f = document.createElement('form');
                f.method = 'POST'; f.action = '/customer/wallet/topup-verify';
                [['razorpay_order_id', resp.razorpay_order_id], ['razorpay_payment_id', resp.razorpay_payment_id], ['razorpay_signature', resp.razorpay_signature]]
                  .forEach(function (kv) { var i = document.createElement('input'); i.type = 'hidden'; i.name = kv[0]; i.value = kv[1]; f.appendChild(i); });
                document.body.appendChild(f); f.submit();
              }
            });
            rz.on('payment.failed', function () { toast('Payment failed — try again.'); btn.removeAttribute('disabled'); });
            rz.open();
          } catch (err) { toast('Could not open the payment window.'); btn.removeAttribute('disabled'); }
        })
        .catch(function () { toast('Gateway unreachable — try again.'); btn.removeAttribute('disabled'); });
    });
    </script>` : ''}
    <div class="card rv"><p class="eyebrow">Recent transactions</p><div style="margin-top:8px">${rows}</div></div>`
  });
}

export function profilePage(user, addresses, notes) {
  const addr = addresses.map((a) => `
    <div class="sumrow"><span><b>${esc(a.label)}</b> — ${esc(a.address)}, ${esc(a.area)} ${esc(a.pin)} ${a.isDefault ? '· <b>default</b>' : ''}</span>
    ${a.isDefault ? '' : `<form method="POST" action="/customer/addresses/default" style="display:inline"><input type="hidden" name="id" value="${a.id}"><button class="rowlink" type="submit" style="border:none;background:none;cursor:pointer">make default</button></form>`}</div>`
  ).join('');
  const feed = notes.map((n) => `<div class="note"><b>${esc(n.orderId)}</b> — ${esc(n.text)}<span class="at">${esc(new Date(n.at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }))}</span></div>`).join('') || '<p class="muted">No notifications yet.</p>';
  return layout({
    title: 'Profile', user, extraCss: '/customer.css', active: '/customer/profile',
    body: `
    <p class="eyebrow rv">Profile</p>
    <h1 class="display rv" style="font-size:clamp(2rem,6vw,3.6rem)">${esc(user.name).split(' ')[0]}<em>'s corner.</em></h1>
    <div class="grid c2" style="margin-top:18px">
      <div class="card rv"><p class="eyebrow">Details — editable</p>
        <form method="POST" action="/customer/profile">
          <div class="field"><label for="pname">Name</label><input id="pname" name="name" value="${esc(user.name)}" required></div>
          <div class="field"><label for="pphone">Phone</label><input id="pphone" name="phone" value="${esc(user.phone || '')}" placeholder="+91 9XXXXXXXXX"></div>
          <div class="field"><label>Email</label><input value="${esc(user.email)}" disabled><small class="muted mono" style="font-size:10px">Email is your login — contact support to change it.</small></div>
          <div class="sumrow"><span>Student rate</span><span>${user.student ? 'ON · ₹2 B&W' : 'Off'}</span></div>
          <button class="btn solid" type="submit" style="margin-top:10px"><span>Save profile →</span></button>
        </form>
      </div>
      <div class="card rv" id="addresses"><p class="eyebrow">Saved addresses</p><div style="margin-top:8px">${addr}</div>
        <details style="margin-top:10px"><summary class="rowlink">+ Add address</summary>
          <form method="POST" action="/customer/addresses/add" style="margin-top:10px">
            <div class="grid c2"><div class="field"><label for="field-label">Label</label><select id="field-label" name="label"><option>Home</option><option>Hostel</option><option>College</option><option>PG</option><option>Office</option></select></div>
            <div class="field"><label for="field-phone">Phone</label><input id="field-phone" name="phone" required></div></div>
            <div class="field"><label for="field-address">Address</label><input id="field-address" name="address" required></div>
            <div class="grid c3"><div class="field"><label for="field-area">Area</label><select id="field-area" name="area"><option>Vapi</option><option>Sarigam</option><option>Bhilad</option><option>Daman</option><option>Kiosk pickup</option></select></div>
            <div class="field"><label for="field-landmark">Landmark</label><input id="field-landmark" name="landmark"></div>
            <div class="field"><label for="field-pin">PIN</label><input id="field-pin" name="pin" required></div></div>
            <button class="btn solid" type="submit"><span>Save address</span></button>
          </form></details>
      </div>
    </div>
    <h2 class="h-sec rv">Notifications</h2>
    <div class="card rv notes">${feed}</div>
    <h2 class="h-sec rv" id="help">Help</h2>
    <div class="card rv"><p><b>Where is my print?</b><br><span class="muted">Track it live on the order page — every stage pings you here too.</span></p>
    <p style="margin-top:10px"><b>Something wrong?</b><br><span class="muted">Call or WhatsApp +91 90167 03180 (Mon–Fri, 24 hours).</span></p></div>`
  });
}
