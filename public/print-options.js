import { printPricing, processingFee, collegeDeliveryFee } from './print-pricing.js?v=20261008-cash-bulk';
import { kmBetween, distanceFee } from './localities.js?v=20261007-split-print';
import { printPlan, packCovers, pageRange, compactRange } from './print-plan.js?v=20261007-split-print';

function initPrintOptions() {
for (const quote of document.querySelectorAll('[data-print-quote]')) {
  if (quote.dataset.ready) continue; quote.dataset.ready='1';
  const form = quote.closest('form'), cfg = JSON.parse(quote.dataset.pricing), pages = Number(quote.dataset.pages);
  const names = ['printType','copies','sides','range','mixedPageType','mixedRange','splitMixed','orientation','binding','notes'];
  const key = 'pk-print-draft:v2:' + form.elements.draft.value;
  const get = name => form.elements[name]?.value || '';
  try {
    const saved = JSON.parse(sessionStorage.getItem(key) || 'null');
    if (saved) for (const name of names) if (form.elements[name] && typeof saved[name] === 'string') form.elements[name].value = saved[name];
  } catch {}
  function update() {
    const input = Object.fromEntries(names.map(name => [name, get(name)]));
    const mixed = get('printType') === 'mixed';
    form.querySelector('[data-mixed-fields]').hidden = !mixed;
    form.elements.mixedPageType.value = input.mixedPageType = 'color';
    form.elements.mixedRange.required = mixed;
    form.elements.splitMixed.disabled = !mixed;
    for (const name of ['copies','range','mixedRange']) form.elements[name]?.setCustomValidity('');
    try {
      const picked=new Set(get('mixedRange').trim() ? pageRange(get('mixedRange'),pages) : []), allowed=new Set(pageRange(get('range'),pages));
      for (const button of form.querySelectorAll('[data-colour-page]')) { button.setAttribute('aria-pressed',String(picked.has(Number(button.dataset.colourPage)))); button.disabled=!allowed.has(Number(button.dataset.colourPage)); }
    } catch {}
    const hint = form.querySelector('#range-err');
    try {
      const plan = printPlan(input, pages), printedSides=plan.effPages*plan.copies+Number(cfg.otherPrintedSides || 0);
      const printing=printPricing({bw:plan.bwPages*plan.copies,color:plan.colorPages*plan.copies},{bw:cfg.bw,color:cfg.color},false,printedSides).subtotal, processFee=processingFee(printedSides);
      form.querySelector('[data-processing-cost]').textContent='₹'+processFee;
      hint.hidden = true;
      form.querySelector('[data-bw-pages]').textContent = `${plan.bwPages} pages · ${plan.bwRange || 'none'}`;
      form.querySelector('[data-colour-pages]').textContent = `${plan.colorPages} pages · ${plan.colorRange || 'none'}`;
      for (const link of form.querySelectorAll('[data-split-download]')) {
        link.hidden = !mixed; link.href = form.querySelector('[data-mixed-fields]').dataset.splitPreview.replace(/\/preview(?:\.pdf)?$/, '/split/'+link.dataset.splitDownload+'.pdf')+'?'+new URLSearchParams({mixedRange:plan.colorRange,range:plan.range || ''});
      }
      form.querySelector('[data-print-assignment]').textContent = `${plan.bwPages * plan.copies} B&W + ${plan.colorPages * plan.copies} colour pages · printing ₹${printing.toLocaleString('en-IN')}`;
      const slot = get('deliverySlot') || 'express', scheduled = slot.startsWith('local-');
      const address = form.querySelector('[name="addressId"]:checked');
      const zone = (scheduled ? slot.split('-')[1] : address && address.value !== '__new' ? address.dataset.area : get('area') || get('nn_area') || 'Vapi').toLowerCase();
      let delivery = slot === 'pickup' ? 0 : slot.startsWith('school') ? slot === 'school-express' ? 25 : collegeDeliveryFee(printedSides) : slot === 'college' ? Math.min(cfg.campusFee ?? 3,collegeDeliveryFee(printedSides)) : slot === 'college-express' ? 25 : scheduled ? cfg.local[zone]?.fee : cfg.fees[zone];
      const locality=form.elements.localityId?.selectedOptions[0];
      const lat=Number(address && address.value!=='__new' ? address.dataset.lat : get('deliveryLat') || locality?.dataset.lat);
      const lng=Number(address && address.value!=='__new' ? address.dataset.lng : get('deliveryLng') || locality?.dataset.lng);
      if(zone==='vapi' && !slot.startsWith('school') && lat && lng) delivery=distanceFee(kmBetween({lat:20.389722,lng:72.889945},{lat,lng})*1.25,scheduled);
      const late = slot === 'express' ? Number(cfg.lateNightFee || 0) : 0, surge = Number(cfg.surgeFee || 0);
      const pack = (cfg.packs || []).some(p => packCovers(p, {bw:plan.bwPages * plan.copies,color:plan.colorPages * plan.copies}));
      const discount = pack ? printing : Math.min(printing, Math.min(Number(cfg.firstPrintPages || 0),plan.bwPages*plan.copies)*cfg.bw);
      const net = Math.round((printing-discount)*100)/100;
      const variable = zone === 'vapi' && !slot.startsWith('school'), free = scheduled && net + Number(cfg.otherSubtotal || 0) >= 149;
      const fee = free ? 0 : slot.startsWith('school') && slot !== 'school-express' ? Math.min(cfg.campusFee ?? 10,delivery) : delivery;
      const total = Math.round((net + Number(cfg.otherSubtotal || 0) + processFee + Number(fee || 0) + late + surge)*100)/100;
      quote.querySelector('span').textContent = variable || cfg.guest || cfg.otherPrintedSides ? 'Estimate · final before payment' : 'Total';
      quote.querySelector('b').textContent = '₹'+total.toLocaleString('en-IN');
      quote.querySelector('button').textContent = 'Continue · ₹'+total.toLocaleString('en-IN')+' →';
      form.querySelector('[data-print-cost]').textContent = '₹'+net.toLocaleString('en-IN')+(pack ? ' · pack' : discount ? ' · offer applied' : '');
      form.querySelector('[data-delivery-cost]').textContent = fee === 0 ? 'FREE' : variable ? scheduled ? Number.isFinite(delivery) && lat && lng ? '₹'+delivery+' · estimate' : '₹10–₹25 · estimate' : Number.isFinite(delivery) && lat && lng ? '₹'+delivery+' · estimate' : '₹15–₹50 · estimate' : Number.isFinite(fee) ? '₹'+fee : 'Confirmed at checkout';
    } catch (error) {
      hint.textContent = error.message; hint.hidden = false;
      let field = mixed ? form.elements.mixedRange : form.elements.range || form.elements.mixedRange;
      try { pageRange(get('range'),pages); } catch { field = form.elements.range || field; }
      if (/cop/i.test(error.message)) field = form.elements.copies;
      field.setCustomValidity(error.message);
      quote.querySelector('b').textContent = 'Check print settings';
      form.querySelector('[data-print-assignment]').textContent = '';
      for (const link of form.querySelectorAll('[data-split-download]')) link.hidden=true;
      form.querySelector('[data-bw-pages]').textContent = 'Shown after valid colour pages are selected';
      form.querySelector('[data-colour-pages]').textContent = 'Check the colour page numbers above';
    }
    try { sessionStorage.setItem(key, JSON.stringify(input)); } catch {}
  }
  form.querySelector('[data-last-print]')?.addEventListener('click',event=>{const previous=JSON.parse(event.currentTarget.dataset.lastPrint);for(const [name,value] of Object.entries(previous))if(form.elements[name])form.elements[name].value=value;update();});
  form.querySelector('[data-mixed-fields]').addEventListener('click',event=>{
    const button=event.target.closest('[data-colour-page]'); if(!button)return;
    let picked; try { picked=new Set(get('mixedRange').trim() ? pageRange(get('mixedRange'),pages) : []); } catch { picked=new Set(); }
    const page=Number(button.dataset.colourPage); picked.has(page) ? picked.delete(page) : picked.add(page);
    form.elements.mixedRange.value=compactRange([...picked].sort((a,b)=>a-b)); update();
  });
  form.addEventListener('input', update); form.addEventListener('change', update);
  form.addEventListener('invalid', event => { const details = event.target.closest('details'); if (details) details.open = true; }, true);
  const area = form.elements.area;
  if (area && form.dataset.area) area.value = form.dataset.area;
  for (const id of ['cMinus','cPlus']) form.querySelector('#'+id)?.addEventListener('click', () => { form.elements.copies.value = Math.max(1, Math.min(200, Number(get('copies')) + (id === 'cMinus' ? -1 : 1))); update(); });
  update();
}

}
initPrintOptions();
document.addEventListener('print-screen',initPrintOptions);
