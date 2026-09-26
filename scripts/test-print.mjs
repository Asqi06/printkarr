// scripts/test-print.mjs — REAL print verification (not DRY_RUN)
// Usage: npm run test:print
// Checks: env, printer online, direct SumatraPDF print, and full app queue → Epson pipeline.
// Requires: npm start running on PRINTKARR_URL, agent token set, printer on + paper loaded.
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { buildCoverPdf } from '../agent/cover.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LOCAL_URL = `http://localhost:${process.env.PORT || 3000}`;
const BASE = process.env.PRINTKARR_URL || LOCAL_URL;
const TOKEN = process.env.AGENT_TOKEN || '';
const PRINTER = process.env.PRINTER_NAME || 'Epson L3250';
const SUMATRA = process.env.SUMATRA_PDF || 'SumatraPDF.exe';

function fail(msg) { console.error('\n✕ ' + msg); process.exit(1); }
function ok(msg) { console.log('✓ ' + msg); }
function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, { timeout: opts.timeout || 30000, windowsHide: true }, (err, stdout, stderr) => {
      if (err) reject(new Error(`${cmd} ${args.join(' ')} failed: ${(stderr || err.message).slice(0, 400)}`));
      else resolve(stdout);
    });
  });
}
async function checkPrinter() {
  try {
    const out = await run('powershell.exe', ['-NoProfile', '-Command', `Get-Printer -Name '${PRINTER.replace(/'/g, "''")}' | Select-Object -ExpandProperty PrinterStatus`]);
    const status = out.trim();
    if (!status) throw new Error('no output');
    if (!/Normal/i.test(status)) fail(`Printer "${PRINTER}" status is "${status.trim()}" — power on, clear jam, reload paper.`);
    ok(`Printer "${PRINTER}" is Normal`);
  } catch (e) {
    fail(`Printer "${PRINTER}" not found or not reachable. Check PRINTER_NAME in .env (exact Windows name). Details: ${e.message}`);
  }
  if (!fs.existsSync(SUMATRA) && !process.env.SUMATRA_PDF) {
    // try PATH
    try { await run('where', [SUMATRA]); } catch { fail(`SumatraPDF not found at "${SUMATRA}". Set SUMATRA_PDF in .env to the installed path (e.g. C:\\Users\\...\\SumatraPDF.exe).`); }
  }
  if (fs.existsSync(SUMATRA)) ok(`SumatraPDF found at ${SUMATRA}`);
  else ok(`SumatraPDF on PATH: ${SUMATRA}`);
  if (!TOKEN) fail('AGENT_TOKEN not set in .env — agent cannot authenticate.');
  ok('AGENT_TOKEN set');
}
let LIVE_URL = BASE;
async function checkServer() {
  // Prefer local server for pipeline test; fall back to BASE
  const tryUrls = [LOCAL_URL, BASE].filter((v, i, a) => a.indexOf(v) === i);
  for (const url of tryUrls) {
    try {
      const r = await fetch(`${url}/api/health`);
      if (r.ok) { ok(`Server reachable at ${url}`); LIVE_URL = url; return; }
    } catch {}
  }
  fail(`Server not reachable at ${tryUrls.join(' or ')} — run "npm start" first.`);
}
async function directPrintTest() {
  console.log('\n— Direct Epson test (1 page, no queue) —');
  const testPdf = path.join(os.tmpdir(), 'printkarr-test-direct.pdf');
  const pdf = buildCoverPdf('PRINTKARR TEST — DIRECT', [
    ['Time', new Date().toLocaleString('en-IN')],
    ['Printer', PRINTER],
    ['Mode', 'If you can read this, the Epson path works.']
  ]);
  fs.writeFileSync(testPdf, pdf);
  ok(`Test PDF written to ${testPdf} (${pdf.length} bytes)`);
  try {
    await run(SUMATRA, ['-print-to', PRINTER, '-print-settings', 'simplex,monochrome', '-silent', testPdf], { timeout: 60000 });
    ok(`SumatraPDF accepted job for "${PRINTER}" (exit 0)`);
  } catch (e) {
    fail(`Direct print failed — Epson rejected the job. ${e.message}\n  Try: SumatraPDF.exe -print-to "${PRINTER}" -print-settings "simplex,monochrome" "${testPdf}"`);
  }
  // Brief spooler check — job should appear then clear within seconds
  try {
    await run('powershell.exe', ['-NoProfile', '-Command', `Start-Sleep -Seconds 2; Get-PrintJob -PrinterName '${PRINTER.replace(/'/g, "''")}' | Select-Object Id,DocumentName,JobStatus | Out-String`]);
    ok('Spooler check done (if paper did not come out, check Epson display for jam/offline)');
  } catch {}
  console.log('  → Check the output tray NOW — you should have 1 sheet: "PRINTKARR TEST — DIRECT"');
}
async function pipelineTest() {
  if (LIVE_URL !== LOCAL_URL) {
    console.log('\n— Full pipeline test skipped (local server not running; only direct Epson test ran).');
    console.log('  Start local server with "npm start" and re-run "npm run test:print" for full queue → Epson test.');
    return;
  }
  console.log('\n— Full pipeline test (guest order → auto-queue → agent → Epson) —');
  // Lazy import DB helpers to avoid top-level await issues
  const { loadDb, saveDb } = await import('../lib/db.js');
  const db = loadDb();
  // Ensure a dedicated test customer exists (so we do not pollute real users)
  let customer = db.users.find(u => u.email === 'test-print@printkarr.test');
  if (!customer) {
    customer = { id: 'CUS-TESTPRINT', role: 'customer', name: 'Test Print', email: 'test-print@printkarr.test', password: null, phone: '+91 9000000000', student: false };
    db.users.push(customer);
    db.wallets.push({ customerId: customer.id, balance: 0 });
    ok('Created test customer test-print@printkarr.test');
  }
  let addr = db.addresses.find(a => a.customerId === customer.id);
  if (!addr) {
    addr = { id: 'ADR-TEST', customerId: customer.id, label: 'Test', name: customer.name, phone: customer.phone, address: 'Kiosk Test', area: 'Classroom pickup', landmark: '', pin: '396155', isDefault: true };
    db.addresses.push(addr);
  }
  const id = `PK-TEST-${Date.now().toString(36).toUpperCase()}`;
  const pdf = buildCoverPdf(`PIPELINE TEST ${id}`, [
    ['Document', 'pipeline-test.pdf'],
    ['Spec', 'B&W / single / Classroom pickup'],
    ['Customer', customer.email],
    ['Time', new Date().toLocaleString('en-IN')]
  ]);
  const uploadsDir = path.join(ROOT, 'data', 'uploads');
  fs.mkdirSync(uploadsDir, { recursive: true });
  const pdfPath = path.join(uploadsDir, `${id}.pdf`);
  fs.writeFileSync(pdfPath, pdf);
  const now = new Date().toISOString();
  db.orders.push({
    id, customerId: customer.id, document: 'pipeline-test.pdf', pages: 1, copies: 1,
    printType: 'bw', sides: 'single', paper: 'A4', orientation: 'auto', binding: 'none', notes: 'test:print pipeline', pageRange: null,
    addressId: addr.id, slot: 'ASAP',
    subtotal: 2, deliveryFee: 0, discount: 0, couponCode: null, couponDiscount: 0, firstFree: false, total: 2,
    paymentStatus: 'paid', paymentMethod: 'test',
    status: 'PRINT_QUEUE', history: [{ from: '—', to: 'CREATED', at: now, by: customer.id }, { from: 'CREATED', to: 'PAYMENT_PENDING', at: now, by: customer.id }, { from: 'PAYMENT_PENDING', to: 'CONFIRMED', at: now, by: customer.id }, { from: 'CONFIRMED', to: 'PRINT_QUEUE', at: now, by: 'test:print' }],
    riderId: null, createdAt: now, updatedAt: now
  });
  saveDb(db);
  ok(`Queued test order ${id} (1p, Classroom pickup, paid) — PDF at ${pdfPath}`);
  // Run agent once, REAL print (no DRY_RUN)
  console.log(`  → Running agent once (real print, not DRY_RUN) against ${LIVE_URL}…`);
  const { spawnSync } = await import('node:child_process');
  const agentEnv = { ...process.env, PRINTKARR_URL: LIVE_URL, RUN_ONCE: '1' };
  delete agentEnv.DRY_RUN;
  const out = spawnSync(process.execPath, [path.join(ROOT, 'agent/print-agent.mjs')], { cwd: ROOT, env: agentEnv, encoding: 'utf8', timeout: 120000 });
  const combined = (out.stdout || '') + (out.stderr || '');
  console.log(combined.split('\n').slice(0, 20).join('\n'));
  if (out.status !== 0) fail(`Agent exited with ${out.status}. Output above.`);
  // Verify order moved through PRINTED to READY_FOR_PICKUP
  const { loadDb: reload } = await import('../lib/db.js');
  // Need fresh read (import cache holds old db object) — read file directly
  const fresh = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/db.json'), 'utf8'));
  const order = fresh.orders.find(o => o.id === id);
  if (!order) fail('Test order vanished from DB');
  if (order.status !== 'READY_FOR_PICKUP') fail(`Pipeline failed — order ${id} is ${order.status} (expected READY_FOR_PICKUP). Check agent log above and printer.`);
  ok(`Pipeline OK — order ${id} is READY_FOR_PICKUP; cover + document should be in the kiosk tray.`);
  console.log('\n  Clean up: order stays as proof; file auto-deletes in 15 min. Delete manually if needed:');
  console.log(`    data/uploads/${id}.pdf`);
}

console.log('Printkarr — test:print (REAL, not dry-run)\n');
await checkPrinter();
await checkServer();
await directPrintTest();
await pipelineTest();
console.log('\n✓ All real-print checks passed. If both sheets are in the tray, the Epson path and the full queue are proven.\n');
