// SumatraPDF accepts page ranges and copy counts in -print-settings.
export function printSettings(order, override = '') {
  const settings = override || `${order.sides === 'double' ? 'duplexlong' : 'simplex'},${order.printType === 'color' ? 'color' : 'monochrome'},paper=A4,shrink`;
  let range = order.pageRange ? String(order.pageRange).replace(/\s+/g, '') : '';
  if (range && !/^\d+(?:-\d+)?(?:,\d+(?:-\d+)?)*$/.test(range)) throw new Error('Invalid page range');
  if (range) {
    const picked = new Set();
    for (const part of range.split(',')) {
      const [from, to = from] = part.split('-').map(Number);
      if (Math.min(from, to) < 1 || Math.max(from, to) > (order.filePages || 1000)) throw new Error('Invalid page range');
      for (let page = Math.min(from, to); page <= Math.max(from, to); page++) picked.add(page);
    }
    range = [...picked].sort((a, b) => a - b).join(',');
  }
  const copies = Number(order.copies ?? 1);
  if (!Number.isInteger(copies) || copies < 1 || copies > 200) throw new Error('Invalid copy count');
  return [settings, range, `${copies}x`].filter(Boolean).join(',');
}

// Bench renders without submitting paper. Exit code alone does not report bad pages.
export function checkRenderedPages(log, expectedPages) {
  const count = Number(log.match(/page count:\s*(\d+)/i)?.[1]);
  const rendered = new Set([...log.matchAll(/pagerender\s+(\d+):/gi)].map(m => Number(m[1])));
  if (/Error:|failed to (?:load|render)/i.test(log) || !count || rendered.size !== count ||
      !Array.from({ length: count }, (_, i) => i + 1).every(p => rendered.has(p))) {
    throw new Error('Document render check failed; no paper submitted');
  }
  if (expectedPages && count !== Number(expectedPages)) throw new Error(`Document has ${count} pages; order recorded ${expectedPages}. Review before printing`);
  return count;
}
