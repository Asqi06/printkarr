// Locality first; native device location is optional and never blocks checkout.
(function () {
  function init(root) {
    var form=root.closest('form'), locality=root.querySelector('[name="localityId"]');
    var lat=root.querySelector('[name="deliveryLat"]'), lng=root.querySelector('[name="deliveryLng"]');
    var status=root.querySelector('[data-delivery-status]'), button=root.querySelector('[data-use-location]');
    var city=form.querySelector('[name="nn_area"],[name="area"]'), request=0;
    function clearLocation(){request++;lat.value=lng.value='';locality.required=true;button.disabled=false;}
    function syncCity(clear){
      var zone=String(city?.value || root.dataset.area || 'Vapi').toLowerCase();
      for(var option of locality.options) if(option.value){option.hidden=option.disabled=option.dataset.zone!==zone;}
      if(clear){clearLocation();locality.value='';status.textContent='Choose your locality. No location permission needed.';}
    }
    city?.addEventListener('change',function(){syncCity(true);});
    locality.addEventListener('change',function(){clearLocation();status.textContent=locality.value?'Locality selected. Review the delivery estimate before payment.':'Choose your locality.';});
    form.querySelectorAll('[name="addressId"]').forEach(function(input){input.addEventListener('change',function(){request++;button.disabled=false;});});
    button.addEventListener('click',function(){
      if(!navigator.geolocation){status.textContent='Location unavailable. Choose your locality to continue.';return;}
      var current=++request;button.disabled=true;status.textContent='Finding your location… You can still select a locality.';
      navigator.geolocation.getCurrentPosition(function(position){
        if(current!==request)return;
        button.disabled=false;
        var a=position.coords.latitude,b=position.coords.longitude;
        if(a<20.1 || a>20.55 || b<72.7 || b>73.1 || position.coords.accuracy>500){status.textContent='Could not get a precise local location. Choose your locality instead.';return;}
        lat.value=a.toFixed(6);lng.value=b.toFixed(6);locality.required=false;
        status.textContent='Device location added for distance pricing. Delivering to a different address? Choose its locality instead.';
        form.dispatchEvent(new Event('change',{bubbles:true}));
      },function(){if(current!==request)return;button.disabled=false;status.textContent='Location unavailable. Choose your locality to continue.';},{enableHighAccuracy:true,timeout:10000,maximumAge:60000});
    });
    syncCity(false);
  }
  function start(){document.querySelectorAll('[data-delivery-picker]').forEach(function(root){if(root.dataset.ready)return;root.dataset.ready='1';init(root);});}
  start();document.addEventListener('DOMContentLoaded',start);document.addEventListener('print-screen',start);
})();
