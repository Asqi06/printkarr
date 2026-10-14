// Run: node scripts/analytics-check.mjs. No network or customer data.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

function analytics(consent, id = 'G-TEST') {
  const storage = new Map([['pk_analytics_consent_v1',consent]]), handlers = {}, scripts = [];
  let quote = {};
  const document = {
    querySelector(selector) { return selector.includes('printkarr-analytics') ? {content:id} : selector === '[data-print-quote]' ? quote : null; },
    addEventListener(name,fn) { (handlers[name] ||= []).push(fn); },
    createElement() { return {}; }, head:{append(script) {scripts.push(script);}}
  };
  const context = {document,location:{pathname:'/order',origin:'https://printkarr.in'},URL,WeakSet,Date,localStorage:{getItem:key=>storage.get(key),setItem:(key,value)=>storage.set(key,value)}};
  context.window=context;
  runInNewContext(readFileSync(new URL('../public/privacy.js',import.meta.url),'utf8'),context);
  return {
    scripts, storage,
    events:()=>Array.from(context.dataLayer || []).filter(args=>args[0]==='event').map(args=>Array.from(args)),
    dispatch(name,event={}) { for(const handler of handlers[name] || [])handler(event); },
    nextScreen() { quote={}; }
  };
}
for (const [consent,id] of [['denied','G-TEST'],['granted','']]) {
  const tracker=analytics(consent,id);
  tracker.dispatch('print-screen');
  tracker.dispatch('submit',{target:{checkValidity:()=>true,matches:()=>true}});
  assert.equal(tracker.scripts.length,0,'No Google requests without consent and configuration');
  assert.equal(tracker.events().length,0);
}
const tracker=analytics('granted');
assert.equal(tracker.scripts.length,1);
tracker.dispatch('print-screen'); // Repeated enhancement does not count a second view.
tracker.nextScreen();tracker.dispatch('print-screen');
function submit(selector,valid=true,value='') {
  tracker.dispatch('submit',{target:{checkValidity:()=>valid,matches:s=>s.includes(selector)},submitter:{value}});
}
submit('data-home-upload');submit('quick-order');
submit('quick-order',true,'wallet');submit('quick-order',true,'add');
submit('data-home-upload',false);
assert.equal(tracker.events().filter(e=>e[1]==='print_options_view').length,2);
assert.equal(tracker.events().filter(e=>e[1]==='print_upload_start').length,1);
assert.equal(tracker.events().filter(e=>e[1]==='begin_checkout').length,1);
for(const event of tracker.events().filter(e=>e[1].startsWith('print_') || e[1]==='begin_checkout')) assert.equal(event.length,2,'Funnel events contain no file or contact payload');
tracker.storage.set('pk_analytics_consent_v1','denied');
const before=tracker.events().length;
submit('data-home-upload');tracker.nextScreen();tracker.dispatch('print-screen');
assert.equal(tracker.events().length,before,'Withdrawal stops future funnel events');
console.log('Analytics checks passed: consent, disabled configuration, screen deduplication, valid submits, auxiliary actions and no customer payload.');
