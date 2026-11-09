import { printPricing } from './print-pricing.js?v=20261109-nature-landing';

const form = document.querySelector('[data-studio-quote]');
const card = document.querySelector('.studio-quote[data-pricing]');
const total = document.querySelector('[data-quote-total]');
const error = document.querySelector('[data-quote-error]');
const breakdown = document.querySelector('[data-quote-breakdown]');
const setText = (selector, text) => {
  const node = document.querySelector(selector);
  if (node) node.textContent = text;
};
const money = (value) => '₹' + (Math.round(Number(value) * 100) / 100).toLocaleString('en-IN');
const rate = (value) => '₹' + (Math.round(Number(value) * 100) / 100).toFixed(2);

if (form && card && total && error && breakdown) {
  let pricing = {};
  try {
    pricing = JSON.parse(card.dataset.pricing || '{}');
  } catch {
    pricing = {};
  }

  const quote = () => {
    try {
      if (!form.checkValidity()) throw new Error('Enter whole page counts from 0 to 1,000 and copies from 1 to 200.');
      const bw = Number(form.elements.bwPages.value);
      const color = Number(form.elements.colorPages.value);
      const copies = Number(form.elements.copies.value);
      if (!bw && !color) throw new Error('Enter at least one B&W or colour page.');
      if (bw + color > 1000) throw new Error('Enter up to 1,000 pages per copy in total.');
      const counts = { bw: bw * copies, color: color * copies };
      const price = printPricing(counts, pricing);
      total.textContent = money(price.subtotal);
      setText('[data-quote-bw]', 'B&W · ' + counts.bw.toLocaleString('en-IN') + ' printed sides');
      setText('[data-quote-color]', 'Colour · ' + counts.color.toLocaleString('en-IN') + ' printed sides');
      setText('[data-quote-bw-rate]', rate(counts.bw ? price.bwRate : pricing.bw) + ' / side');
      setText('[data-quote-color-rate]', rate(counts.color ? price.colorRate : pricing.color) + ' / side');
      setText('[data-quote-regular]', money(price.regularSubtotal));
      setText('[data-quote-savings]', price.bulkDiscount > 0
        ? money(price.bulkDiscount) + ' (' + (price.bulkDiscount / price.regularSubtotal * 100).toFixed(2) + '%)'
        : 'None at this quantity');
      breakdown.hidden = false;
      error.hidden = true;
    } catch (e) {
      total.textContent = 'Unavailable';
      breakdown.hidden = true;
      error.textContent = e.message;
      error.hidden = false;
    }
  };

  form.addEventListener('input', quote);
  form.addEventListener('change', quote);
  form.addEventListener('submit', (event) => event.preventDefault());
  quote();
}
