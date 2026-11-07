import { printPricing, processingFee, collegeDeliveryFee, BULK_TIERS } from './print-pricing.js?v=20261010-mixed-calculator';
import { printPlan, packCovers, pageRange, compactRange } from './print-plan.js?v=20261007-split-print';

function initPrintOptions() {
for (const quote of document.querySelectorAll('[data-print-quote]')) {
  if (quote.dataset.ready) continue; quote.dataset.ready='1';
  const form = quote.closest('form'), cfg = JSON.parse(quote.dataset.pricing), pages = Number(quote.dataset.pages);
  const names = ['printType','copies','sides','paperGsm','range','mixedPageType','mixedRange','splitMixed','orientation','binding','notes'];
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
    const gutter = form.querySelector('#gutterNotice');
    if (gutter) gutter.style.display = ['spiral', 'wiro', 'hardcover'].includes(get('binding')) ? 'flex' : 'none';
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
      const due=total;
      const wallet=form.querySelector('[name="paymentMethod"][value="wallet"]');
      if(wallet)wallet.disabled=Number(cfg.balance || 0)<total;
      if(wallet?.checked && wallet.disabled){const available=form.querySelector('[name="paymentMethod"][value="online"]');if(available){available.checked=true;update();return;}}
      for(const [selector,cost] of [['[data-other-cost]',otherSubtotal],['[data-night-cost]',late],['[data-demand-cost]',surge]]){const line=form.querySelector(selector);if(line){line.textContent='₹'+cost.toLocaleString('en-IN');line.closest('div').hidden=!cost;}}
      const final=form.querySelector('[data-final-review]');if(final){final.querySelector('.total span:last-child').textContent='₹'+due.toLocaleString('en-IN');}
      const fmt = (n) => '₹' + n.toLocaleString('en-IN');
      const parts = ['Print ' + fmt(net)];
      if (Number(otherSubtotal) > 0) parts.push('Extras ' + fmt(otherSubtotal));
      if (processFee) parts.push('Processing ' + fmt(processFee));
      parts.push('Delivery ' + (fee === 0 ? 'FREE' : fmt(fee)));
      quote.querySelector('span').textContent = form.dataset.reviewedTotal ? 'Final total' : parts.join(' + ') + (cfg.guest || cfg.otherPrintedSides ? ' — checked before payment' : '');
      quote.querySelector('b').textContent = fmt(due);
      quote.querySelector('button').textContent = (cfg.guest ? 'Verify email' : get('paymentMethod')==='wallet' ? 'Pay with wallet' : 'Pay online')+' →';
      const payable=cfg.guest || form.querySelector('[name="paymentMethod"]:checked:not(:disabled)');
      quote.querySelector('button').disabled=!payable;
      if (!payable) { hint.textContent='Your wallet needs funds and online payment is unavailable. Try again later or contact support.';hint.hidden=false; }
      form.querySelector('[data-print-cost]').textContent = '₹'+net.toLocaleString('en-IN')+(pack ? ' · pack' : discount ? ' · offer applied' : '');
      form.querySelector('[data-delivery-cost]').textContent = fee === 0 ? 'FREE' : '₹'+fee;
      // Rate ladder + savings: same tier math as the desk's progressive pricing.
      const baseRates={bw:cfg.bw,color:cfg.color};
      const rate=(tier,kind)=>Math.round((baseRates[kind]-Math.max(0,baseRates[kind]-(kind==='bw'?1.4:3))*tier[kind])*100)/100;
      const fmtRate=(r)=>'₹'+r.toLocaleString('en-IN',{maximumFractionDigits:2});
      const slab=form.querySelector('[data-slab]');
      if(slab){
        const idx=BULK_TIERS.findIndex((t)=>printedSides<=t.through);
        const now=BULK_TIERS[Math.max(0,idx)], next=BULK_TIERS[idx+1]||null, prevThrough=idx>0?BULK_TIERS[idx-1].through:0;
        const bar=slab.querySelector('[data-slab-bar]'), copy=slab.querySelector('[data-slab-copy]'), side=slab.querySelector('[data-slab-side]');
        if(side)side.textContent=printedSides.toLocaleString('en-IN')+' sides';
        if(bar)bar.style.width=Math.round(Math.min(1,Math.max(0.04,next?(printedSides-prevThrough)/(now.through-prevThrough):1))*100)+'%';
        const kindLine=(tier)=>{const parts=[];if(rate(tier,'bw')<baseRates.bw)parts.push(fmtRate(rate(tier,'bw'))+'/side B&amp;W');if(rate(tier,'color')<baseRates.color)parts.push(fmtRate(rate(tier,'color'))+'/side colour');return parts.join(' · ')||'already the desk’s best rate';};
        if(copy){
          if(pack)copy.innerHTML='<b>Semester pack</b>: covered sides print at pack rates — the ladder doesn’t apply here.';
          else if(!BULK_TIERS.some((t)=>t.through>=printedSides))copy.innerHTML='<b>'+printedSides.toLocaleString('en-IN')+' printed sides</b> — this checkout prints at our lowest tray rates: '+kindLine(now)+'.';
          else if(next)copy.innerHTML='<b>'+printedSides.toLocaleString('en-IN')+' printed sides</b> on the desk. The next <b>'+(now.through+1-printedSides)+'+</b> added sides drop to <b>'+kindLine(next)+'</b>. Copies, colour pages and other files in this checkout count together.';
          else copy.innerHTML='<b>'+printedSides.toLocaleString('en-IN')+' printed sides</b> — you\'re printing at our lowest tray rates: '+kindLine(now)+'.';
        }
        slab.hidden=false;
      }
      const saveLine=form.querySelector('[data-print-save]');
      if(saveLine){
        const baseTotal=Math.round((plan.bwPages*plan.copies*baseRates.bw+plan.colorPages*plan.copies*baseRates.color)*100)/100;
        const save=Math.round((baseTotal-printing+discount)*100)/100;
        const row=saveLine.parentElement||saveLine.closest('div');
        if(save>0&&(net>0||pack)){row.hidden=false;saveLine.textContent='₹'+save.toLocaleString('en-IN')+(pack?' · pack':'');}
        else row.hidden=true;
      }
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
  const clearReview=event=>{if(['paymentMethod'].includes(event.target.name))return;delete form.dataset.reviewedTotal;form.querySelector('[data-final-review]')?.remove();form.querySelector('[data-print-breakdown]').hidden=false;};
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
