// SumatraPDF accepts page ranges and copy counts in -print-settings.
export function printSettings(order, override = '') {
  const settings = override || `${order.sides === 'double' ? 'duplexlong' : 'simplex'},${order.printType === 'color' ? 'color' : 'monochrome'}`;
  const range = order.pageRange ? String(order.pageRange).replace(/\s+/g, '') : '';
  if (range && !/^\d+(?:-\d+)?(?:,\d+(?:-\d+)?)*$/.test(range)) throw new Error('Invalid page range');
  const copies = Number(order.copies || 1);
  if (!Number.isInteger(copies) || copies < 1 || copies > 200) throw new Error('Invalid copy count');
  return [settings, range, copies > 1 ? `${copies}x` : ''].filter(Boolean).join(',');
}
