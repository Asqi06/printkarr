import {printPlan,printSides} from './print-plan.js';
import {printPricing,processingFee} from './print-pricing.js';
const drop=document.querySelector('.studio-drop'),input=document.getElementById('doc');
for(const type of ['dragenter','dragover'])drop.addEventListener(type,event=>{event.preventDefault();drop.classList.add('is-dragging');});
for(const type of ['dragleave','drop'])drop.addEventListener(type,event=>{event.preventDefault();drop.classList.remove('is-dragging');});
drop.addEventListener('drop',event=>{const files=event.dataTransfer.files;if(files.length!==1){document.getElementById('fname').textContent='Choose one document to start. Add more files in your order.';return;}const transfer=new DataTransfer();transfer.items.add(files[0]);input.files=transfer.files;input.dispatchEvent(new Event('change',{bubbles:true}));});
const form=document.querySelector('[data-studio-quote]'),total=document.querySelector('[data-quote-total]'),error=document.querySelector('[data-quote-error]'),pricing=JSON.parse(document.querySelector('.studio-quote').dataset.pricing);
function quote(){try{const values=Object.fromEntries(new FormData(form)),plan=printPlan(values,Number(values.pages)),counts=printSides(plan),price=printPricing(counts,pricing);total.textContent='₹'+(price.subtotal+processingFee(price.printedSides)).toFixed(2);error.hidden=true;}catch(e){total.textContent='—';error.textContent=e.message;error.hidden=false;}}
form.addEventListener('input',quote);form.addEventListener('change',quote);form.addEventListener('submit',event=>event.preventDefault());quote();
