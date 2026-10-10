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
  function initPayment() {
    for(const form of document.querySelectorAll('[data-print-payment]')) {
      if(form.dataset.paymentReady)continue;form.dataset.paymentReady='1';
      const total=form.querySelector('[data-payment-total]');
      const update=()=>{const cash=form.elements.paymentMethod.value==='cod',consent=form.querySelector('[data-cash-consent]');if(consent){consent.hidden=!cash;consent.querySelector('input').disabled=!cash;consent.querySelector('input').required=cash;}if(!total)return;const due=Number(cash ? total.dataset.cashTotal : total.dataset.onlineTotal);total.firstChild.nodeValue='\u20b9'+due.toLocaleString('en-IN');total.querySelector('small').textContent=cash ? 'Cash total' : 'Online / wallet total';if(consent)consent.querySelector('[data-cash-due]').textContent='\u20b9'+due.toLocaleString('en-IN');form.querySelector('.order-continue button').textContent=cash ? 'Confirm cash order →' : 'Pay & place order →';};
      form.addEventListener('change',update);update();
    }
  }
  initPayment();document.addEventListener('print-screen',initPayment);
  async function pay(event) {
    const form=event.target.closest('form[data-print-payment]');
    const button=form ? form.querySelector('.order-continue [type=submit]') : event.target.closest('[data-store-gateway]');
    if(!button || form && event.type!=='submit')return;
    event.preventDefault();let id=button.dataset.storeGateway;const message=form?.querySelector('[data-payment-error]') || document.querySelector('[data-payment-error]');
    if(button.disabled)return;button.disabled=true;message.hidden=true;
    try {
      if(form){
        if(form.dataset.purchaseId){location.assign(`/customer/purchases/${encodeURIComponent(form.dataset.purchaseId)}`);return;}
        const data=new URLSearchParams(new FormData(form,event.submitter));
        let action=form.action;
        if(action.endsWith('/customer/orders/new/confirm')) {
          const checked=await fetch(action,{method:'POST',body:data});
          if(checked.ok && checked.redirected && /^\/customer\/purchases\/[^/]+$/.test(new URL(checked.url).pathname)){location.assign(checked.url);return;}
          if(checked.redirected && new URL(checked.url).pathname==='/login'){location.assign(checked.url);return;}
          const doc=new DOMParser().parseFromString(await checked.text(),'text/html'), confirmed=doc.querySelector('[data-print-payment]');
          if(!checked.ok || !confirmed)throw new Error(doc.querySelector('[role=alert]')?.textContent || 'Could not check your settings. Please retry.');
          if(confirmed.querySelector('.order-continue button').disabled)throw new Error(doc.querySelector('[role=alert]')?.textContent || 'Check the code before payment.');
          const exact=Number(confirmed.elements.expectedTotal.value);
          if(event.submitter?.value!=='add' && event.submitter?.value!=='wallet' && (exact!==Number(data.get('expectedTotal')) || data.get('coupon') || data.get('referral'))) {
            // Keep review on this page. No order or payment exists until the final amount is accepted.
            if(form.dataset.reviewedTotal!==String(exact)) {
              form.dataset.reviewedTotal=String(exact);form.elements.expectedTotal.value=exact;
              form.querySelector('[data-final-review]')?.remove();
              const review=doc.querySelector('.order-totals');review.dataset.finalReview='1';review.querySelector('.total span:last-child').textContent='₹'+exact.toLocaleString('en-IN');form.querySelector('[data-print-breakdown]').hidden=true;
              form.querySelector('[data-print-breakdown]').before(review);
              form.querySelector('[data-print-quote] b').textContent='\u20b9'+exact.toLocaleString('en-IN');
              form.querySelector('[data-print-quote] span').textContent='Final total';
              const cashDue=form.querySelector('[data-cash-due]');if(cashDue)cashDue.textContent='\u20b9'+exact.toLocaleString('en-IN');
              form.querySelector('[data-cash-consent] input').checked=false;form.querySelector('[name="paymentMethod"]:checked').dispatchEvent(new Event('change',{bubbles:true}));
              message.textContent='Your final price is shown below. Review the breakdown, then confirm to place your order.';message.hidden=false;
              review.scrollIntoView({behavior:'auto',block:'center'});button.disabled=false;return;
            }
          }
          data.set('expectedTotal',exact);action=confirmed.getAttribute('action');
        }
        const response=await fetch(action,{method:'POST',headers:{Accept:'application/json'},body:data});
        if(response.ok && event.submitter?.value==='add'){location.assign('/customer/orders/new?fresh=1');return;}
        const json=response.headers.get('content-type')?.includes('application/json');
        const result=json?await response.json():{error:new DOMParser().parseFromString(await response.text(),'text/html').querySelector('[role=alert]')?.textContent || 'Could not prepare your order. Please retry.'};
        if(!response.ok || !result.id)throw new Error(result.error || 'Could not prepare your order.');
        id=result.id;form.dataset.purchaseId=id;
        if(result.paid || Number(data.get('expectedTotal'))!==result.total){location.assign(`/customer/purchases/${encodeURIComponent(id)}`);return;}
        if(event.submitter?.value==='wallet'){location.assign(`/customer/wallet?purchase=${encodeURIComponent(id)}`);return;}
        if(form.elements.paymentMethod.value==='cod'){
          if(data.get('confirmCash')!=='1'){location.assign(`/customer/purchases/${encodeURIComponent(id)}#cash-choice`);return;}
          const confirmed=await fetch(`/customer/purchases/${encodeURIComponent(id)}/cod`,{method:'POST',body:new URLSearchParams({confirmCash:'1',expectedTotal:result.total})});
          if(!confirmed.ok)throw new Error(new DOMParser().parseFromString(await confirmed.text(),'text/html').querySelector('[role=alert]')?.textContent || 'Cash confirmation failed. Your checkout is saved; please retry.');
          location.assign(confirmed.url);return;
        }
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
