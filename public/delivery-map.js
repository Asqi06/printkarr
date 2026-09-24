// A pinned destination is the rider's drop point and the server's pricing input.
(function () {
  function init(root) {
    var form = root.closest('form');
    var mapEl = root.querySelector('[data-delivery-map]');
    var latInput = root.querySelector('[name="deliveryLat"]');
    var lngInput = root.querySelector('[name="deliveryLng"]');
    var status = root.querySelector('[data-delivery-status]');
    var map, marker;
    var centers = {
      vapi: [20.389722, 72.889945], daman: [20.398424, 72.89082],
      sarigam: [20.27801, 72.84171], bhilad: [20.258333, 72.883333]
    };
    function selected() { return form.querySelector('[name="addressId"]:checked'); }
    function area() {
      var choice = selected();
      return (choice?.value === '__new' ? form.querySelector('[name="nn_area"]')?.value : choice?.dataset.area || root.dataset.area || 'vapi').toLowerCase();
    }
    function setPoint(lat, lng) {
      latInput.value = Number(lat).toFixed(6);
      lngInput.value = Number(lng).toFixed(6);
      if (marker) marker.setLatLng([lat, lng]);
      else marker = L.marker([lat, lng]).addTo(map);
      status.textContent = 'Delivery point selected. The rider will come to this pin.';
    }
    function sync() {
      var choice = selected(), kind = area();
      root.hidden = kind === 'pickup';
      if (root.hidden) { latInput.value = lngInput.value = ''; return; }
      if (map) {
        map.invalidateSize();
        var lat = Number(choice ? choice.dataset.lat : root.dataset.lat), lng = Number(choice ? choice.dataset.lng : root.dataset.lng);
        if (lat && lng) { setPoint(lat, lng); map.setView([lat, lng], 15); }
        else {
          latInput.value = lngInput.value = '';
          if (marker) { map.removeLayer(marker); marker = null; }
          map.setView(centers[kind] || centers.vapi, 13);
          status.textContent = 'Select the delivery point on the map.';
        }
      }
    }
    form.querySelectorAll('[name="addressId"]').forEach(function (radio) { radio.addEventListener('change', sync); });
    form.querySelector('[name="nn_area"]')?.addEventListener('change', sync);
    form.addEventListener('submit', function (event) {
      if (area() !== 'pickup' && (!latInput.value || !lngInput.value)) {
        event.preventDefault(); status.textContent = 'Select your delivery point before continuing.';
        root.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, true);
    root.querySelector('[data-use-location]').addEventListener('click', function () {
      if (!navigator.geolocation) { status.textContent = 'Location is unavailable. Tap the map instead.'; return; }
      navigator.geolocation.getCurrentPosition(function (position) {
        var { latitude, longitude } = position.coords;
        setPoint(latitude, longitude); map.setView([latitude, longitude], 16);
      }, function () { status.textContent = 'Location unavailable. Tap the map instead.'; }, { enableHighAccuracy: true, timeout: 10000 });
    });
    var tries = 0;
    var ready = setInterval(function () {
      if (typeof L === 'undefined') {
        if (++tries >= 25) { clearInterval(ready); status.textContent = 'Map unavailable. Please reload or contact us to place the order.'; }
        return;
      }
      clearInterval(ready);
      map = L.map(mapEl).setView(centers[area()] || centers.vapi, 13);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors © CARTO', maxZoom: 19
      }).addTo(map);
      map.on('click', function (event) { setPoint(event.latlng.lat, event.latlng.lng); });
      sync();
    }, 200);
  }
  document.querySelectorAll('[data-delivery-picker]').forEach(init);
})();
