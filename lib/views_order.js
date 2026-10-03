// Customer order wizard (§6–13), wallet (§17), profile (§18–19).
import { campaignDefaults, deliveryPlan } from './campus.js';
import { layout, esc, icon, uploadScript, DELIVERY_MAP_HEAD, deliveryPicker } from './views.js';

const rs = (n) => '₹' + (Math.round(n * 100) / 100);

export function walletPrompt(campaign, offers = [], balance = 0) {
  const choices = offers.filter((o) => o.bonus > 0 && !o.memberDays).sort((a, b) => a.amount - b.amount).slice(0, 3);
  if (!choices.length || balance >= choices[0].amount) return '';
  const first = choices[0];
  return `<dialog class="wallet-prompt" data-wallet-prompt data-prompt-key="${esc(choices.map((o) => `${o.id}:${o.amount}:${o.bonus}`).join('|'))}" aria-labelledby="wallet-prompt-title" aria-describedby="wallet-prompt-description">
    <button type="button" class="wallet-prompt-close" data-wallet-dismiss aria-label="Close wallet offer">×</button>
    <div class="wallet-prompt-art">${icon('wallet')}<p>Your next print, already covered.</p><div class="wallet-prompt-credit"><span>Add <b data-prompt-amount>${rs(first.amount)}</b></span><span>Get <strong data-prompt-total>${rs(first.amount + first.bonus)}</strong> to print</span></div></div>
    <div class="wallet-prompt-copy"><p class="eyebrow">PRINTKARR WALLET</p><h2 id="wallet-prompt-title">Keep a little.<br><em>Print a little more.</em></h2>
    <p id="wallet-prompt-description">Extra print credit with eligible top-ups. Pay from your balance next time, with fewer payment steps.</p>
    <fieldset class="wallet-prompt-options"><legend>Choose your top-up</legend>${choices.map((o, i) => `<label><input type="radio" name="wallet-prompt-offer" value="${esc(o.id)}" data-amount="${o.amount}" data-bonus="${o.bonus}" ${i ? '' : 'checked'}><span>${rs(o.amount)}<small>+${rs(o.bonus)} bonus</small></span></label>`).join('')}</fieldset>
    <p class="wallet-prompt-terms">Added money stays in your wallet without expiry. Bonus credit is non-withdrawable and ${campaign?.bonusValidityDays ? `valid for ${esc(campaign.bonusValidityDays)} days` : 'has no expiry'}. Delivery is priced separately.</p>
    <a class="btn loud big" data-wallet-offer="${esc(first.id)}" data-prompt-link href="/customer/wallet?offer=${encodeURIComponent(first.id)}">Explore this wallet offer ${icon('arrow-up-right')}</a>
    <button type="button" class="wallet-prompt-later" data-wallet-dismiss>Continue to printing</button></div>
  </dialog>`;
}

export function deliveryGuide(campaign = campaignDefaults(), pricing) {
  const d = campaign.delivery;
  return `<details class="delivery-guide" open><summary>Know your delivery cost before uploading</summary><div class="delivery-guide-body">
    <label for="delivery-guide-area">Where do you need your prints?</label><select id="delivery-guide-area" data-delivery-guide-area><option value="vapi">Vapi</option><option value="daman">Daman</option>${d.enabled && d.campuses.some((c) => c.id === 'lit' && c.enabled) && d.slots.some((s) => s.enabled) ? '<option value="lit">LIT Sarigam campus</option>' : ''}</select>
    ${['vapi', 'daman'].map((zone, i) => `<div data-delivery-guide-zone="${zone}" ${i ? 'hidden' : ''}><p><strong>Address delivery ${rs(pricing.delivery[zone])}</strong> · printing charged separately.</p>${d.local?.[zone]?.enabled && d.slots.some((s) => s.enabled) ? `<p>Scheduled route ${rs(d.local[zone].fee)} · within ${d.local[zone].radiusKm} km of the delivery hub. Choose a time window after uploading.</p>` : ''}<p class="field-hint">Your map location confirms coverage and the applicable fee at checkout.</p></div>`).join('')}
    <div data-delivery-guide-zone="lit" hidden><p><strong>First standard campus delivery free. Then ₹3.</strong></p><p class="field-hint">Delivery to LIT Sarigam only. Emergency express ₹25.</p></div>
    ${d.pickup?.enabled ? `<p class="field-hint">Free collection: ${esc(d.pickup.address)}.</p>` : '<p class="field-hint">Public pickup is not available yet.</p>'}
  </div></details>`;
}

export function printQuote(pricing, draft, campaign = campaignDefaults(), student = false, surcharges = {}) {
  const config = JSON.stringify({ bw: student ? pricing.studentBw : pricing.bw, color: student ? pricing.studentColor : pricing.color, fees: pricing.delivery, local: campaign.delivery.local, ...surcharges });
  return `<div class="livetotal" data-print-quote data-pages="${esc(draft.pages)}" data-pricing="${esc(config)}" role="status" aria-live="polite"><span>Printing and delivery estimate</span><b>₹–</b></div><p class="field-hint">Final coverage, offers and total are confirmed at review. You can preview your document and change settings before paying.</p>`;
}

export function documentPreview(url, pages, range, fileType, open = false) {
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
  return `<details class="document-preview" ${open ? 'open' : ''}>
    <summary><span>Review your ${isImage ? 'photo' : 'PDF'} before printing</span><small>${isImage ? 'One photo, one page' : 'Check the actual pages before printing'}</small></summary>
    <div class="document-preview-body">
      <p class="document-preview-pages">Printing <b>${selection}</b></p>
      <p class="preview-reminder">Take one last look: correct file, readable text, margins and all required pages. Check colour, sides and copies in your order summary.</p>
      <a href="${esc(url)}" target="_blank" rel="noopener">Open ${isImage ? 'photo' : 'PDF'} in a new tab ↗</a>
      <p class="field-hint">${isImage ? 'Original photo preview; the printed layout follows your settings.' : 'Original PDF preview; page ranges and print settings are applied when printing. If the viewer is blank on your phone, open the PDF in a new tab.'}</p>
      ${frame}
    </div>
  </details>`;
}

export function uploadStep(user, { pricing, campaign, maxMb = 20, repeat } = {}) {
  return layout({
    title: 'New order', user, extraCss: '/customer.css', active: '/customer/orders/new',
    body: `
    <p class="eyebrow rv">Create new order · step 1 of 3</p>
    <h1 class="display rv" style="font-size:clamp(2rem,6vw,3.6rem)">Upload your <em>file.</em></h1>
    ${pricing ? deliveryGuide(campaign, pricing) : ''}
    ${repeat ? `<p class="repeat-note">Reuse the settings from <b>${esc(repeat.document)}</b>. Upload your original file again; your print settings are ready to reuse.</p>` : ''}
    <form class="card rv" style="margin-top:18px" method="POST" action="/customer/orders/new/upload" enctype="multipart/form-data" data-max-mb="${esc(maxMb)}">
      ${repeat ? `<input type="hidden" name="repeat" value="${esc(repeat.id)}">` : ''}
      <label class="drop" for="doc"><span class="drop-arrow">↑</span><b>Upload file</b><span class="muted">PDF, PNG or JPG up to ${esc(maxMb)} MB · pages counted after upload</span></label>
      <input id="doc" name="doc" type="file" accept="application/pdf,.pdf,.png,.jpg,.jpeg" required class="file-input">
      <p class="mono muted" id="fname" style="font-size:11px;margin:10px 0"></p>
      <button class="btn loud big" type="submit" style="width:100%"><span>Count my pages →</span></button>
    </form>
    ${uploadScript()}`
  });
}

export function deliverySlotsFields(cfg = campaignDefaults(), pricing = { delivery: {} }, selected = '', includeArea = true) {
  const d = cfg.delivery;
  const college = d.enabled && d.campuses.some((c) => c.id === 'lit' && c.enabled);
  const standard = college && d.slots.some((s) => s.enabled);
  const available = ['express', ...(standard ? ['college'] : []), ...(college ? ['college-express'] : []), ...(d.pickup?.enabled ? ['pickup'] : []), ...Object.entries(d.local || {}).filter(([, o]) => o.enabled).flatMap(([zone]) => d.slots.filter((s) => s.enabled).map((s) => `local-${zone}-${s.id}`))];
  const chosen = available.includes(selected) ? selected : selected ? 'express' : standard ? 'college' : 'express';
  return `<fieldset style="border:0;padding:0;margin:0"><legend class="eyebrow">Where should we bring your prints?</legend>
    <div class="route-picks" style="margin-top:10px">
      ${standard ? `<label class="pick"><input type="radio" name="deliverySlot" value="college" ${chosen === 'college' ? 'checked' : ''}><span><b>LIT College · ₹3</b><small>First standard delivery free · next campus batch</small></span></label>` : ''}
      <label class="pick"><input type="radio" name="deliverySlot" value="express" ${chosen === 'express' ? 'checked' : ''}><span><b>Vapi / Daman delivery</b><small>To your address · confirm your location</small></span></label>
      ${Object.entries(d.local || {}).filter(([, o]) => o.enabled).map(([zone, o]) => d.slots.filter((s) => s.enabled).map((s) => {
        const plan = deliveryPlan({ settings: { campaign: cfg } }, `local-${zone}-${s.id}`);
        return `<label class="pick"><input type="radio" name="deliverySlot" value="${esc(plan.slotId)}" ${chosen === plan.slotId ? 'checked' : ''}><span><b>${zone === 'vapi' ? 'Vapi' : 'Daman'} scheduled · ${rs(o.fee)}</b><small>${esc(new Date(plan.deliveryStartAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short' }))} · ${esc(s.start)}–${esc(s.end)} · within ${o.radiusKm} km of hub</small></span></label>`;
      }).join('')).join('')}
    </div>
    ${college ? `<label class="pick" style="margin-top:8px"><input type="radio" name="deliverySlot" value="college-express" ${chosen === 'college-express' ? 'checked' : ''}><span><b>LIT emergency express · ₹25</b><br><small>Need it urgently? Choose a separate express trip.</small></span></label>` : ''}
    ${d.pickup?.enabled ? `<details class="order-more"><summary>Prefer to collect yourself?</summary><label class="pick"><input type="radio" name="deliverySlot" value="pickup" ${chosen === 'pickup' ? 'checked' : ''}><span><b>₹0 pickup</b><small>${esc(d.pickup.address)}</small></span></label></details>` : ''}
    ${includeArea ? `<div class="field" data-local-fields><label for="delivery-area">Delivery area</label><select id="delivery-area" name="area"><option value="Vapi">Vapi · ₹${esc(pricing.delivery.vapi ?? 15)} delivery</option><option value="Daman">Daman · ₹${esc(pricing.delivery.daman ?? 20)} delivery</option></select></div>` : ''}
    </fieldset>
    <script>(function(){function init(){var choice=document.querySelector('[name="deliverySlot"]');if(!choice)return;var form=choice.form;function sync(){var route=form.querySelector('[name="deliverySlot"]:checked').value,local=route==='express'||route.indexOf('local-')===0;form.querySelectorAll('[data-address-fields],[data-local-fields]').forEach(function(block){block.hidden=!local;block.querySelectorAll('input,select,textarea').forEach(function(i){i.disabled=!local;});});if(route.indexOf('local-')===0){var area=form.querySelector('[name="area"],[name="nn_area"]');if(area)area.value=route.split('-')[1]==='vapi'?'Vapi':'Daman';}var contact=form.querySelector('#batchPhone');if(contact){contact.hidden=route==='pickup';contact.querySelector('input').disabled=contact.hidden;}}form.querySelectorAll('[name="deliverySlot"]').forEach(function(i){i.addEventListener('change',sync);});sync();}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();})();</script>`;
}

export function optionsStep(user, draft, addresses, campaign = campaignDefaults(), pricing = { delivery: {} }, surcharges = {}) {
  const saved = draft.selections || {};
  addresses = addresses.filter((a) => !a.campusId && ['vapi', 'daman'].includes(String(a.area).toLowerCase()));
  const addrRadios = addresses.map((a, i) => `
    <label class="pick"><input type="radio" name="addressId" value="${a.id}" data-area="${esc(a.area)}" data-lat="${esc(a.lat || '')}" data-lng="${esc(a.lng || '')}" ${addresses.some((a) => a.id === saved.addressId) ? a.id === saved.addressId ? 'checked' : '' : a.isDefault || !i && !addresses.some((a) => a.isDefault) ? 'checked' : ''} required>
    <b>${esc(a.label)}</b> — ${esc(a.address)}, ${esc(a.area)} ${esc(a.pin)}</label>`).join('');
  return layout({
    title: 'Print options', user, extraCss: '/customer.css', extraHead: DELIVERY_MAP_HEAD, active: '/customer/orders/new',
    body: `
    <p class="eyebrow rv">Step 2 of 3 · ${draft.fileType === 'image' ? '🖼️' : '📄'} ${esc(draft.document)} · ${draft.fileType === 'image' ? '1 photo page' : `${draft.pages} pages`}</p>
    <h1 class="display rv" style="font-size:clamp(2rem,6vw,3.6rem)">How should <em>it print?</em></h1>
    <form class="quick-order" method="POST" action="/customer/orders/new/confirm" style="margin-top:18px">
      <input type="hidden" name="draft" value="${draft.id}">
      <div class="card rv">
        <p class="eyebrow">Print settings · A4 · single-sided by default</p>
        <div class="grid c2">
          <div class="field"><label>Print type</label><div class="chips">
            <label class="chip-pick"><input type="radio" name="printType" value="bw" ${saved.printType !== 'color' ? 'checked' : ''}> B&W</label>
            <label class="chip-pick"><input type="radio" name="printType" value="color" ${saved.printType === 'color' ? 'checked' : ''}> Color</label></div></div>

          <div class="field"><label for="copies">Copies</label><input id="copies" aria-label="Number of copies" name="copies" type="number" value="${esc(saved.copies || 1)}" min="1" max="200"></div>
        </div>
        <details class="order-more"><summary>More print settings</summary><div class="order-more-body">
          <div class="field"><label>Sides</label><div class="chips">
            <label class="chip-pick"><input type="radio" name="sides" value="single" ${saved.sides !== 'double' ? 'checked' : ''}> Single</label>
            <label class="chip-pick"><input type="radio" name="sides" value="double" ${saved.sides === 'double' ? 'checked' : ''}> Double</label></div></div>
        ${draft.fileType === 'image'
          ? '<p class="field-hint">One photo prints as one full page.</p>'
          : `<div class="field"><label for="range">Pages to print</label><input id="range" name="range" autocomplete="off" value="${esc(saved.range || '')}" placeholder="All pages · or e.g. 1, 3-5"><p class="field-hint">Leave empty to print all ${draft.pages} pages.</p></div>`}
        <div class="grid c2">
          <div class="field"><label for="orientation">Orientation</label><select id="orientation" name="orientation">${['auto', 'portrait', 'landscape'].map((v) => `<option value="${v}" ${saved.orientation === v ? 'selected' : ''}>${v[0].toUpperCase() + v.slice(1)}</option>`).join('')}</select></div>
          <div class="field"><label for="binding">Binding</label><select id="binding" name="binding">${[['none', 'None'], ['staple', 'Staple'], ['spiral', 'Spiral binding']].map(([v, label]) => `<option value="${v}" ${saved.binding === v ? 'selected' : ''}>${label}</option>`).join('')}</select></div>
        </div>
        <div class="field"><label for="notes">Notes for the printer</label><textarea id="notes" name="notes" rows="2" placeholder="Please staple after page 10.">${esc(saved.notes || '')}</textarea></div>
        </div></details>
      </div>
      <div class="card rv" style="margin-top:14px">
        ${deliverySlotsFields(campaign, pricing, saved.deliveryMode === 'scheduled' ? saved.slotId : saved.campusId === 'lit' ? (saved.deliveryMode === 'batch' ? 'college' : 'college-express') : draft.selections ? (saved.zone === 'pickup' ? 'pickup' : 'express') : '', false)}
        <div id="batchPhone" class="field"><label for="campus-phone">Contact phone</label><input id="campus-phone" name="nn_phone" type="tel" value="${esc(user.phone || addresses.find((a) => a.isDefault)?.phone || addresses[0]?.phone || '')}" required maxlength="20"></div>
        <div data-address-fields><p class="eyebrow">Your delivery address</p>
        <div style="margin-top:8px;display:flex;flex-direction:column;gap:8px">${addrRadios}</div>
        <details style="margin-top:10px" ${addresses.length ? '' : 'open'}><summary class="rowlink">+ New address</summary>
          <div class="field"><label for="local-address">Full delivery address</label><input id="local-address" name="nn_address" autocomplete="street-address"></div>
          <div class="grid c3">
            <div class="field"><label for="local-area">Area</label><select id="local-area" name="nn_area"><option>Vapi</option><option>Daman</option></select></div>
            <div class="field"><label for="local-landmark">Landmark (optional)</label><input id="local-landmark" name="nn_landmark"></div>
            <div class="field"><label for="local-pin">PIN code</label><input id="local-pin" name="nn_pin" inputmode="numeric" autocomplete="postal-code" maxlength="6"></div>
          </div>
          <label class="pick"><input type="radio" name="addressId" value="__new" ${addresses.length ? '' : 'checked'}> Use this new address</label>
        </details>
        ${deliveryPicker()}
        </div>
      </div>
      ${printQuote(pricing, draft, campaign, !!user.student, surcharges)}
      <button class="btn loud big rv" type="submit" style="width:100%;margin-top:16px"><span>Review order →</span></button>
    </form>`
  });
}

export function summaryStep(user, draft, s, q, packCover = null, ref = { code: '', error: null }) {
  return layout({
    title: 'Review', user, extraCss: '/customer.css', active: '/customer/orders/new',
    body: `
    <p class="eyebrow rv">Step 3 of 3 · review</p>
    <h1 class="display rv" style="font-size:clamp(2rem,6vw,3.6rem)">Review your <em>order.</em></h1>
    <div class="card rv" style="margin-top:18px">
      <p class="eyebrow">Order summary</p>
      <p style="font-weight:700;margin:8px 0">📄 ${esc(draft.document)}</p>
      ${documentPreview(`/customer/orders/new/${encodeURIComponent(draft.id)}/preview.pdf`, draft.pages, s.range, draft.fileType, true)}
      <a class="rowlink" href="/customer/orders/new?draft=${encodeURIComponent(draft.id)}">Change print settings or delivery →</a>
      <div class="sumrow"><span>${s.effPages} pages × ${s.copies}</span><span>${rs(q.subtotal + (q.studentDiscount || 0))}</span></div>
      <div class="sumrow"><span>${s.printType === 'bw' ? 'B&W' : 'Color'} · ${s.sides} · ${s.orientation} · ${s.binding}</span></div>
      ${q.studentDiscount ? `<div class="sumrow disc"><span>Student discount</span><span>−${rs(q.studentDiscount)}</span></div>` : ''}
      ${packCover ? `<div class="sumrow disc"><span>Semester pack ${esc(packCover.packName)} · ${s.effPages * s.copies} sides covered</span><span>−${rs(q.subtotal)}</span></div>` : ''}
      ${ref.discount ? `<div class="sumrow disc"><span>Friend referral ${esc(ref.code)}</span><span>−${rs(ref.discount)}</span></div>` : ''}
      <div class="sumrow"><span>Selected slot</span><span>${esc(s.slot)}</span></div>
      ${q.firstPrintDiscount ? `<div class="sumrow disc"><span>First print offer</span><span>−${rs(q.firstPrintDiscount)}</span></div>` : ''}
      ${q.firstDeliveryDiscount ? `<div class="sumrow disc"><span>First delivery offer</span><span>−${rs(q.firstDeliveryDiscount)}</span></div>` : ''}
      <div class="sumrow"><span>${s.zone === 'pickup' ? 'Kiosk collection' : q.firstBatchFree && s.campusId === 'lit' ? 'First LIT College delivery' : `Delivery · ${esc(s.zoneLabel)}`}</span><span>${q.deliveryFee === 0 ? '<span class="freebadge">FREE</span>' : rs(q.deliveryFee)}</span></div>
      ${q.lateNightFee ? `<div class="sumrow"><span>Late-night delivery</span><span>${rs(q.lateNightFee)}</span></div>` : ''}
      ${q.surgeFee ? `<div class="sumrow"><span>High-demand fee</span><span>${rs(q.surgeFee)}</span></div>` : ''}
      <div class="sumrow total"><span>Total</span><span>${rs(q.total)}</span></div>
      <form method="POST" action="/customer/orders/new/place" style="margin-top:14px">
        <input type="hidden" name="draft" value="${draft.id}">
        <details class="order-more" ${ref.error || ref.code ? 'open' : ''}><summary>Have a coupon or referral code?</summary>
        ${packCover ? '' : `<div class="field"><label for="coupon">Coupon code (optional)</label><input id="coupon" name="coupon" style="text-transform:uppercase"></div>`}
        <div class="field"><label for="referral">Friend's referral code (first order, optional)</label><input id="referral" name="referral" placeholder="K7Q2M4" value="${esc(ref.code)}" style="text-transform:uppercase" maxlength="12"></div>
        ${ref.error ? `<p class="login-err" role="alert">${esc(ref.error)}</p>` : ''}
        </details>
        <button class="btn loud big" type="submit" style="width:100%"><span>Confirm order →</span></button>
      </form>
    </div>`
  });
}

export function payStep(user, order, opts = {}) {
  const testPrintsLeft = Number(opts.testPrintsLeft) || 0;
  const walletReady = Number(user.walletBalance || 0) >= order.total;
  const suggested = (opts.offers || []).filter((o) => !o.memberDays && Number(user.walletBalance || 0) + o.amount + o.bonus >= order.total).sort((a, b) => a.amount - b.amount)[0];
  const printSubtotal = Math.max(0, Number(order.subtotal ?? (Number(order.total || 0) - Number(order.deliveryFee || 0) - Number(order.lateNightFee || 0) - Number(order.surgeFee || 0) + Number(order.couponDiscount || 0) + Number(order.referralDiscount || 0) + Number(order.packDiscount || 0))) + Number(order.discount || 0));
  const rzp = opts.razorpay
    ? `<label class="pick"><input type="radio" name="method" value="razorpay" ${walletReady ? '' : 'checked'}> UPI / Card</label>`
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
        <p class="field-hint">${esc(order.slot || '')}</p>
        <p class="receipt-document">▤ &nbsp;${esc(order.document || 'Print order')}</p>
        ${documentPreview(`/customer/orders/${encodeURIComponent(order.id)}/preview.pdf`, order.filePages, order.pageRange, order.fileType)}
        <p class="preview-reminder">Before you pay, open the preview above and check every required page. ${order.sides === 'double' ? 'Double-sided' : 'Single-sided'} · ${order.copies || 1} ${order.copies > 1 ? 'copies' : 'copy'}.</p>
        ${order.pages ? `<div class="sumrow"><span>${esc(order.pages)} pages${order.copies > 1 ? ` × ${esc(order.copies)} copies` : ''}</span><span>${order.printType === 'color' ? 'Color' : 'B&W'}</span></div>` : ''}
        <div class="sumrow"><span>Print subtotal</span><span>${rs(printSubtotal)}</span></div>
        ${order.firstPrintDiscount ? `<div class="sumrow disc"><span>First print offer</span><span>−${rs(order.firstPrintDiscount)}</span></div>` : ''}
        ${order.firstDeliveryDiscount ? `<div class="sumrow disc"><span>First delivery offer</span><span>−${rs(order.firstDeliveryDiscount)}</span></div>` : ''}
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
      ${walletReady ? `<p class="wallet-checkout-note">Your wallet covers this order. ${rs(Number(user.walletBalance || 0) - order.total)} will remain after payment.</p>` : suggested ? `<div class="wallet-checkout-note"><b>Add ${rs(suggested.amount)}, get ${rs(suggested.bonus)} extra print credit.</b><p>After paying ${rs(order.total)} for this order, ${rs(Number(user.walletBalance || 0) + suggested.amount + suggested.bonus - order.total)} stays for next time.</p><a class="rowlink" data-wallet-offer="${esc(suggested.id)}" href="/customer/wallet?order=${encodeURIComponent(order.id)}&amp;offer=${encodeURIComponent(suggested.id)}">Top up &amp; return to this order →</a><small>Optional. ${opts.bonusValidityDays ? `Bonus valid ${esc(opts.bonusValidityDays)} days; ` : ''}bonus is non-withdrawable. Order payment follows separately.</small></div>` : ''}
      ${order.lateCredit ? `<p class="field-hint">Pay before ${esc(new Date(order.deliveryCutoffAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }))} IST to activate the ₹${order.lateCredit} missed-slot credit.</p>` : ''}
      <div style="display:flex;flex-direction:column;gap:8px;margin:10px 0 18px">
        ${rzp}
        ${opts.livePay ? '' : `<label class="pick"><input type="radio" name="method" value="upi"${opts.razorpay || walletReady ? '' : ' checked'}> UPI — simulated</label>`}
        <label class="pick"><input type="radio" name="method" value="wallet"${walletReady ? ' checked' : ''}${!walletReady ? ' disabled' : ''}> Wallet ${user.walletBalance != null ? `(₹${user.walletBalance} available)` : ''}${walletReady ? '' : ' · top-up needed'}</label>
        ${opts.walletTopup ? `<label class="pick hot"><input type="radio" name="method" value="wallet_topup"> Add ${rs(opts.walletTopup.short)} &amp; pay ${rs(order.total)} — one tap${opts.walletTopup.bonus ? ` (incl. ${rs(opts.walletTopup.bonus)} bonus)` : ''}</label>` : ''}
      </div>
      <button class="btn loud big" type="submit" style="width:100%" ${opts.livePay && !opts.razorpay && !walletReady ? 'disabled' : ''}><span>Pay ${rs(order.total)}</span></button>
      ${opts.livePay && !opts.razorpay && !walletReady ? '<p class="field-hint">Online payments are temporarily unavailable and your wallet needs a top-up. Please contact support before paying.</p>' : ''}
      <p class="muted mono" style="font-size:10px;margin-top:10px">${opts.livePay ? 'Live mode: real payments only.' : (opts.razorpay ? 'Razorpay is live. Other methods are simulated.' : 'Demo: no money moves. Success is simulated.')}</p>
    </form>
    </section>
    ${testPrintsLeft ? `<form method="POST" action="/customer/orders/${order.id}/demo-pay" style="margin-top:10px"><button class="btn ghost" type="submit" style="width:100%;border-style:dashed"><span>◆ Use test print credit — no charge</span></button></form><p class="muted mono" style="font-size:11px;margin-top:6px">${testPrintsLeft} test print${testPrintsLeft === 1 ? '' : 's'} left. Kiosk pickup, up to five sheets. Test prints are excluded from sales.</p>` : ''}
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
  const offers = opts.offers || [];
  const bonusBalance = opts.bonusBalance || 0;
  const ladder = `${offers.length ? '<h2 class="h-sec">Choose a wallet offer</h2>' : ''}<div class="grid c2 wallet-offers" style="margin:16px 0">${offers.map((o) => `<article class="card"><p class="eyebrow">${esc(o.name)}</p><p><b>Pay ${rs(o.amount)} → ${rs(o.amount + o.bonus)} wallet balance</b></p>${o.freeFirstBatch ? '<p class="field-hint">First campus batch delivery free.</p>' : ''}${o.memberDays ? `<p class="field-hint">${o.memberDays}-day membership${o.freeBatch ? ' · free campus batch delivery' : ''}.</p>` : ''}<button class="btn sun" type="button" data-offer="${esc(o.id)}" data-amount="${o.amount}" ${!rzpOn && livePay ? 'disabled' : ''}><span>Choose ${esc(o.name)}</span></button></article>`).join('')}</div><p class="nudge" id="topNudge" role="status"></p>`;
  const rows = tx.map((t) => `
    <div class="sumrow"><span>${t.amount > 0 ? '+' : ''}${rs(t.amount)} · ${esc(t.label)}${t.expiresAt ? ` · expires ${esc(new Date(t.expiresAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }))}` : ''}</span><span class="at">${esc(new Date(t.at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }))}</span></div>`
  ).join('') || '<p class="muted">No transactions yet.</p>';
  return layout({
    title: 'Wallet', user, extraCss: '/customer.css', active: '/customer/wallet',
    body: `
    <section class="wallet-overview"><p class="eyebrow rv">Wallet balance</p>
    <h1 class="display rv" style="font-size:clamp(2.6rem,8vw,5rem)">${rs(wallet.balance)}</h1>
    <p class="muted">${rs(wallet.balance - bonusBalance)} added money · ${rs(bonusBalance)} bonus credit. Bonus credit is non-withdrawable and usable only on PrintKarr orders. ${opts.campaign?.bonusValidityDays ? `New bonuses expire after ${opts.campaign.bonusValidityDays} days.` : 'New bonuses do not expire.'}</p>
    ${opts.campaign?.showPages ? `<p class="field-hint">Approximately ${((user.student ? pricing.studentBw : pricing.bw) > 0 ? Math.floor(wallet.balance / (user.student ? pricing.studentBw : pricing.bw)) : 0)} B&amp;W page-sides at your current rate, before delivery and other fees.</p>` : ''}
    </section>
    ${Date.parse(wallet.memberUntil) > Date.now() ? `<p class="pick">Semester Pass active until ${esc(new Date(wallet.memberUntil).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }))}${wallet.memberFreeBatch ? ' · free campus batch delivery' : ''}.</p>` : ''}
    ${opts.returnOrder ? `<div class="wallet-checkout-note"><b>Your print order is saved.</b><p>Top up here, then return to review and pay for order #${esc(opts.returnOrder)}.</p><a class="rowlink" href="/customer/orders/${encodeURIComponent(opts.returnOrder)}/pay">Return to checkout →</a></div>` : ''}
    ${opts.firstBatchAvailable ? '<p class="pick">Your first LIT College standard delivery is free. Later deliveries cost ₹3; emergency express costs ₹25.</p>' : ''}
    ${opts.cash > 0 ? `<a class="card promo rv" href="/customer/referrals" style="text-decoration:none;display:block;margin-top:12px"><p class="eyebrow">Previous cash earnings</p><div class="stat"><div class="v">${rs(opts.cash)}<em> cash</em></div><div class="k">View withdrawal options →</div></div></a>` : ''}
    ${ladder}
    ${rzpOn ? `<div class="card rv" style="margin:16px 0">
      <h2 class="h-sec" style="margin-top:0">Top up your wallet</h2>
      <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;align-items:end">
        <div class="field" style="margin:0"><label for="amount">Amount (₹10 – ₹10,000)</label>
          <input id="amount" name="amount" type="number" step="0.01" value="${offers[0]?.amount ?? 10}" min="10" max="10000" style="max-width:160px"></div>
        <div class="field" style="margin:0"><label for="rzp-ref">Referral (add ${rs(opts.refMin ?? 99)}+ and complete first paid order → ${rs(opts.refBonus ?? 20)} credit)</label>
          <input id="rzp-ref" type="text" placeholder="K7Q2M4" maxlength="12" style="text-transform:uppercase;max-width:130px"></div>
        <button class="btn sun" type="button" id="topupBtn"><span>+ Top up wallet</span></button>
      </div>
      <p class="muted mono" style="font-size:10px;margin-top:8px">The selected wallet offer applies. Referral credit arrives after your first paid order is completed.</p>
    </div>
    ${!livePay ? `<p class="muted mono" style="font-size:10px">Demo build: card is test mode.</p>` : ''}` : ''}
    ${opts.refErr ? `<p class="login-err" role="alert">${esc(opts.refErr)}</p>` : ''}
    ${!rzpOn && !livePay ? `<form id="demoTopup" class="rv" method="POST" action="/customer/wallet/add" style="margin:16px 0;display:flex;gap:8px;flex-wrap:wrap;align-items:end">
      <div class="field" style="margin:0"><label for="amount">Add money (demo)</label>
        <div style="display:flex;gap:8px"><input id="amount" name="amount" type="number" step="0.01" value="${offers[0]?.amount ?? 10}" min="10" max="10000" style="max-width:140px">
        <button class="btn sun" type="submit"><span>+ Add</span></button></div></div>
      <div class="field" style="margin:0"><label for="wref">Referral (add ${rs(opts.refMin ?? 99)}+ and complete first paid order → ${rs(opts.refBonus ?? 20)} credit)</label>
        <input id="wref" name="referral" placeholder="K7Q2M4" maxlength="12" style="text-transform:uppercase;max-width:130px"></div>
    </form>
    ` : ''}
    ${!rzpOn && livePay ? '<p class="muted mono rv" style="font-size:11px;margin:16px 0">Top-ups unavailable — gateway not configured. Pay per order instead.</p>' : ''}
    <input type="hidden" id="offerId" name="offerId" form="demoTopup" value="${esc(offers[0]?.id || '')}">
    ${opts.returnOrder ? `<input type="hidden" name="orderId" form="demoTopup" value="${esc(opts.returnOrder)}">` : ''}
    <script>
    (function(){
      var offers = ${JSON.stringify(offers).replace(/</g, '\\u003c')}, inp = document.getElementById('amount'), n = document.getElementById('topNudge'), chosen = document.getElementById('offerId');
      if (!inp || !n) return;
      var selected = ${JSON.stringify(opts.selectedOffer || '').replace(/</g, '\\u003c')};
      try { var remembered = JSON.parse(sessionStorage.getItem('pk-wallet-offer')); if (!selected && remembered && Date.now()-remembered.at < 30*60e3) selected=remembered.id; sessionStorage.removeItem('pk-wallet-offer'); } catch {}
      var initial=offers.find(function(o){return o.id===selected;}); if(initial){inp.value=initial.amount;chosen.value=initial.id;}
      function upd(){document.querySelectorAll('[data-offer]').forEach(function(b){var on=b.dataset.offer===chosen.value;b.setAttribute('aria-pressed',String(on));b.closest('article').classList.toggle('wallet-offer-selected',on);});var v=Number(inp.value),o=offers.find(function(x){return x.id===chosen.value;})||offers.find(function(x){return !x.memberDays&&x.amount===v;});n.textContent=o?'Add ₹'+v+' + ₹'+o.bonus+' bonus = ₹'+(v+o.bonus)+' credit added. New wallet balance: ₹'+Math.round((${wallet.balance}+v+o.bonus)*100)/100:'Custom top-up: ₹'+v+' added to your wallet';}
      document.querySelectorAll('[data-offer]').forEach(function(b){b.addEventListener('click',function(){inp.value=b.dataset.amount;chosen.value=b.dataset.offer;upd();inp.focus();});});
      inp.addEventListener('input', function(){chosen.value='';upd();}); upd();
    })();
    </script>
    ${rzpOn ? `
    <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
    <script>
    document.getElementById('topupBtn').addEventListener('click', function () {
      var btn = this;
      var amount = Number(document.getElementById('amount').value);
      var offerId = document.getElementById('offerId').value;
      var refEl = document.getElementById('rzp-ref');
      var referral = refEl ? refEl.value.trim().toUpperCase().slice(0, 12) : '';
      if (typeof Razorpay === 'undefined') { toast('Payment window blocked — disable your ad-blocker for checkout.razorpay.com.'); return; }
      btn.setAttribute('disabled', 'true');
      fetch('/api/wallet/topup-order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: amount, offerId: offerId, referral: referral, orderId: ${JSON.stringify(opts.returnOrder || null).replace(/</g, '\\u003c')} }) })
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

export function profilePage(user, addresses, notes, { review, reviewError, reviewSaved } = {}) {
  const addr = addresses.map((a) => `
    <div class="sumrow"><span><b>${esc(a.label)}</b> — ${esc(a.address)}, ${esc(a.area)} ${esc(a.pin)} ${a.isDefault ? '· <b>default</b>' : ''}</span>
    ${a.isDefault ? '' : `<form method="POST" action="/customer/addresses/default" style="display:inline"><input type="hidden" name="id" value="${a.id}"><button class="rowlink" type="submit" style="border:none;background:none;cursor:pointer">make default</button></form>`}</div>`
  ).join('');
  const feed = notes.map((n) => `<div class="note"><b>${esc(n.orderId)}</b> — ${esc(n.text)}<span class="at">${esc(new Date(n.at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }))}</span></div>`).join('') || '<p class="muted">No notifications yet.</p>';
  return layout({
    title: 'My Account', user, extraCss: '/customer.css', active: '/customer/profile',
    body: `
    <p class="eyebrow rv">Profile &amp; saved addresses</p>
    <h1 class="display rv" style="font-size:clamp(2rem,6vw,3.6rem)">My <em>Account.</em></h1>
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
    <section class="card rv profile-review" id="review" aria-labelledby="review-title">
      <p class="eyebrow">YOUR EXPERIENCE</p><h2 id="review-title">How was your print?</h2>
      <p class="muted">A small note helps the next person. Your review and first name will appear on our home page.</p>
      ${reviewError ? `<p class="login-err" role="alert">${esc(reviewError)}</p>` : ''}
      ${reviewSaved ? '<p class="review-saved" role="status">Your review is saved. Thank you for sharing it.</p>' : ''}
      <form method="POST" action="/customer/review">
        <fieldset class="review-rating"><legend>Your rating</legend><div class="review-rating-options">${[1,2,3,4,5].map(n => `<label><input type="radio" name="rating" value="${n}" ${Number(review?.rating) === n ? 'checked' : ''} required><span aria-hidden="true">★</span><span class="rating-number">${n}</span><span class="sr-only">${n === 1 ? 'star' : 'stars'}</span></label>`).join('')}</div></fieldset>
        <div class="field"><label for="review-text">Your review</label><textarea id="review-text" name="text" rows="4" minlength="10" maxlength="1000" required placeholder="What did you print? What went well, or could be better?">${esc(review?.text)}</textarea><small class="muted">10 to 1,000 characters. Please leave out phone numbers and order details.</small></div>
        <div class="review-form-actions"><button class="btn loud" type="submit">${review?.id ? 'Update review' : 'Share review'}</button><a class="rowlink" href="/#reviews">Read customer reviews ${icon('arrow-up-right')}</a></div>
      </form>
    </section>
    <h2 class="h-sec rv">Notifications</h2>
    <div class="card rv notes">${feed}</div>
    <h2 class="h-sec rv" id="help">Help</h2>
    <div class="card rv"><p><b>Where is my print?</b><br><span class="muted">Track it live on the order page — every stage pings you here too.</span></p>
    <p style="margin-top:10px"><b>Something wrong?</b><br><span class="muted">Call or WhatsApp +91 90167 03180 (Mon–Fri, 24 hours).</span></p></div>`
  });
}
