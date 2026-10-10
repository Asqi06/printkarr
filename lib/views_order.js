import { LOCALITIES } from '../public/localities.js';
import { printDescription, printPlan } from '../public/print-plan.js';
import { COD_FEE, BULK_TIERS, offerActive } from '../public/print-pricing.js';
// Customer order wizard (§6–13), wallet (§17), profile (§18–19).
import { campaignDefaults, deliveryPlan, deliveryChoice, FILE_COLORS } from './campus.js';
import { layout, esc, icon, uploadScript, ASSET_V, DELIVERY_MAP_HEAD, deliveryPicker } from './views.js';

export const feeExplanation = '<p class="field-hint">The processing fee supports file checks, order coordination and running PrintKarr. It grows with printed sides and is capped at ₹10 per checkout. College scheduled delivery gets cheaper with more sides. Pay by wallet or Razorpay UPI to avoid the extra ₹10 cash-handling fee.</p><p class="field-hint">Place print orders on printkarr.in. WhatsApp print requests are not processed; support is available for website orders.</p>';

export function bulkPricingGuide(pricing) {
  const base={bw:Number(pricing.bw),color:Number(pricing.color)};
  return `<details class="delivery-guide"><summary>Print rates &amp; transparent fees</summary><div class="delivery-guide-body">${(pricing.printOffers || []).filter(o=>offerActive(o)).map(o=>`<p><b>${esc(o.name)}</b>: ${rs(o.price)} for ${o.sides} ${o.type==='color' ? 'colour' : 'B&amp;W'} printed sides. ${o.repeat ? 'Every complete bundle qualifies.' : 'One bundle per checkout.'} Extra sides use the regular rate; the better of bulk pricing and this offer applies. Processing and delivery are extra.</p>`).join('')}<p>Progressive bulk pricing: each slab applies only to the sides in that slab. B&amp;W and colour sides, copies and documents in one checkout count together.</p><div class="tblwrap"><table class="tbl"><thead><tr><th>Printed sides in checkout</th><th>B&amp;W / side</th><th>Colour / side</th></tr></thead><tbody>${BULK_TIERS.map((t,i)=>`<tr><td>${i ? BULK_TIERS[i-1].through+1 : 1}${Number.isFinite(t.through) ? '–'+t.through : '+'}</td><td>${rs(base.bw-Math.max(0,base.bw-1.4)*t.bw)}</td><td>${rs(base.color-Math.max(0,base.color-3)*t.color)}</td></tr>`).join('')}</tbody></table></div><p>Processing: 1–10 sides ₹2 · 11–30 ₹4 · 31–75 ₹6 · 76–150 ₹8 · 151+ ₹10. Charged once for all prints in a checkout; a stationery-only basket has ₹0 print processing.</p><p>School / college / classes: scheduled delivery starts at ₹10, drops ₹1 for every 30 printed sides, and is free at 300 sides. Existing earned free-delivery benefits still apply. Express stays ₹25.</p><p>Online / wallet: ₹0 extra payment fee. Cash on delivery: ₹10 extra per checkout.</p>${feeExplanation}</div></details>`;
}

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
    <p class="wallet-prompt-terms">Added money stays in your wallet without expiry. Bonus credit is non-withdrawable. Each offer's validity is shown on the wallet page. Delivery is priced separately.</p>
    <a class="btn loud big" data-wallet-offer="${esc(first.id)}" data-prompt-link href="/customer/wallet?offer=${encodeURIComponent(first.id)}">Explore this wallet offer ${icon('arrow-up-right')}</a>
    <button type="button" class="wallet-prompt-later" data-wallet-dismiss>Continue to printing</button></div>
  </dialog>`;
}

export function deliveryGuide(campaign = campaignDefaults(), pricing) {
  return `<details class="delivery-guide"><summary>Delivery prices</summary><div class="delivery-guide-body"><p>School / college / classes: scheduled delivery up to ₹10, reducing with printed sides; ₹25 express. Choose your institution, or enter its name and locality. Handover at the main gate.</p><p>Vapi home / office: ₹15–₹50 express or ₹10–₹25 scheduled, by estimated distance. Daman express ${rs(pricing.delivery.daman)}.</p><p>Choose an available time window and choose your locality. Location sharing is optional. Exact total before payment.</p></div></details>`;
}

export function printQuote(pricing, draft, campaign = campaignDefaults(), student = false, surcharges = {}) {
  const config = JSON.stringify({ bw: student ? pricing.studentBw : pricing.bw, color: student ? pricing.studentColor : pricing.color, printOffers: pricing.printOffers || [], fees: pricing.delivery, local: campaign.delivery.local, ...surcharges });
  return `${bulkPricingGuide(pricing)}<div class="order-price-lines" data-print-breakdown><div><span>Printing</span><b data-print-cost>—</b></div><div><span>Processing · capped at ₹10</span><b data-processing-cost>—</b></div><div><span>Delivery</span><b data-delivery-cost>—</b></div><div hidden><span>Other basket items</span><b data-other-cost>—</b></div><div hidden><span>Late-night delivery</span><b data-night-cost>—</b></div><div hidden><span>Demand fee</span><b data-demand-cost>—</b></div><div hidden><span>Extra COD cash handling</span><b data-cod-cost>₹10</b></div></div><div class="livetotal order-continue" data-print-quote data-pages="${esc(draft.pages)}" data-pricing="${esc(config)}" role="status" aria-live="polite"><div><b>₹–</b><span>Total</span></div><button class="btn loud big" type="submit">Continue →</button></div>`;
}

export function mixedFields(saved = {}, pages = 0, preview = '') {
  let range = saved.mixedRange || '';
  if (saved.printType === 'mixed' && saved.mixedPageType === 'bw') {
    try { range = printPlan(saved,pages).colorRange; } catch {}
  }
  return `<div class="split-print" data-mixed-fields data-split-preview="${esc(preview)}" ${saved.printType === 'mixed' ? '' : 'hidden'}>
    <input type="hidden" name="mixedPageType" value="color"><input type="hidden" name="splitMixed" value="1">
    <p class="field-hint">Choose only your colour pages. Everything else in your page selection goes into the B&amp;W PDF automatically.</p>
    <div class="field"><label for="mixed-range">Colour page numbers</label><input id="mixed-range" name="mixedRange" value="${esc(range)}" placeholder="e.g. 2, 5-8" autocomplete="off" aria-describedby="split-help range-err"><small id="split-help">Use original PDF page numbers, not a count of pages.</small></div>
    <details class="split-picker"><summary>Or select page numbers</summary><p class="field-hint">Tap a page to include it in the colour PDF. Tap again for B&amp;W.</p><div class="split-page-grid" role="group" aria-label="Choose colour pages">${Array.from({length:pages},(_,i)=>`<button type="button" data-colour-page="${i+1}" aria-label="Page ${i+1} in colour" aria-pressed="false">${i+1}</button>`).join('')}</div></details>
    <div class="split-summary"><div><strong>B&amp;W PDF</strong><p data-bw-pages>All remaining pages</p><a data-split-download="bw" hidden target="_blank" rel="noopener">Preview B&amp;W PDF ↗</a></div><div><strong>Colour PDF</strong><p data-colour-pages>Choose your colour pages above</p><a data-split-download="color" hidden target="_blank" rel="noopener">Preview colour PDF ↗</a></div></div>
    <p class="field-hint">Two separate print sets, one order. Both sides applies within each set. The shop can arrange or bind the pages after printing.</p><p class="field-hint" data-print-assignment role="status" aria-live="polite"></p>
  </div><p class="login-err" id="range-err" role="alert" hidden></p>`;
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

export function uploadStep(user, { maxMb = 20, repeat, error, shop } = {}) {
  return layout({ title: 'Print something', user, focused: true, extraHead: DELIVERY_MAP_HEAD, body: `
    <p class="eyebrow">UPLOAD → PRINT, DELIVERY &amp; PAY</p><h1>Let’s get it printed.</h1><p class="order-intro">Choose a PDF or photo. We’ll count the pages and show your price.</p><p class="field-hint">School / college delivery up to ₹10 · Vapi express ₹15–₹50 · scheduled address delivery ₹10–₹25. Printing extra.</p>
    ${error ? `<p class="login-err" role="alert">${esc(error)}</p>` : ''}
    <form class="order-upload" method="POST" action="${user ? '/customer/orders/new/upload' : '/order/upload'}" enctype="multipart/form-data" data-max-mb="${esc(maxMb)}" data-order-upload>
      ${shop ? `<input type="hidden" name="shopId" value="${esc(shop.id)}"><p class="field-hint">Printing with ${esc(shop.name)}. Delivery coverage is confirmed before payment.</p>` : ''}
      ${repeat ? `<input type="hidden" name="repeat" value="${esc(repeat.id)}"><p class="field-hint">Using your previous print settings. Page selections reset for the new file.</p>` : ''}
      <label class="drop" for="doc"><span class="drop-arrow">↑</span><b>Choose a PDF or photo</b><span class="muted">Up to ${esc(maxMb)} MB</span></label>
      <input id="doc" name="doc" type="file" accept="application/pdf,.pdf,.png,.jpg,.jpeg" required class="file-input">
      <p id="fname" role="status" aria-live="polite"></p><button class="btn loud big" type="submit"><span>Upload file →</span></button>
    </form>` });
}

export function deliverySlotsFields(cfg = campaignDefaults(), pricing = { delivery: {} }, selected = '', includeArea = true, noun = 'prints', saved = {}) {
  const d = cfg.delivery;
  const college = d.enabled;
  const standard = college && d.slots.some((s) => s.enabled);
  const available = ['express', ...(standard ? ['school'] : []), ...(college ? ['school-express'] : []), ...Object.entries(d.local || {}).filter(([, o]) => o.enabled).flatMap(([zone]) => d.slots.filter((s) => s.enabled).map((s) => `local-${zone}-${s.id}`)), ...d.slots.filter(s => s.enabled).map(s => 'school-' + s.id)];
  const chosen = available.includes(selected) ? selected : 'express';
  const school = chosen.startsWith('school');
  return `<fieldset style="border:0;padding:0;margin:0"><legend class="eyebrow">Where should we bring your ${esc(noun)}?</legend>
    <div class="route-picks" style="margin-top:10px">
      ${standard ? `<label class="pick"><input type="radio" name="deliverySlot" value="${school && chosen !== 'school-express' ? esc(chosen) : 'school'}" ${school && chosen !== 'school-express' ? 'checked' : ''}><span><b>School / College / Classes · up to ₹10</b><small>Any institution in our local coverage · next scheduled window</small></span></label><p class="field-hint" data-college-routes>Next window: ${esc(deliveryPlan({settings:{campaign:cfg}}, school && chosen !== 'school-express' ? chosen : 'school').slot)}</p>` : ''}
    ${college ? `<label class="pick"><input type="radio" name="deliverySlot" value="school-express" ${chosen === 'school-express' ? 'checked' : ''}><span><b>School / College · Express ₹25</b><small>Institution address only · confirm urgent timing before paying</small></span></label><fieldset data-school-fields class="school-destination" ${school ? '' : 'hidden disabled'}><legend>School / college</legend><div class="field"><label for="institution-location">Choose your institution or locality</label><select id="institution-location" name="institutionLocation" required><option value="">Choose school / college</option>${(saved.institutionAddresses || []).map(a=>`<option value="address:${esc(a.id)}" data-name="${esc(a.institutionName)}" ${saved.institutionLocation === 'address:'+a.id ? 'selected' : ''}>${esc(a.institutionName)} · saved</option>`).join('')}${d.campuses.filter(c=>c.enabled).map(c=>`<option value="campus:${esc(c.id)}" data-name="${esc(c.name)}" ${saved.institutionLocation === 'campus:'+c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}<optgroup label="Another school / college · choose locality">${LOCALITIES.filter(l=>l.id!=='vapi-other').map(l=>`<option value="locality:${l.id}" ${saved.institutionLocation === 'locality:'+l.id ? 'selected' : ''}>${esc(l.name)} · ${esc(l.zone)}</option>`).join('')}</optgroup></select></div><div data-school-other><div class="field"><label for="institution-name">School / college / classes name</label><input id="institution-name" name="institutionName" value="${esc(saved.institutionName || '')}" minlength="2" maxlength="120" required></div><div class="field"><label for="school-meeting">Gate / meeting point (optional)</label><input id="school-meeting" name="schoolMeeting" maxlength="100" value="${esc(saved.schoolMeeting || '')}" placeholder="Main gate by default"></div></div>${saved.contactPhone !== undefined ? `<details class="order-more" ${saved.contactPhone ? '' : 'open'}><summary>${saved.contactPhone ? `Delivery phone · ${esc(saved.schoolPhone || saved.contactPhone)} · change` : 'Add delivery phone'}</summary><div class="field"><label for="school-phone">Delivery phone</label><input id="school-phone" name="schoolPhone" type="tel" autocomplete="tel" required maxlength="20" value="${esc(saved.schoolPhone || saved.contactPhone)}"></div></details>` : ''}<p class="field-hint">Handover at the institution’s main gate. No home address or PIN needed. Hostel / room delivery uses Home / office.</p></fieldset>` : ''}
      <label class="pick"><input type="radio" name="deliverySlot" value="express" ${chosen === 'express' ? 'checked' : ''}><span><b>Home / Office / Other · Express</b><small>Vapi ₹15–₹50 by estimated distance · Daman ${rs(pricing.delivery.daman ?? 20)}</small></span></label>
    </div>
    ${Object.values(d.local || {}).some(o=>o.enabled) && d.slots.some(s=>s.enabled) ? `<details class="order-more" data-local-routes ${chosen.startsWith('local-') ? 'open' : ''}><summary>Save with scheduled delivery · Vapi ₹10–₹25</summary><p class="field-hint">Home, office or any local address. Orders share a delivery trip; your booked window is honoured even if the batch is small.</p><div class="route-picks">${Object.entries(d.local || {}).filter(([, o]) => o.enabled).map(([zone, o]) => d.slots.filter((s) => s.enabled).map((s) => {
        const plan = deliveryPlan({ settings: { campaign: cfg } }, `local-${zone}-${s.id}`);
        return `<label class="pick"><input type="radio" name="deliverySlot" value="${esc(plan.slotId)}" ${chosen === plan.slotId ? 'checked' : ''}><span><b>${zone === 'vapi' ? 'Vapi · ₹10–₹25' : 'Daman · ' + rs(o.fee)} scheduled</b><small>${esc(new Date(plan.deliveryStartAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short' }))} · ${esc(s.start)}–${esc(s.end)} · cutoff ${esc(s.cutoff)}</small></span></label>`;
      }).join('')).join('')}</div></details>` : ''}

    ${includeArea ? `<div class="field" data-local-fields><label for="delivery-area">Delivery area</label><select id="delivery-area" name="area">${['Vapi','Daman','Sarigam','Bhilad'].map(area => `<option ${saved.area === area ? 'selected' : ''}>${area}</option>`).join('')}</select></div>` : ''}
    </fieldset>
    <script>(function(){var choice=document.querySelector('[name="deliverySlot"]');if(!choice)return;var form=choice.form, schoolBlock=form.querySelector('[data-school-fields]'), local=form.querySelector('[data-local-fields]'), address=form.querySelector('[data-address-fields]'), institution=form.elements.institutionLocation;function sync(){address=form.querySelector('[data-address-fields]');var route=form.elements.deliverySlot.value,school=route.indexOf('school')===0;if(schoolBlock){schoolBlock.hidden=!school;schoolBlock.disabled=!school;var other=form.querySelector('[data-school-other]'),known=institution.value.indexOf('campus:')===0||institution.value.indexOf('address:')===0;other.hidden=known;other.querySelectorAll('input').forEach(function(i){i.disabled=known||!school;});if(known)form.elements.institutionName.value=institution.selectedOptions[0].dataset.name;}if(local){local.hidden=school;local.querySelectorAll('input,select').forEach(function(i){i.disabled=school;});}if(address){address.hidden=school;address.querySelectorAll('[name="addressId"]').forEach(function(i){i.disabled=school;});var fresh=address.querySelector('[data-new-address],[data-cart-new-address]');if(fresh){fresh.hidden=school||form.elements.addressId.value!=='__new';fresh.disabled=fresh.hidden;}}form.querySelectorAll('[data-college-routes]').forEach(function(block){block.hidden=!school||route==='school-express';});if(route.indexOf('local-')===0){var area=form.querySelector('[name="area"],[name="nn_area"]');if(area){var next=route.split('-')[1]==='vapi'?'Vapi':'Daman';if(area.value!==next){area.value=next;area.dispatchEvent(new Event('change',{bubbles:true}));}}}}form.addEventListener('change',sync);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',sync,{once:true});else sync();})();</script>`;
}

export function optionsStep(user, draft, addresses = [], campaign = campaignDefaults(), pricing, surcharges = {}, error = null) {
  const saved = {...(draft.form || draft.selections || draft.defaults || {})}, guest = !user;
  saved.institutionAddresses=addresses.filter(a=>a.institutionName);
  if(!guest)saved.contactPhone=user.phone || '';
  const previousSchool=addresses.find(a=>a.id===saved.addressId && a.institutionName);
  if(!saved.institutionLocation && previousSchool)saved.institutionLocation='address:'+previousSchool.id;
  const slot = saved.deliverySlot || deliveryChoice(saved);
  const mixed = saved.printType === 'mixed';
  const preview = guest ? `/order/${encodeURIComponent(draft.id)}/preview` : `/customer/orders/new/${encodeURIComponent(draft.id)}/preview.pdf`;
  const addrRadios = addresses.filter(a => !a.campusId && a.area !== 'Kiosk pickup').sort((a,b)=>Number(!!b.isDefault)-Number(!!a.isDefault)).map((a,i) => `<label class="pick"><input type="radio" name="addressId" required value="${esc(a.id)}" data-area="${esc(a.area)}" data-locality="${esc(a.localityId || '')}" data-accuracy="${esc(a.locationAccuracy || 'device')}" data-lat="${esc(a.lat || '')}" data-lng="${esc(a.lng || '')}" ${saved.addressId === '__new' ? '' : saved.addressId ? saved.addressId === a.id ? 'checked' : '' : i === 0 ? 'checked' : ''}><span>${esc(a.label || a.name || 'Saved address')}${a.isDefault ? ' · Default' : ''}<small>${esc(a.address)}, ${esc(a.area)} ${esc(a.pin)}</small></span></label>`).join('');
  return layout({ title: 'Your print', user, focused: true, extraHead: DELIVERY_MAP_HEAD + (guest ? '' : `<script src="/store.js?v=${ASSET_V}" defer></script>${surcharges.gateway ? '<script src="https://checkout.razorpay.com/v1/checkout.js" defer></script>' : ''}`), body: `
    <p class="eyebrow">UPLOAD → PRINT, DELIVERY &amp; PAY</p><div class="order-file"><div><h1>${esc(draft.document)}</h1><p>${draft.pages} ${draft.pages === 1 ? 'page' : 'pages'} · A4</p></div><button class="order-text" type="button" data-open-preview>Preview</button></div>
    <dialog class="order-preview" aria-label="Document preview"><div><strong>${esc(draft.document)}</strong><button type="button" data-close-preview aria-label="Close preview">×</button></div>${draft.fileType === 'image' ? `<img data-preview-src="${esc(preview)}" alt="Your photo">` : `<iframe title="Your PDF" data-preview-src="${esc(preview)}"></iframe>`}<a href="${esc(preview)}" target="_blank" rel="noopener">Open original file ↗</a></dialog>
    ${error ? `<p class="login-err" role="alert">${esc(String(error).replace(/<[^>]*>/g,''))}</p>` : ''}
    <form class="quick-order" method="POST" action="${guest ? '/order/options' : '/customer/orders/new/confirm'}" ${guest ? '' : 'data-print-payment'}>
      <input type="hidden" name="draft" value="${esc(draft.id)}">
      <section class="order-section"><h2>Print settings</h2>
        <fieldset class="order-choice"><legend>Colour</legend><div class="chips">${[['bw','B&W'],['color','Colour'],...(draft.pages > 1 && draft.fileType !== 'image' ? [['mixed','Split B&W + colour']] : [])].map(([v,t])=>`<label class="chip-pick"><input type="radio" name="printType" value="${v}" ${saved.printType === v || v === 'bw' && !['color','mixed'].includes(saved.printType) ? 'checked' : ''}>${t}</label>`).join('')}</div></fieldset>
        ${mixedFields(saved,draft.pages,preview)}
        <fieldset class="order-choice"><legend>Sides</legend><div class="chips">${[['single','Single-sided'],['double','Both sides']].map(([v,t])=>`<label class="chip-pick"><input type="radio" name="sides" value="${v}" ${saved.sides === v || v === 'single' && saved.sides !== 'double' ? 'checked' : ''}>${t}</label>`).join('')}</div></fieldset>
        <div class="order-copy-row"><label for="copies">Copies</label><div class="order-stepper"><button id="cMinus" type="button" aria-label="Remove one copy">−</button><input id="copies" aria-label="Number of copies" name="copies" type="number" value="${esc(saved.copies || 1)}" min="1" max="200" required><button id="cPlus" type="button" aria-label="Add one copy">+</button></div></div>
        ${draft.previousPrint ? `<button type="button" class="order-text" data-last-print="${esc(JSON.stringify(draft.previousPrint))}">Use last print settings</button>` : ''}
        <details class="order-more" ${mixed || saved.range ? 'open' : ''}><summary>More print options</summary><div class="order-more-body">
          ${draft.fileType === 'image' ? '' : `<div class="field"><label for="range">Pages</label><input id="range" name="range" autocomplete="off" value="${esc(saved.range || '')}" placeholder="All pages — or 1, 3-5"><small>Leave empty for all ${draft.pages} pages.</small></div>`}
          <div class="grid c2"><div class="field"><label for="orientation">Orientation</label><select id="orientation" name="orientation">${['auto','portrait','landscape'].map(v=>`<option value="${v}" ${saved.orientation === v ? 'selected' : ''}>${v === 'auto' ? 'Automatic' : v[0].toUpperCase()+v.slice(1)}</option>`).join('')}</select></div><div class="field"><label for="binding">Binding</label><select id="binding" name="binding">${[['none','None'],['staple','Staple'],['spiral','Spiral binding']].map(([v,t])=>`<option value="${v}" ${saved.binding === v ? 'selected' : ''}>${t}</option>`).join('')}</select></div></div>
          <div class="field"><label for="notes">Special instructions</label><textarea id="notes" name="notes" rows="2" maxlength="300">${esc(saved.notes || '')}</textarea></div>
        </div></details>
      </section>
      <section class="order-section"><h2 id="delivery">Delivery</h2>${deliverySlotsFields(campaign,pricing,slot,guest,'prints',saved)}
      ${guest ? '' : `<div data-address-fields data-destination-details>
        <h3 class="address-heading">Where should we deliver?</h3>${addrRadios}
        <label class="pick"><input type="radio" name="addressId" required value="__new" ${!addrRadios || saved.addressId === '__new' ? 'checked' : ''}><span>Use a new address<small>Saved for your next order</small></span></label>
        <fieldset class="address-fields" data-new-address ${addrRadios && saved.addressId !== '__new' ? 'hidden disabled' : ''}>
          <div class="field"><label for="campus-phone">Delivery phone</label><input id="campus-phone" name="nn_phone" type="tel" autocomplete="tel" value="${esc(saved.nn_phone || user.phone || '')}" required maxlength="20"></div>
          <div class="field"><label for="local-address">Full address</label><input id="local-address" name="nn_address" autocomplete="street-address" value="${esc(saved.nn_address || '')}" required maxlength="200" placeholder="Flat / room, building and street"></div>
          <div class="grid c2"><div class="field"><label for="local-area">City / area</label><select id="local-area" name="nn_area">${['Vapi','Daman','Sarigam','Bhilad'].map(area => `<option ${saved.nn_area === area ? 'selected' : ''}>${area}</option>`).join('')}</select></div><div class="field"><label for="local-pin">PIN code</label><input id="local-pin" name="nn_pin" value="${esc(saved.nn_pin || '')}" inputmode="numeric" autocomplete="postal-code" maxlength="6" pattern="[1-9][0-9]{5}" required></div></div>
          <div class="field"><label for="local-landmark">Landmark (optional)</label><input id="local-landmark" name="nn_landmark" value="${esc(saved.nn_landmark || '')}" maxlength="100"></div>
          ${deliveryPicker(saved.nn_area || 'Vapi', {localityId:saved.localityId,lat:saved.deliveryLat,lng:saved.deliveryLng})}
        </fieldset><script>(function(){var form=document.querySelector('.quick-order'),block=form.querySelector('[data-new-address]');function sync(){block.hidden=form.querySelector('[name="addressId"]:checked')?.value!=='__new';block.disabled=block.hidden;}form.querySelectorAll('[name="addressId"]').forEach(function(i){i.addEventListener('change',sync);});sync();})();</script>
      </div>`}
      </section>
      ${guest ? '' : `<input type="hidden" name="checkout" value="1"><input type="hidden" name="expectedTotal" value=""><section class="order-section"><h2>Payment</h2><fieldset class="order-choice"><legend class="sr-only">Pay with</legend>${surcharges.gateway ? '<label class="pick"><input type="radio" name="paymentMethod" value="online" checked><span>UPI / cards<small>Razorpay · no extra payment fee</small></span></label>' : ''}<label class="pick"><input type="radio" name="paymentMethod" value="wallet" ${surcharges.gateway ? '' : Number(surcharges.balance)>0 ? 'checked' : ''}><span>Wallet<small>${rs(surcharges.balance || 0)} available · no COD fee</small></span></label><label class="pick"><input type="radio" name="paymentMethod" value="cod" ${!surcharges.gateway && !Number(surcharges.balance) ? 'checked' : ''}><span>Cash on delivery<small>₹10 extra cash-handling fee</small></span></label></fieldset>${cashConsent()}<details class="order-more"><summary>Coupon / referral</summary><div class="field"><label for="coupon">Coupon</label><input id="coupon" name="coupon" maxlength="40"></div><div class="field"><label for="referral">Referral code</label><input id="referral" name="referral" maxlength="12"></div><small>Any code saving is confirmed here before payment.</small></details></section><p role="alert" data-payment-error hidden></p>`}
      ${printQuote(pricing,draft,campaign,!!user?.student,surcharges)}
      ${guest ? '' : '<button class="order-text" type="submit" name="next" value="wallet" formnovalidate>Wallet top-up offers →</button><button class="order-text order-add" type="submit" name="next" value="add" formnovalidate>+ Add another document</button>'}
    </form>` });
}

export function cashConsent() {
  return `<div class="cash-consent" data-cash-consent><label class="pick"><input type="checkbox" name="confirmCash" value="1"><span>I’ll pay <strong data-cash-due>the cash total</strong> on delivery.<small>Includes the extra ₹10 cash-handling fee. Confirm below to place the order.</small></span></label></div>`;
}

export function summaryStep(user, draft, s, q, packCover = null, ref = { code: '', error: null }, checkout = {}) {
  const edit = `/customer/orders/new?draft=${encodeURIComponent(draft.id)}`;
  return layout({ title: 'Confirm & pay', user, focused: true, back: edit, extraHead: `<script src="/store.js?v=${ASSET_V}" defer></script>${checkout.gateway ? '<script src="https://checkout.razorpay.com/v1/checkout.js" defer></script>' : ''}`, body: `
    <h1>Confirm &amp; pay.</h1><p class="field-hint">Fulfilled by ${esc(checkout.fulfillmentName || 'PrintKarr print desk')}. Your prints and stationery arrive together.</p>
    <section class="order-section"><div class="order-file"><div><h2>${esc(draft.document)}</h2><p>${s.effPages} pages · ${esc(printDescription(s))} · ${s.sides === 'double' ? 'Double' : 'Single'}-sided · ${s.copies} ${s.copies === 1 ? 'copy' : 'copies'}</p></div><a class="order-text" href="${edit}">Edit</a></div>
    ${(checkout.prints || []).map(o=>`<p class="order-added-file">${esc(o.document)} · ${rs(o.net)}</p>`).join('')}${(checkout.items || []).map(i=>`<p class="order-added-file">${esc(i.name)} · ${i.quantity} × ${rs(i.price)}</p>`).join('')}
    <div class="order-line"><div><h2>Delivery</h2><p>${esc(s.campusId ? s.slot : (checkout.address?.address || s.zoneLabel)+' · '+s.slot)}</p></div><a class="order-text" href="${edit}#delivery">Change</a></div>
    ${user.phone ? `<p class="order-contact">${esc(user.name)} · ${esc(user.phone)}</p>` : ''}
    </section>
    <form method="GET" action="/customer/orders/new/summary" data-inline-order><input type="hidden" name="draft" value="${esc(draft.id)}"><details class="order-more" ${ref.error || ref.code || checkout.coupon ? 'open' : ''}><summary>Coupon / referral</summary>${packCover ? '' : `<div class="field"><label for="coupon">Coupon</label><input id="coupon" name="coupon" value="${esc(checkout.coupon || '')}" maxlength="40"></div>`}<div class="field"><label for="referral">Referral code</label><input id="referral" name="referral" value="${esc(ref.code || '')}" maxlength="12"></div>${ref.error ? `<p class="login-err" role="alert">${esc(ref.error)}</p>` : ''}<button class="btn ghost" type="submit">Apply code</button></details></form>
    <section class="order-section order-totals"><div class="sumrow"><span>Printing${checkout.items?.length ? ' & stationery' : ''}</span><span>${rs(q.subtotal + (q.studentDiscount || 0) + (q.bulkDiscount || 0))}</span></div>${q.studentDiscount ? `<div class="sumrow"><span>Student discount</span><span>−${rs(q.studentDiscount)}</span></div>` : ''}${q.bulkDiscount ? `<div class="sumrow"><span>Print savings</span><span>−${rs(q.bulkDiscount)}</span></div>` : ''}${q.packDiscount ? `<div class="sumrow"><span>Semester pack</span><span>−${rs(q.packDiscount)}</span></div>` : ''}${q.firstPrintDiscount ? `<div class="sumrow"><span>First print offer</span><span>−${rs(q.firstPrintDiscount)}</span></div>` : ''}${q.couponDiscount ? `<div class="sumrow"><span>Coupon</span><span>−${rs(q.couponDiscount)}</span></div>` : ''}${ref.discount ? `<div class="sumrow"><span>Referral</span><span>−${rs(ref.discount)}</span></div>` : ''}<div class="sumrow"><span>Processing · ${q.printedSides || 0} printed sides</span><span>${rs(q.processingFee || 0)}</span></div><div class="sumrow"><span>Delivery</span><span>${q.deliveryFee ? rs(q.deliveryFee) : 'FREE'}</span></div>${q.lateNightFee ? `<div class="sumrow"><span>Late-night delivery</span><span>${rs(q.lateNightFee)}</span></div>` : ''}${q.surgeFee ? `<div class="sumrow"><span>Demand fee</span><span>${rs(q.surgeFee)}</span></div>` : ''}<div class="sumrow total"><span>Total</span><span>${rs(q.total)}</span></div></section>
    <form method="POST" action="/customer/orders/new/place" data-print-payment><input type="hidden" name="draft" value="${esc(draft.id)}"><input type="hidden" name="checkout" value="1"><input type="hidden" name="expectedTotal" value="${esc(q.total)}"><input type="hidden" name="coupon" value="${esc(checkout.coupon || '')}"><input type="hidden" name="referral" value="${esc(ref.code || '')}">
      <fieldset class="order-choice"><legend>Pay with</legend>${checkout.gateway && q.total>0 ? '<label class="pick"><input type="radio" name="paymentMethod" value="online" checked>Razorpay UPI / cards · no extra payment fee</label>' : ''}${checkout.balance>=q.total ? `<label class="pick"><input type="radio" name="paymentMethod" value="wallet" ${checkout.gateway && q.total>0 ? '' : 'checked'}>Wallet · ${rs(checkout.balance)} available · no COD fee</label>` : ''}<label class="pick"><input type="radio" name="paymentMethod" value="cod" ${!checkout.gateway && checkout.balance<q.total ? 'checked' : ''}>Cash on delivery · ${rs(q.total+COD_FEE)} including ₹10 extra</label></fieldset>
      ${cashConsent()}<p class="field-hint">Wallet / UPI total <strong>${rs(q.total)}</strong>. Cash total <strong>${rs(q.total+COD_FEE)}</strong>. Online payment saves ₹10.</p><button class="order-text" type="submit" name="next" value="wallet" formnovalidate>View wallet top-up offers →</button>${feeExplanation}
      <p role="alert" data-payment-error hidden></p><div class="order-continue"><span data-payment-total data-online-total="${q.total}" data-cash-total="${q.total+COD_FEE}">${rs(!checkout.gateway && checkout.balance<q.total ? q.total+COD_FEE : q.total)}<small>${!checkout.gateway && checkout.balance<q.total ? "Cash total · includes extra COD fee" : "Online / wallet total"}</small></span><button class="btn loud big" type="submit" ${ref.error ? 'disabled' : ''}>Continue to payment →</button></div>
      <button class="order-text order-add" type="submit" name="next" value="add" formnovalidate>+ Add another document</button>
    </form>` });
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
        ${order.pages ? `<div class="sumrow"><span>${esc(order.pages)} pages${order.copies > 1 ? ` × ${esc(order.copies)} copies` : ''}</span><span>${esc(printDescription(order))}</span></div>` : ''}
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
      ${walletReady ? `<p class="wallet-checkout-note">Your wallet covers this order. ${rs(Number(user.walletBalance || 0) - order.total)} will remain after payment.</p>` : suggested ? `<div class="wallet-checkout-note"><b>Add ${rs(suggested.amount)}, ${suggested.freeFiles ? `get ${suggested.freeFiles} free paper/cardboard files` : `get ${rs(suggested.bonus)} extra print credit`}.</b><p>After paying ${rs(order.total)} for this order, ${rs(Number(user.walletBalance || 0) + suggested.amount + suggested.bonus - order.total)} stays for next time.</p><a class="rowlink" data-wallet-offer="${esc(suggested.id)}" href="/customer/wallet?order=${encodeURIComponent(order.id)}&amp;offer=${encodeURIComponent(suggested.id)}">Top up &amp; return to this order →</a><small>Optional. Bonus ${(suggested.validityDays ?? opts.bonusValidityDays) ? 'valid '+esc(suggested.validityDays ?? opts.bonusValidityDays)+' days; ' : 'has no expiry; '}bonus is non-withdrawable. Order payment follows separately.</small></div>` : ''}
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
  const ladder = `${offers.length ? '<h2 class="h-sec">Choose a wallet offer</h2>' : ''}<div class="grid c2 wallet-offers" style="margin:16px 0">${offers.map((o) => `<article class="card"><p class="eyebrow">${esc(o.name)}</p><p class="offer-value">${rs(o.amount + o.bonus)}<small>wallet balance · pay ${rs(o.amount)}</small></p>${o.freeFiles ? `<p><strong>+ ${o.freeFiles} free paper/cardboard files</strong></p><p class="field-hint">Orange, green, red or yellow. Choose your colour after a successful top-up. All ${rs(o.amount)} stays in your wallet.</p>` : ''}${o.freeFirstBatch ? '<p class="field-hint">Eligible first school / college batch delivery free.</p>' : ''}${o.memberDays ? `<p class="field-hint">${o.memberDays}-day membership${o.freeBatch ? ' · free campus batch delivery' : ''}.</p>` : ''}<p class="field-hint">Bonus ${(o.validityDays ?? opts.campaign?.bonusValidityDays) ? 'valid for '+esc(o.validityDays ?? opts.campaign?.bonusValidityDays)+' days' : 'has no expiry'}. Non-withdrawable; usable on orders.${o.firstOnly ? ' First top-up only.' : ''}${o.endsOn ? ' Offer ends '+esc(o.endsOn)+' (IST).' : ''}</p><button class="btn sun" type="button" data-offer="${esc(o.id)}" data-amount="${o.amount}" ${!rzpOn && livePay ? 'disabled' : ''}><span>Choose offer</span></button></article>`).join('')}</div>`;
  const fileGifts = (opts.fileGifts || []).map((t) => {
    const gift = t.freeFiles;
    return `<article class="card"><p class="eyebrow">From your ${rs(t.amount)} top-up</p><h3>${gift.quantity} free paper/cardboard files</h3>${gift.fulfilledAt ? `<p>${esc(gift.color)} · handed over ${esc(new Date(gift.fulfilledAt).toLocaleDateString('en-IN', {timeZone:'Asia/Kolkata'}))}</p>` : `<form method="POST" action="/customer/wallet/files/${encodeURIComponent(t.id)}/claim"><div class="field"><label for="file-${esc(t.id)}">Colour for your ${gift.quantity} files</label><select id="file-${esc(t.id)}" name="color" required><option value="">Choose a colour</option>${FILE_COLORS.map((color) => `<option value="${color}" ${gift.color === color ? 'selected' : ''}>${color[0].toUpperCase() + color.slice(1)}</option>`).join('')}</select></div><button class="btn sun" type="submit">${gift.color ? 'Update colour' : 'Request my free files'}</button></form><p class="field-hint">${gift.color ? 'Colour saved. Your files are awaiting handover.' : 'Choose your colour so our team can prepare your files.'}</p>`}</article>`;
  }).join('');
  const rows = tx.map((t) => `
    <div class="sumrow"><span>${t.amount > 0 ? '+' : ''}${rs(t.amount)} · ${esc(t.label)}${t.expiresAt ? ` · expires ${esc(new Date(t.expiresAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }))}` : ''}</span><span class="at">${esc(new Date(t.at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }))}</span></div>`
  ).join('') || '<p class="muted">No transactions yet.</p>';
  return layout({
    title: 'Wallet', user, extraCss: '/customer.css', active: '/customer/wallet',
    body: `
<div class="page-heading"><p class="eyebrow">READY FOR YOUR NEXT ORDER</p><h1>Your <em>wallet.</em></h1><p>Add money when you need it. Choose an offer or enter your own amount; paying per order is always an option.</p></div><div class="wallet-layout">    <section class="wallet-overview"><p class="eyebrow rv">Wallet balance</p>
    <p class="wallet-balance">${rs(wallet.balance)}</p><div class="wallet-breakdown"><div><span>Your added money</span><strong>${rs(wallet.balance - bonusBalance)}</strong></div><div><span>Bonus credit</span><strong>${rs(bonusBalance)}</strong></div></div>
    <p class="muted">Bonus credit is non-withdrawable and usable on PrintKarr orders. Check each offer below for its bonus validity.</p>
    ${opts.campaign?.showPages ? `<p class="field-hint">Approximately ${((user.student ? pricing.studentBw : pricing.bw) > 0 ? Math.floor(wallet.balance / (user.student ? pricing.studentBw : pricing.bw)) : 0)} B&amp;W page-sides at your current rate, before delivery and other fees.</p>` : ''}
    </section><section class="card wallet-topup">    ${rzpOn ? `<div>
      <h2 class="h-sec" style="margin-top:0">Top up your wallet</h2>
      <div class="topup-fields">
        <div class="field" style="margin:0"><label for="amount">Amount (₹10 – ₹10,000)</label>
          <input id="amount" name="amount" type="number" step="0.01" value="${offers[0]?.amount ?? 10}" min="10" max="10000" style="max-width:160px"></div>
        <div class="field" style="margin:0"><label for="rzp-ref">Referral code (optional)</label>
          <input id="rzp-ref" type="text" placeholder="K7Q2M4" maxlength="12" style="text-transform:uppercase;max-width:130px"></div>
        <button class="btn sun" type="button" id="topupBtn"><span>+ Top up wallet</span></button>
      </div>
      <p class="muted mono" style="font-size:12px;margin-top:8px">The selected wallet offer applies. Referral credit arrives after your first paid order is completed.</p>
    </div>
    ${!livePay ? `<p class="muted mono" style="font-size:12px">Demo build: card is test mode.</p>` : ''}` : ''}
    ${opts.refErr ? `<p class="login-err" role="alert">${esc(opts.refErr)}</p>` : ''}
    ${!rzpOn && !livePay ? `<h2>Top up your wallet</h2><form id="demoTopup" class="topup-fields" method="POST" action="/customer/wallet/add">
      <div class="field" style="margin:0"><label for="amount">Add money (demo)</label>
        <div style="display:flex;gap:8px"><input id="amount" name="amount" type="number" step="0.01" value="${offers[0]?.amount ?? 10}" min="10" max="10000" style="max-width:140px">
        </div></div>
      <div class="field" style="margin:0"><label for="wref">Referral code (optional)</label>
        <input id="wref" name="referral" placeholder="K7Q2M4" maxlength="12" style="text-transform:uppercase;max-width:130px"><small class="field-hint">Add ${rs(opts.refMin ?? 99)}+ and complete your first paid order for eligible ${rs(opts.refBonus ?? 20)} referral credit.</small></div><button class="btn sun" type="submit">Add demo balance →</button>
    </form>
    ` : ''}
    ${!rzpOn && livePay ? '<p class="muted mono rv" style="font-size:11px;margin:16px 0">Top-ups unavailable — gateway not configured. Pay per order instead.</p>' : ''}
    <input type="hidden" id="offerId" name="offerId" form="demoTopup" value="${esc(offers[0]?.id || '')}">
    ${opts.returnPurchase ? `<input type="hidden" name="purchaseId" form="demoTopup" value="${esc(opts.returnPurchase)}">` : ''}${opts.returnOrder ? `<input type="hidden" name="orderId" form="demoTopup" value="${esc(opts.returnOrder)}">` : ''}
<p class="wallet-nudge" id="topNudge" role="status"></p></section></div>
    ${Date.parse(wallet.memberUntil) > Date.now() ? `<p class="pick">Semester Pass active until ${esc(new Date(wallet.memberUntil).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }))}${wallet.memberFreeBatch ? ' · free campus batch delivery' : ''}.</p>` : ''}
    ${opts.returnPurchase ? `<div class="wallet-checkout-note"><b>Your checkout is saved.</b><p>Top up, then return to review and pay. Wallet / UPI avoids the ₹10 COD fee.</p><a class="rowlink" href="/customer/purchases/${encodeURIComponent(opts.returnPurchase)}">Return to checkout →</a></div>` : ''}${opts.returnOrder ? `<div class="wallet-checkout-note"><b>Your print order is saved.</b><p>Top up here, then return to review and pay for order #${esc(opts.returnOrder)}.</p><a class="rowlink" href="/customer/orders/${encodeURIComponent(opts.returnOrder)}/pay">Return to checkout →</a></div>` : ''}
    ${opts.firstBatchAvailable ? '<p class="pick">Your earned first school / college batch-delivery benefit is available. Scheduled delivery is up to ₹10 and reduces with sides; express is ₹25.</p>' : ''}
    ${opts.cash > 0 ? `<a class="card promo rv" href="/customer/referrals" style="text-decoration:none;display:block;margin-top:12px"><p class="eyebrow">Previous cash earnings</p><div class="stat"><div class="v">${rs(opts.cash)}<em> cash</em></div><div class="k">View withdrawal options →</div></div></a>` : ''}
    ${ladder}
    ${fileGifts ? `<section id="free-files"><h2 class="h-sec">Your free files</h2><div class="grid c2">${fileGifts}</div></section>` : ''}
    <script>
    (function(){
      var offers = ${JSON.stringify(offers).replace(/</g, '\\u003c')}, inp = document.getElementById('amount'), n = document.getElementById('topNudge'), chosen = document.getElementById('offerId');
      if (!inp || !n) return;
      var selected = ${JSON.stringify(opts.selectedOffer || '').replace(/</g, '\\u003c')};
      try { var remembered = JSON.parse(sessionStorage.getItem('pk-wallet-offer')); if (!selected && remembered && Date.now()-remembered.at < 30*60e3) selected=remembered.id; sessionStorage.removeItem('pk-wallet-offer'); } catch {}
      var initial=offers.find(function(o){return o.id===selected;}); if(initial){inp.value=initial.amount;chosen.value=initial.id;}
      function upd(){document.querySelectorAll('[data-offer]').forEach(function(b){var on=b.dataset.offer===chosen.value;b.setAttribute('aria-pressed',String(on));b.closest('article').classList.toggle('wallet-offer-selected',on);});var v=Number(inp.value),o=offers.find(function(x){return x.id===chosen.value;})||offers.filter(function(x){return !x.memberDays&&x.amount===v;}).sort(function(a,b){return b.bonus-a.bonus;})[0];n.textContent=o?'Add ₹'+v+(o.bonus?' + ₹'+o.bonus+' bonus':'')+' = ₹'+(v+o.bonus)+' will be added.'+(o.freeFiles?' Plus '+o.freeFiles+' free paper/cardboard files; choose your colour after payment.':'')+' Balance after top-up: ₹'+Math.round((${wallet.balance}+v+o.bonus)*100)/100:'Custom top-up: ₹'+v+' added to your wallet';}
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
      fetch('/api/wallet/topup-order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: amount, offerId: offerId, referral: referral, purchaseId: ${JSON.stringify(opts.returnPurchase || null).replace(/</g, '\\u003c')}, orderId: ${JSON.stringify(opts.returnOrder || null).replace(/</g, '\\u003c')} }) })
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
    <div class="card rv"><h2>Recent transactions</h2><div style="margin-top:8px">${rows}</div></div>`
  });
}

export function profilePage(user, addresses, notes, { review, reviewError, reviewSaved } = {}) {
  const addr = addresses.map(a=>`<article class="address-card"><strong>${esc(a.label || 'Saved address')}</strong>${a.isDefault?'<span class="badge">Default</span>':''}<p>${esc(a.institutionName || '')} ${esc(a.address)}, ${esc(a.area)} ${esc(a.pin)}</p>${a.phone?`<p>${esc(a.phone)}</p>`:''}${a.isDefault?'':`<form method="POST" action="/customer/addresses/default"><input type="hidden" name="id" value="${esc(a.id)}"><button class="rowlink" type="submit">Use as default →</button></form>`}</article>`).join('') || '<p class="muted">No saved addresses yet. Add one below or during checkout.</p>';
  return layout({
    title: 'My Account', user, extraHead: DELIVERY_MAP_HEAD, extraCss: '/customer.css', active: '/customer/profile',
    body: `
    <div class="page-heading"><p class="eyebrow">EVERYTHING IN ITS PLACE</p><h1>Your <em>account.</em></h1><p>Keep your contact details and delivery addresses ready for your next order.</p></div><div class="profile-layout">
      <section class="card"><h2>Personal details</h2>
        <form method="POST" action="/customer/profile">
          <div class="field"><label for="pname">Name</label><input id="pname" name="name" value="${esc(user.name)}" required></div>
          <div class="field"><label for="pphone">Phone</label><input id="pphone" name="phone" type="tel" autocomplete="tel" value="${esc(user.phone || '')}" placeholder="+91 9XXXXXXXXX"></div>
          <div class="field"><label for="profile-email">Email</label><input id="profile-email" value="${esc(user.email)}" type="email" disabled><small class="muted mono" style="font-size:10px">Email is your login — contact support to change it.</small></div>
          <div class="sumrow"><span>Student rate</span><span>${user.student ? 'ON · ₹2 B&W' : 'Off'}</span></div>
          <button class="btn solid" type="submit" style="margin-top:10px"><span>Save profile →</span></button>
        </form>
      </section>
      <section class="card" id="addresses"><h2>Delivery addresses</h2><div style="margin-top:8px">${addr}</div>
        <details class="address-add"><summary class="rowlink">Add a new address ${icon('plus')}</summary>
          <form method="POST" action="/customer/addresses/add" style="margin-top:10px">
            <div class="grid c2"><div class="field"><label for="field-label">Label</label><select id="field-label" name="label"><option>Home</option><option>Hostel</option><option>College</option><option>PG</option><option>Office</option></select></div>
            <div class="field"><label for="field-phone">Phone</label><input id="field-phone" name="phone" type="tel" autocomplete="tel" value="${esc(user.phone || '')}" required></div></div>
            <div class="field"><label for="field-address">Address</label><input id="field-address" name="address" autocomplete="street-address" required></div>
            <div class="grid c3"><div class="field"><label for="field-area">Area</label><select id="field-area" name="area"><option>Vapi</option><option>Sarigam</option><option>Bhilad</option><option>Daman</option></select></div>
            <div class="field"><label for="field-landmark">Landmark</label><input id="field-landmark" name="landmark"></div>
            <div class="field"><label for="field-pin">PIN</label><input id="field-pin" name="pin" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" required></div></div>
            ${deliveryPicker('Vapi')}<button class="btn solid" type="submit"><span>Save address</span></button>
          </form></details>
      </section>
    </div>
    <details class="card profile-review review-disclosure" id="review" ${reviewError || reviewSaved ? 'open' : ''}><summary><h2>How was your print?</h2><span>${review?.id ? 'Edit your review' : 'Leave a review'} →</span></summary>
      <p class="muted">A small note helps the next person. Your review and first name will appear on our home page.</p>
      ${reviewError ? `<p class="login-err" role="alert">${esc(reviewError)}</p>` : ''}
      ${reviewSaved ? '<p class="review-saved" role="status">Your review is saved. Thank you for sharing it.</p>' : ''}
      <form method="POST" action="/customer/review">
        <fieldset class="review-rating"><legend>Your rating</legend><div class="review-rating-options">${[1,2,3,4,5].map(n => `<label><input type="radio" name="rating" value="${n}" ${Number(review?.rating) === n ? 'checked' : ''} required><span aria-hidden="true">★</span><span class="rating-number">${n}</span><span class="sr-only">${n === 1 ? 'star' : 'stars'}</span></label>`).join('')}</div></fieldset>
        <div class="field"><label for="review-text">Your review</label><textarea id="review-text" name="text" rows="4" minlength="10" maxlength="1000" required placeholder="What did you print? What went well, or could be better?">${esc(review?.text)}</textarea><small class="muted">10 to 1,000 characters. Please leave out phone numbers and order details.</small></div>
        <div class="review-form-actions"><button class="btn loud" type="submit">${review?.id ? 'Update review' : 'Share review'}</button><a class="rowlink" href="/#reviews">Read customer reviews ${icon('arrow-up-right')}</a></div>
      </form>
    </details><aside class="profile-help"><div><strong>Need help with an order?</strong><p class="muted">Track your delivery or talk to our team.</p></div><div class="action-row" style="margin:0"><a class="rowlink" href="/customer/notifications">Open your inbox →</a><a class="btn" href="/contact">Get help →</a></div></aside>`
  });
}
