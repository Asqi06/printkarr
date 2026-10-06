import { printPlan } from './print-plan.js';

function initPrintOptions() {
for (const quote of document.querySelectorAll('[data-print-quote]')) {
  if (quote.dataset.ready) continue; quote.dataset.ready='1';
  const form = quote.closest('form'), cfg = JSON.parse(quote.dataset.pricing), pages = Number(quote.dataset.pages);
  const names = ['printType','copies','sides','range','mixedPageType','mixedRange','orientation','binding','notes'];
  const key = 'pk-print-draft:' + form.elements.draft.value;
  const get = name => form.elements[name]?.value || '';
  try {
    const saved = JSON.parse(sessionStorage.getItem(key) || 'null');
    if (saved) for (const name of names) if (form.elements[name] && typeof saved[name] === 'string') form.elements[name].value = saved[name];
  } catch {}
  function update() {
    const input = Object.fromEntries(names.map(name => [name, get(name)]));
    const mixed = get('printType') === 'mixed';
    form.querySelector('[data-mixed-fields]').hidden = !mixed;
    form.elements.mixedRange.required = mixed;
    if(mixed)form.elements.mixedRange.closest('details').open=true;
    form.querySelector('#mixed-rule').textContent = 'All other selected pages print in ' + (get('mixedPageType') === 'bw' ? 'colour.' : 'B&W.');
    for (const name of ['copies','range','mixedRange']) form.elements[name]?.setCustomValidity('');
    const hint = form.querySelector('#range-err');
    try {
      const plan = printPlan(input, pages), printing = Math.round((plan.bwPages * cfg.bw + plan.colorPages * cfg.color) * plan.copies * 100) / 100;
      hint.hidden = true;
      form.querySelector('[data-print-assignment]').textContent = `${plan.bwPages * plan.copies} B&W + ${plan.colorPages * plan.copies} colour pages · printing ₹${printing.toLocaleString('en-IN')}`;
      const slot = get('deliverySlot') || 'express', scheduled = slot.startsWith('local-');
      const address = form.querySelector('[name="addressId"]:checked');
      const zone = (scheduled ? slot.split('-')[1] : address && address.value !== '__new' ? address.dataset.area : get('area') || get('nn_area') || 'Vapi').toLowerCase();
      const delivery = slot === 'pickup' ? 0 : slot.startsWith('school') ? slot === 'school-express' ? 25 : 10 : slot === 'college' ? 3 : slot === 'college-express' ? 25 : scheduled ? cfg.local[zone]?.fee : cfg.fees[zone];
      const late = slot === 'express' ? Number(cfg.lateNightFee || 0) : 0, surge = Number(cfg.surgeFee || 0);
      const pack = (cfg.packs || []).some(p => p.bw >= plan.bwPages * plan.copies && p.color >= plan.colorPages * plan.copies);
      const discount = pack ? printing : Math.min(printing, Math.min(Number(cfg.firstPrintPages || 0),plan.bwPages*plan.copies)*cfg.bw);
      const net = Math.round((printing-discount)*100)/100;
      const variable = zone === 'vapi' && !slot.startsWith('school'), free = scheduled && net + Number(cfg.otherSubtotal || 0) >= 149;
      const fee = free ? 0 : slot.startsWith('school') && slot !== 'school-express' ? cfg.campusFee ?? 10 : delivery;
      const total = Math.round((net + Number(cfg.otherSubtotal || 0) + Number(fee || 0) + late + surge)*100)/100;
      quote.querySelector('span').textContent = variable || cfg.guest ? 'Estimated total · confirmed before payment' : 'Total';
      quote.querySelector('b').textContent = '₹'+total.toLocaleString('en-IN');
      quote.querySelector('button').textContent = 'Continue · ₹'+total.toLocaleString('en-IN')+' →';
      form.querySelector('[data-print-cost]').textContent = '₹'+net.toLocaleString('en-IN')+(pack ? ' · pack' : discount ? ' · offer applied' : '');
      form.querySelector('[data-delivery-cost]').textContent = fee === 0 ? 'FREE' : variable ? scheduled ? '₹10–₹25 · distance estimate' : '₹15–₹50 · distance estimate' : Number.isFinite(fee) ? '₹'+fee : 'Confirmed at checkout';
    } catch (error) {
      hint.textContent = error.message; hint.hidden = false;
      const field = /cop/.test(error.message) ? form.elements.copies : /Mixed|mixed/.test(error.message) ? form.elements.mixedRange : form.elements.range || form.elements.mixedRange;
      field.setCustomValidity(error.message);
      quote.querySelector('b').textContent = 'Check print settings';
      form.querySelector('[data-print-assignment]').textContent = '';
    }
    try { sessionStorage.setItem(key, JSON.stringify(input)); } catch {}
  }
  form.querySelector('[data-last-print]')?.addEventListener('click',event=>{const previous=JSON.parse(event.currentTarget.dataset.lastPrint);for(const [name,value] of Object.entries(previous))if(form.elements[name])form.elements[name].value=value;update();});
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
