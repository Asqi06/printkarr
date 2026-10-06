// One page assignment shared by the form, pricing and fulfilment instructions.
export function pageRange(text, total) {
  if (!Number.isInteger(total) || total < 1 || total > 1000) throw new Error('The file must contain 1–1000 pages.');
  const value = String(text || '').trim().replace(/[–—−]/g, '-').replace(/\s*-\s*/g, '-');
  if (value.length > 6000) throw new Error('The page list is too long.');
  if (!value) return Array.from({ length: total }, (_, i) => i + 1);
  const picked = new Set();
  for (const part of value.split(/[,;\s]+/).filter(Boolean)) {
    const match = part.match(/^(\d+)(?:-(\d+))?$/);
    if (!match) throw new Error(`Cannot read “${part}”. Use 1-10, 13-20.`);
    const from = Number(match[1]), to = Number(match[2] || match[1]);
    if (from < 1 || to > total || to < 1 || from > total) throw new Error(`Pages must be between 1 and ${total}.`);
    if (from > to) throw new Error(`Range ${part} is reversed. Put the smaller page first.`);
    for (let n = from; n <= to; n++) picked.add(n);
  }
  if (!picked.size) throw new Error('Choose at least one page.');
  return [...picked].sort((a, b) => a - b);
}

export function compactRange(pages) {
  const parts = [];
  for (let i = 0; i < pages.length; i++) {
    const start = pages[i]; let end = start;
    while (pages[i + 1] === end + 1) end = pages[++i];
    parts.push(start === end ? String(start) : `${start}-${end}`);
  }
  return parts.join(', ');
}

export function printPlan(input, total) {
  const selected = pageRange(input.range, total), type = input.printType || 'bw';
  if (!['bw', 'color', 'mixed'].includes(type)) throw new Error('Choose B&W, colour or mixed printing.');
  const copies = Number(input.copies ?? 1), sides = input.sides || 'single';
  if (!Number.isInteger(copies) || copies < 1 || copies > 200) throw new Error('Choose 1–200 whole copies.');
  if (!['single', 'double'].includes(sides)) throw new Error('Choose single or double sided.');
  let color = type === 'color' ? selected : [], mixed = [];
  const mixedPageType = input.mixedPageType || 'color';
  if (type === 'mixed') {
    if (!['bw', 'color'].includes(mixedPageType)) throw new Error('Choose which type the specified pages use.');
    if (!String(input.mixedRange || '').trim()) throw new Error('Enter the pages for mixed printing, for example 11-12.');
    mixed = pageRange(input.mixedRange, total);
    const selection = new Set(selected);
    if (mixed.some((n) => !selection.has(n))) throw new Error('Mixed pages must be among the pages selected to print.');
    const specified = new Set(mixed);
    color = mixedPageType === 'color' ? mixed : selected.filter((n) => !specified.has(n));
  }
  const colors = new Set(color), bw = selected.filter((n) => !colors.has(n));
  return { printType: type, copies, sides, effPages: selected.length, range: selected.length === total ? null : compactRange(selected), mixedPageType, mixedRange: compactRange(mixed), bwPages: bw.length, colorPages: color.length, bwRange: compactRange(bw), colorRange: compactRange(color) };
}

export function printSides(order) {
  const pages = Number(order.effPages ?? order.pages), copies = Number(order.copies || 1);
  const bw = order.printType === 'mixed' ? Number(order.bwPages) : order.printType === 'color' ? 0 : pages;
  const color = order.printType === 'mixed' ? Number(order.colorPages) : order.printType === 'color' ? pages : 0;
  if (![pages, copies, bw, color].every(Number.isInteger) || pages < 1 || copies < 1 || copies > 200 || bw < 0 || color < 0 || bw + color !== pages) throw new Error('Invalid print page counts. Review the file before printing.');
  return { bw: bw * copies, color: color * copies };
}

export function printDescription(order) {
  if (order.printType !== 'mixed') return order.printType === 'color' ? 'Colour' : 'B&W';
  return `Mixed · ${order.bwPages} B&W (pages ${order.bwRange || 'none'}) · ${order.colorPages} colour (pages ${order.colorRange || 'none'})`;
}
