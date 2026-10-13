import {printPricing} from './print-pricing.js?v=20261010-mixed-calculator';
const drop=document.querySelector('.studio-drop'),input=document.getElementById('doc');
for(const type of ['dragenter','dragover'])drop.addEventListener(type,event=>{event.preventDefault();drop.classList.add('is-dragging');});
for(const type of ['dragleave','drop'])drop.addEventListener(type,event=>{event.preventDefault();drop.classList.remove('is-dragging');});
drop.addEventListener('drop',event=>{const files=event.dataTransfer.files;if(files.length!==1){document.getElementById('fname').textContent='Choose one document to start. Add more files in your order.';return;}const transfer=new DataTransfer();transfer.items.add(files[0]);input.files=transfer.files;input.dispatchEvent(new Event('change',{bubbles:true}));});
const form=document.querySelector('[data-studio-quote]'),total=document.querySelector('[data-quote-total]'),error=document.querySelector('[data-quote-error]'),pricing=JSON.parse(document.querySelector('.studio-quote').dataset.pricing);
const breakdown=document.querySelector('[data-quote-breakdown]'),rupees=n=>'₹'+n.toFixed(2);
function quote(){
  try{
    if(!form.checkValidity())throw new Error('Enter whole page counts from 0–1,000 and copies from 1–200.');
    const bw=Number(form.elements.bwPages.value),color=Number(form.elements.colorPages.value),copies=Number(form.elements.copies.value);
    if(!bw&&!color)throw new Error('Enter at least one B&W or colour page.');
    if(bw+color>1000)throw new Error('Enter up to 1,000 pages per copy in total.');
    const counts={bw:bw*copies,color:color*copies},price=printPricing(counts,pricing);
    total.textContent=rupees(price.subtotal);
    document.querySelector('[data-quote-bw]').textContent='B&W · '+counts.bw.toLocaleString('en-IN')+' printed sides';
    document.querySelector('[data-quote-color]').textContent='Colour · '+counts.color.toLocaleString('en-IN')+' printed sides';
    document.querySelector('[data-quote-bw-rate]').textContent=rupees(price.bwRate)+' / side';
    document.querySelector('[data-quote-color-rate]').textContent=rupees(price.colorRate)+' / side';
    document.querySelector('[data-quote-regular]').textContent=rupees(price.regularSubtotal);
    document.querySelector('[data-quote-savings]').textContent=rupees(price.bulkDiscount)+' ('+(price.regularSubtotal ? price.bulkDiscount/price.regularSubtotal*100 : 0).toFixed(2)+'%)';
    breakdown.hidden=false;error.hidden=true;
  }catch(e){total.textContent='—';breakdown.hidden=true;error.textContent=e.message;error.hidden=false;}
}
form.addEventListener('input',quote);form.addEventListener('change',quote);form.addEventListener('submit',event=>event.preventDefault());quote();
