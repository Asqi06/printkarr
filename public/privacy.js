// Optional analytics uses basic consent: no Google request before opt-in.
const measurementId = document.querySelector('meta[name="printkarr-analytics"]')?.content || '';
const enabled = /^G-[A-Z0-9]+$/.test(measurementId) && !/^\/(admin|partner|rider|api|auth|share|c)(\/|$)/.test(location.pathname);
const key = 'pk_analytics_consent_v1';
const read = name => { try { return localStorage.getItem(name); } catch { return null; } };
const write = (name,value) => { try { localStorage.setItem(name,value); } catch {} };
let started = false;
function start() {
  if (!enabled || started) return;
  started = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  const canonical = document.querySelector('link[rel="canonical"]');
  const safeRoutes = ['/order','/order/phone','/login','/customer','/customer/wallet','/customer/orders','/customer/orders/new','/customer/purchases','/customer/profile','/customer/referrals','/customer/packs','/customer/notifications','/cart','/stationery','/contact/thank-you'];
  const route = canonical ? new URL(canonical.href).pathname : safeRoutes.includes(location.pathname) ? location.pathname : /^\/customer\/(orders|purchases)\//.test(location.pathname) ? '/customer/'+location.pathname.split('/')[2]+'/detail' : /^\/order\//.test(location.pathname) ? '/order' : '/other';
  const page = {page_location:location.origin+route,page_referrer:'',page_title:canonical ? document.title : 'PrintKarr · '+route,send_page_view:false,allow_google_signals:false,allow_ad_personalization_signals:false};
  gtag('consent','default',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
  gtag('js',new Date());
  gtag('set',page);
  gtag('config',measurementId,page);
  gtag('event','page_view',{page_location:page.page_location,page_title:page.page_title,page_referrer:''});
  if (document.querySelector('[data-contact-confirmed]')) gtag('event','generate_lead',{form_name:'contact_enquiry'});
  const receipt = document.querySelector('[data-analytics-purchase]');
  if (receipt) {
    try {
      const data = JSON.parse(receipt.textContent), seen = 'pk_measured_'+data.transaction_id;
      if (!read(seen)) { gtag('event','purchase',data); write(seen,'1'); }
    } catch {}
  }
  const script = document.createElement('script');
  script.async = true; script.src = 'https://www.googletagmanager.com/gtag/js?id='+measurementId;
  document.head.append(script);
}
function eraseAnalyticsCookies() {
  for (const entry of document.cookie.split(';')) {
    const name = entry.trim().split('=')[0];
    if (!/^_ga(?:_|$)/.test(name)) continue;
    const pieces = location.hostname.split('.');
    document.cookie = name+'=;Max-Age=0;Path=/';
    for (let i=0;i<pieces.length-1;i++) document.cookie = name+'=;Max-Age=0;Path=/;Domain=.'+pieces.slice(i).join('.');
  }
}
function preferences() {
  let dialog = document.querySelector('#cookie-dialog');
  if (!dialog) {
    dialog = document.createElement('dialog'); dialog.id='cookie-dialog'; dialog.className='cookie-dialog';
    dialog.setAttribute('aria-labelledby','cookie-title');
    dialog.innerHTML='<h2 id="cookie-title">Your cookies. Your choice.</h2><p>Essential cookies keep your sign-in, basket and orders working.</p><p>'+ (enabled?'With your permission, Google Analytics helps us understand page visits, successful enquiries and purchases. We do not send document contents or contact details in these events.':'Optional analytics is currently switched off. You can continue using every ordering feature.')+'</p><a href="/privacy">Read our privacy policy</a><div class="cookie-actions">'+(enabled?'<button type="button" class="btn ghost" data-choice="denied">Essential only</button><button type="button" class="btn loud" data-choice="granted">Allow analytics</button>':'<button type="button" class="btn loud" data-close>Got it</button>')+'</div>';
    document.body.append(dialog);
    dialog.addEventListener('click',event=>{
      const button=event.target.closest('button'); if(!button)return;
      const choice=button.dataset.choice;
      if(choice) {
        write(key,choice);
        if(choice==='denied') {
          window['ga-disable-'+measurementId]=true;
          eraseAnalyticsCookies();
          dialog.close();
          if(started)location.reload();
          return;
        }
        start();
      }
      dialog.close();
    });
    // Escape means essential-only for this visit, with no analytics requests.
  }
  dialog.showModal();
}
document.addEventListener('click',event=>{if(event.target.closest('[data-cookie-settings]'))preferences();});
if(enabled) {
  if(read(key)==='granted')start();
  else if(!read(key))preferences();
}
