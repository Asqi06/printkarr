// No database or network: stale snapshots must fail before touching shared files.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { runInNewContext } from 'node:vm';
const source = fs.readFileSync(new URL('../lib/atlas.js', import.meta.url), 'utf8');
const body = source.slice(source.indexOf('export async function flushAtlas()'), source.indexOf('export async function closeAtlas()')).replaceAll('export ', '');
let touched = 0, writes = 0, restored = 0;
const context = {
  atlasEnabled:true, version:1, queued:[{orders:['stale']}], failed:null, flushing:null,
  states:{findOne:async()=>({version:2,data:{orders:['newer']}}),updateOne:async()=>{writes++;return {matchedCount:0};}},
  syncFiles:async()=>{touched++;}, writeLocal:()=>{restored++;}, restoreFiles:async()=>{},
};
const api = runInNewContext(body+'\n({flushAtlas,refreshAtlas});', context);
await assert.rejects(api.flushAtlas, {code:'ATLAS_VERSION_CONFLICT'});
assert.equal(touched,0); assert.equal(writes,0); assert.equal(context.queued.length,1);
context.failed=null;context.queued=[];
await api.refreshAtlas();assert.equal(context.version,2);assert.equal(restored,1);assert.equal(touched,0);
context.states.updateOne=async()=>({matchedCount:1});context.queued=[{orders:['current']}];
await api.flushAtlas();assert.equal(context.version,3);assert.equal(context.queued.length,0);assert.equal(touched,1);

const server=fs.readFileSync(new URL('../server.mjs',import.meta.url),'utf8');
const start=server.slice(server.indexOf('async function start()'));
let attempts=0, timers=0, closes=0;
const lifecycle={bootstrap:async()=>{attempts++;throw Object.assign(new Error('conflict'),{code:'ATLAS_VERSION_CONFLICT'});},app:{listen(){throw new Error('Must not listen');}},setInterval(){timers++;},console:{warn(){},error(){}},closeAtlas:async()=>{closes++;},process:{exitCode:0}};
await runInNewContext(start,lifecycle);
assert.equal(attempts,3);assert.equal(timers,0);assert.equal(closes,1);assert.equal(lifecycle.process.exitCode,1);
attempts=timers=0;
lifecycle.bootstrap=async()=>{if(++attempts===1)throw Object.assign(new Error('changed during boot'),{code:'ATLAS_VERSION_CONFLICT'});};
lifecycle.app.listen=()=>({once(event,fn){if(event==='listening')queueMicrotask(fn);return this;}});
lifecycle.queueMicrotask=queueMicrotask;lifecycle.PORT=0;lifecycle.process.env={};lifecycle.console.log=()=>{};
lifecycle.setInterval=()=>{timers++;return {unref(){}};};
await runInNewContext(start.slice(0,start.indexOf('start().catch'))+'\nstart();',lifecycle);
assert.equal(attempts,2);assert.equal(timers,3);
console.log('Atlas safety passed: stale writes leave cloud files untouched, reads refresh first, failed boot retries then closes with no timers.');
