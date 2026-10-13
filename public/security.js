document.addEventListener('click', async event => {
  const print = event.target.closest('[data-print-page]');
  if (print) window.print();
  const copy = event.target.closest('[data-copy-code]');
  if (copy) {
    try { await navigator.clipboard.writeText(copy.dataset.copyCode); window.toast?.('Code copied'); }
    catch { window.toast?.('Copy the code shown above.'); }
  }
});
document.addEventListener('submit', event => {
  if (event.target.matches('[data-store-search]')) event.preventDefault();
  const message = event.target.dataset.confirm;
  if (message && !window.confirm(message)) event.preventDefault();
}, true);
