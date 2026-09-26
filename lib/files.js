// Uploaded-file analysis: PDFs keep real page counts, raster images count
// as a single page. Magic bytes are checked so a renamed .exe can't pass
// as a printable file. Pure — unit-tested, no filesystem.
export function analyzeUpload(originalname, buf) {
  const name = String(originalname || '');
  if (!Buffer.isBuffer(buf) || buf.length === 0) throw new Error('That file arrived empty — try again.');
  if (/\.pdf$/i.test(name)) {
    const m = buf.toString('latin1').match(/\/Type\s*\/Page[^s]/g);
    const pages = m ? m.length : 0;
    if (!pages) throw new Error('That PDF has no readable pages.');
    return { fileType: 'pdf', ext: 'pdf', pages };
  }
  const isPng = buf.length > 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
  const isJpg = buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  if (/\.(png|jpe?g)$/i.test(name) && (isPng || isJpg)) {
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
