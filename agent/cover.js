// Hand-built one-page cover PDF (Order ID slip). Zero dependencies —
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
