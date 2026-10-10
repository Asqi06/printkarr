import { PDFDocument } from 'pdf-lib';
import { pageRange, printSides } from '../public/print-plan.js';

// Uploaded-file analysis: PDFs keep real page counts, raster images count
// as a single page. Magic bytes are checked so a renamed .exe can't pass
// as a printable file. Pure — unit-tested, no filesystem.
export async function analyzeUpload(originalname, buf) {
  const name = String(originalname || '');
  if (!Buffer.isBuffer(buf) || buf.length === 0) throw new Error('That file arrived empty — try again.');
  if (/\.pdf$/i.test(name)) {
    let pages;
    try {
      if (!buf.subarray(0,1024).includes(Buffer.from('%PDF-'))) throw new Error('Missing PDF header');
      pages = (await PDFDocument.load(buf,{updateMetadata:false,throwOnInvalidObject:true})).getPageCount();
    } catch { throw new Error('That PDF has no readable pages. Upload an unlocked, printable PDF.'); }
    if (!pages) throw new Error('That PDF has no readable pages.');
    return { fileType: 'pdf', ext: 'pdf', pages };
  }
  const isPng = buf.length > 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
  const isJpg = buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  if (/\.(png|jpe?g)$/i.test(name) && (isPng || isJpg)) {
    try {
      const pdf = await PDFDocument.create();
      if (isPng) await pdf.embedPng(buf); else await pdf.embedJpg(buf);
    } catch { throw new Error('That file has no readable image. Upload a complete PNG or JPG.'); }
    return { fileType: 'image', ext: isPng ? 'png' : 'jpg', pages: 1 };
  }
  throw new Error('PDF, PNG or JPG only — DOCX and PPTX are not supported yet.');
}

// Final on-disk name for an order/document id. Legacy orders predate fileExt
// and are always PDFs.
export function orderFile(id, ext) {
  const safe = String(id || '').replace(/[^A-Za-z0-9-]/g, '');
  const clean = /^(pdf|png|jpe?g)$/i.test(String(ext || '')) ? String(ext).toLowerCase() : 'pdf';
  return `${safe}.${clean === 'jpeg' ? 'jpg' : clean}`;
}

export function mimeFor(ext) {
  const e = String(ext || '').toLowerCase();
  if (e === 'png') return 'image/png';
  if (e === 'jpg' || e === 'jpeg') return 'image/jpeg';
  return 'application/pdf';
}

// Copy original pages, fonts, sizes and rotations; monochrome is a printer setting.
export async function splitMixedPdf(bytes, order) {
  if (order.printType !== 'mixed' || !order.splitMixed) throw new Error('Choose split B&W and colour printing.');
  printSides(order);
  const source = await PDFDocument.load(bytes, {updateMetadata:false, throwOnInvalidObject:true});
  const total = source.getPageCount();
  if (total !== Number(order.filePages || order.effPages || order.pages)) throw new Error('The PDF page count changed. Upload it again before printing.');
  const selected = pageRange(order.pageRange || order.range, total);
  const bw = order.bwRange ? pageRange(order.bwRange, total) : [], color = order.colorRange ? pageRange(order.colorRange, total) : [];
  const assigned = new Set([...bw, ...color]);
  if (!bw.length || !color.length || bw.length !== order.bwPages || color.length !== order.colorPages || assigned.size !== bw.length + color.length || assigned.size !== selected.length || selected.some(n=>!assigned.has(n))) throw new Error('B&W and colour pages must cover the selection once, without overlap.');
  source.getForm().flatten({updateFieldAppearances:false});
  const parts = [];
  for (const [printType, pages] of [['bw',bw],['color',color]]) {
    const pdf = await PDFDocument.create();
    for (const page of await pdf.copyPages(source, pages.map(n=>n-1))) pdf.addPage(page);
    pdf.setTitle(`${printType === 'bw' ? 'B&W' : 'Colour'} print set · original pages ${printType === 'bw' ? order.bwRange : order.colorRange}`);
    parts.push({printType, pages:pages.length, bytes:Buffer.from(await pdf.save({useObjectStreams:false}))});
  }
  return parts;
}
