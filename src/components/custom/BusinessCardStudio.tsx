"use client";

import { useState, useRef, useId } from "react";
import { addCustomPrint, openCart } from "@/lib/cartStore";

type PackSize = 100 | 250 | 500 | 1000;
type CardSides = "SINGLE" | "DOUBLE";
type CornerStyle = "SQUARE" | "ROUNDED";
type CardFinish = "MATTE" | "GLOSS" | "SPOT_UV";

const PACK_PRICING: Record<PackSize, { single: number; double: number }> = {
  100: { single: 199, double: 249 },
  250: { single: 399, double: 499 },
  500: { single: 699, double: 849 },
  1000: { single: 1199, double: 1499 },
};

const FINISHES: Record<CardFinish, { name: string; desc: string; addPer100: number }> = {
  MATTE: { name: "Velvet Matte Lamination", desc: "Silky soft anti-glare finish, smudge-resistant", addPer100: 0 },
  GLOSS: { name: "High Gloss UV Coat", desc: "Vibrant high-shine reflective coating", addPer100: 20 },
  SPOT_UV: { name: "Raised Spot UV on Logo", desc: "Glossy embossed 3D texture over company logo", addPer100: 80 },
};

export function BusinessCardStudio() {
  const frontInputId = useId();
  const backInputId = useId();
  const [pack, setPack] = useState<PackSize>(100);
  const [sides, setSides] = useState<CardSides>("SINGLE");
  const [corners, setCorners] = useState<CornerStyle>("SQUARE");
  const [finish, setFinish] = useState<CardFinish>("MATTE");

  // Optional cardholder details for quick card preview / pre-print
  const [companyName, setCompanyName] = useState("");
  const [personName, setPersonName] = useState("");
  const [designation, setDesignation] = useState("");
  const [phone, setPhone] = useState("");
  const [frontFileName, setFrontFileName] = useState("");
  const [backFileName, setBackFileName] = useState("");

  const frontRef = useRef<HTMLInputElement>(null);
  const backRef = useRef<HTMLInputElement>(null);

  const packUnits = pack / 100;
  const basePrice = sides === "SINGLE" ? PACK_PRICING[pack].single : PACK_PRICING[pack].double;
  const cornerAdd = corners === "ROUNDED" ? 30 * packUnits : 0;
  const finishAdd = FINISHES[finish].addPer100 * packUnits;
  const totalPrice = Math.round(basePrice + cornerAdd + finishAdd);

  function handleAddToCart() {
    const title = companyName
      ? `Visiting Cards · ${companyName} (${pack} pcs)`
      : `Visiting Cards · ${pack} Cards`;
    const specs = `${pack} Cards · 350 GSM Artboard · ${sides === "SINGLE" ? "Single Side" : "Both Sides"} · ${
      corners === "SQUARE" ? "Square Corners" : "3mm Rounded Corners"
    } · ${FINISHES[finish].name}`;

    addCustomPrint({
      category: "BUSINESS_CARD",
      title,
      specs,
      price: totalPrice,
      quantity: 1,
      customDetails: {
        packSize: pack,
        paper: "350 GSM European Artboard",
        finish: FINISHES[finish].name,
        textLines: [companyName, personName, designation, phone].filter(Boolean),
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
              Visiting Card Configurator
            </span>
            <h2 className="font-grotesk text-2xl font-bold text-ink mt-0.5">
              Customize Premium Business Cards
            </h2>
          </div>
          <span className="rounded-full bg-[#0c831f]/10 px-3 py-1 text-xs font-bold text-[#0c831f]">
            Printed in 30–45 Mins
          </span>
        </div>
        <p className="text-xs text-slate mt-1">
          Rigid 350 GSM European artboard with laser-sharp 2400 DPI digital offset quality. No minimum 1000 pcs requirement.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-12 pt-6">
        {/* Left Column: Form Controls */}
        <div className="lg:col-span-7 space-y-6">
          {/* Pack Size Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate mb-2">
              1. Choose Quantity / Pack Size
            </label>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {([100, 250, 500, 1000] as PackSize[]).map((p) => {
                const active = pack === p;
                const cost = sides === "SINGLE" ? PACK_PRICING[p].single : PACK_PRICING[p].double;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPack(p)}
                    className={`rounded-2xl border p-3 text-left transition ${
                      active
                        ? "border-[#0c831f] bg-[#e8f8ec]/50 ring-2 ring-[#0c831f]/20 shadow-xs"
                        : "border-ink/10 bg-white hover:border-ink/20"
                    }`}
                  >
                    <span className="block text-sm font-extrabold text-ink">{p} Cards</span>
                    <span className="block text-[11px] text-slate mt-0.5">₹{(cost / p).toFixed(2)}/card</span>
                    <b className="mt-1 block text-xs font-bold text-[#0c831f]">₹{cost}</b>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sides: Single vs Double */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate mb-2">
              2. Print Sides
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: "SINGLE" as CardSides, label: "Single-Sided Print", desc: "Front side printed, clean white back" },
                { id: "DOUBLE" as CardSides, label: "Double-Sided Print", desc: "Both front & back printed in full color" },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSides(s.id)}
                  className={`rounded-2xl border p-3 text-left transition ${
                    sides === s.id
                      ? "border-[#0c831f] bg-[#e8f8ec]/40 font-bold text-ink"
                      : "border-ink/10 bg-white hover:border-ink/20 text-slate"
                  }`}
                >
                  <p className="text-xs font-bold text-ink">{s.label}</p>
                  <p className="text-[11px] text-slate mt-0.5">{s.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Surface Finish */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate mb-2">
              3. Lamination &amp; Premium Coating
            </label>
            <div className="space-y-2">
              {(Object.keys(FINISHES) as CardFinish[]).map((k) => {
                const f = FINISHES[k];
                const active = finish === k;
                return (
                  <label
                    key={k}
                    className={`flex cursor-pointer items-center justify-between rounded-2xl border p-3 transition ${
                      active
                        ? "border-[#0c831f] bg-[#e8f8ec]/40 font-semibold"
                        : "border-ink/10 bg-white hover:border-ink/20 text-slate"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="cardFinish"
                        checked={active}
                        onChange={() => setFinish(k)}
                        className="accent-[#0c831f]"
                      />
                      <div>
                        <p className="text-xs font-bold text-ink">{f.name}</p>
                        <p className="text-[11px] text-slate">{f.desc}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-ink">
                      {f.addPer100 === 0 ? "Included" : `+₹${f.addPer100 * packUnits}`}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Corner Style */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate mb-2">
              4. Corner Cut
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setCorners("SQUARE")}
                className={`rounded-2xl border p-3 text-left transition ${
                  corners === "SQUARE"
                    ? "border-[#0c831f] bg-[#e8f8ec]/40 font-bold text-ink"
                    : "border-ink/10 bg-white hover:border-ink/20 text-slate"
                }`}
              >
                <p className="text-xs font-bold text-ink">Standard Sharp 90° Square</p>
                <p className="text-[11px] text-slate mt-0.5">Classic crisp business cut (Included)</p>
              </button>
              <button
                type="button"
                onClick={() => setCorners("ROUNDED")}
                className={`rounded-2xl border p-3 text-left transition ${
                  corners === "ROUNDED"
                    ? "border-[#0c831f] bg-[#e8f8ec]/40 font-bold text-ink"
                    : "border-ink/10 bg-white hover:border-ink/20 text-slate"
                }`}
              >
                <p className="text-xs font-bold text-ink">3mm Precision Rounded Corner</p>
                <p className="text-[11px] text-slate mt-0.5">Smooth die-cut edges (+₹{30 * packUnits})</p>
              </button>
            </div>
          </div>

          {/* Design Upload or Quick Details */}
          <div className="rounded-2xl border border-ink/10 bg-slate-50 p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate">
              5. Upload Artwork or Enter Cardholder Info
            </h4>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <div
                onClick={() => frontRef.current?.click()}
                className="cursor-pointer rounded-xl border border-dashed border-ink/20 bg-white p-3 text-center hover:border-[#0c831f]"
              >
                <input
                  id={frontInputId}
                  ref={frontRef}
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setFrontFileName(e.target.files?.[0]?.name || "")}
                  className="hidden"
                />
                <span className="text-xl block">📄</span>
                <p className="text-xs font-bold text-ink mt-0.5">
                  {frontFileName ? `Front: ${frontFileName}` : "Upload Front Side (PDF/PNG)"}
                </p>
              </div>

              {sides === "DOUBLE" ? (
                <div
                  onClick={() => backRef.current?.click()}
                  className="cursor-pointer rounded-xl border border-dashed border-ink/20 bg-white p-3 text-center hover:border-[#0c831f]"
                >
                  <input
                    id={backInputId}
                    ref={backRef}
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => setBackFileName(e.target.files?.[0]?.name || "")}
                    className="hidden"
                  />
                  <span className="text-xl block">📄</span>
                  <p className="text-xs font-bold text-ink mt-0.5">
                    {backFileName ? `Back: ${backFileName}` : "Upload Back Side (PDF/PNG)"}
                  </p>
                </div>
              ) : null}
            </div>

            <div className="pt-2">
              <p className="text-[11px] font-semibold text-slate mb-1.5">
                Or enter details for live visual preview:
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <input
                  type="text"
                  placeholder="Company / Brand Name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="rounded-xl border border-ink/15 bg-white px-3 py-1.5 text-xs focus:border-[#0c831f] focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Person Name (e.g. Rajesh Shah)"
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  className="rounded-xl border border-ink/15 bg-white px-3 py-1.5 text-xs focus:border-[#0c831f] focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Designation / Profession"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className="rounded-xl border border-ink/15 bg-white px-3 py-1.5 text-xs focus:border-[#0c831f] focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Contact / WhatsApp"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="rounded-xl border border-ink/15 bg-white px-3 py-1.5 text-xs focus:border-[#0c831f] focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Card Preview & Order Summary */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-6 rounded-3xl border border-ink/10 bg-slate-50/70 p-5">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate mb-3">
              Standard 89 × 54 mm Live Preview
            </h3>

            {/* Business Card Render */}
            <div
              className={`relative mx-auto flex aspect-[1.65/1] w-full max-w-[320px] flex-col justify-between bg-gradient-to-br from-slate-900 to-slate-800 p-5 text-white shadow-xl transition-all ${
                corners === "ROUNDED" ? "rounded-2xl" : "rounded-sm"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-grotesk text-sm font-black tracking-wider text-amber-400">
                    {companyName.trim() || "PRINTS & MEDIA CO."}
                  </h4>
                  <span className="text-[9px] tracking-widest uppercase text-slate-300">
                    Precision Print Services
                  </span>
                </div>
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-xs">
                  📇
                </div>
              </div>

              <div className="space-y-0.5">
                <p className="font-grotesk text-sm font-bold text-white leading-tight">
                  {personName.trim() || "Anirudh Verma"}
                </p>
                <p className="text-[10px] text-slate-300">
                  {designation.trim() || "Managing Director"}
                </p>
                <p className="text-[10px] font-mono text-emerald-400 pt-1">
                  {phone.trim() || "+91 90167 03180"}
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-white/15 pt-2 text-[9px] text-slate-400">
                <span>Vapi · Sarigam · Daman</span>
                <span className="font-mono">350 GSM European Artboard</span>
              </div>
            </div>

            {/* Technical Specs Checklist */}
            <div className="mt-5 space-y-2 rounded-2xl border border-ink/10 bg-white p-3.5 text-xs">
              <h4 className="font-bold text-ink">Technical Specifications</h4>
              <div className="flex justify-between text-slate">
                <span>Trim Size:</span>
                <span className="font-semibold text-ink">89 mm × 54 mm</span>
              </div>
              <div className="flex justify-between text-slate">
                <span>Bleed Margin:</span>
                <span className="font-semibold text-ink">92 mm × 57 mm (1.5mm bleed)</span>
              </div>
              <div className="flex justify-between text-slate">
                <span>Safe Line:</span>
                <span className="font-semibold text-ink">3mm inside cut boundary</span>
              </div>
              <div className="flex justify-between text-slate">
                <span>Paper Grade:</span>
                <span className="font-semibold text-ink">350 GSM European Artboard</span>
              </div>
              <div className="flex justify-between text-slate">
                <span>Finish:</span>
                <span className="font-semibold text-ink">{FINISHES[finish].name}</span>
              </div>
            </div>
          </div>

          <div className="border-t border-ink/10 pt-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-[11px] text-slate block">{pack} Visiting Cards</span>
                <b className="font-grotesk text-2xl font-bold text-ink">₹{totalPrice}</b>
              </div>
              <span className="text-xs font-bold text-[#0c831f]">
                {totalPrice >= 149 ? "Free Express Delivery" : "Add essentials for free delivery"}
              </span>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#0c831f] py-3.5 text-sm font-bold text-white shadow-md hover:bg-[#096a18] active:translate-y-0.5 transition"
            >
              <span>🛒</span>
              <span>Add Business Cards to Basket (₹{totalPrice})</span>
            </button>
            <p className="mt-2 text-center text-[10px] text-slate">
              ⚡ Delivered in a rigid protective plastic card dispenser box
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
