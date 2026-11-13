import { scriptNonce } from './security.js';
import { LOCALITIES } from '../public/localities.js';
import { printDescription, printPlan } from '../public/print-plan.js';
import { BULK_TIERS, offerActive, printPricing } from '../public/print-pricing.js';
// Customer order wizard (§6–13), wallet (§17), profile (§18–19).
import { campaignDefaults, deliveryPlan, deliveryChoice, FILE_COLORS } from './campus.js';
import { layout, esc, icon, uploadScript, ASSET_V, DELIVERY_MAP_HEAD, deliveryPicker } from './views.js';

export const feeExplanation = '<p class="field-hint">School / college / classes delivery is ₹5 flat per checkout. No processing, late-night or demand fees. Other available delivery has no additional charge.</p><p class="field-hint">Upload and pay on printkarr.in. Need help with your order? Contact us on WhatsApp.</p>';

export function bulkPricingGuide(pricing, inline = false) {
  const base={bw:Number(pricing.bw),color:Number(pricing.color)};
  const offers=(pricing.printOffers || []).filter(o=>offerActive(o)).map(o=>`<p><b>${esc(o.name)}</b>: ${rs(o.price)} for ${o.sides} ${o.type==='color' ? 'colour' : 'B&amp;W'} printed sides. ${o.repeat ? 'Every complete bundle qualifies.' : 'One bundle per checkout.'} Extra sides use the regular rate; the better of bulk pricing and this offer applies. School / college delivery is ₹5 extra.</p>`).join('');
  const tiers=`<p>Progressive bulk pricing: each slab applies only to the sides in that slab. B&amp;W and colour sides, copies and documents in one checkout count together.</p><div class="tblwrap"><table class="tbl"><thead><tr><th>Printed sides in checkout</th><th>B&amp;W / side</th><th>Colour / side</th></tr></thead><tbody>${BULK_TIERS.map((t,i)=>`<tr><td>${i ? BULK_TIERS[i-1].through+1 : 1}${Number.isFinite(t.through) ? '–'+t.through : '+'}</td><td>${rs(base.bw-Math.max(0,base.bw-1.4)*t.bw)}</td><td>${rs(base.color-Math.max(0,base.color-3)*t.color)}</td></tr>`).join('')}</tbody></table></div>${feeExplanation}`;
  if (inline) return `<div class="delivery-guide guide-inline"><div class="delivery-guide-body">${offers}${tiers}</div></div>`;
  return `<p class="field-hint" data-price-examples><b>B&amp;W price examples · 1 copy</b><br>${[50,100].map(pages=>`${pages} pages = ${rs(printPricing({bw:pages,color:0},pricing).subtotal)}`).join(' · ')}<br>Printing only. Binding and delivery are shown separately before payment.</p><details class="delivery-guide"><summary>See bulk rates &amp; delivery fees</summary><div class="delivery-guide-body">${offers}${tiers}</div></details>`;
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

// Rate-ladder meter (the quick-commerce "you're X away from a better deal" pattern,
// spoken in the print desk's own progressive slab rates). Honest framing: every slab
// discounts only the sides inside it, so the meter nudges the *next* added sides.
// Sides are basket-wide: copies, colour pages and other files count together.
export function slabMeter(sides, pricing, student = false) {
  const base = { bw: Number(student ? pricing.studentBw : pricing.bw), color: Number(student ? pricing.studentColor : pricing.color) };
  if (!Number.isSafeInteger(sides) || sides < 1 || !Object.values(base).every((n) => Number.isFinite(n) && n > 0)) return '';
  const rate = (tier, kind) => base[kind] - Math.max(0, base[kind] - (kind === 'bw' ? 1.4 : 3)) * tier[kind];
  const money = (n) => '₹' + (Math.round(n * 100) / 100);
  const idx = BULK_TIERS.findIndex((t) => t.through >= sides);
  const now = BULK_TIERS[idx], next = BULK_TIERS[idx + 1] || null;
  const prevThrough = idx > 0 ? BULK_TIERS[idx - 1].through : 0;
  const progress = next ? (sides - prevThrough) / (now.through - prevThrough) : 1;
  const kindLine = (tier) => {
    const parts = [];
    if (rate(tier, 'bw') < base.bw) parts.push(`${money(rate(tier, 'bw'))}/side B&amp;W`);
    if (rate(tier, 'color') < base.color) parts.push(`${money(rate(tier, 'color'))}/side colour`);
    return parts.join(' · ') || 'already the desk\'s best rate';
  };
  const copy = next
    ? `<b>${sides} printed sides</b> on the desk. The next <b>${now.through + 1 - sides}+</b> added sides drop to <b>${kindLine(next)}</b>. Copies, colour pages and other files in this checkout count together.`
    : `<b>${sides} printed sides</b> — this checkout prints at our lowest tray rates: ${kindLine(now)}.`;
  return `<div class="pk-slab" data-slab><div class="pk-slab-head"><span>Print rate ladder</span><span data-slab-side>${sides} sides</span></div><div class="pk-slab-track" aria-hidden="true"><b data-slab-bar style="width:${Math.round(Math.min(1, Math.max(0.04, progress)) * 100)}%"></b></div><p class="pk-slab-copy" data-slab-copy>${copy}</p></div>`;
}

export function deliveryGuide(campaign = campaignDefaults(), pricing) {
  return `<details class="delivery-guide"><summary>Delivery prices</summary><div class="delivery-guide-body"><p>School / college / classes: ₹5 flat for scheduled or express delivery. Choose your institution, or enter its name and locality. Handover at the main gate.</p><p>Other available delivery has no extra charge.</p><p>Choose an available time window and choose your locality. Location sharing is optional. Exact total before payment.</p></div></details>`;
}

export function printQuote(pricing, draft, campaign = campaignDefaults(), student = false, surcharges = {}) {
  const config = JSON.stringify({ bw: student ? pricing.studentBw : pricing.bw, color: student ? pricing.studentColor : pricing.color, printOffers: pricing.printOffers || [], fees: pricing.delivery, local: campaign.delivery.local, ...surcharges });
  return `<div class="order-quote"><div class="order-price-lines" data-print-breakdown><div><span>Printing</span><b data-print-cost>—</b></div><div hidden><span>Processing</span><b data-processing-cost>—</b></div><div><span>Delivery</span><b data-delivery-cost>—</b></div><div hidden><span>Other basket items</span><b data-other-cost>—</b></div><div hidden><span>Late-night delivery</span><b data-night-cost>—</b></div><div hidden><span>Demand fee</span><b data-demand-cost>—</b></div><div hidden><span>You save</span><b data-print-save></b></div></div><div class="livetotal order-continue" data-print-quote data-pages="${esc(draft.pages)}" data-pricing="${esc(config)}" role="status" aria-live="polite"><div><b>₹–</b><span>Total</span></div><button class="btn loud big" type="submit">Continue →</button></div></div>`;
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
  </div>`;
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

const orderSteps = (now) => `<ol class="order-steps" aria-label="Order progress">${[['Upload file', 'Choose a PDF or photo'], ['Settings &amp; delivery', 'Print, address and price'], ['Payment before print', 'Pay and it goes to print']].map(([label, hint], i) => `<li ${i === now ? 'class="now" aria-current="step"' : i < now ? 'class="done"' : ''} aria-label="${esc(label || '')}"><b>${i + 1}</b><span>${label}</span></li>`).join('')}</ol>`;

export function uploadStep(user, { maxMb = 20, repeat, error } = {}) {
  return layout({ title: 'Print something', user, focused: true, extraHead: DELIVERY_MAP_HEAD + `<link rel="stylesheet" href="/quick.css?v=${ASSET_V}">`, body: `
    ${orderSteps(0)}<h1>Let’s get it <em>printed.</em></h1><p class="order-intro">Choose a PDF or photo — it uploads by itself and your price appears. No button to press.</p>
    ${error ? `<p class="login-err" role="alert">${esc(error)}</p>` : ''}
    <form class="order-upload" method="POST" action="${user ? '/customer/orders/new/upload' : '/order/upload'}" enctype="multipart/form-data" data-max-mb="${esc(maxMb)}" data-order-upload>
      ${repeat ? `<input type="hidden" name="repeat" value="${esc(repeat.id)}"><p class="field-hint">Using your previous print settings. Page selections reset for the new file.</p>` : ''}
      <label class="drop" for="doc"><span class="drop-arrow">${icon('upload-simple')}</span><b>Choose a PDF or photo</b><span class="muted">PDF, JPG or PNG · up to ${esc(maxMb)} MB · Or drop it here</span><span class="pk-upload-pill" style="margin-top:14px;display:inline-block">Choose a file</span></label>
      <input id="doc" name="doc" type="file" accept="application/pdf,.pdf,.png,.jpg,.jpeg" required class="file-input">
      <p id="fname" role="status" aria-live="polite"></p><noscript><button class="btn loud big pk-btn pk-btn-primary" type="submit"><span>Upload file →</span></button></noscript>
      <p class="order-trust"><span>${icon('check')} Exact total before payment</span><span>${icon('map-pin')} ₹0 local address delivery</span><span>${icon('users')} ₹5 school &amp; college delivery</span></p>
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
      ${standard ? `<p class="route-where">School / college / classes</p><label class="pick"><input type="radio" name="deliverySlot" value="${school && chosen !== 'school-express' ? esc(chosen) : 'school'}" ${school && chosen !== 'school-express' ? 'checked' : ''}><span><b>Standard · next scheduled window · ₹5</b><small>Any institution in local coverage · handover at the main gate</small></span></label><p class="field-hint" data-college-routes>Next window: ${esc(deliveryPlan({settings:{campaign:cfg}}, school && chosen !== 'school-express' ? chosen : 'school').slot)}</p>` : ''}
    ${college ? `<label class="pick"><input type="radio" name="deliverySlot" value="school-express" ${chosen === 'school-express' ? 'checked' : ''}><span><b>Urgent · as soon as printing finishes · ₹5</b><small>Institution address only · we confirm the timing before payment</small></span></label><fieldset data-school-fields class="school-destination" ${school ? '' : 'hidden disabled'}><legend>School / college</legend><div class="field"><label for="institution-location">Choose your institution or locality</label><select id="institution-location" name="institutionLocation" required><option value="">Choose school / college</option>${(saved.institutionAddresses || []).map(a=>`<option value="address:${esc(a.id)}" data-name="${esc(a.institutionName)}" ${saved.institutionLocation === 'address:'+a.id ? 'selected' : ''}>${esc(a.institutionName)} · saved</option>`).join('')}${d.campuses.filter(c=>c.enabled).map(c=>`<option value="campus:${esc(c.id)}" data-name="${esc(c.name)}" ${saved.institutionLocation === 'campus:'+c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}<optgroup label="Another school / college · choose locality">${LOCALITIES.filter(l=>l.id!=='vapi-other').map(l=>`<option value="locality:${l.id}" ${saved.institutionLocation === 'locality:'+l.id ? 'selected' : ''}>${esc(l.name)} · ${esc(l.zone)}</option>`).join('')}</optgroup></select></div><div data-school-other><div class="field"><label for="institution-name">School / college / classes name</label><input id="institution-name" name="institutionName" value="${esc(saved.institutionName || '')}" minlength="2" maxlength="120" required></div><div class="field"><label for="school-meeting">Gate / meeting point (optional)</label><input id="school-meeting" name="schoolMeeting" maxlength="100" value="${esc(saved.schoolMeeting || '')}" placeholder="Main gate by default"></div></div>${saved.contactPhone !== undefined ? `<details class="order-more" ${saved.contactPhone ? '' : 'open'}><summary>${saved.contactPhone ? `Delivery phone · ${esc(saved.schoolPhone || saved.contactPhone)} · change` : 'Add delivery phone'}</summary><div class="field"><label for="school-phone">Delivery phone</label><input id="school-phone" name="schoolPhone" type="tel" autocomplete="tel" required maxlength="20" value="${esc(saved.schoolPhone || saved.contactPhone)}"></div></details>` : ''}<p class="field-hint">Handover at the institution’s main gate. No home address or PIN needed. Hostel / room delivery uses Home / office.</p></fieldset>` : ''}
      <p class="route-where">Home / hostel / office</p>
      <label class="pick"><input type="radio" name="deliverySlot" value="express" ${chosen === 'express' ? 'checked' : ''}><span><b>Now · as soon as printing finishes · ₹0</b><small>No delivery charge · within local coverage</small></span></label>
    </div>
    ${Object.values(d.local || {}).some(o=>o.enabled) && d.slots.some(s=>s.enabled) ? `<details class="order-more" data-local-routes ${chosen.startsWith('local-') ? 'open' : ''}><summary>Or a scheduled window · ₹0</summary><p class="field-hint">Home, office or any local address. Orders share a delivery trip; your booked window is honoured even if the batch is small.</p><div class="route-picks">${Object.entries(d.local || {}).filter(([, o]) => o.enabled).map(([zone, o]) => d.slots.filter((s) => s.enabled).map((s) => {
        const plan = deliveryPlan({ settings: { campaign: cfg } }, `local-${zone}-${s.id}`);
        return `<label class="pick"><input type="radio" name="deliverySlot" value="${esc(plan.slotId)}" ${chosen === plan.slotId ? 'checked' : ''}><span><b>${zone === 'vapi' ? 'Vapi' : 'Daman'} scheduled · no extra charge</b><small>${esc(new Date(plan.deliveryStartAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short' }))} · ${esc(s.start)}–${esc(s.end)} · cutoff ${esc(s.cutoff)}</small></span></label>`;
      }).join('')).join('')}</div></details>` : ''}

    ${includeArea ? `<div class="field" data-local-fields><label for="delivery-area">Delivery area</label><select id="delivery-area" name="area">${['Vapi','Daman','Sarigam','Bhilad'].map(area => `<option ${saved.area === area ? 'selected' : ''}>${area}</option>`).join('')}</select></div>` : ''}
    </fieldset>
    <script nonce="${scriptNonce()}">(function(){var choice=document.querySelector('[name="deliverySlot"]');if(!choice)return;var form=choice.form, schoolBlock=form.querySelector('[data-school-fields]'), local=form.querySelector('[data-local-fields]'), address=form.querySelector('[data-address-fields]'), home=form.querySelector('[data-home-details]'), institution=form.elements.institutionLocation;function sync(){address=form.querySelector('[data-address-fields]');var route=form.elements.deliverySlot.value,school=route.indexOf('school')===0;if(schoolBlock){schoolBlock.hidden=!school;schoolBlock.disabled=!school;var other=form.querySelector('[data-school-other]'),known=institution.value.indexOf('campus:')===0||institution.value.indexOf('address:')===0;other.hidden=known;other.querySelectorAll('input').forEach(function(i){i.disabled=known||!school;});if(known)form.elements.institutionName.value=institution.selectedOptions[0].dataset.name;}if(local){local.hidden=school;local.querySelectorAll('input,select').forEach(function(i){i.disabled=school;});}if(home){home.hidden=school;home.querySelectorAll('input,select,textarea').forEach(function(i){i.disabled=school;});}if(address){address.hidden=school;address.querySelectorAll('[name="addressId"]').forEach(function(i){i.disabled=school;});var fresh=address.querySelector('[data-new-address],[data-cart-new-address]');if(fresh){fresh.hidden=school||form.elements.addressId.value!=='__new';fresh.disabled=fresh.hidden;}}form.querySelectorAll('[data-college-routes]').forEach(function(block){block.hidden=!school||route==='school-express';});if(route.indexOf('local-')===0){var area=form.querySelector('[name="area"],[name="nn_area"]');if(area){var next=route.split('-')[1]==='vapi'?'Vapi':'Daman';if(area.value!==next){area.value=next;area.dispatchEvent(new Event('change',{bubbles:true}));}}}}form.addEventListener('change',sync);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',sync,{once:true});else sync();})();</script>`;
}

export function frequentlyAddedAov() {
  const essentials = [
    { id: 'prod-clear-folder', name: 'A4 Transparent Folder', price: 10, icon: '📁', tag: 'Protect prints' },
    { id: 'prod-ball-pen', name: 'Cello Gripper Ball Pen', price: 10, icon: '🖊️', tag: 'Exam & sign ready' },
    { id: 'prod-highlighter', name: 'Neon Study Highlighter', price: 25, icon: '🖍️', tag: 'Key revision' },
    { id: 'prod-binder-clips', name: 'Binder Clips (4-pack)', price: 15, icon: '📎', tag: 'Organize sheets' }
  ];
  return `<section class="order-section pk-aov-section" aria-label="Essential add-ons">
    <div class="pk-aov-head">
      <span class="pk-aov-badge">⚡ Frequently Added</span>
      <h3>Complete your assignment &amp; document kit</h3>
      <p class="field-hint">Essential protection &amp; study stationery delivered in the same parcel</p>
    </div>
    <div class="pk-aov-grid">
      ${essentials.map(item => `
        <article class="pk-aov-card">
          <div class="pk-aov-top">
            <span class="pk-aov-icon" aria-hidden="true">${item.icon}</span>
            <div class="pk-aov-info">
              <span class="pk-aov-tag">${esc(item.tag)}</span>
              <h4>${esc(item.name)}</h4>
            </div>
          </div>
          <div class="pk-aov-bottom">
            <b class="pk-aov-price">₹${item.price}</b>
            <button type="button" class="pk-aov-add-btn" data-aov-add data-product-id="${esc(item.id)}" data-price="${item.price}">+ Add</button>
          </div>
        </article>
      `).join('')}
    </div>
  </section>`;
}

export function optionsStep(user, draft, addresses = [], campaign = campaignDefaults(), pricing, surcharges = {}, error = null, referral = '') {
  const saved = {...(draft.form || draft.selections || draft.defaults || {})}, guest = !user;
  saved.institutionAddresses=addresses.filter(a=>a.institutionName);
  if(!guest)saved.contactPhone=user.phone || '';
  const previousSchool=addresses.find(a=>a.id===saved.addressId && a.institutionName);
  if(!saved.institutionLocation && previousSchool)saved.institutionLocation='address:'+previousSchool.id;
  const homeAddresses = addresses.filter(a => !a.campusId && a.area !== 'Kiosk pickup').sort((a,b)=>Number(!!b.isDefault)-Number(!!a.isDefault));
  const savedAddress = homeAddresses.find(a => a.id === saved.addressId) || homeAddresses.find(a => a.isDefault) || homeAddresses[0] || null;
  const slot = saved.deliverySlot || deliveryChoice(saved);
  const mixed = saved.printType === 'mixed';
  const preview = guest ? `/order/${encodeURIComponent(draft.id)}/preview` : `/customer/orders/new/${encodeURIComponent(draft.id)}/preview.pdf`;
  return layout({ title: 'Your print', user, focused: true, extraHead: DELIVERY_MAP_HEAD + `<link rel="stylesheet" href="/quick.css?v=${ASSET_V}">` + (guest ? '' : `<script src="/store.js?v=${ASSET_V}" defer></script>${surcharges.gateway ? '<script src="https://checkout.razorpay.com/v1/checkout.js" defer></script>' : ''}`), body: `
    ${orderSteps(1)}
    <dialog class="order-preview" aria-label="Document preview"><div><strong>${esc(draft.document)}</strong><button type="button" data-close-preview aria-label="Close preview">×</button></div>${draft.fileType === 'image' ? `<img data-preview-src="${esc(preview)}" alt="Your photo">` : `<iframe title="Your PDF" data-preview-src="${esc(preview)}"></iframe>`}<a href="${esc(preview)}" target="_blank" rel="noopener">Open original file ↗</a></dialog>
    ${error ? `<p class="login-err" role="alert">${esc(String(error).replace(/<[^>]*>/g,''))}</p>` : ''}
    <form class="quick-order" method="POST" action="${guest ? '/order/options' : '/customer/orders/new/confirm'}" ${guest ? '' : 'data-print-payment'}>
      <input type="hidden" name="draft" value="${esc(draft.id)}">
      <div class="pk-checkout-grid">
        <div class="pk-col-main">
          ${guest ? '' : `<div class="qk-strip"><span class="qk-strip-dot" aria-hidden="true"></span><b>Your print desk</b><span>${savedAddress ? `Delivering to ${esc(savedAddress.label || 'Home')}, ${esc(savedAddress.area)} ${esc(savedAddress.pin)}` : 'Add your delivery address to continue'}</span><a href="#delivery" class="qk-strip-change">${savedAddress ? 'CHANGE' : 'ADD'}</a></div>`}
          <div class="order-file"><div><h1>${esc(draft.document)}</h1><p>${draft.pages} ${draft.pages === 1 ? 'page' : 'pages'} · A4</p></div><button class="order-text" type="button" data-open-preview>Preview</button></div>
          <section class="order-section"><h2>Print settings</h2>
            <fieldset class="order-choice"><legend>Colour</legend><div class="chips">${[['bw','B&W'],['color','Colour'],...(draft.pages > 1 && draft.fileType !== 'image' ? [['mixed','Split B&W + colour']] : [])].map(([v,t])=>`<label class="chip-pick"><input type="radio" name="printType" value="${v}" ${saved.printType === v || v === 'bw' && !['color','mixed'].includes(saved.printType) ? 'checked' : ''}>${t}</label>`).join('')}</div></fieldset>
            ${mixedFields(saved,draft.pages,preview)}
            <fieldset class="order-choice"><legend>Sides</legend><div class="chips">${[['single','Single-sided'],['double','Double-sided (front–back)']].map(([v,t])=>`<label class="chip-pick"><input type="radio" name="sides" value="${v}" ${saved.sides === v || v === 'single' && saved.sides !== 'double' ? 'checked' : ''}>${t}</label>`).join('')}</div></fieldset>
            <fieldset class="order-choice"><legend>Paper grade</legend><div class="chips">${[['75gsm','75 GSM Standard Copy'],['100gsm','100 GSM Executive Bond']].map(([v,t])=>`<label class="chip-pick"><input type="radio" name="paperGsm" value="${v}" ${saved.paperGsm === v || v === '75gsm' && saved.paperGsm !== '100gsm' ? 'checked' : ''}>${t}</label>`).join('')}</div></fieldset>
            <fieldset class="order-choice"><legend>Finishing &amp; Binding</legend><p class="order-choice-hint">Professional binding prepared at your local print desk.</p><div class="chips">${[['none','Loose sheets'],['staple','Stapled'],['spiral','Spiral bound'],['wiro','Wiro metal loop'],['hardcover','Hardcover Thesis']].map(([v,t])=>`<label class="chip-pick"><input type="radio" name="binding" value="${v}" ${saved.binding === v || v === 'none' && !['staple','spiral','wiro','hardcover'].includes(saved.binding) ? 'checked' : ''}>${t}</label>`).join('')}</div></fieldset>
            <div class="pk-preflight-alert" id="gutterNotice" ${['spiral','wiro','hardcover'].includes(saved.binding)?'':'style="display:none"'}>
              <span class="pk-alert-badge">📐 Gutter Preflight</span>
              <span><strong>Binding Safety:</strong> Ensure your document has at least a 12–15mm left margin so punch holes do not cut into your text.</span>
            </div>
            <div class="order-copy-row"><label for="copies">Copies</label><div class="order-stepper"><button id="cMinus" type="button" aria-label="Remove one copy">−</button><input id="copies" aria-label="Number of copies" name="copies" type="number" value="${esc(saved.copies || 1)}" min="1" max="200" required><button id="cPlus" type="button" aria-label="Add one copy">+</button></div></div>
            ${draft.previousPrint ? `<button type="button" class="order-text" data-last-print="${esc(JSON.stringify(draft.previousPrint))}">Use last print settings</button>` : ''}
            <details class="order-more" ${mixed || saved.range ? 'open' : ''}><summary>More options &amp; pricing</summary><div class="order-more-body">
              ${draft.fileType === 'image' ? '' : `<div class="field"><label for="range">Pages</label><input id="range" name="range" autocomplete="off" value="${esc(saved.range || '')}" placeholder="All pages — or 1, 3-5"><small>Leave empty for all ${draft.pages} pages.</small></div>`}
              <div class="field"><label for="orientation">Orientation</label><select id="orientation" name="orientation">${['auto','portrait','landscape'].map(v=>`<option value="${v}" ${saved.orientation === v ? 'selected' : ''}>${v === 'auto' ? 'Automatic' : v[0].toUpperCase()+v.slice(1)}</option>`).join('')}</select></div>
              <div class="field"><label for="notes">Special instructions</label><textarea id="notes" name="notes" rows="2" maxlength="300">${esc(saved.notes || '')}</textarea></div>
              <a class="rowlink" href="/printing-prices">All printing prices →</a>
              ${bulkPricingGuide(pricing, true)}
            </div></details>
          </section>
          ${frequentlyAddedAov()}
          ${slabMeter(Math.min(100000, (draft.pages || 0) * (Math.max(1, Number(saved.copies) || 1))), pricing, !!user?.student)}
        </div>
        <aside class="pk-col-side">
          <section class="order-section"><h2 id="delivery">Delivery</h2>${deliverySlotsFields(campaign,pricing,slot,guest,'prints',saved)}
          ${guest ? `<div data-home-details ${String(slot).startsWith('school') ? 'hidden disabled' : ''}><div class="field"><label for="ga">Street address</label><input id="ga" name="address" value="${esc(saved.address || '')}" required autocomplete="street-address" maxlength="200" placeholder="Flat / room, building, street — with the landmark"></div><div class="field"><label for="gp">PIN code</label><input id="gp" name="pin" value="${esc(saved.pin || '')}" required inputmode="numeric" pattern="[0-9]{6}" autocomplete="postal-code" maxlength="6" placeholder="396191"></div>${deliveryPicker(saved.area || 'Vapi', saved.localityId || saved.deliveryLat || saved.deliveryLng ? { localityId: saved.localityId, lat: saved.deliveryLat, lng: saved.deliveryLng } : null)}</div>` : ''}
          ${guest ? '' : `<div data-address-fields data-destination-details>
            <h3 class="address-heading">Deliver to</h3>
            ${savedAddress ? `<div class="qk-address-card" id="qkActiveAddressCard">
              <span class="qk-address-label">SAVED ADDRESS · <span id="qkActiveLabel">${esc(savedAddress.label || 'Home')}${savedAddress.isDefault ? ' · Default' : ''}</span></span>
              <b id="qkActiveContact">${esc(savedAddress.name || user.name || '')}${savedAddress.phone || user.phone ? ' · ' + esc(savedAddress.phone || user.phone) : ''}</b>
              <p id="qkActiveAddressText">${esc(savedAddress.address)}, ${esc(savedAddress.area)} ${esc(savedAddress.pin)}</p>
              <button type="button" class="qk-change" id="qkChangeAddressBtn">CHANGE</button>
            </div>
            <input type="hidden" name="addressId" id="qkSelectedAddressId" value="${esc(savedAddress.id)}">
            <div class="qk-address-drawer" id="qkAddressDrawer" style="display:none">
              <div class="qk-drawer-header">
                <strong>Choose delivery address</strong>
                <button type="button" class="qk-drawer-close" id="qkCloseDrawerBtn" aria-label="Close address selection">✕</button>
              </div>
              <div class="qk-address-list">
                ${homeAddresses.map((a) => `<label class="qk-address-option ${a.id === savedAddress.id ? 'active' : ''}">
                  <input type="radio" name="selectAddressRadio" value="${esc(a.id)}" data-label="${esc(a.label || 'Saved')}${a.isDefault ? ' · Default' : ''}" data-contact="${esc(a.name || user.name || '')}${a.phone || user.phone ? ' · ' + esc(a.phone || user.phone) : ''}" data-text="${esc(a.address)}, ${esc(a.area)} ${esc(a.pin)}" ${a.id === savedAddress.id ? 'checked' : ''}>
                  <div class="qk-opt-body">
                    <span class="qk-opt-label">${esc(a.label || 'Saved')}${a.isDefault ? ' · Default' : ''}</span>
                    <b>${esc(a.name || user.name || '')}${a.phone || user.phone ? ' · ' + esc(a.phone || user.phone) : ''}</b>
                    <p>${esc(a.address)}, ${esc(a.area)} ${esc(a.pin)}</p>
                  </div>
                </label>`).join('')}
              </div>
              <details class="qk-new-addr-details" id="qkNewAddrDetails">
                <summary>+ Add a new delivery address</summary>
                <div class="qk-new-addr-fields">
                  <div class="field"><label for="qk_na_address">Street address</label><input id="qk_na_address" name="nn_address" placeholder="Room/Flat, Street, Landmark" maxlength="200"></div>
                  <div class="grid c2">
                    <div class="field"><label for="qk_na_area">Locality</label><select id="qk_na_area" name="nn_area"><option value="Sarigam">Sarigam</option><option value="Vapi">Vapi</option><option value="Daman">Daman</option><option value="Bhilad">Bhilad</option></select></div>
                    <div class="field"><label for="qk_na_pin">PIN Code</label><input id="qk_na_pin" name="nn_pin" pattern="[0-9]{6}" maxlength="6" placeholder="396155"></div>
                  </div>
                  <div class="field"><label for="qk_na_phone">Phone</label><input id="qk_na_phone" name="nn_phone" type="tel" value="${esc(user.phone || '')}" maxlength="20"></div>
                  <button type="button" class="btn small loud" id="qkSaveNewAddressBtn">Use this address</button>
                </div>
              </details>
            </div>` : `<div class="qk-address-card"><span class="qk-address-label">DELIVERY ADDRESS</span><b>Add your delivery address</b><div class="qk-new-addr-fields" style="margin-top:10px"><input type="hidden" name="addressId" value="__new"><div class="field"><label for="new_street">Street address</label><input id="new_street" name="nn_address" required placeholder="Room/Flat, Street, Landmark" maxlength="200"></div><div class="grid c2"><div class="field"><label for="new_area">Locality</label><select id="new_area" name="nn_area"><option value="Sarigam">Sarigam</option><option value="Vapi">Vapi</option><option value="Daman">Daman</option><option value="Bhilad">Bhilad</option></select></div><div class="field"><label for="new_pin">PIN Code</label><input id="new_pin" name="nn_pin" required pattern="[0-9]{6}" maxlength="6" placeholder="396155"></div></div><div class="field"><label for="new_phone">Contact phone</label><input id="new_phone" name="nn_phone" type="tel" value="${esc(user.phone || '')}" required maxlength="20"></div></div></div>`}
            <p class="field-hint">Delivering to your selected address. No need to visit your account page.</p>
          </div>`}
          </section>
          ${guest ? `<section class="order-section"><h2>Your details</h2><div class="grid c2"><div class="field"><label for="gn">Name</label><input id="gn" name="name" value="${esc(saved.name || '')}" autocomplete="name" required maxlength="60" placeholder="Full name"></div><div class="field"><label for="gh">Contact phone</label><input id="gh" name="phone" type="tel" value="${esc(saved.phone || '')}" required autocomplete="tel" inputmode="tel" maxlength="20" placeholder="10-digit mobile"></div></div><div class="field"><label for="ge">Email</label><input id="ge" name="email" type="email" value="${esc(saved.email || '')}" required autocomplete="email" maxlength="120" placeholder="you@example.com" aria-describedby="ge-hint"></div><p class="field-hint" id="ge-hint">We email a 6-digit code to set up your account. Payment happens after — the total is already shown below.</p><input type="hidden" name="referral" value="${esc(String(saved.referral || referral || '').slice(0, 12))}"></section>` : ''}
          ${guest ? '' : `<input type="hidden" name="checkout" value="1"><input type="hidden" name="expectedTotal" value=""><section class="order-section"><h2>Payment</h2><fieldset class="order-choice"><legend class="sr-only">Pay with</legend>${surcharges.gateway ? '<label class="pick"><input type="radio" name="paymentMethod" value="online" checked><span>Pay directly · UPI / cards<small>No wallet top-up needed · Razorpay</small></span></label>' : ''}<label class="pick"><input type="radio" name="paymentMethod" value="wallet" ${surcharges.gateway ? '' : 'checked'}><span>Use wallet balance<small>${rs(surcharges.balance || 0)} available · no extra payment fee</small></span></label></fieldset><details class="order-more"><summary>Coupon / referral</summary><div class="field"><label for="coupon">Coupon</label><input id="coupon" name="coupon" maxlength="40"></div><div class="field"><label for="referral">Referral code</label><input id="referral" name="referral" maxlength="12"></div><small>Any code saving is confirmed here before payment.</small></details></section><p role="alert" data-payment-error hidden></p>`}
          <p class="login-err" id="range-err" role="alert" hidden></p>
          ${printQuote(pricing,draft,campaign,!!user?.student,surcharges)}
          <div class="pk-checkout-trust"><span>${icon('check')} Exact total before payment</span><span>${icon('users')} School &amp; college delivery ₹5</span></div>
          ${guest ? '' : '<div class="pk-aux-links"><button class="order-text" type="submit" name="next" value="wallet" formnovalidate>Optional wallet top-up offers →</button><button class="order-text order-add" type="submit" name="next" value="add" formnovalidate>+ Add another document</button></div>'}
        </aside>
      </div>
    </form>` });
}

export function summaryStep(user, draft, s, q, packCover = null, ref = { code: '', error: null }, checkout = {}) {
  const edit = `/customer/orders/new?draft=${encodeURIComponent(draft.id)}`;
  return layout({ title: 'Confirm & pay', user, focused: true, back: edit, extraHead: `<link rel="stylesheet" href="/quick.css?v=${ASSET_V}"><script src="/store.js?v=${ASSET_V}" defer></script>${checkout.gateway ? '<script src="https://checkout.razorpay.com/v1/checkout.js" defer></script>' : ''}`, body: `
    <h1>Confirm &amp; pay.</h1><p class="field-hint">Fulfilled by ${esc(checkout.fulfillmentName || 'PrintKarr print desk')}. Your prints and stationery arrive together.</p>
    <section class="order-section"><div class="order-file"><div><h2>${esc(draft.document)}</h2><p>${s.effPages} pages · ${esc(printDescription(s))} · ${s.sides === 'double' ? 'Double' : 'Single'}-sided · ${s.copies} ${s.copies === 1 ? 'copy' : 'copies'}</p></div><a class="order-text" href="${edit}">Edit</a></div>
    ${(checkout.prints || []).map(o=>`<p class="order-added-file">${esc(o.document)} · ${rs(o.net)}</p>`).join('')}${(checkout.items || []).map(i=>`<p class="order-added-file">${esc(i.name)} · ${i.quantity} × ${rs(i.price)}</p>`).join('')}
    <div class="order-line"><div><h2>Delivery</h2><p>${esc(s.campusId ? s.slot : (checkout.address?.address || s.zoneLabel)+' · '+s.slot)}</p></div><a class="order-text" href="${edit}#delivery">Change</a></div>
    ${user.phone ? `<p class="order-contact">${esc(user.name)} · ${esc(user.phone)}</p>` : ''}
    </section>
    <form method="GET" action="/customer/orders/new/summary" data-inline-order><input type="hidden" name="draft" value="${esc(draft.id)}"><details class="order-more" ${ref.error || ref.code || checkout.coupon ? 'open' : ''}><summary>Coupon / referral</summary>${packCover ? '' : `<div class="field"><label for="coupon">Coupon</label><input id="coupon" name="coupon" value="${esc(checkout.coupon || '')}" maxlength="40"></div>`}<div class="field"><label for="referral">Referral code</label><input id="referral" name="referral" value="${esc(ref.code || '')}" maxlength="12"></div>${ref.error ? `<p class="login-err" role="alert">${esc(ref.error)}</p>` : ''}<button class="btn ghost" type="submit">Apply code</button></details></form>
    <section class="order-section order-totals"><div class="sumrow"><span>Printing${checkout.items?.length ? ' & stationery' : ''}</span><span>${rs(q.subtotal + (q.studentDiscount || 0) + (q.bulkDiscount || 0))}</span></div>${q.studentDiscount ? `<div class="sumrow"><span>Student discount</span><span>−${rs(q.studentDiscount)}</span></div>` : ''}${q.bulkDiscount ? `<div class="sumrow"><span>Print savings</span><span>−${rs(q.bulkDiscount)}</span></div>` : ''}${q.packDiscount ? `<div class="sumrow"><span>Semester pack</span><span>−${rs(q.packDiscount)}</span></div>` : ''}${q.firstPrintDiscount ? `<div class="sumrow"><span>First print offer</span><span>−${rs(q.firstPrintDiscount)}</span></div>` : ''}${q.couponDiscount ? `<div class="sumrow"><span>Coupon</span><span>−${rs(q.couponDiscount)}</span></div>` : ''}${ref.discount ? `<div class="sumrow"><span>Referral</span><span>−${rs(ref.discount)}</span></div>` : ''}${q.processingFee ? `<div class="sumrow"><span>Processing</span><span>${rs(q.processingFee)}</span></div>` : ''}<div class="sumrow"><span>Delivery</span><span>${q.deliveryFee ? rs(q.deliveryFee) : 'FREE'}</span></div>${q.lateNightFee ? `<div class="sumrow"><span>Late-night delivery</span><span>${rs(q.lateNightFee)}</span></div>` : ''}${q.surgeFee ? `<div class="sumrow"><span>Demand fee</span><span>${rs(q.surgeFee)}</span></div>` : ''}<div class="sumrow total"><span>Total</span><span>${rs(q.total)}</span></div></section>
    <form method="POST" action="/customer/orders/new/place" data-print-payment><input type="hidden" name="draft" value="${esc(draft.id)}"><input type="hidden" name="checkout" value="1"><input type="hidden" name="expectedTotal" value="${esc(q.total)}"><input type="hidden" name="coupon" value="${esc(checkout.coupon || '')}"><input type="hidden" name="referral" value="${esc(ref.code || '')}">
      <fieldset class="order-choice"><legend>Pay with</legend>${checkout.gateway && q.total>0 ? '<label class="pick"><input type="radio" name="paymentMethod" value="online" checked>Pay directly · UPI / cards · no wallet top-up needed</label>' : ''}${checkout.balance>=q.total ? `<label class="pick"><input type="radio" name="paymentMethod" value="wallet" ${checkout.gateway && q.total>0 ? '' : 'checked'}>Wallet · ${rs(checkout.balance)} available · no extra payment fee</label>` : ''}</fieldset>
      <p class="field-hint">Pay with your wallet or Razorpay. The displayed total applies to both.</p><button class="order-text" type="submit" name="next" value="wallet" formnovalidate>View wallet top-up offers →</button>${feeExplanation}
      <p role="alert" data-payment-error hidden></p><div class="order-continue"><span data-payment-total data-online-total="${q.total}">${rs(q.total)}<small>Wallet / Razorpay total</small></span><button class="btn loud big" type="submit" ${ref.error ? 'disabled' : ''}>Continue to payment →</button></div>
      <button class="order-text order-add" type="submit" name="next" value="add" formnovalidate>+ Add another document</button>
    </form>` });
}

export function payStep(user, order, opts = {}) {
  const testPrintsLeft = Number(opts.testPrintsLeft) || 0;
  const walletReady = Number(user.walletBalance || 0) >= order.total;
  const suggested = (opts.offers || []).filter((o) => !o.memberDays && Number(user.walletBalance || 0) + o.amount + o.bonus >= order.total).sort((a, b) => a.amount - b.amount)[0];
  const printSubtotal = Math.max(0, Number(order.subtotal ?? (Number(order.total || 0) - Number(order.deliveryFee || 0) - Number(order.lateNightFee || 0) - Number(order.surgeFee || 0) + Number(order.couponDiscount || 0) + Number(order.referralDiscount || 0) + Number(order.packDiscount || 0))) + Number(order.discount || 0));
  const rzp = opts.razorpay
    ? `<label class="pick"><input type="radio" name="method" value="razorpay" ${walletReady ? '' : 'checked'}> Pay directly · UPI / Card · no wallet top-up needed</label>`
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
    ${testPrintsLeft ? `<form method="POST" action="/customer/orders/${order.id}/demo-pay" style="margin-top:10px"><button class="btn ghost" type="submit" style="width:100%;border-style:dashed"><span>◆ Use test print credit — no charge</span></button></form><p class="muted mono" style="font-size:11px;margin-top:6px">${testPrintsLeft} test print${testPrintsLeft === 1 ? '' : 's'} left. Up to five sheets. Test prints are excluded from sales.</p>` : ''}
    ${wa}
    ${opts.razorpay ? `
    <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
    <script nonce="${scriptNonce()}">
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
  const ladder = `${offers.length ? '<h2 class="h-sec">Choose a wallet offer</h2>' : ''}<div class="grid c2 wallet-offers" style="margin:16px 0">${offers.map((o) => `<article class="card"><p class="eyebrow">${esc(o.name)}</p><p class="offer-value">${rs(o.amount + o.bonus)}<small>wallet balance · pay ${rs(o.amount)}</small></p>${o.freeFiles ? `<p><strong>+ ${o.freeFiles} free paper/cardboard files</strong></p><p class="field-hint">Orange, green, red or yellow. Choose your colour after a successful top-up. All ${rs(o.amount)} stays in your wallet.</p>` : ''}${o.freeFirstBatch ? '<p class="field-hint">School / college delivery ₹5 flat.</p>' : ''}${o.memberDays ? `<p class="field-hint">${o.memberDays}-day membership.</p>` : ''}<p class="field-hint">Bonus ${(o.validityDays ?? opts.campaign?.bonusValidityDays) ? 'valid for '+esc(o.validityDays ?? opts.campaign?.bonusValidityDays)+' days' : 'has no expiry'}. Non-withdrawable; usable on orders.${o.firstOnly ? ' First top-up only.' : ''}${o.endsOn ? ' Offer ends '+esc(o.endsOn)+' (IST).' : ''}</p><button class="btn sun" type="button" data-offer="${esc(o.id)}" data-amount="${o.amount}" ${!rzpOn && livePay ? 'disabled' : ''}><span>Choose offer</span></button></article>`).join('')}</div>`;
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
    ${Date.parse(wallet.memberUntil) > Date.now() ? `<p class="pick">Semester Pass active until ${esc(new Date(wallet.memberUntil).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }))}.</p>` : ''}
    ${opts.returnPurchase ? `<div class="wallet-checkout-note"><b>Your checkout is saved.</b><p>Top up, then return to review and pay. All payment methods have the same total.</p><a class="rowlink" href="/customer/purchases/${encodeURIComponent(opts.returnPurchase)}">Return to checkout →</a></div>` : ''}${opts.returnOrder ? `<div class="wallet-checkout-note"><b>Your print order is saved.</b><p>Top up here, then return to review and pay for order #${esc(opts.returnOrder)}.</p><a class="rowlink" href="/customer/orders/${encodeURIComponent(opts.returnOrder)}/pay">Return to checkout →</a></div>` : ''}

    ${opts.cash > 0 ? `<a class="card promo rv" href="/customer/referrals" style="text-decoration:none;display:block;margin-top:12px"><p class="eyebrow">Previous cash earnings</p><div class="stat"><div class="v">${rs(opts.cash)}<em> cash</em></div><div class="k">View withdrawal options →</div></div></a>` : ''}
    ${ladder}
    ${fileGifts ? `<section id="free-files"><h2 class="h-sec">Your free files</h2><div class="grid c2">${fileGifts}</div></section>` : ''}
    <script nonce="${scriptNonce()}">
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
    <script nonce="${scriptNonce()}">
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
      <section class="card" id="privacy-data"><h2>Data &amp; privacy</h2>
        <p class="muted">Under India's DPDP Act and privacy regulations, you have full control over your personal data.</p>
        <div style="display:flex;gap:12px;flex-wrap:wrap;margin:16px 0">
          <a class="btn ghost" href="/customer/data/export" download><span>Download my data (JSON)</span></a>
        </div>
        <details class="account-delete" style="margin-top:16px">
          <summary class="rowlink" style="color:#b91c1c">Delete account &amp; wipe data</summary>
          <form method="POST" action="/customer/data/delete" style="margin-top:12px;padding:16px;background:#fef2f2;border:1px solid #fecaca;border-radius:12px">
            <p style="font-size:13px;color:#991b1b;margin-bottom:12px">This action permanently anonymizes your account, removes saved addresses, and schedules all uploaded files for deletion. Active in-progress orders cannot be deleted.</p>
            <label class="pick" style="display:flex;align-items:center;gap:8px;font-size:13px;color:#7f1d1d"><input type="checkbox" name="confirmDelete" value="1" required> I understand this action is permanent and cannot be undone.</label>
            <button class="btn loud" type="submit" style="background:#dc2626;border-color:#dc2626;color:#fff;margin-top:12px"><span>Permanently delete account</span></button>
          </form>
        </details>
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
