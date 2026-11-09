(() => {
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
  const chipRail = [...document.querySelectorAll('[data-category-chip]')];
  const categorySelect = document.querySelector('[data-product-category]');
  function paintCategory() {
    chipRail.forEach((chip) => chip.setAttribute('aria-pressed', String(chip.dataset.categoryChip === category)));
    if (categorySelect) categorySelect.value = category;
  }
  chipRail.forEach((chip) => chip.addEventListener('click', () => { category = chip.dataset.categoryChip; paintCategory(); filter(); }));
  categorySelect?.addEventListener('change', (event) => { category = event.target.value; paintCategory(); filter(); });
  paintCategory();
  document.querySelector('[data-product-sort]')?.addEventListener('change', (event) => {
    const mode = event.target.value, grid = document.getElementById('product-grid');
    [...cards].sort((a, b) => mode === 'featured' ? a.dataset.index - b.dataset.index : mode === 'low' ? a.dataset.price - b.dataset.price : b.dataset.price - a.dataset.price).forEach((card) => grid.append(card));
  });
  let toastTimer;
  document.querySelectorAll('[data-add-product]').forEach((form) => {
    form.querySelectorAll('[name="color"]').forEach((input) => input.addEventListener('change', () => { form.querySelector('[data-color-label]').textContent = input.value; }));
    form.addEventListener('submit', async (event) => {
      event.preventDefault(); const button = form.querySelector('[type="submit"]'), message = form.parentElement.querySelector('.product-feedback');
      button.disabled = true; button.setAttribute('aria-busy', 'true'); message.hidden = true;
      try {
        const response = await fetch(form.action, { method: 'POST', headers: { Accept: 'application/json' }, body: new URLSearchParams(new FormData(form)) });
        const result = await response.json();
        if (response.status === 401 && result.login) { location.assign(result.login); return; }
        if (!response.ok) throw new Error(result.error || 'Could not add this item.');
        document.querySelectorAll('[data-cart-count]').forEach((badge) => { badge.textContent = result.count; });
        const step = form.parentElement.querySelector('[data-qty]');
        if (step) {
          const quantity = Number(result.quantity) || 0;
          const chosen = form.querySelector('[name="color"]:checked');
          if (chosen) { step.dataset.color = chosen.value; step.querySelectorAll('input[name="color"]').forEach((input) => { input.value = chosen.value; }); }
          step.dataset.qty = String(quantity);
          step.querySelector('[data-qty-num]').textContent = quantity;
          const decForm = step.querySelector('[data-qty-dec]')?.closest('form');
          if (decForm) decForm.elements.quantity.value = Math.max(0, quantity - 1);
          if (quantity > 0) { form.hidden = true; step.hidden = false; }
        }
        const toast = document.querySelector('[data-store-toast]'); if (toast) { toast.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { toast.hidden = true; }, 6000); }
      } catch (error) { message.textContent = error.message || 'Please try again.'; message.hidden = false; }
      finally { button.disabled = false; button.removeAttribute('aria-busy'); }
    });
  });
  document.addEventListener('submit', async (event) => {
    const form = event.target.closest('[data-qty-form]');
    if (!form) return;
    event.preventDefault();
    const step = form.closest('[data-qty]');
    if (!step || step.dataset.busy) return;
    step.dataset.busy = '1';
    try {
      const response = await fetch(form.action, { method: 'POST', headers: { Accept: 'application/json' }, body: new URLSearchParams(new FormData(form)) });
      const result = await response.json();
      if (response.status === 401 && result.login) { location.assign(result.login); return; }
      if (!response.ok) throw new Error(result.error || 'Could not update your cart.');
      const quantity = Number(result.quantity) || 0;
      step.dataset.qty = String(quantity);
      step.querySelector('[data-qty-num]').textContent = quantity;
      const decForm = step.querySelector('[data-qty-dec]')?.closest('form');
      if (decForm) decForm.elements.quantity.value = Math.max(0, quantity - 1);
      document.querySelectorAll('[data-cart-count]').forEach((badge) => { badge.textContent = result.count; });
      if (quantity === 0) {
        step.hidden = true;
        const addForm = step.parentElement.querySelector('[data-add-product]');
        if (addForm) { addForm.hidden = false; const feedback = addForm.parentElement.querySelector('.product-feedback'); if (feedback) feedback.hidden = true; }
      }
    } catch (error) {
      const message = step.parentElement.querySelector('.product-feedback');
      if (message) { message.textContent = error.message || 'Please try again.'; message.hidden = false; }
    } finally { delete step.dataset.busy; }
  });
  function initPayment() {
    for(const form of document.querySelectorAll('[data-print-payment]')) {
      if(form.dataset.paymentReady)continue;form.dataset.paymentReady='1';
      const total=form.querySelector('[data-payment-total]');
      const update=()=>{if(!total)return;const due=Number(total.dataset.onlineTotal);total.firstChild.nodeValue='₹'+due.toLocaleString('en-IN');total.querySelector('small').textContent='Wallet / Razorpay total';form.querySelector('.order-continue button').textContent='Pay & place order →';};
      form.addEventListener('change',update);update();
    }
  }
  initPayment();document.addEventListener('print-screen',initPayment);
  async function pay(event) {
    const form=event.target.closest('form[data-print-payment]');
    const button=form ? form.querySelector('.order-continue [type=submit]') : event.target.closest('[data-store-gateway]');
    if(!button || form && event.type!=='submit')return;
    event.preventDefault();let id=button.dataset.storeGateway;const message=form?.querySelector('[data-payment-error]') || document.querySelector('[data-payment-error]');
    if(button.disabled)return;const label=button.textContent;const reset=()=>{button.disabled=false;button.textContent=label;form?.removeAttribute('aria-busy');};button.disabled=true;button.textContent='Preparing payment…';form?.setAttribute('aria-busy','true');message.hidden=true;
    try {
      if(form){
        if(form.dataset.purchaseId){location.assign(`/customer/purchases/${encodeURIComponent(form.dataset.purchaseId)}`);return;}
        const data=new URLSearchParams(new FormData(form,event.submitter));
        let action=form.action;
        if(action.endsWith('/customer/orders/new/confirm')) {
          const checked=await fetch(action,{method:'POST',headers:{Accept:'application/json'},body:data});
          if(checked.ok){
            const result=await checked.json().catch(()=>null);
            if(result?.id){
              id=result.id;form.dataset.purchaseId=id;
              if(event.submitter?.value==='add'){location.assign('/customer/orders/new?fresh=1');return;}
              if(event.submitter?.value==='wallet'){location.assign(`/customer/wallet?purchase=${encodeURIComponent(id)}`);return;}
              if(form.elements.paymentMethod?.value==='wallet'){
                const paid=await fetch(`/customer/purchases/${encodeURIComponent(id)}/wallet`,{method:'POST'});
                if(!paid.ok)throw new Error('Payment could not be completed with wallet balance.');
                location.assign(paid.url);return;
              }
              // Online payment continues down to Razorpay window!
              const response=await fetch(`/customer/purchases/${encodeURIComponent(id)}/gateway`,{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
              if(response.redirected && new URL(response.url).pathname==='/login'){location.assign(response.url);return;}
              const gResult=await response.json();if(response.status===401 && gResult.login){location.assign(gResult.login);return;}if(!response.ok)throw new Error(gResult.error || 'Could not open payment.');
              if(!window.Razorpay)throw new Error('Payment provider is still loading. Please retry.');
              const checkout=new window.Razorpay({key:gResult.keyId,order_id:gResult.id,amount:gResult.amount,currency:'INR',name:'PrintKarr',description:'Prints & stationery',modal:{ondismiss:()=>{reset();}},handler(proof){
                const proofForm=document.createElement('form');proofForm.method='POST';proofForm.action=`/customer/purchases/${encodeURIComponent(id)}/verify`;
                Object.entries(proof).forEach(([name,value])=>{const input=document.createElement('input');input.type='hidden';input.name=name;input.value=value;proofForm.append(input);});
                document.body.append(proofForm);proofForm.submit();
              }});
              checkout.on?.('payment.failed',event=>{message.textContent=event.error?.description || 'Payment failed. Your checkout is saved; retry online payment. Contact support if money was deducted.';message.hidden=false;reset();});
              checkout.open();
              return;
            }
          }
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
              form.querySelector('[name="paymentMethod"]:checked').dispatchEvent(new Event('change',{bubbles:true}));
              message.textContent='Your final price is shown below. Review the breakdown, then confirm to place your order.';message.hidden=false;
              review.scrollIntoView({behavior:'auto',block:'center'});reset();return;
            }
          }
          data.set('expectedTotal',exact);action=confirmed.getAttribute('action');
        }
        const response=await fetch(action,{method:'POST',headers:{Accept:'application/json'},body:data});
        if(response.ok && event.submitter?.value==='add'){location.assign('/customer/orders/new?fresh=1');return;}
        const json=response.headers.get('content-type')?.includes('application/json');
        const result=json?await response.json():{error:new DOMParser().parseFromString(await response.text(),'text/html').querySelector('[role=alert]')?.textContent || 'Could not prepare your order. Please retry.'};
        if(response.status===401 && result.login){location.assign(result.login);return;}
        if(!response.ok || !result.id)throw new Error(result.error || 'Could not prepare your order.');
        id=result.id;form.dataset.purchaseId=id;
        if(result.paid || Number(data.get('expectedTotal'))!==result.total){location.assign(`/customer/purchases/${encodeURIComponent(id)}`);return;}
        if(event.submitter?.value==='wallet'){location.assign(`/customer/wallet?purchase=${encodeURIComponent(id)}`);return;}
        if(form.elements.paymentMethod.value==='wallet'){
          const paid=await fetch(`/customer/purchases/${encodeURIComponent(id)}/wallet`,{method:'POST'});
          if(!paid.ok)throw new Error(new DOMParser().parseFromString(await paid.text(),'text/html').querySelector('[role=alert]')?.textContent || 'Payment could not be completed. Please retry.');
          location.assign(paid.url);return;
        }
      }
      const response=await fetch(`/customer/purchases/${encodeURIComponent(id)}/gateway`,{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
      if(response.redirected && new URL(response.url).pathname==='/login'){location.assign(response.url);return;}
      const result=await response.json();if(response.status===401 && result.login){location.assign(result.login);return;}if(!response.ok)throw new Error(result.error || 'Could not open payment.');
      if(!window.Razorpay)throw new Error('Payment provider is still loading. Please retry.');
      const checkout=new window.Razorpay({key:result.keyId,order_id:result.id,amount:result.amount,currency:'INR',name:'PrintKarr',description:'Prints & stationery',modal:{ondismiss:()=>{reset();}},handler(proof){
        const proofForm=document.createElement('form');proofForm.method='POST';proofForm.action=`/customer/purchases/${encodeURIComponent(id)}/verify`;
        Object.entries(proof).forEach(([name,value])=>{const input=document.createElement('input');input.type='hidden';input.name=name;input.value=value;proofForm.append(input);});
        document.body.append(proofForm);proofForm.submit();
      }});
      checkout.on?.('payment.failed',event=>{message.textContent=event.error?.description || 'Payment failed. Your checkout is saved; retry online payment. Contact support if money was deducted.';message.hidden=false;reset();});
      checkout.open();
    }catch(error){message.textContent=error.message;message.hidden=false;reset();}
  }
  document.addEventListener('click',event=>{if(event.target.closest('[data-store-gateway]'))pay(event);});
  document.addEventListener('submit',event=>{if(event.target.matches('[data-print-payment]'))pay(event);});
})();

/* ── Persistent cart strip (Phase 2 redesign, Blinkit cart_strip pattern) ── */
(function () {
  function syncCartStrip() {
    const strip = document.getElementById('cartStrip');
    if (!strip) return;
    const count = +(localStorage.getItem('pk_cart_count') || 0);
    const price = +(localStorage.getItem('pk_cart_price') || 0);
    strip.classList.toggle('strip-visible', count > 0);
    const countEl = document.getElementById('cartStripCount');
    const priceEl = document.getElementById('cartStripPrice');
    if (countEl) countEl.textContent = count + ' item' + (count !== 1 ? 's' : '');
    if (priceEl) priceEl.textContent = price > 0 ? '\u20b9' + price.toFixed(2) : '';
  }
  document.addEventListener('DOMContentLoaded', syncCartStrip);
  document.addEventListener('pk:cart-updated', syncCartStrip);
  window.pkSyncCartStrip = syncCartStrip;
})();

/* ── Inline delivery address changer & drawer ── */
(function () {
  function initAddressDrawer() {
    const changeBtn = document.getElementById('qkChangeAddressBtn');
    const closeBtn = document.getElementById('qkCloseDrawerBtn');
    const drawer = document.getElementById('qkAddressDrawer');
    const activeLabel = document.getElementById('qkActiveLabel');
    const activeContact = document.getElementById('qkActiveContact');
    const activeText = document.getElementById('qkActiveAddressText');
    const hiddenInput = document.getElementById('qkSelectedAddressId');

    if (changeBtn && drawer) {
      changeBtn.addEventListener('click', function (e) {
        e.preventDefault();
        drawer.style.display = (drawer.style.display === 'none' || !drawer.style.display) ? 'block' : 'none';
      });
    }
    if (closeBtn && drawer) {
      closeBtn.addEventListener('click', function (e) {
        e.preventDefault();
        drawer.style.display = 'none';
      });
    }

    document.querySelectorAll('input[name="selectAddressRadio"]').forEach(function (radio) {
      radio.addEventListener('change', function () {
        if (activeLabel && radio.dataset.label) activeLabel.textContent = radio.dataset.label;
        if (activeContact && radio.dataset.contact) activeContact.textContent = radio.dataset.contact;
        if (activeText && radio.dataset.text) activeText.textContent = radio.dataset.text;
        if (hiddenInput) hiddenInput.value = radio.value;
        document.querySelectorAll('.qk-address-option').forEach(function (opt) { opt.classList.remove('active'); });
        radio.closest('.qk-address-option')?.classList.add('active');
        if (drawer) drawer.style.display = 'none';
      });
    });

    const saveNewBtn = document.getElementById('qkSaveNewAddressBtn');
    if (saveNewBtn) {
      saveNewBtn.addEventListener('click', async function (e) {
        e.preventDefault();
        const address = document.getElementById('qk_na_address')?.value?.trim();
        const area = document.getElementById('qk_na_area')?.value;
        const pin = document.getElementById('qk_na_pin')?.value?.trim();
        const phone = document.getElementById('qk_na_phone')?.value?.trim();
        if (!address || !pin || !/^\d{6}$/.test(pin) || !phone) {
          alert('Please enter a valid street address, 6-digit PIN code and phone number.');
          return;
        }
        saveNewBtn.disabled = true;
        saveNewBtn.textContent = 'Saving…';
        try {
          const res = await fetch('/customer/addresses/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
            body: new URLSearchParams({ address, area, pin, phone, label: 'Saved Address' })
          });
          const data = await res.json();
          if (res.ok && data.address) {
            if (activeLabel) activeLabel.textContent = data.address.label || 'Home';
            if (activeContact) activeContact.textContent = (data.address.name || '') + (data.address.phone ? ' · ' + data.address.phone : '');
            if (activeText) activeText.textContent = data.address.address + ', ' + data.address.area + ' ' + data.address.pin;
            if (hiddenInput) hiddenInput.value = data.address.id;
            if (drawer) drawer.style.display = 'none';
          } else {
            alert(data.error || 'Could not save new address. Please check your fields.');
          }
        } catch (err) {
          alert('Could not save address. Please retry.');
        } finally {
          saveNewBtn.disabled = false;
          saveNewBtn.textContent = 'Use this address';
        }
      });
    }

    const stripChange = document.querySelector('.qk-strip-change');
    if (stripChange) {
      stripChange.addEventListener('click', function (e) {
        e.preventDefault();
        const deliverySec = document.getElementById('delivery');
        if (deliverySec) {
          deliverySec.scrollIntoView({ behavior: 'smooth', block: 'start' });
          if (drawer) drawer.style.display = 'block';
        }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAddressDrawer);
  } else {
    initAddressDrawer();
  }
})();
