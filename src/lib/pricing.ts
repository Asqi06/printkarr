/**
 * Printkarr pricing configuration + quote calculator.
 * Real rates aligned with Vapi & Sarigam dark-store fulfillment.
 */

export type PaperSize = "A4" | "A3";
export type PrintType = "bw" | "colour";
export type SideType = "single" | "double";
export type PaperGrade = "75gsm" | "100gsm";
export type BindingType = "none" | "staple" | "spiral" | "wiro" | "hardcover";
export type DeliveryType = "express" | "karrRun";

export const pricing = {
  /** ₹ per printed side */
  prints: {
    A4: {
      bw: { single: 2.0, double: 1.5 },
      colour: { single: 5.0, double: 4.0 },
    },
    A3: {
      bw: { single: 5.0, double: 4.5 },
      colour: { single: 10.0, double: 9.0 },
    },
  },
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
  /** ₹ per copy */
  addOns: {
    stapling: 2,
    holePunch: 2,
  },
  zones: [
    {
      id: "vapi",
      name: "Vapi (city)",
      areas: ["Vapi", "Chala", "Gunjan", "Koparli", "Chanod"],
      express: 20,
      karrRun: 0,
      expressEta: "30–45 min",
      karrRunEta: "same-day window",
    },
    {
      id: "outer",
      name: "Sarigam / Bhilad / Daman",
      areas: ["Sarigam", "Bhilad", "Daman"],
      express: 30,
      karrRun: 15,
      expressEta: "45–60 min",
      karrRunEta: "same-day window",
    },
  ],
  freeDeliveryThreshold: 149,
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
    if (!m) return total; // unparsable → treat as all pages
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
  let rate =
    pricing.prints[f.paperSize][f.printType][
      f.sideType as "single" | "double"
    ] ?? 2.0;

  const totalPrintedSides = pages * f.copies;
  let volumeDiscount = 0;

  // Volume tier ladder
  if (totalPrintedSides >= 50) {
    volumeDiscount = 0.25; // 25% bulk discount on 50+ printed sides
  } else if (totalPrintedSides >= 20) {
    volumeDiscount = 0.10; // 10% discount on 20+ printed sides
  }

  const effectiveRate = Math.round(rate * (1 - volumeDiscount) * 100) / 100;
  const rawPrinting = pages * rate * f.copies;
  const discountAmount = rawPrinting * volumeDiscount;
  const printing = rawPrinting - discountAmount;

  const sheets = f.sideType === "double" ? Math.ceil(pages / 2) : pages;
  const totalSheets = sheets * f.copies;
  const paperExtra = totalSheets * pricing.paperGradeAddon[f.paperGrade || "75gsm"];
  const bindingCost = (pricing.binding[f.binding || "none"] || 0) * f.copies;

  let addOns = 0;
  if (f.stapling && f.binding === "none") addOns += pricing.addOns.stapling * f.copies;
  if (f.holePunch) addOns += pricing.addOns.holePunch * f.copies;

  const total = Math.round((printing + paperExtra + bindingCost + addOns) * 100) / 100;

  return {
    printing,
    paperExtra,
    bindingCost,
    addOns,
    pages,
    sheets: totalSheets,
    effectiveRate,
    volumeDiscount: Math.round(discountAmount * 100) / 100,
    total,
  };
}

export type Zone = (typeof pricing.zones)[number];

export function zoneById(id: string | null): Zone | undefined {
  return pricing.zones.find((z) => z.id === id);
}

export function quoteDelivery(
  type: DeliveryType | null,
  zone: Zone | undefined,
  subtotal: number = 0
): number {
  if (subtotal >= pricing.freeDeliveryThreshold) return 0;
  if (!type || !zone) return 0;
  return type === "express" ? zone.express : zone.karrRun;
}
