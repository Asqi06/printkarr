/**
 * PrintKarr pricing configuration + quote calculator.
 * Exact fees, rates, volume tiers, and delivery tariffs mirrored from E:prntkr.
 */

export type PaperSize = "A4" | "A3";
export type PrintType = "bw" | "colour";
export type SideType = "single" | "double";
export type PaperGrade = "75gsm" | "100gsm";
export type BindingType = "none" | "staple" | "spiral" | "wiro" | "hardcover";
export type DeliveryType = "express" | "campus" | "evening" | "pickup";

export const pricing = {
  /** ₹ per printed side (exact E:prntkr rates) */
  prints: {
    A4: {
      bw: { single: 2.0, double: 1.5 },
      colour: { single: 4.0, double: 3.5 },
    },
    A3: {
      bw: { single: 5.0, double: 4.0 },
      colour: { single: 9.0, double: 8.0 },
    },
  },
  /** Bulk volume ladder from E:prntkr (drops down to ₹1.40 B&W and ₹3.00 Colour) */
  bulkTiers: [
    { through: 50, bwRate: 2.0, colourRate: 4.0 },
    { through: 150, bwRate: 1.8, colourRate: 3.75 },
    { through: 300, bwRate: 1.6, colourRate: 3.5 },
    { through: Infinity, bwRate: 1.4, colourRate: 3.0 },
  ],
  paperGradeAddon: {
    "75gsm": 0,
    "100gsm": 1.0, // Executive Bond extra per sheet
  },
  binding: {
    none: 0,
    staple: 2,
    spiral: 25,
    wiro: 35,
    hardcover: 150,
  },
  addOns: {
    stapling: 2,
    holePunch: 2,
    lamination: 15,
  },
  /** Delivery tariffs from E:prntkr */
  delivery: {
    vapi: 15,
    sarigam: 30,
    bhilad: 30,
    daman: 30,
    campus: 5, // Flat ₹5 for college campus gate drop (LIT Sarigam, ROFEL Vapi)
    pickup: 0,
  },
  freeDeliveryThreshold: 149,
  zones: [
    {
      id: "vapi",
      name: "Zone 1 · Vapi Core",
      areas: ["Chala", "Gunjan", "GIDC Phase 1-4", "Vapi Station", "Silvassa Road"],
      express: 15,
      expressEta: "30–45 mins",
      karrRun: 0,
      karrRunEta: "Same-Day 6 PM",
    },
    {
      id: "sarigam",
      name: "Zone 2 · Sarigam & Campus",
      areas: ["LIT Sarigam Campus", "Sarigam GIDC", "Bhilad", "Umbergaon Route"],
      express: 30,
      expressEta: "40–60 mins (Campus Gate: ₹5)",
      karrRun: 0,
      karrRunEta: "Daily Campus Drop",
    },
    {
      id: "daman",
      name: "Zone 3 · Daman Coastal",
      areas: ["Nani Daman", "Moti Daman", "Devka Beach Road", "Dabhel Industrial"],
      express: 30,
      expressEta: "45–60 mins",
      karrRun: 0,
      karrRunEta: "Same-Day Evening",
    },
    {
      id: "bhilad",
      name: "Zone 4 · Bhilad Border",
      areas: ["Bhilad Station", "NH 48 Hub", "Sarigam Link"],
      express: 30,
      expressEta: "45–60 mins",
      karrRun: 0,
      karrRunEta: "Same-Day Evening",
    },
  ],
} as const;

const nf = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 1 });

export function inr(n: number): string {
  return Number.isInteger(n) ? `₹${nf.format(n)}` : `₹${nf1.format(n)}`;
}

/** Parse "1-10, 12, 15-20" into a printable page count, clamped to total. */
export function countPages(spec: string, total: number): number {
  if (!spec.trim()) return total;
  let count = 0;
  for (const part of spec.split(/[,;]+/)) {
    const seg = part.trim();
    if (!seg) continue;
    const m = seg.match(/^(\d+)\s*(?:[-–]\s*(\d+))?$/);
    if (!m) return total;
    const from = parseInt(m[1], 10);
    const to = m[2] ? parseInt(m[2], 10) : from;
    if (Number.isNaN(from) || Number.isNaN(to)) continue;
    const lo = Math.max(1, Math.min(from, to));
    const hi = Math.min(total, Math.max(from, to));
    if (hi >= lo) count += hi - lo + 1;
  }
  return Math.min(count, total);
}

export type FileConfig = {
  pages: number;
  printType: PrintType;
  sideType: SideType;
  paperSize: PaperSize;
  paperGrade: PaperGrade;
  binding: BindingType;
  copies: number;
  pageSpec: string;
  notes?: string;
  stapling: boolean;
  holePunch: boolean;
};

export type FileLine = {
  printing: number;
  paperExtra: number;
  bindingCost: number;
  addOns: number;
  pages: number;
  sheets: number;
  effectiveRate: number;
  volumeDiscount: number;
  total: number;
};

export function quoteFile(f: FileConfig): FileLine {
  const pages = countPages(f.pageSpec, f.pages) || f.pages;
  const baseRate =
    pricing.prints[f.paperSize][f.printType][
      f.sideType as "single" | "double"
    ] ?? 2.0;

  const totalPrintedSides = pages * f.copies;

  // Exact volume ladder from E:prntkr
  let effectiveRate: number = baseRate;
  if (f.printType === "bw") {
    if (totalPrintedSides > 300) effectiveRate = 1.4;
    else if (totalPrintedSides > 150) effectiveRate = 1.6;
    else if (totalPrintedSides > 50) effectiveRate = 1.8;
    else effectiveRate = baseRate;
  } else {
    if (totalPrintedSides > 300) effectiveRate = 3.0;
    else if (totalPrintedSides > 150) effectiveRate = 3.5;
    else if (totalPrintedSides > 50) effectiveRate = 3.75;
    else effectiveRate = baseRate;
  }

  const rawPrinting = pages * baseRate * f.copies;
  const discountedPrinting = pages * effectiveRate * f.copies;
  const volumeDiscount = Math.max(0, rawPrinting - discountedPrinting);

  const sheets = f.sideType === "double" ? Math.ceil(pages / 2) : pages;
  const totalSheets = sheets * f.copies;
  const paperExtra = totalSheets * pricing.paperGradeAddon[f.paperGrade || "75gsm"];
  const bindingCost = (pricing.binding[f.binding || "none"] || 0) * f.copies;

  let addOns = 0;
  if (f.stapling && f.binding === "none") addOns += pricing.addOns.stapling * f.copies;
  if (f.holePunch) addOns += pricing.addOns.holePunch * f.copies;

  const total = Math.round((discountedPrinting + paperExtra + bindingCost + addOns) * 100) / 100;

  return {
    printing: Math.round(discountedPrinting * 100) / 100,
    paperExtra,
    bindingCost,
    addOns,
    pages,
    sheets: totalSheets,
    effectiveRate,
    volumeDiscount: Math.round(volumeDiscount * 100) / 100,
    total,
  };
}

export function quoteDelivery(
  zone: "vapi" | "sarigam" | "bhilad" | "daman" | "campus" | "pickup",
  subtotal: number = 0
): number {
  if (subtotal >= pricing.freeDeliveryThreshold) return 0;
  if (zone === "campus") return pricing.delivery.campus; // Flat ₹5
  return pricing.delivery[zone] ?? 15;
}
