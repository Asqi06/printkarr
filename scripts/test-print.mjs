// REAL three-sheet check: cover, one B&W page, one colour page.
// Stop the idle production agent first. Uses a loopback fixture, never the live queue or DB.
import 'dotenv/config';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {createServer} from 'node:http';
import {execFile, spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {PDFDocument, rgb} from 'pdf-lib';
import {printPlan} from '../public/print-plan.js';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const PRINTER=process.env.PRINTER_NAME || 'Epson L3250';
const SUMATRA=process.env.SUMATRA_PDF || 'SumatraPDF.exe';
const run=(cmd,args)=>new Promise((resolve,reject)=>execFile(cmd,args,{timeout:30000,windowsHide:true},(error,out)=>error?reject(error):resolve(out)));

async function main(){
 assert.equal(process.platform,'win32','Real print verification requires Windows.');
 const printer=PRINTER.replaceAll("'","''");
 const state=JSON.parse(await run('powershell.exe',['-NoProfile','-NonInteractive','-Command',`$p=Get-Printer -Name '${printer}' -ErrorAction Stop; @{status=[int]$p.PrinterStatus;queued=@(Get-PrintJob -PrinterName '${printer}').Count}|ConvertTo-Json -Compress`]));
 assert.equal(state.status & 0x005418DB,0,'Printer needs attention. Turn it on and clear any fault.');
 assert.equal(state.queued,0,'Finish existing printer jobs before running the check.');
 if(!fs.existsSync(SUMATRA))await run('where.exe',[SUMATRA]);

 const pdf=await PDFDocument.create();
 const bw=pdf.addPage([595,842]);bw.drawText('PRINTKARR B&W CHECK',{x:60,y:760,size:24});bw.drawText('Expected: one monochrome sheet, page 1.',{x:60,y:710,size:14});
 const colour=pdf.addPage([595,842]);colour.drawText('PRINTKARR COLOUR CHECK',{x:60,y:760,size:24});
 for(const [i,color] of [rgb(1,0,0),rgb(0,0.65,0),rgb(0,0,1)].entries())colour.drawRectangle({x:60+i*130,y:590,width:100,height:100,color});
 colour.drawText('Expected: red, green and blue blocks, page 2.',{x:60,y:540,size:14});
 const bytes=Buffer.from(await pdf.save()), token=crypto.randomUUID();
 const order={id:'PK-SELFTEST-'+Date.now().toString(36).toUpperCase(),document:'Local printer self-check.pdf',filePages:2,pages:2,paper:'A4',...printPlan({printType:'mixed',splitMixed:'1',mixedRange:'2',sides:'single',copies:1},2)};
 let offered=false,started=false,report,failure;
 const server=createServer(async(req,res)=>{
  const json=(code,body)=>{res.writeHead(code,{'Content-Type':'application/json'});res.end(JSON.stringify(body));};
  if(req.headers.authorization!=='Bearer '+token)return json(401,{error:'Fixture authorization required.'});
  if(req.method==='GET' && req.url==='/api/agent/next?splitMixed=1'){
   if(offered){res.writeHead(204);return res.end();}offered=true;return json(200,{order});
  }
  if(req.method==='GET' && req.url==='/api/agent/file/'+order.id && started){res.writeHead(200,{'Content-Type':'application/pdf'});return res.end(bytes);}
  if(req.url===`/api/agent/${order.id}/progress`)return json(200,{ok:true,stopRequested:false});
  let body='';for await(const part of req)body+=part;
  let input;try{input=JSON.parse(body);}catch{return json(400,{error:'Invalid fixture request.'});}
  if(req.method==='POST' && req.url===`/api/agent/${order.id}/started`){if(input.splitMixed!==true)return json(400,{error:'Split capability required.'});started=true;return json(200,{ok:true});}
  if(req.method==='POST' && req.url===`/api/agent/${order.id}/failed`){failure=String(input.error || 'Printer failed');return json(200,{ok:true});}
  if(req.method==='POST' && req.url===`/api/agent/${order.id}/done`){report=input;return json(200,{ok:true,verificationRequired:true});}
  json(404,{error:'Not a fixture endpoint.'});
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{
  console.log('REAL printer check: three sheets, using a temporary local queue. No customer data or payments.');
  const child=spawn(process.execPath,[path.join(ROOT,'agent/print-agent.mjs')],{cwd:ROOT,windowsHide:true,env:{...process.env,PRINTKARR_URL:'http://127.0.0.1:'+server.address().port,AGENT_TOKEN:token,RUN_ONCE:'1',DRY_RUN:'0',PRINT_SETTINGS:'',PRINT_TIMEOUT_SECONDS:'90'}});
  child.stdout.on('data',chunk=>process.stdout.write(chunk));child.stderr.on('data',chunk=>process.stderr.write(chunk));
  const code=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',resolve);});
  assert.equal(code,0,'Agent exited unexpectedly.');
  assert.ok(!failure,failure);
  assert.ok(report,'No output report. Stop the idle automatic agent before running this check.');
  assert.equal(report.splitMixed,true);assert.equal(report.queueDrained,true);assert.deepEqual(report.completedParts,['bw','color']);
  console.log('PASS: source and both PDFs rendered; cover, B&W and colour queues completed.');
  console.log('Inspect the tray: cover + monochrome page 1 + red/green/blue page 2. Queue drain does not prove ink quality.');
 }finally{await new Promise(resolve=>server.close(resolve));}
}
main().catch(error=>{console.error('Printer check failed:',error.message);process.exitCode=1;});
