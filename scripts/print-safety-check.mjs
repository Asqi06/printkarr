// Paper-free checks; no production DB, network, customer documents or printer jobs.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {runInNewContext} from 'node:vm';
import {execFileSync} from 'node:child_process';
import {janitor} from '../lib/janitor.js';
import {blankDb,loadDb,saveDb} from '../lib/db.js';
import {transition,canTransition} from '../lib/machine.js';
import {printSettings,printJobs,checkRenderedPages} from '../agent/print-settings.js';
import {buildCoverPdf,validatePdf} from '../agent/cover.js';
const root=fs.mkdtempSync(path.join(os.tmpdir(),'printkarr-safety-'));
try {
  const uploads=path.join(root,'data','uploads'), dbFile=path.join(root,'db.json');fs.mkdirSync(uploads,{recursive:true});
  const old=new Date(Date.now()-48*3600e3).toISOString(), recent=new Date().toISOString();
  const db=blankDb();
  db.orders=[{id:'PK-OLD',status:'DELIVERED',updatedAt:old},{id:'PK-NEW',status:'DELIVERED',updatedAt:recent},{id:'PK-FAIL',status:'PRINT_FAILED',updatedAt:old},{id:'PK-ACTIVE',status:'PRINTING',updatedAt:old},{id:'PK-BAD',status:'DELIVERED',updatedAt:'invalid'}];
  db.drafts=[{id:'old',stored:'a'.repeat(32),createdAt:old},{id:'new',stored:'b'.repeat(32),createdAt:recent}];
  const orphan='c'.repeat(32);
  for(const name of [...db.orders.map(o=>o.id+'.pdf'),...db.drafts.map(d=>d.stored),orphan,'unknown.txt']) {fs.writeFileSync(path.join(uploads,name),'fixture');fs.utimesSync(path.join(uploads,name),new Date(old),new Date(old));}
  saveDb(db,dbFile);assert.equal(janitor(root,15,dbFile),3);
  assert.ok(!fs.existsSync(path.join(uploads,'PK-OLD.pdf')));assert.ok(!fs.existsSync(path.join(uploads,orphan)));
  for(const name of ['PK-NEW.pdf','PK-FAIL.pdf','PK-ACTIVE.pdf','PK-BAD.pdf','b'.repeat(32),'unknown.txt']) assert.ok(fs.existsSync(path.join(uploads,name)),name);
  assert.equal(loadDb(dbFile).drafts.length,1);assert.ok(loadDb(dbFile).orders[0].fileDeletedAt);assert.equal(janitor(root,15,dbFile),0);
  const atlasSource=fs.readFileSync(new URL('../lib/atlas.js',import.meta.url),'utf8');
  const syncBody=atlasSource.slice(atlasSource.indexOf('async function syncFiles()'),atlasSource.indexOf('export async function flushAtlas()'));
  const cloud=[{_id:'active-current',filename:'PK-ACTIVE.pdf'},{_id:'active-old',filename:'PK-ACTIVE.pdf'},{_id:'deleted-current',filename:'PK-OLD.pdf'},{_id:'deleted-old',filename:'PK-OLD.pdf'}],deleted=[];
  const activeStat=fs.statSync(path.join(uploads,'PK-ACTIVE.pdf'));
  const sync=runInNewContext(syncBody+'\n syncFiles;',{fs:{...fs,readdirSync:()=>['PK-ACTIVE.pdf']},path,uploadsDir:uploads,remoteFiles:new Map([['PK-ACTIVE.pdf',{id:'active-current',size:activeStat.size,mtimeMs:Math.round(activeStat.mtimeMs)}],['PK-OLD.pdf',{id:'deleted-current'}]]),files:{find:()=>({toArray:async()=>cloud})},bucket:{delete:async id=>deleted.push(id)}});
  await sync();assert.deepEqual(deleted,['active-old','deleted-current','deleted-old']);
  const source=fs.readFileSync(new URL('../server.mjs',import.meta.url),'utf8').replaceAll('\r\n','\n');
  const memory=blankDb();memory.orders=[{id:'PK-ONE',status:'PRINTING',pages:36,copies:1,history:[]},{id:'PK-TWO',status:'PRINT_QUEUE',createdAt:old,history:[]}];
  function handler(method,route){
    let result;const start=source.indexOf(`app.${method}('${route}'`),end=source.indexOf('\napp.',start+1);assert.ok(start>=0);
    runInNewContext(source.slice(start,end),{app:{[method](...args){result=args.at(-1);}},agentAuth(){},loadDb:()=>memory,saveDb(){},safeOrderId:id=>id,agentJob:o=>({...o}),notifyState(){},transition});return result;
  }
  const response=()=>({code:200,status(code){this.code=code;return this;},json(body){this.body=body;},end(){this.ended=true;}});
  const next=response();handler('get','/api/agent/next')({},next);assert.equal(next.body.paused,true);
  const oldAgent=response();handler('post','/api/agent/:id/done')({params:{id:'PK-ONE'},body:{}},oldAgent);assert.equal(oldAgent.code,400);assert.equal(memory.orders[0].status,'PRINTING');
  const done=response();handler('post','/api/agent/:id/done')({params:{id:'PK-ONE'},body:{queueDrained:true,observedJobs:1}},done);assert.equal(done.body.verificationRequired,true);assert.equal(memory.orders[0].status,'PRINTING');assert.equal(memory.orders[0].printAwaitingVerification,true);
  const fail=response();handler('post','/api/agent/:id/failed')({params:{id:'PK-ONE'},body:{error:'incomplete output'}},fail);assert.equal(memory.orders[0].status,'PRINT_FAILED');
  const paused=response();handler('get','/api/agent/next')({},paused);assert.equal(paused.body.paused,true);
  assert.ok(canTransition('PRINT_FAILED','PRINTED'));transition(memory.orders[0],'PRINTED',{by:'operator'});transition(memory.orders[0],'READY_FOR_PICKUP',{by:'operator'});
  const unblocked=response();handler('get','/api/agent/next')({},unblocked);assert.equal(unblocked.body.order.id,'PK-TWO');
  const agent=fs.readFileSync(new URL('../agent/print-agent.mjs',import.meta.url),'utf8');
  const jobFunction=agent.slice(agent.indexOf('async function processJob('),agent.indexOf('\nlet stopping'));
  const prints=[],calls=[],reports=[];let broken=false, splitMode=false, failColour=false;
  const render=count=>'page count: '+count+'\n'+Array.from({length:count},(_,i)=>`pagerender ${i+1}: 1 ms`).join('\n');
  const log='page count: 36\n'+Array.from({length:36},(_,i)=>`pagerender ${i+1}: 1 ms`).join('\n');
  const context={path,TMP:root,fs:{mkdirSync(){},writeFileSync(){},rmSync(){}},DRY:false,PRINTER:'Fake printer',SUMATRA:'mock',BASE:'fixture',TOKEN:'fixture',process:{env:{}},Buffer,AbortSignal,console:{log(){}},printSettings,printJobs,checkRenderedPages,buildCoverPdf,validatePdf,stopping:false,
    api:async(p,opts)=>{calls.push(p);if(p.endsWith('/done'))reports.push(JSON.parse(opts.body));return {verificationRequired:true};},fetch:async()=>({ok:true,arrayBuffer:async()=>buildCoverPdf('Mock',[['Sample','No paper']])}),splitMixedPdf:async()=>[{printType:'bw',bytes:Buffer.from('mock')},{printType:'color',bytes:Buffer.from('mock')}],run:async(_exe,args)=>splitMode ? broken && args.includes(path.join(root,'PK-SPLIT','PK-SPLIT-color.pdf')) ? render(1) : render(args.includes(path.join(root,'PK-SPLIT','PK-SPLIT-bw.pdf')) ? 3 : args.includes(path.join(root,'PK-SPLIT','PK-SPLIT-color.pdf')) ? 2 : 5) : broken ? log.replace('pagerender 36:', 'missing 36:') : log,
    printFile:async(file,order,tag)=>{prints.push(tag);if(failColour && tag==='color')throw new Error('Colour printer fault');return {queueDrained:true,observedJobs:1};}};
  const job=runInNewContext(jobFunction+'\nprocessJob;',context);
  await job({id:'PK-CHECK',pages:36,filePages:36,copies:1,sides:'single',printType:'bw'});assert.deepEqual(prints,['cover','document']);assert.ok(calls.includes('/api/agent/PK-CHECK/done'));
  prints.length=0;calls.length=0;broken=true;await job({id:'PK-CHECK',pages:36,filePages:36,copies:1,sides:'single',printType:'bw'});assert.equal(prints.length,0);assert.ok(calls.includes('/api/agent/PK-CHECK/failed'));assert.equal(context.stopping,true);
  splitMode=true;broken=false;context.stopping=false;prints.length=calls.length=0;
  const split={id:'PK-SPLIT',pages:5,filePages:5,copies:2,sides:'single',printType:'mixed',splitMixed:true,bwPages:3,colorPages:2,bwRange:'1-3',colorRange:'4-5'};
  await job({...split});assert.deepEqual(prints,['cover','bw','color']);assert.deepEqual(reports.at(-1).completedParts,['bw','color']);assert.equal(reports.at(-1).observedJobs,2);
  broken=true;prints.length=calls.length=0;await job({...split});assert.deepEqual(prints,[]);assert.ok(calls.includes('/api/agent/PK-SPLIT/failed'),'Every split set renders before any paper');
  broken=false;failColour=true;prints.length=calls.length=0;await job({...split});assert.ok(calls.includes('/api/agent/PK-SPLIT/failed'));assert.ok(!calls.includes('/api/agent/PK-SPLIT/done'),'Partial printing cannot report success');
  if (process.platform === 'win32') {
    const monitor=path.resolve('agent/print-monitored.ps1'), mock=path.join(root,'monitor-mock.ps1');
    fs.writeFileSync(mock,`param([string]$Mode,[string]$Monitor)
$script:started=$false; $script:poll=0; $script:clock=0; $script:removed=@()
function Get-Printer { param($Name) @{PrinterStatus= $(if($Mode -eq 'offline'){128}else{0})} }
function Get-PrintJob { param($PrinterName,$ErrorAction)
  if ($Mode -eq 'busy') { return [pscustomobject]@{ID=99;DocumentName='foreign.pdf';JobStatus='Printing'} }
  if (!$script:started) { return }
  $script:poll++
  if ($script:poll -eq 1 -or $Mode -eq 'fault') { return [pscustomobject]@{ID=7;DocumentName='sample.pdf';JobStatus=$(if($Mode -eq 'fault'){'Error'}else{'Printing'})} }
}
function Start-Process { param($FilePath,$ArgumentList,$WindowStyle,[switch]$PassThru)
  $script:started=$true
  $p=[pscustomobject]@{HasExited=$true;ExitCode=$(if($Mode -eq 'exit') {5}else{0});Id=123}
  $p | Add-Member -MemberType ScriptMethod -Name Refresh -Value {}
  $p | Add-Member -MemberType ScriptMethod -Name WaitForExit -Value {}
  return $p
}
function Stop-Process {param($Id,$ErrorAction)}
function Remove-PrintJob {param($PrinterName,$ID,$ErrorAction) $script:removed+= $ID; Write-Output "CANCEL:$ID"}
function Start-Sleep {param($Milliseconds)}
function Get-Date { $script:clock++; [datetime]'2026-10-02' | ForEach-Object {$_.AddSeconds($script:clock)} }
& $Monitor -Printer Fake -Sumatra mock.exe -File sample.pdf -Settings simplex -AppData fixture
exit $LASTEXITCODE
`);
    const check=mode=>{try {return {code:0,out:execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File',mock,'-Mode',mode,'-Monitor',monitor],{encoding:'utf8',windowsHide:true,timeout:15000,stdio:['ignore','pipe','pipe']})};}catch(e){return {code:e.status,out:String(e.stdout),err:String(e.stderr)};}};
    const success=check('ok');assert.equal(success.code,0);assert.match(success.out,/"queueDrained":true/);assert.match(success.out,/"observedJobs":1/);
    for(const mode of ['busy','offline']){const stopped=check(mode);assert.equal(stopped.code,1);assert.doesNotMatch(stopped.out,/CANCEL:/);assert.doesNotMatch(stopped.out,/queueDrained/);}
    const fault=check('fault');assert.equal(fault.code,1);assert.match(fault.out,/CANCEL:7/);assert.doesNotMatch(fault.out,/CANCEL:99/);
    const exit=check('exit');assert.equal(exit.code,1);assert.match(exit.err,/code 5/);
  }
  console.log('PASS: file retention, cloud duplicate cleanup, abandoned uploads, render failure, sequential printing, false-success rejection, queue pause and mocked Windows printer monitoring.');
} finally {fs.rmSync(root,{recursive:true,force:true});}
