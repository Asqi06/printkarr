import assert from 'node:assert/strict';
import { runInNewContext } from 'node:vm';
import { deliverySlotsFields } from '../lib/views_order.js';
import { campaignDefaults } from '../lib/campus.js';
// Shared picker: institution delivery needs its name; address delivery uses the local fields.
const config=campaignDefaults();
const html=deliverySlotsFields(config,{delivery:{vapi:15,daman:20}});
assert.match(html,/school \/ college \/ classes · ₹5 flat/);assert.doesNotMatch(html,/value="pickup"|value="college"/);
const scripts=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
const input={disabled:false,required:true}, localInput={disabled:false};
const institution={hidden:false,disabled:false};
const other={hidden:false,querySelectorAll(){return [input];}};
const local={hidden:false,querySelectorAll(){return [localInput];}};
const windowText={hidden:false};const area={value:'Daman',dispatchEvent(){}};
let selected='school';
const location={value:'locality:vapi-chala',selectedOptions:[{dataset:{name:'Saved college'}}]};
let change;
const form={elements:{deliverySlot:{get value(){return selected;}},institutionLocation:location,institutionName:{value:''}},
  querySelector(selector){return {'[data-school-fields]':institution,'[data-school-other]':other,'[data-local-fields]':local,'[name="area"],[name="nn_area"]':area}[selector] || null;},
  querySelectorAll(){return [windowText];},addEventListener(_event,handler){change=handler;}};
runInNewContext(scripts[0],{Event:class {},document:{readyState:'complete',querySelector(){return {form};}}});
for(const [route,school,showWindow] of [['school',true,true],['school-express',true,false],['express',false,false],['local-vapi-morning',false,false]]){
  selected=route;change();assert.equal(institution.hidden,!school);assert.equal(institution.disabled,!school);assert.equal(input.disabled,!school);assert.equal(localInput.disabled,school);assert.equal(windowText.hidden,!showWindow);
}
assert.equal(area.value,'Vapi');
selected='school';location.value='campus:lit';change();
assert.equal(other.hidden,true);assert.equal(input.disabled,true);assert.equal(form.elements.institutionName.value,'Saved college');
config.delivery.slots.forEach(s=>s.enabled=false);
assert.doesNotMatch(deliverySlotsFields(config,{delivery:{daman:20}}),/value="school"/);
assert.match(deliverySlotsFields(config,{delivery:{daman:20}}),/value="school-express"/);
console.log('Delivery UI passed: ₹5 institution fee, destination fields, saved institution, scheduled area, urgent delivery and unavailable windows.');
