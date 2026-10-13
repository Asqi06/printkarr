import { PDFDocument } from 'pdf-lib';
import { inflateSync } from 'node:zlib';
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
    if (isPng) {
      if (buf.length < 24 || buf.toString('ascii',12,16) !== 'IHDR') throw new Error('That PNG is incomplete. Upload it again.');
      const width=buf.readUInt32BE(16),height=buf.readUInt32BE(20);
      if (!width || !height || width > 10000 || height > 10000 || width*height > 16000000) throw new Error('Choose a PNG of at most 16 megapixels and 10,000 pixels per side.');
      const channels={0:1,2:3,3:1,4:2,6:4}[buf[25]],depth=buf[24],parts=[];
      if (!channels || ![1,2,4,8,16].includes(depth)) throw new Error('Choose a readable static PNG.');
      let ended=false,chunks=0;
      for(let offset=8;offset+12<=buf.length;) {
        const length=buf.readUInt32BE(offset),type=buf.toString('ascii',offset+4,offset+8);
        if (++chunks > 4096 || length > buf.length-offset-12) throw new Error('That PNG has invalid image chunks.');
        if (type==='acTL' || type==='fcTL') throw new Error('Choose a static PNG, JPG or PDF rather than an animated PNG.');
        if (type==='IDAT') parts.push(buf.subarray(offset+8,offset+8+length));
        offset+=length+12;
        if(type==='IEND' && length===0){ended=true;break;}
      }
      if(!ended || !parts.length)throw new Error('That PNG is incomplete. Upload it again.');
      // Bound inflation before the image library's JavaScript decoder sees compressed pixel data.
      try { inflateSync(Buffer.concat(parts),{maxOutputLength:Math.min(64*1024*1024,Math.ceil(width*height*channels*depth/8)+8*height+1024)}); }
      catch { throw new Error('That PNG has invalid or oversized pixel data. Choose a smaller static image.'); }
    }
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
