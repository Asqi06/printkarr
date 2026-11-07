"use client";

import { useState } from "react";
import { addCustomPrint, openCart } from "@/lib/cartStore";

type PlateMaterial = "GOLD_ACRYLIC" | "TEAK_WOOD" | "ROSE_GOLD" | "DESK_STAND";
type PlateSize = "12x4" | "14x6" | "16x8" | "8x2.5";
type MountingChoice = "TAPE_3M" | "SS_STUDS";

const MATERIALS: Record<PlateMaterial, { name: string; desc: string; basePrice: number }> = {
  GOLD_ACRYLIC: {
    name: "3D Golden Mirror Cast Acrylic (5mm)",
    desc: "Weatherproof glossy black base with laser-cut raised mirror gold lettering",
    basePrice: 599,
  },
  TEAK_WOOD: {
    name: "Kiln-Dried Natural Teak Wood (15mm)",
    desc: "CNC laser-engraved typography with polyurethane all-weather protective seal",
    basePrice: 799,
  },
  ROSE_GOLD: {
    name: "Luxury Rose Gold Mirror Acrylic",
    desc: "Matte acrylic backplate with 3D rose gold metallic lettering",
    basePrice: 699,
  },
  DESK_STAND: {
    name: "Executive Cabin / Doctor Desk Stand",
    desc: "Freestanding angled acrylic desk plaque for reception or office",
    basePrice: 399,
  },
};

const SIZES: Record<PlateSize, { name: string; inches: string; add: number }> = {
  "12x4": { name: "Flat / Apartment Entrance", inches: "12 × 4 inches", add: 0 },
  "14x6": { name: "Bungalow / Villa Main Door", inches: "14 × 6 inches", add: 150 },
  "16x8": { name: "Estate Gate / Large Entrance", inches: "16 × 8 inches", add: 350 },
  "8x2.5": { name: "Desk / Cabin Stand", inches: "8 × 2.5 inches", add: -100 },
};

const MOUNTING: Record<MountingChoice, { name: string; desc: string }> = {
  TAPE_3M: {
    name: "3M Heavy-Duty Exterior Foam Tape (Drill-Free)",
    desc: "Pre-applied industrial adhesive. Holds up to 5kg on tiles, marble, or wood without drilling.",
  },
  SS_STUDS: {
    name: "Stainless Steel Mirror Studs & Screws",
    desc: "Heavy 304 SS standoff bolts with wall anchors for permanent outdoor masonry installation.",
  },
};

export function NamePlateStudio() {
  const [material, setMaterial] = useState<PlateMaterial>("GOLD_ACRYLIC");
  const [size, setSize] = useState<PlateSize>("12x4");
  const [mounting, setMounting] = useState<MountingChoice>("TAPE_3M");

  const [line1, setLine1] = useState("B-402, Royal Palms");
  const [line2, setLine2] = useState("The Verma Family");
  const [line3, setLine3] = useState("ॐ Welcome ॐ");

  const base = MATERIALS[material].basePrice;
  const sizeAdd = SIZES[size].add;
  const totalPrice = Math.max(349, base + sizeAdd);

  function handleAddToCart() {
    const title = `Custom Name Plate · ${line2.trim() || "Custom Plaque"}`;
    const specs = `${SIZES[size].inches} · ${MATERIALS[material].name} · ${MOUNTING[mounting].name}`;

    addCustomPrint({
      category: "NAME_PLATE",
      title,
      specs,
      price: totalPrice,
      quantity: 1,
      customDetails: {
        size: SIZES[size].name,
        material: MATERIALS[material].name,
        mounting: MOUNTING[mounting].name,
        textLines: [line1, line2, line3].filter(Boolean),
      },
    });

    openCart();
  }

  return (
    <div className="rounded-3xl border border-ink/10 bg-white p-6 sm:p-8 shadow-sm">
      <div className="border-b border-ink/10 pb-5">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#0c831f]">
              Custom Name Plate Studio
            </span>
            <h2 className="font-grotesk text-2xl font-bold text-ink mt-0.5">
              Live Customizer &amp; Plaque Preview
            </h2>
          </div>
          <span className="rounded-full bg-[#0c831f]/10 px-3 py-1 text-xs font-bold text-[#0c831f]">
            Weatherproof Outdoor Grade
          </span>
        </div>
        <p className="text-xs text-slate mt-1">
          Precision laser-cut acrylic and kiln-dried wood. All lettering is 3D raised or deep CNC laser-engraved.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-12 pt-6">
        {/* Left Column: Customization Controls */}
        <div className="lg:col-span-7 space-y-6">
          {/* Text Line Inputs */}
          <div className="rounded-2xl border border-ink/10 bg-slate-50 p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate">
              1. Enter Your Custom Name Plate Text
            </h4>
            <div className="space-y-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate mb-1">
                  Line 1: Flat No / House / Villa Identifier
                </label>
                <input
                  type="text"
                  value={line1}
                  onChange={(e) => setLine1(e.target.value)}
                  placeholder="e.g. B-402, Royal Palms or Villa 12"
                  className="w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-xs font-medium focus:border-[#0c831f] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate mb-1">
                  Line 2: Family Name / Resident / Cabin Name (Primary)
                </label>
                <input
                  type="text"
                  value={line2}
                  onChange={(e) => setLine2(e.target.value)}
                  placeholder="e.g. The Verma Family or Dr. Rajesh Shah"
                  className="w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-xs font-bold focus:border-[#0c831f] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate mb-1">
                  Line 3: Optional Sub-Title / Blessing / Society Name
                </label>
                <input
                  type="text"
                  value={line3}
                  onChange={(e) => setLine3(e.target.value)}
                  placeholder="e.g. Welcome or Shree Ganeshaya Namah"
                  className="w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-xs font-medium focus:border-[#0c831f] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Material Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate mb-2">
              2. Select Base Material &amp; Lettering Style
            </label>
            <div className="space-y-2">
              {(Object.keys(MATERIALS) as PlateMaterial[]).map((k) => {
                const m = MATERIALS[k];
                const active = material === k;
                return (
                  <label
                    key={k}
                    className={`flex cursor-pointer items-center justify-between rounded-2xl border p-3.5 transition ${
                      active
                        ? "border-[#0c831f] bg-[#e8f8ec]/40 font-semibold"
                        : "border-ink/10 bg-white hover:border-ink/20 text-slate"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="plateMaterial"
                        checked={active}
                        onChange={() => setMaterial(k)}
                        className="accent-[#0c831f]"
                      />
                      <div>
                        <p className="text-xs font-bold text-ink">{m.name}</p>
                        <p className="text-[11px] text-slate">{m.desc}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-ink">₹{m.basePrice}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Plaque Size */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate mb-2">
              3. Choose Plaque Dimensions
            </label>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {(Object.keys(SIZES) as PlateSize[]).map((k) => {
                const s = SIZES[k];
                const active = size === k;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setSize(k)}
                    className={`rounded-2xl border p-3 text-left transition ${
                      active
                        ? "border-[#0c831f] bg-[#e8f8ec]/50 ring-2 ring-[#0c831f]/20 shadow-xs"
                        : "border-ink/10 bg-white hover:border-ink/20"
                    }`}
                  >
                    <span className="block text-xs font-extrabold text-ink">{k}</span>
                    <span className="block text-[11px] text-slate mt-0.5">{s.inches}</span>
                    <span className="mt-1 block text-[10px] font-semibold text-slate">
                      {s.add === 0 ? "Standard" : s.add > 0 ? `+₹${s.add}` : `-₹${Math.abs(s.add)}`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mounting Choice */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate mb-2">
              4. Mounting Hardware Included Free
            </label>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {(Object.keys(MOUNTING) as MountingChoice[]).map((k) => {
                const m = MOUNTING[k];
                const active = mounting === k;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setMounting(k)}
                    className={`rounded-2xl border p-3 text-left transition ${
                      active
                        ? "border-[#0c831f] bg-[#e8f8ec]/40 font-bold text-ink"
                        : "border-ink/10 bg-white hover:border-ink/20 text-slate"
                    }`}
                  >
                    <p className="text-xs font-bold text-ink">{m.name}</p>
                    <p className="text-[10px] text-slate mt-0.5">{m.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Live Visual Plaque Preview */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-6 rounded-3xl border border-ink/10 bg-slate-50/70 p-5">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate mb-3">
              Real-Time Visual Plaque Render
            </h3>

            {/* Plaque Visual Simulation */}
            <div
              className={`relative mx-auto flex aspect-[2.6/1] w-full max-w-[360px] flex-col items-center justify-center p-6 text-center shadow-2xl transition-all duration-300 ${
                material === "TEAK_WOOD"
                  ? "rounded-xl border-4 border-amber-950/20 bg-gradient-to-r from-[#8c5225] via-[#a36531] to-[#7d4820] text-amber-950"
                  : material === "ROSE_GOLD"
                  ? "rounded-2xl border-4 border-slate-900 bg-slate-950 text-rose-300"
                  : material === "DESK_STAND"
                  ? "rounded-xl border-2 border-slate-300 bg-gradient-to-b from-white to-slate-100 text-slate-800 shadow-lg"
                  : "rounded-2xl border-4 border-slate-900 bg-gradient-to-b from-[#111317] to-[#1c2024] text-amber-300"
              }`}
            >
              {/* Corner Screws / Standoff simulation */}
              {mounting === "SS_STUDS" ? (
                <>
                  <div className="absolute top-2 left-2 h-3 w-3 rounded-full bg-gradient-to-br from-slate-200 to-slate-400 shadow-xs border border-slate-500" />
                  <div className="absolute top-2 right-2 h-3 w-3 rounded-full bg-gradient-to-br from-slate-200 to-slate-400 shadow-xs border border-slate-500" />
                  <div className="absolute bottom-2 left-2 h-3 w-3 rounded-full bg-gradient-to-br from-slate-200 to-slate-400 shadow-xs border border-slate-500" />
                  <div className="absolute bottom-2 right-2 h-3 w-3 rounded-full bg-gradient-to-br from-slate-200 to-slate-400 shadow-xs border border-slate-500" />
                </>
              ) : null}

              {/* Line 1 */}
              <p
                className={`text-[11px] tracking-widest uppercase font-semibold opacity-85 ${
                  material === "TEAK_WOOD" ? "text-amber-950" : ""
                }`}
              >
                {line1.trim() || "FLAT / VILLA NUMBER"}
              </p>

              {/* Line 2 (Primary Name with 3D shadow illusion) */}
              <h4
                className={`font-grotesk text-lg sm:text-xl font-extrabold tracking-wide my-1 ${
                  material === "TEAK_WOOD"
                    ? "text-[#3d2008] drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)]"
                    : material === "ROSE_GOLD"
                    ? "text-rose-200 drop-shadow-[0_2px_4px_rgba(244,114,182,0.3)]"
                    : material === "DESK_STAND"
                    ? "text-slate-900"
                    : "text-amber-300 drop-shadow-[0_2px_4px_rgba(251,191,36,0.35)]"
                }`}
              >
                {line2.trim() || "THE RESIDENCE"}
              </h4>

              {/* Line 3 */}
              <p
                className={`text-[10px] tracking-wider opacity-80 ${
                  material === "TEAK_WOOD" ? "text-amber-950 font-serif" : ""
                }`}
              >
                {line3.trim()}
              </p>
            </div>

            {/* Technical Specifications */}
            <div className="mt-5 space-y-2 rounded-2xl border border-ink/10 bg-white p-3.5 text-xs">
              <h4 className="font-bold text-ink">Material &amp; Weatherproof Guarantee</h4>
              <div className="flex justify-between text-slate">
                <span>Material:</span>
                <span className="font-semibold text-ink">{MATERIALS[material].name}</span>
              </div>
              <div className="flex justify-between text-slate">
                <span>Dimensions:</span>
                <span className="font-semibold text-ink">{SIZES[size].inches}</span>
              </div>
              <div className="flex justify-between text-slate">
                <span>Mounting System:</span>
                <span className="font-semibold text-ink">{MOUNTING[mounting].name}</span>
              </div>
              <div className="flex justify-between text-slate">
                <span>Monsoon &amp; UV Rating:</span>
                <span className="font-bold text-[#0c831f]">100% Outdoor Safe (Zero Rust/Fade)</span>
              </div>
            </div>
          </div>

          <div className="border-t border-ink/10 pt-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-[11px] text-slate block">Custom Plaque Price</span>
                <b className="font-grotesk text-2xl font-bold text-ink">₹{totalPrice}</b>
              </div>
              <span className="text-xs font-bold text-[#0c831f]">
                Free Express Delivery in Vapi &amp; Daman
              </span>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#0c831f] py-3.5 text-sm font-bold text-white shadow-md hover:bg-[#096a18] active:translate-y-0.5 transition"
            >
              <span>🛒</span>
              <span>Add Custom Name Plate to Basket (₹{totalPrice})</span>
            </button>
            <p className="mt-2 text-center text-[10px] text-slate">
              ⚡ Pre-drilled with matching studs or pre-applied 3M heavy outdoor foam tape
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
