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
import { buildCoverPdf } from './cover.js';

const BASE = process.env.PRINTKARR_URL || 'http://localhost:3000';
const TOKEN = process.env.AGENT_TOKEN || '';
const PRINTER = process.env.PRINTER_NAME || 'Epson L3250';
const SUMATRA = process.env.SUMATRA_PDF || 'SumatraPDF.exe';
const DRY = process.env.DRY_RUN === '1';
const POLL = Math.max(2000, Number(process.env.POLL_MS) || 15000);
const RUN_ONCE = process.env.RUN_ONCE === '1';
const QPDF = process.env.QPDF_BIN || '';
const TMP = path.join(os.tmpdir(), 'printkarr-agent');

if (!TOKEN) {
  console.error('AGENT_TOKEN is not set — refusing to start.');
  process.exit(1);
}
fs.mkdirSync(TMP, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(p, opts = {}) {
  const r = await fetch(BASE + p, {
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

function run(cmd, args, timeoutMs = 180000) {
  return new Promise((resolve, reject) => {
    const child = execFile(cmd, args, { timeout: timeoutMs, windowsHide: true }, (err, stdout, stderr) => {
      if (err) reject(new Error(`${cmd} failed: ${(stderr || err.message).slice(0, 300)}`));
      else resolve(stdout);
    });
    child.on('error', reject);
  });
}

function printSettings(order) {
  if (process.env.PRINT_SETTINGS) return process.env.PRINT_SETTINGS;
  const duplex = order.sides === 'double' ? 'duplexlong' : 'simplex';
  const tone = order.printType === 'color' ? 'color' : 'monochrome';
  return `${duplex},${tone}`;
}

async function printFile(file, order, tag) {
  const settings = printSettings(order);
  if (DRY) {
    console.log(`DRY-PRINT [${tag}] ${path.basename(file)} -> "${PRINTER}" (${settings})`);
    return;
  }
  await run(SUMATRA, ['-print-to', PRINTER, '-print-settings', settings, '-silent', file]);
  console.log(`printed [${tag}] ${path.basename(file)} (${settings})`);
}

async function maybeSubset(srcPdf, order, workDir) {
  // Page ranges need a real PDF splitter. If qpdf is present we subset;
  // otherwise the whole document prints (noted on the cover + in logs).
  if (!order.pageRange || !QPDF) return { file: srcPdf, ranged: false };
  const out = path.join(workDir, `${order.id}-range.pdf`);
  const spec = order.pageRange.replace(/\s+/g, '').split(',').join(',');
  try {
    if (DRY) {
      console.log(`DRY-SUBSET [${order.id}] pages ${spec} (qpdf)`);
      return { file: srcPdf, ranged: false };
    }
    await run(QPDF, ['--empty', '--pages', srcPdf, spec, '--', out]);
    return { file: out, ranged: true };
  } catch (e) {
    console.log(`subset failed for ${order.id}, printing whole document: ${e.message}`);
    return { file: srcPdf, ranged: false };
  }
}

async function processJob(order) {
  const workDir = path.join(TMP, order.id);
  fs.mkdirSync(workDir, { recursive: true });
  await api(`/api/agent/${order.id}/started`, { method: 'POST', body: '{}' });
  console.log(`job ${order.id}: ${order.document} (${order.pages}p x${order.copies}, ${order.printType})`);
  try {
    const dl = await fetch(`${BASE}/api/agent/file/${order.id}`, { headers: { Authorization: 'Bearer ' + TOKEN } });
    if (!dl.ok) throw new Error(`download -> ${dl.status}`);
    const srcPdf = path.join(workDir, `${order.id}.pdf`);
    fs.writeFileSync(srcPdf, Buffer.from(await dl.arrayBuffer()));
    const { file: docPdf, ranged } = await maybeSubset(srcPdf, order, workDir);
    const cover = buildCoverPdf(`PRINTKARR ${order.id}`, [
      ['Document', order.document],
      ['Pages x copies', `${order.pages} x ${order.copies}${order.pageRange ? ` (${order.pageRange}${ranged ? '' : ', full doc printed'})` : ''}`],
      ['Spec', `${order.printType === 'bw' ? 'B&W' : 'Colour'} / ${order.sides}-sided / ${order.paper}`],
      ['Printer', PRINTER],
      ['Queued', new Date().toLocaleString('en-IN')]
    ]);
    const coverPdf = path.join(workDir, `${order.id}-cover.pdf`);
    fs.writeFileSync(coverPdf, cover);
    await printFile(coverPdf, { ...order, sides: 'single', printType: 'bw' }, 'cover');
    for (let c = 1; c <= Math.max(1, Math.min(200, order.copies)); c++) {
      await printFile(docPdf, order, `copy ${c}/${order.copies}`);
    }
    await api(`/api/agent/${order.id}/done`, { method: 'POST', body: '{}' });
    console.log(`job ${order.id}: READY`);
  } catch (e) {
    console.log(`job ${order.id}: FAILED — ${e.message}`);
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
async function main() {
  console.log(`agent up → ${BASE} as printer "${PRINTER}"${DRY ? ' (DRY RUN — no paper moves)' : ''}`);
  for (;;) {
    if (stopping) {
      console.log('agent stopped cleanly.');
      return;
    }
    let next = null;
    try {
      const d = await api('/api/agent/next');
      next = d && d.order;
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
  process.exit(1);
});
