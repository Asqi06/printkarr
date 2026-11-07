import fs from 'node:fs';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

// The supplied artwork stays intact; only the clear top-right area gets metadata.
export async function buildOrderCover(order, queuedAt = new Date()) {
  const pdf = await PDFDocument.load(fs.readFileSync(new URL('./assets/order-cover.pdf', import.meta.url)), {updateMetadata:false,throwOnInvalidObject:true});
  if (pdf.getPageCount() !== 1) throw new Error('The order cover template must have exactly one page.');
  const page = pdf.getPage(0), box = page.getMediaBox();
  const font = await pdf.embedFont(StandardFonts.Helvetica), bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const characters = new Set(font.getCharacterSet());
  // ponytail: standard Latin metadata replaces unsupported characters; embed a Unicode font when multilingual filenames must be reproduced.
  const clean = value => Array.from(String(value ?? '').replace(/\s+/g,' ').slice(0,200), c=>characters.has(c.codePointAt(0)) ? c : '?').join('');
  const x = box.x + box.width - 210, top = box.y + box.height - 100, width = 188;
  const draw = (value, y, size = 7.5, face = font) => {
    let text = clean(value), clipped = false;
    // ponytail: width fitting scans at most 200 characters; use binary search for larger text blocks.
    while (text && face.widthOfTextAtSize(text + (clipped ? '...' : ''), size) > width) { text = text.slice(0,-1); clipped = true; }
    page.drawText(text + (clipped ? '...' : ''), {x,y,size,font:face,color:rgb(0.16,0.20,0.28)});
  };
  draw('ORDER ' + order.id, top - 9, 8.5, bold);
  page.drawLine({start:{x,y:top-15},end:{x:x+width,y:top-15},thickness:0.5,color:rgb(0.02,0.29,0.65)});
  draw('File: ' + (order.document || 'Document'), top - 27);
  draw(`${order.pages} pages x ${order.copies || 1} ${Number(order.copies || 1) === 1 ? 'copy' : 'copies'} | ${order.paper || 'A4'}`, top - 38);
  const mode = order.printType === 'mixed' ? `${order.bwPages} B&W / ${order.colorPages} colour` : order.printType === 'color' ? 'Colour' : 'B&W';
  draw(`${mode} | ${order.sides === 'double' ? 'Both sides' : 'Single-sided'}`, top - 49);
  const date = new Intl.DateTimeFormat('en-IN',{timeZone:'Asia/Kolkata',day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(queuedAt);
  draw('Queued: ' + date + ' IST', top - 60);
  pdf.setTitle('PrintKarr cover - ' + clean(order.id));
  return Buffer.from(await pdf.save({useObjectStreams:false}));
}

// Hand-built one-page PDF for test documents. Zero dependencies —
// plain PDF 1.4 written byte-correct with a validated xref table.
function escText(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

export function buildCoverPdf(title, rows) {
  const content = [];
  content.push('BT /F1 22 Tf 72 770 Td (' + escText(title) + ') Tj ET');
  let y = 736;
  for (const [k, v] of rows) {
    content.push(`BT /F2 12 Tf 72 ${y} Td (${escText(k + ': ' + v)}) Tj ET`);
    y -= 22;
  }
  content.push(`BT /F2 10 Tf 72 80 Td (${escText('Printed by Printkarr V0 pilot — collect at the counter')}) Tj ET`);
  const stream = content.join('\n').replace(/—/g, '-');
  const objs = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>',
    `<< /Length ${Buffer.byteLength(stream, 'latin1')} >>\nstream\n${stream}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'
  ];
  let out = '%PDF-1.4\n';
  const offsets = [];
  objs.forEach((body, i) => {
    offsets.push(Buffer.byteLength(out, 'latin1'));
    out += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xrefAt = Buffer.byteLength(out, 'latin1');
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) out += `${String(off).padStart(10, '0')} 00000 n \n`;
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xrefAt}\n%%EOF`;
  return Buffer.from(out, 'latin1');
}

// Structural validator: every xref offset must land on its "N 0 obj" line.
export function validatePdf(buf) {
  const s = buf.toString('latin1');
  if (!s.startsWith('%PDF-')) return { ok: false, error: 'missing header' };
  const m = s.match(/xref\n0 (\d+)\n([\s\S]*?)trailer/);
  if (!m) return { ok: false, error: 'no xref' };
  const rows = m[2].trim().split('\n').slice(1);
  for (let i = 0; i < rows.length; i++) {
    const off = parseInt(rows[i].slice(0, 10), 10);
    if (!s.startsWith(`${i + 1} 0 obj`, off)) return { ok: false, error: `bad offset for obj ${i + 1}` };
  }
  if (!s.includes('startxref') || !s.trimEnd().endsWith('%%EOF')) return { ok: false, error: 'bad trailer' };
  return { ok: true, objects: rows.length };
}
