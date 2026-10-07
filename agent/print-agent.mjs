// PrintKarr laptop agent (V0 pilot). Polls the queue, prints serially
// (one job at a time — files can never mix), reports back.
import 'dotenv/config';
//
//   PRINTKARR_URL=http://localhost:3000 AGENT_TOKEN=... PRINTER_NAME="Epson L3250"
//   DRY_RUN=1 npm run agent        # full loop, no printer touched
//   RUN_ONCE=1 ...                 # a single job, then exit (tests)
//
// Real printing uses SumatraPDF Portable (free):
//   SUMATRA_PDF=C:\tools\SumatraPDF.exe  (or on PATH as SumatraPDF.exe)
// PRINT_SETTINGS overrides the auto duplex/mono flags — confirm exact
// flags against your machine with one manual print first (V0 Phase 1).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { buildOrderCover } from './cover.js';
import { printSettings, printJobs, checkRenderedPages } from './print-settings.js';
import { splitMixedPdf } from '../lib/files.js';
import { acquireAgentLock } from './instance-lock.js';

const BASE = process.env.PRINTKARR_URL || 'http://localhost:3000';
const TOKEN = process.env.AGENT_TOKEN || '';
const PRINTER = process.env.PRINTER_NAME || 'Epson L3250';
const SUMATRA = process.env.SUMATRA_PDF || 'SumatraPDF.exe';
const DRY = process.env.DRY_RUN === '1';
const POLL = Math.max(2000, Number(process.env.POLL_MS) || 2000);
const RUN_ONCE = process.env.RUN_ONCE === '1';
const TMP = path.join(os.tmpdir(), 'printkarr-agent');
const MONITOR = fileURLToPath(new URL('./print-monitored.ps1', import.meta.url));
const PRINT_TIMEOUT = Math.min(7200, Math.max(300, Number(process.env.PRINT_TIMEOUT_SECONDS) || 1800));

if (!TOKEN) {
  console.error('AGENT_TOKEN is not set — refusing to start.');
  process.exit(1);
}
const instanceLock = process.platform === 'win32' ? await acquireAgentLock() : null;
if (process.platform === 'win32' && !instanceLock) {
  console.log('Another PrintKarr agent is already running; leaving it in control.');
  process.exit(0);
}
fs.mkdirSync(TMP, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(p, opts = {}) {
  const r = await fetch(BASE + p, {
    signal: AbortSignal.timeout(30000),
    ...opts,
    headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json', ...(opts.headers || {}) }
  });
  if (r.status === 204) return null;
  const body = await r.text();
  let data = {};
  try { data = JSON.parse(body); } catch { /* non-JSON error */ }
  if (!r.ok) throw new Error(`${p} -> ${r.status} ${data.error || body.slice(0, 120)}`);
  return data;
}

function run(cmd, args, timeoutMs = 180000, bench = false) {
  return new Promise((resolve, reject) => {
    const child = execFile(cmd, args, { timeout: timeoutMs, windowsHide: true }, (err, stdout, stderr) => {
      if (err && !(bench && err.code === 1 && !err.killed)) reject(new Error(`${cmd} failed: ${(stderr || err.message).slice(0, 300)}`));
      else resolve(stdout);
    });
    child.on('error', reject);
  });
}

async function printFile(file, order, tag, appData) {
  const settings = printSettings(order, tag === 'cover' ? '' : process.env.PRINT_SETTINGS);
  if (DRY) {
    console.log(`DRY-PRINT [${tag}] ${path.basename(file)} -> "${PRINTER}" (${settings})`);
    return { dryRun: true };
  }
  const started = Date.now();
  if (process.platform !== 'win32') throw new Error('Monitored printing requires Windows');
  const report = JSON.parse(await run('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', MONITOR, '-Printer', PRINTER, '-Sumatra', SUMATRA, '-File', file, '-Settings', settings, '-AppData', appData, '-TimeoutSeconds', String(PRINT_TIMEOUT)], (PRINT_TIMEOUT + 30) * 1000));
  if (!report.queueDrained) throw new Error('Printer queue did not drain');
  console.log(`queue drained [${tag}] ${path.basename(file)} (${settings}) in ${Date.now() - started}ms`);
  return report;
}

async function processJob(order) {
  if (!/^PK-[A-Z0-9-]{3,}$/.test(String(order.id))) throw new Error('Invalid order ID from server');
  const workDir = path.join(TMP, order.id);
  const appData = path.join(workDir, 'sumatra');
  fs.mkdirSync(workDir, { recursive: true });
  try {
    await api(`/api/agent/${order.id}/started`, { method: 'POST', body: JSON.stringify({splitMixed:order.splitMixed === true}) });
    console.log(`job ${order.id}: ${order.document} (${order.pages}p x${order.copies}, ${order.printType})`);
    const dl = await fetch(`${BASE}/api/agent/file/${order.id}`, { headers: { Authorization: 'Bearer ' + TOKEN }, signal: AbortSignal.timeout(120000) });
    if (!dl.ok) throw new Error(`download -> ${dl.status}`);
    const ext = /^(png|jpe?g)$/i.test(order.fileExt || '') ? String(order.fileExt).toLowerCase() : 'pdf';
    const srcPdf = path.join(workDir, `${order.id}.${ext}`);
    const bytes = Buffer.from(await dl.arrayBuffer());
    if (!bytes.length || (ext === 'pdf' && !bytes.subarray(0, 1024).includes(Buffer.from('%PDF-')))) throw new Error('Downloaded file is empty or is not a PDF');
    fs.writeFileSync(srcPdf, bytes);
    fs.mkdirSync(appData, { recursive: true });
    fs.writeFileSync(path.join(appData, 'SumatraPDF-settings.txt'), 'ReuseInstance = false\nRememberOpenedFiles = false\nRememberStatePerDocument = false\nRestoreSession = false\nCheckForUpdates = false\n');
    const jobs = printJobs(order);
    if (order.splitMixed && process.env.PRINT_SETTINGS) throw new Error('Clear PRINT_SETTINGS for split printing: each PDF must use its own colour and sides settings.');
    for (const job of jobs) printSettings(job, process.env.PRINT_SETTINGS);
    const files = new Map([['document',srcPdf]]);
    if (order.splitMixed) {
      for (const part of await splitMixedPdf(bytes,order)) {
        const file=path.join(workDir,`${order.id}-${part.printType}.pdf`);
        fs.writeFileSync(file,part.bytes); files.set(part.printType,file);
      }
    }
    if (order.sides === 'double' && /L3250/i.test(PRINTER)) throw new Error('L3250 requires manual duplex; print this order manually and confirm output');
    if (!DRY) {
      const log = await run(SUMATRA, ['-appdata', appData, '-bench', srcPdf], Math.max(180000, Number(order.filePages || order.pages) * 10000), true);
      order.filePages = checkRenderedPages(log, order.filePages || (order.pageRange ? null : order.pages));
      if (order.splitMixed) {
        for (const job of jobs) {
          const partLog = await run(SUMATRA,['-appdata',appData,'-bench',files.get(job.tag)],Math.max(180000,job.filePages*10000),true);
          checkRenderedPages(partLog,job.filePages);
        }
      } else { jobs[0].filePages=order.filePages; printSettings(jobs[0],process.env.PRINT_SETTINGS); }
      console.log(`job ${order.id}: all source pages rendered before printing`);
    }
    const cover = await buildOrderCover(order);
    const coverPdf = path.join(workDir, `${order.id}-cover.pdf`);
    fs.writeFileSync(coverPdf, cover);
    if (!DRY) checkRenderedPages(await run(SUMATRA,['-appdata',appData,'-bench',coverPdf],180000,true),1);
    console.log(`job ${order.id}: branded cover ${cover.length} bytes (one page)`);
    // Cover stays its own single-sided job: merging it into a duplexed
    // document would share its sheet with page 1. Two jobs, correct output.
    await printFile(coverPdf, { ...order, sides: 'single', printType: 'color', pageRange: null, copies: 1 }, 'cover', appData);
    const report = {queueDrained:true,observedJobs:0};
    const completedParts=[];
    for (const job of jobs) {
      const partReport = await printFile(files.get(job.tag),job,job.tag,appData);
      report.queueDrained = report.queueDrained && partReport.queueDrained === true;
      report.observedJobs += partReport.observedJobs || 0;
      completedParts.push(job.tag);
    }
    const doneRes = await api(`/api/agent/${order.id}/done`, { method: 'POST', body: JSON.stringify({ splitMixed:order.splitMixed === true, completedParts, queueDrained: report.queueDrained === true, observedJobs: report.observedJobs || 0 }) });
    console.log(`job ${order.id}: ${doneRes?.verificationRequired ? 'OUTPUT CHECK REQUIRED — confirm all pages in admin before the queue continues' : 'READY'}`);
  } catch (e) {
    console.log(`job ${order.id}: FAILED — ${e.message}`);
    stopping = true; // A printer fault must not consume the next customer's paper.
    try {
      await api(`/api/agent/${order.id}/failed`, { method: 'POST', body: JSON.stringify({ error: e.message }) });
    } catch (e2) {
      console.log(`could not report failure: ${e2.message}`);
    }
  } finally {
    try { fs.rmSync(workDir, { recursive: true, force: true }); } catch {}
  }
}

let stopping = false;
let pauseReason = '';

async function main() {
  console.log(`agent up → ${BASE} as printer "${PRINTER}"${DRY ? ' (DRY RUN — no paper moves)' : ''}`);
  for (;;) {
    if (stopping) {
      console.log('agent stopped cleanly.');
      return;
    }
    let next = null;
    try {
      const d = await api('/api/agent/next?splitMixed=1');
      next = d && d.order;
      if (d?.paused && d.reason !== pauseReason) console.log(`queue paused: ${d.reason}`);
      pauseReason = d?.reason || '';
    } catch (e) {
      console.log(`queue poll failed: ${e.message}`);
    }
    if (!next) {
      if (RUN_ONCE) return;
      await sleep(POLL);
      continue;
    }
    await processJob(next);
    if (RUN_ONCE || stopping) return;
  }
}

process.on('SIGINT', () => {
  // Never die mid-print: wedged PRINTING orders block the queue forever.
  if (stopping) {
    console.log('forced exit — the current job may be wedged in PRINTING.');
    process.exit(1);
  }
  stopping = true;
  console.log('finishing the current job, then stopping… (Ctrl+C again to force)');
});

main().catch((e) => {
  console.error('agent crashed:', e.message);
  process.exitCode = 1;
}).finally(() => instanceLock?.close());
