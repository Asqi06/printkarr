"use client";

import { useState, useRef, useId } from "react";
import { addCustomPrint, openCart } from "@/lib/cartStore";

type PosterSize = "A4" | "A3" | "12x18" | "A2";
type PaperStock = "GLOSS_300" | "MATTE_280" | "SYNTHETIC_320";
type Lamination = "NONE" | "GLOSS" | "VELVET";

const SIZES: Record<PosterSize, { name: string; inches: string; pxAt300: string; basePrice: number }> = {
  A4: { name: "A4 Standard Photo", inches: "8.3 × 11.7 in", pxAt300: "2480 × 3508 px", basePrice: 29 },
  A3: { name: "A3 Large Poster", inches: "11.7 × 16.5 in", pxAt300: "3508 × 4960 px", basePrice: 59 },
  "12x18": { name: "12 × 18 in (Classic Studio)", inches: "12.0 × 18.0 in", pxAt300: "3600 × 5400 px", basePrice: 79 },
  A2: { name: "A2 Giant Exhibition", inches: "16.5 × 23.4 in", pxAt300: "4960 × 7016 px", basePrice: 149 },
};

const PAPERS: Record<PaperStock, { name: string; desc: string; add: number }> = {
  GLOSS_300: { name: "300 GSM Heavy Photo Gloss", desc: "Vibrant rich colors & deep contrast", add: 0 },
  MATTE_280: { name: "280 GSM Velvet Matte", desc: "Anti-glare, gallery-grade soft finish", add: 0 },
  SYNTHETIC_320: { name: "320 GSM Tear-Proof Synthetic", desc: "Waterproof, non-tearable & outdoor durable", add: 20 },
};

const LAMINATIONS: Record<Lamination, { name: string; add: number }> = {
  NONE: { name: "No Lamination (Raw Paper)", add: 0 },
  GLOSS: { name: "Thermal Gloss Film (+₹15)", add: 15 },
  VELVET: { name: "Velvet Soft-Touch Matte (+₹25)", add: 25 },
};

export function PosterStudio() {
  const fileInputId = useId();
  const [size, setSize] = useState<PosterSize>("A3");
  const [paper, setPaper] = useState<PaperStock>("GLOSS_300");
  const [lamination, setLamination] = useState<Lamination>("NONE");
  const [copies, setCopies] = useState(1);
  const [fileName, setFileName] = useState("");
  const [fileResolution, setFileResolution] = useState<{ w: number; h: number } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Resolution Preflight Calculator
  const dpiStatus = (() => {
    if (!fileResolution) return null;
    const req = SIZES[size];
    // approximate based on width
    const ratio = Math.min(fileResolution.w, fileResolution.h) / 2480;
    if (ratio >= 0.9) return { label: "Excellent · 300+ DPI", color: "text-[#0c831f] bg-[#e8f8ec]" };
    if (ratio >= 0.5) return { label: "Good for Wall Viewing · ~180 DPI", color: "text-amber-700 bg-amber-50" };
    return { label: "Notice: Low Resolution (May appear soft)", color: "text-red-700 bg-red-50" };
  })();

  const unitPrice = SIZES[size].basePrice + PAPERS[paper].add + LAMINATIONS[lamination].add;
  const totalPrice = unitPrice * copies;

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      const img = new Image();
      img.onload = () => {
        setFileResolution({ w: img.width, h: img.height });
      };
      img.src = url;
    } else {
      setPreviewUrl(null);
      setFileResolution(null);
    }
  }

  function handleAddToCart() {
    const title = fileName ? `Custom Poster · ${fileName}` : `Custom ${SIZES[size].name}`;
    const specs = `${SIZES[size].inches} · ${PAPERS[paper].name} · ${LAMINATIONS[lamination].name}`;

    addCustomPrint({
      category: "POSTER",
      title,
      specs,
      price: unitPrice,
      quantity: copies,
      customDetails: {
        size: SIZES[size].name,
        paper: PAPERS[paper].name,
        lamination: LAMINATIONS[lamination].name,
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
              Interactive Custom Studio
            </span>
            <h2 className="font-grotesk text-2xl font-bold text-ink mt-0.5">
              Configure Your HD Poster
            </h2>
          </div>
          <span className="rounded-full bg-[#0c831f]/10 px-3 py-1 text-xs font-bold text-[#0c831f]">
            30-Min Delivery in Vapi
          </span>
        </div>
        <p className="text-xs text-slate mt-1">
          Select poster dimensions, upload your artwork, choose museum-grade paper stock, and inspect DPI preflight.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-12 pt-6">
        {/* Left Column: Configurator Controls */}
        <div className="lg:col-span-7 space-y-6">
          {/* File Upload & DPI Preflight */}
          <div>
            <label htmlFor={fileInputId} className="block text-xs font-bold uppercase tracking-wider text-slate mb-2">
              1. Upload Your Image or Design (PDF, PNG, JPG)
            </label>
            <div
              onClick={() => fileRef.current?.click()}
              className="cursor-pointer rounded-2xl border-2 border-dashed border-ink/20 bg-slate-50 p-5 text-center transition hover:border-[#0c831f] hover:bg-[#e8f8ec]/20"
            >
              <input
                id={fileInputId}
                ref={fileRef}
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
              <span className="text-3xl block mb-1">📁</span>
              <p className="text-xs font-bold text-ink">
                {fileName ? `Selected: ${fileName}` : "Click to select or drop poster file here"}
              </p>
              <p className="text-[11px] text-slate mt-0.5">
                Recommended 300 DPI · CMYK or RGB · PDF, PNG, JPG up to 50MB
              </p>
              {dpiStatus ? (
                <div className="mt-2 inline-block">
                  <span className={`rounded-full px-3 py-0.5 text-xs font-bold ${dpiStatus.color}`}>
                    {dpiStatus.label}
                    {fileResolution ? ` (${fileResolution.w} × ${fileResolution.h} px)` : ""}
                  </span>
                </div>
              ) : null}
            </div>
          </div>

          {/* Size Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate mb-2">
              2. Choose Poster Dimensions
            </label>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {(Object.keys(SIZES) as PosterSize[]).map((k) => {
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
                    <b className="mt-1 block text-xs font-bold text-[#0c831f]">₹{s.basePrice}</b>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Paper Stock Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate mb-2">
              3. Select Paper Stock
            </label>
            <div className="space-y-2">
              {(Object.keys(PAPERS) as PaperStock[]).map((k) => {
                const p = PAPERS[k];
                const active = paper === k;
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
                        name="posterPaper"
                        checked={active}
                        onChange={() => setPaper(k)}
                        className="accent-[#0c831f]"
                      />
                      <div>
                        <p className="text-xs font-bold text-ink">{p.name}</p>
                        <p className="text-[11px] text-slate">{p.desc}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-ink">
                      {p.add === 0 ? "Standard" : `+₹${p.add}`}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Lamination Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate mb-2">
              4. Protective Lamination Finish
            </label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {(Object.keys(LAMINATIONS) as Lamination[]).map((k) => {
                const l = LAMINATIONS[k];
                const active = lamination === k;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setLamination(k)}
                    className={`rounded-2xl border p-2.5 text-left text-xs transition ${
                      active
                        ? "border-[#0c831f] bg-[#e8f8ec]/50 font-bold text-ink"
                        : "border-ink/10 bg-white hover:border-ink/20 text-slate"
                    }`}
                  >
                    <span className="block font-bold">{l.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Copies Stepper */}
          <div className="flex items-center justify-between rounded-2xl border border-ink/10 bg-slate-50 p-3.5">
            <div>
              <span className="text-xs font-bold text-ink block">Number of Copies</span>
              <span className="text-[11px] text-slate">Bulk discounts automatically calculated in cart</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCopies((c) => Math.max(1, c - 1))}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-ink/20 bg-white font-bold text-ink hover:bg-slate-100"
              >
                −
              </button>
              <span className="min-w-[20px] text-center font-mono text-sm font-bold text-ink">
                {copies}
              </span>
              <button
                type="button"
                onClick={() => setCopies((c) => c + 1)}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-ink/20 bg-white font-bold text-ink hover:bg-slate-100"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live Poster Mockup & Summary */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-6 rounded-3xl border border-ink/10 bg-slate-50/70 p-5">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate mb-3">
              Live Mockup &amp; Dimensions
            </h3>
            <div className="relative mx-auto flex aspect-[3/4] max-h-72 w-full max-w-[220px] items-center justify-center overflow-hidden rounded-xl border-4 border-white bg-slate-200 shadow-md">
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt="Poster preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="p-4 text-center">
                  <span className="text-3xl block mb-1">🖼️</span>
                  <p className="text-xs font-bold text-ink">{SIZES[size].name}</p>
                  <p className="text-[10px] text-slate mt-0.5">{SIZES[size].inches}</p>
                  <span className="mt-2 inline-block rounded-md bg-white/80 px-2 py-0.5 text-[9px] font-mono text-slate">
                    3mm Bleed Protected
                  </span>
                </div>
              )}
            </div>

            <div className="mt-4 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate">
                <span>Selected Size:</span>
                <span className="font-semibold text-ink">{SIZES[size].name} ({SIZES[size].inches})</span>
              </div>
              <div className="flex justify-between text-slate">
                <span>Print Spec:</span>
                <span className="font-semibold text-ink">12-Color Pigment CMYK</span>
              </div>
              <div className="flex justify-between text-slate">
                <span>Paper Stock:</span>
                <span className="font-semibold text-ink">{PAPERS[paper].name}</span>
              </div>
              <div className="flex justify-between text-slate">
                <span>Lamination:</span>
                <span className="font-semibold text-ink">{LAMINATIONS[lamination].name}</span>
              </div>
              <div className="flex justify-between text-slate">
                <span>Copies:</span>
                <span className="font-semibold text-ink">{copies}</span>
              </div>
            </div>
          </div>

          <div className="border-t border-ink/10 pt-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-[11px] text-slate block">Subtotal (Inclusive of all taxes)</span>
                <b className="font-grotesk text-2xl font-bold text-ink">₹{totalPrice}</b>
              </div>
              <span className="text-xs font-bold text-[#0c831f]">
                {totalPrice >= 149 ? "Free Delivery Unlocked!" : `Add ₹${149 - totalPrice} for Free Drop`}
              </span>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#0c831f] py-3.5 text-sm font-bold text-white shadow-md hover:bg-[#096a18] active:translate-y-0.5 transition"
            >
              <span>🛒</span>
              <span>Add Custom Poster to Basket (₹{totalPrice})</span>
            </button>
            <p className="mt-2 text-center text-[10px] text-slate">
              ⚡ Printed in Vapi dark-store &amp; delivered in 30 mins to your address
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
