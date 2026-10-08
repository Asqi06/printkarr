(() => {
  if(location.hash==='#cash-choice')document.getElementById('cash-choice')?.setAttribute('open','');
  const cards = [...document.querySelectorAll('[data-product]')];
  let category = 'all';
  const search = document.querySelector('[data-product-search]');
  function filter() {
    const term = search?.value.trim().toLowerCase() || '';
    let shown = 0;
    cards.forEach((card) => { card.hidden = !(category === 'all' || card.dataset.category === category) || !card.dataset.name.includes(term); if (!card.hidden) shown++; });
    const results = document.querySelector('[data-product-results]');
    if (results) results.textContent = `${shown} ${shown === 1 ? 'essential' : 'essentials'}`;
    const empty = document.querySelector('[data-no-results]'); if (empty) empty.hidden = !!shown;
  }
  search?.addEventListener('input', filter);
  document.querySelector('[data-product-category]')?.addEventListener('change', (event) => { category = event.target.value; filter(); });
  document.querySelector('[data-product-sort]')?.addEventListener('change', (event) => {
    const mode = event.target.value, grid = document.getElementById('product-grid');
    [...cards].sort((a, b) => mode === 'featured' ? a.dataset.index - b.dataset.index : mode === 'low' ? a.dataset.price - b.dataset.price : b.dataset.price - a.dataset.price).forEach((card) => grid.append(card));
  });
  let toastTimer;
  document.querySelectorAll('[data-add-product]').forEach((form) => {
    form.querySelectorAll('[name="color"]').forEach((input) => input.addEventListener('change', () => { form.querySelector('[data-color-label]').textContent = input.value; }));
    form.addEventListener('submit', async (event) => {
      event.preventDefault(); const button = form.querySelector('[type="submit"]'), message = form.querySelector('.product-feedback');
      button.disabled = true; button.setAttribute('aria-busy', 'true'); message.hidden = true;
      try {
        const response = await fetch(form.action, { method: 'POST', headers: { Accept: 'application/json' }, body: new URLSearchParams(new FormData(form)) });
        const result = await response.json(); if (!response.ok) throw new Error(result.error || 'Could not add this item.');
        document.querySelectorAll('[data-cart-count]').forEach((badge) => { badge.textContent = result.count; });
        const toast = document.querySelector('[data-store-toast]'); if (toast) { toast.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { toast.hidden = true; }, 6000); }
      } catch (error) { message.textContent = error.message || 'Please try again.'; message.hidden = false; }
      finally { button.disabled = false; button.removeAttribute('aria-busy'); }
    });
  });
  for(const form of document.querySelectorAll('[data-print-payment]')) {
    const total=form.querySelector('[data-payment-total]');
    if(!total)continue;
    const update=()=>{const cash=form.elements.paymentMethod.value==='cod';total.firstChild.nodeValue='\u20b9'+Number(cash ? total.dataset.cashTotal : total.dataset.onlineTotal).toLocaleString('en-IN');total.querySelector('small').textContent=cash ? 'Cash total · includes extra COD fee' : 'Online / wallet total';form.querySelector('.order-continue button').textContent=cash ? 'Review cash order →' : 'Continue to payment →';};
    form.addEventListener('change',update);update();
  }
  async function pay(event) {
    const form=event.target.closest('form[data-print-payment]');
    const button=form ? form.querySelector('.order-continue [type=submit]') : event.target.closest('[data-store-gateway]');
    if(!button || form && event.type!=='submit')return;
    if(form && event.submitter?.value==='add')return;
    event.preventDefault();let id=button.dataset.storeGateway;const message=document.querySelector('[data-payment-error]');
    if(button.disabled)return;button.disabled=true;message.hidden=true;
    try {
      if(form){
        const response=await fetch(form.action,{method:'POST',headers:{Accept:'application/json'},body:new URLSearchParams(new FormData(form,event.submitter))});
        const json=response.headers.get('content-type')?.includes('application/json');
        const result=json?await response.json():{error:new DOMParser().parseFromString(await response.text(),'text/html').querySelector('[role=alert]')?.textContent || 'Could not prepare your order. Please retry.'};
        if(!response.ok || !result.id)throw new Error(result.error || 'Could not prepare your order.');
        id=result.id;
        if(result.paid || Number(form.elements.expectedTotal.value)!==result.total){location.assign(`/customer/purchases/${encodeURIComponent(id)}`);return;}
        if(event.submitter?.value==='wallet'){location.assign(`/customer/wallet?purchase=${encodeURIComponent(id)}`);return;}
        if(form.elements.paymentMethod.value==='cod'){location.assign(`/customer/purchases/${encodeURIComponent(id)}#cash-choice`);return;}
        if(form.elements.paymentMethod.value==='wallet'){
          const paid=await fetch(`/customer/purchases/${encodeURIComponent(id)}/wallet`,{method:'POST'});
          if(!paid.ok)throw new Error(new DOMParser().parseFromString(await paid.text(),'text/html').querySelector('[role=alert]')?.textContent || 'Payment could not be completed. Please retry.');
          location.assign(paid.url);return;
        }
      }
      const response=await fetch(`/customer/purchases/${encodeURIComponent(id)}/gateway`,{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
      const result=await response.json();if(!response.ok)throw new Error(result.error || 'Could not open payment.');
      if(!window.Razorpay)throw new Error('Payment provider is still loading. Please retry.');
      const checkout=new window.Razorpay({key:result.keyId,order_id:result.id,amount:result.amount,currency:'INR',name:'PrintKarr',description:'Prints & stationery',modal:{ondismiss:()=>{button.disabled=false;}},handler(proof){
        const proofForm=document.createElement('form');proofForm.method='POST';proofForm.action=`/customer/purchases/${encodeURIComponent(id)}/verify`;
        Object.entries(proof).forEach(([name,value])=>{const input=document.createElement('input');input.type='hidden';input.name=name;input.value=value;proofForm.append(input);});
        document.body.append(proofForm);proofForm.submit();
      }});
      checkout.on?.('payment.failed',event=>{message.textContent=event.error?.description || 'Payment failed. Your checkout is saved; retry online payment. Contact support if money was deducted.';message.hidden=false;button.disabled=false;});
      checkout.open();
    }catch(error){message.textContent=error.message;message.hidden=false;button.disabled=false;}
  }
  document.addEventListener('click',event=>{if(event.target.closest('[data-store-gateway]'))pay(event);});
  document.addEventListener('submit',event=>{if(event.target.matches('[data-print-payment]'))pay(event);});
})();
