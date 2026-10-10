import { printPricing, processingFee, collegeDeliveryFee, COD_FEE } from './print-pricing.js?v=20261010-checkout-refresh';
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
      let printing=printPricing({bw:plan.bwPages*plan.copies,color:plan.colorPages*plan.copies},{bw:cfg.bw,color:cfg.color,printOffers:cfg.printOffers},false,printedSides,{bw:plan.bwPages*plan.copies+Number(cfg.otherPrintCounts?.bw || 0),color:plan.colorPages*plan.copies+Number(cfg.otherPrintCounts?.color || 0)}).subtotal;
      const processFee=processingFee(printedSides), basketCounts={bw:plan.bwPages*plan.copies+Number(cfg.otherPrintCounts?.bw || 0),color:plan.colorPages*plan.copies+Number(cfg.otherPrintCounts?.color || 0)};
      let otherSubtotal=Number(cfg.otherSubtotal || 0);
      if (cfg.otherPrints?.length) {
        let cumulative={bw:0,color:0}, previous=0; otherSubtotal=Number(cfg.otherItemsSubtotal || 0);
        for (const p of cfg.otherPrints) {
          cumulative={bw:cumulative.bw+p.counts.bw,color:cumulative.color+p.counts.color};
          const running=printPricing(cumulative,cfg,false,printedSides,basketCounts).subtotal, sub=Math.round((running-previous)*100)/100;previous=running;
          otherSubtotal+=p.pack ? 0 : Math.max(0,sub-p.firstPrintDiscount-p.couponDiscount);
        }
        printing=Math.round((printPricing(basketCounts,cfg,false,printedSides,basketCounts).subtotal-previous)*100)/100;
        otherSubtotal=Math.round(otherSubtotal*100)/100;
      }
      const processLine=form.querySelector('[data-processing-cost]');if(processLine){processLine.textContent='₹'+processFee;processLine.closest('div').hidden=!processFee;}
      hint.hidden = true;
      form.querySelector('[data-bw-pages]').textContent = `${plan.bwPages} pages · ${plan.bwRange || 'none'}`;
      form.querySelector('[data-colour-pages]').textContent = `${plan.colorPages} pages · ${plan.colorRange || 'none'}`;
      for (const link of form.querySelectorAll('[data-split-download]')) {
        link.hidden = !mixed; link.href = form.querySelector('[data-mixed-fields]').dataset.splitPreview.replace(/\/preview(?:\.pdf)?$/, '/split/'+link.dataset.splitDownload+'.pdf')+'?'+new URLSearchParams({mixedRange:plan.colorRange,range:plan.range || ''});
      }
      form.querySelector('[data-print-assignment]').textContent = `${plan.bwPages * plan.copies} B&W + ${plan.colorPages * plan.copies} colour pages · printing ₹${printing.toLocaleString('en-IN')}`;
      const slot = get('deliverySlot') || 'express';
      const delivery = slot.startsWith('school') || slot.startsWith('college') ? collegeDeliveryFee(printedSides) : 0;
      const late = 0, surge = 0;
      const pack = (cfg.packs || []).some(p => packCovers(p, {bw:plan.bwPages * plan.copies,color:plan.colorPages * plan.copies}));
      const discount = pack ? printing : Math.min(printing, Math.min(Number(cfg.firstPrintPages || 0),plan.bwPages*plan.copies)*cfg.bw);
      const net = Math.round((printing-discount)*100)/100;
      const fee = delivery;
      let total = Math.round((net + otherSubtotal + processFee + Number(fee || 0) + late + surge)*100)/100;
      if(form.dataset.reviewedTotal)total=Number(form.dataset.reviewedTotal);
      if(form.elements.expectedTotal)form.elements.expectedTotal.value=total;
      const cash=get('paymentMethod')==='cod', due=total+(cash ? COD_FEE : 0);
      const wallet=form.querySelector('[name="paymentMethod"][value="wallet"]');
      if(wallet)wallet.disabled=Number(cfg.balance || 0)<total;
      if(wallet?.checked && wallet.disabled){const available=form.querySelector('[name="paymentMethod"][value="online"]') || form.querySelector('[name="paymentMethod"][value="cod"]');available.checked=true;update();return;}
      for(const [selector,cost] of [['[data-other-cost]',otherSubtotal],['[data-night-cost]',late],['[data-demand-cost]',surge]]){const line=form.querySelector(selector);if(line){line.textContent='₹'+cost.toLocaleString('en-IN');line.closest('div').hidden=!cost;}}
      const final=form.querySelector('[data-final-review]');if(final){final.querySelector('[data-final-cod]')?.remove();final.querySelector('.total span:last-child').textContent='₹'+due.toLocaleString('en-IN');}
      const feeLine=form.querySelector('[data-cod-cost]');if(feeLine){feeLine.closest('div').hidden=!cash || !COD_FEE;feeLine.textContent='₹'+COD_FEE;}
      const consent=form.querySelector('[data-cash-consent]');if(consent){consent.hidden=!cash;consent.querySelector('input').disabled=!cash;consent.querySelector('input').required=cash;consent.querySelector('[data-cash-due]').textContent='₹'+due.toLocaleString('en-IN');}
      quote.querySelector('span').textContent = form.dataset.reviewedTotal ? cash ? 'Cash total · final' : 'Final total' : cfg.guest || cfg.otherPrintedSides ? 'Estimate · checked before payment' : cash ? 'Cash total' : 'Total';
      quote.querySelector('b').textContent = '₹'+due.toLocaleString('en-IN');
      quote.querySelector('button').textContent = (cfg.guest ? 'Continue' : cash ? 'Confirm cash order' : get('paymentMethod')==='wallet' ? 'Pay with wallet' : 'Pay online')+' →';
      form.querySelector('[data-print-cost]').textContent = '₹'+net.toLocaleString('en-IN')+(pack ? ' · pack' : discount ? ' · offer applied' : '');
      form.querySelector('[data-delivery-cost]').textContent = fee === 0 ? 'FREE' : '₹'+fee;
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
  form.querySelector('[data-last-print]')?.addEventListener('click',event=>{const previous=JSON.parse(event.currentTarget.dataset.lastPrint);for(const [name,value] of Object.entries(previous))if(form.elements[name])form.elements[name].value=value;form.dispatchEvent(new Event('input',{bubbles:true}));});
  form.querySelector('[data-mixed-fields]').addEventListener('click',event=>{
    const button=event.target.closest('[data-colour-page]'); if(!button)return;
    let picked; try { picked=new Set(get('mixedRange').trim() ? pageRange(get('mixedRange'),pages) : []); } catch { picked=new Set(); }
    const page=Number(button.dataset.colourPage); picked.has(page) ? picked.delete(page) : picked.add(page);
    form.elements.mixedRange.value=compactRange([...picked].sort((a,b)=>a-b)); form.dispatchEvent(new Event('input',{bubbles:true}));
  });
  const clearReview=event=>{if(['paymentMethod','confirmCash'].includes(event.target.name))return;delete form.dataset.reviewedTotal;form.querySelector('[data-final-review]')?.remove();form.querySelector('[data-print-breakdown]').hidden=false;if(form.querySelector('[data-cash-consent] input'))form.querySelector('[data-cash-consent] input').checked=false;};
  form.addEventListener('input',clearReview,true);form.addEventListener('change',clearReview,true);
  form.addEventListener('input', update); form.addEventListener('change', update);
  form.addEventListener('invalid', event => { const details = event.target.closest('details'); if (details) details.open = true; }, true);
  const area = form.elements.area;
  if (area && form.dataset.area) area.value = form.dataset.area;
  for (const id of ['cMinus','cPlus']) form.querySelector('#'+id)?.addEventListener('click', () => { form.elements.copies.value = Math.max(1, Math.min(200, Number(get('copies')) + (id === 'cMinus' ? -1 : 1))); form.dispatchEvent(new Event('input',{bubbles:true})); });
  update();
}

}
initPrintOptions();
document.addEventListener('print-screen',initPrintOptions);
