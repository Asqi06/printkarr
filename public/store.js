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
  document.querySelectorAll('[data-category]').forEach((button) => button.addEventListener('click', () => {
    if (button.tagName !== 'BUTTON') return;
    category = button.dataset.category;
    document.querySelectorAll('.store-filters button').forEach((b) => b.setAttribute('aria-pressed', String(b === button))); filter();
  }));
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
  document.querySelector('[data-store-gateway]')?.addEventListener('click', async (event) => {
    const button = event.currentTarget, id = button.dataset.storeGateway, message = document.querySelector('[data-payment-error]');
    button.disabled = true; message.hidden = true;
    try {
      const response = await fetch(`/customer/purchases/${encodeURIComponent(id)}/gateway`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      const result = await response.json(); if (!response.ok) throw new Error(result.error || 'Could not open payment.');
      if (!window.Razorpay) throw new Error('Payment provider is still loading. Please retry.');
      new window.Razorpay({ key: result.keyId, order_id: result.id, amount: result.amount, currency: 'INR', name: 'PrintKarr', description: 'Prints & stationery', modal: { ondismiss: () => { button.disabled = false; } }, handler(proof) {
        const form = document.createElement('form'); form.method = 'POST'; form.action = `/customer/purchases/${encodeURIComponent(id)}/verify`;
        Object.entries(proof).forEach(([name, value]) => { const input = document.createElement('input'); input.type = 'hidden'; input.name = name; input.value = value; form.append(input); });
        document.body.append(form); form.submit();
      } }).open();
    } catch (error) { message.textContent = error.message; message.hidden = false; button.disabled = false; }
  });
})();
