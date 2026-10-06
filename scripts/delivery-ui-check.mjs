import assert from 'node:assert/strict';
import { runInNewContext } from 'node:vm';
import { deliverySlotsFields } from '../lib/views_order.js';
import { campaignDefaults } from '../lib/campus.js';
// Shared picker: every destination needs an address; institution rates also need its name.
const config=campaignDefaults();
const html=deliverySlotsFields(config,{delivery:{vapi:15,daman:20}});
assert.match(html,/School \/ College · ₹10/);assert.doesNotMatch(html,/value="pickup"|value="college"/);
const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
const input={disabled:false,required:false};
const institution={hidden:false,querySelectorAll(){return [input];}};
const windowText={hidden:false};const area={value:'Daman'};
let selected='school';
const choices=['school','school-express','express','local-vapi-morning'].map(value=>({value,addEventListener(_event,handler){this.change=handler;}}));
const form={querySelector(selector){return selector.includes(':checked')?{value:selected}:area;},querySelectorAll(selector){return selector==='[name="deliverySlot"]'?choices:selector==='[data-school-fields]'?[institution]:[windowText];}};
choices.forEach(c=>c.form=form);
runInNewContext(scripts[0],{document:{readyState:'complete',querySelector(){return choices[0];}}});
for(const [route,school,showWindow] of [['school',true,true],['school-express',true,false],['express',false,false],['local-vapi-morning',false,false]]){
  selected=route;choices[0].change();assert.equal(institution.hidden,!school);assert.equal(input.disabled,!school);assert.equal(input.required,school);assert.equal(windowText.hidden,!showWindow);
}
assert.equal(area.value,'Vapi');
config.delivery.slots.forEach(s=>s.enabled=false);
assert.doesNotMatch(deliverySlotsFields(config,{delivery:{daman:20}}),/value="school"/);
assert.match(deliverySlotsFields(config,{delivery:{daman:20}}),/value="school-express"/);
console.log('Delivery UI passed: institution name, shared address requirements, scheduled area, express and unavailable windows.');
