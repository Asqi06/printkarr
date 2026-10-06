const search = document.querySelector('[data-shop-search]');
const grid = document.querySelector('[data-shops]');
const cards = [...document.querySelectorAll('[data-shop]')];
const status = document.querySelector('[data-shops-status]');
function filterShops() {
  const value = search.querySelector('input').value.trim().toLowerCase();
  for (const card of cards) card.hidden = !card.dataset.search.toLowerCase().includes(value);
  document.querySelector('[data-no-shops]').hidden = cards.some(card => !card.hidden);
}
search.addEventListener('submit', event => event.preventDefault());
search.querySelector('input').addEventListener('input', filterShops);
filterShops();
document.querySelector('[data-locate-shops]').addEventListener('click', () => {
  if (!navigator.geolocation) { status.textContent = 'Location is unavailable. Search your area above.'; return; }
  status.textContent = 'Finding nearby shops…';
  navigator.geolocation.getCurrentPosition(({coords}) => {
    const rad = n => n * Math.PI / 180;
    for (const card of cards) {
      const a = Math.sin(rad(Number(card.dataset.lat)-coords.latitude)/2)**2 + Math.cos(rad(coords.latitude))*Math.cos(rad(Number(card.dataset.lat)))*Math.sin(rad(Number(card.dataset.lng)-coords.longitude)/2)**2;
      card.distance = 6371*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
      card.querySelector('.shop-distance').textContent = `${card.distance.toFixed(1)} km away · straight-line estimate`;
    }
    cards.sort((a,b)=>a.distance-b.distance).forEach(card=>grid.append(card));
    status.textContent = 'Nearest shops shown first. Confirm your delivery pin at checkout.';
  }, () => { status.textContent = 'Could not access your location. Search your area above.'; }, {timeout:10000});
});
