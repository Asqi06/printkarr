"use client";

import { useState } from "react";
import { addCustomPrint, openCart } from "@/lib/cartStore";

type DecorProduct = "LED_LAMP" | "LIGHTBOX" | "SCROLL_HANGER" | "MANGA_KIT";
type LightTone = "WARM_WHITE" | "COOL_WHITE" | "RGB_REMOTE";

const PRODUCTS: Record<DecorProduct, { name: string; desc: string; basePrice: number; icon: string }> = {
  LED_LAMP: {
    name: "3D LED Optical Acrylic Lamp",
    desc: "4mm precision laser-etched optical acrylic on solid beech wood base with 5V USB cord",
    basePrice: 599,
    icon: "💡",
  },
  LIGHTBOX: {
    name: "A4 Backlit Manga Lightbox Frame",
    desc: "Illuminated deep shadowbox frame with high-CRI 90+ diffusion LED array & desk stand",
    basePrice: 749,
    icon: "🖼️",
  },
  SCROLL_HANGER: {
    name: "Magnetic Teak Wood Scroll Hanger (A3/A4)",
    desc: "Natural teak wood batons with embedded neodymium magnets for zero-damage hanging",
    basePrice: 349,
    icon: "📜",
  },
  MANGA_KIT: {
    name: "50-Piece Manga Wall Collage Kit",
    desc: "50 iconic manga panels on 300 GSM satin cardstock with double-sided stick dots",
    basePrice: 249,
    icon: "🎌",
  },
};

const THEMES = [
  { id: "luffy", name: "Monkey D. Luffy · Gear 5 Nika", series: "One Piece" },
  { id: "zoro", name: "Roronoa Zoro · King of Hell", series: "One Piece" },
  { id: "gojo", name: "Gojo Satoru · Infinite Void", series: "Jujutsu Kaisen" },
  { id: "tanjiro", name: "Tanjiro Kamado · Sun Breathing", series: "Demon Slayer" },
  { id: "naruto", name: "Naruto Uzumaki · Sage Mode", series: "Naruto Shippuden" },
  { id: "aot", name: "Scout Regiment · Wings of Freedom", series: "Attack on Titan" },
  { id: "custom", name: "Custom Art / Upload Your Artwork", series: "Personalized" },
];

const LIGHT_TONES: Record<LightTone, { name: string; desc: string; add: number }> = {
  WARM_WHITE: { name: "Warm Ambient White (3000K)", desc: "Cozy nighttime glow, gentle on study eyes", add: 0 },
  COOL_WHITE: { name: "Daylight Cool White (6000K)", desc: "Sharp crisp silhouette illumination", add: 0 },
  RGB_REMOTE: { name: "RGB 7-Color Changing + Remote", desc: "Fade, flash & 7 selectable gaming room colors", add: 100 },
};

export function AnimeDecorStudio() {
  const [product, setProduct] = useState<DecorProduct>("LED_LAMP");
  const [theme, setTheme] = useState("luffy");
  const [lightTone, setLightTone] = useState<LightTone>("WARM_WHITE");
  const [customEngraving, setCustomEngraving] = useState("");
  const [customArtNote, setCustomArtNote] = useState("");

  const basePrice = PRODUCTS[product].basePrice;
  const lightAdd = product === "LED_LAMP" || product === "LIGHTBOX" ? LIGHT_TONES[lightTone].add : 0;
  const totalPrice = basePrice + lightAdd;

  const currentThemeObj = THEMES.find((t) => t.id === theme) || THEMES[0];

  function handleAddToCart() {
    const title = `${PRODUCTS[product].name} · ${currentThemeObj.name}`;
    const specs = `${currentThemeObj.series} · ${
      product === "LED_LAMP" || product === "LIGHTBOX" ? LIGHT_TONES[lightTone].name : "Non-electric Decor"
    }${customEngraving.trim() ? ` · Base Engraving: "${customEngraving.trim()}"` : ""}`;

    addCustomPrint({
      category: "ANIME_DECOR",
      title,
      specs,
      price: totalPrice,
      quantity: 1,
      customDetails: {
        theme: currentThemeObj.name,
        material: PRODUCTS[product].name,
        textLines: customEngraving.trim() ? [customEngraving.trim()] : undefined,
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
              Anime Decor &amp; LED Lighting Studio
            </span>
            <h2 className="font-grotesk text-2xl font-bold text-ink mt-0.5">
              Customize Your Anime Room Setup
            </h2>
          </div>
          <span className="rounded-full bg-[#0c831f]/10 px-3 py-1 text-xs font-bold text-[#0c831f]">
            5V Low-Power Cool LEDs
          </span>
        </div>
        <p className="text-xs text-slate mt-1">
          Precision laser-etched optical acrylic, natural beech wood bases, and museum-grade scroll hangers crafted in Vapi.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-12 pt-6">
        {/* Left Column: Form Controls */}
        <div className="lg:col-span-7 space-y-6">
          {/* Product Type Picker */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate mb-2">
              1. Choose Decor Item
            </label>
            <div className="space-y-2">
              {(Object.keys(PRODUCTS) as DecorProduct[]).map((k) => {
                const p = PRODUCTS[k];
                const active = product === k;
                return (
                  <label
                    key={k}
                    className={`flex cursor-pointer items-center justify-between rounded-2xl border p-3.5 transition ${
                      active
                        ? "border-[#0c831f] bg-[#e8f8ec]/40 font-semibold"
                        : "border-ink/10 bg-white hover:border-ink/20 text-slate"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{p.icon}</span>
                      <div>
                        <p className="text-xs font-bold text-ink">{p.name}</p>
                        <p className="text-[11px] text-slate">{p.desc}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-[#0c831f]">₹{p.basePrice}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Theme / Character Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate mb-2">
              2. Select Character or Anime Design
            </label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {THEMES.map((t) => {
                const active = theme === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTheme(t.id)}
                    className={`rounded-2xl border p-3 text-left transition ${
                      active
                        ? "border-[#0c831f] bg-[#e8f8ec]/40 font-bold text-ink shadow-xs"
                        : "border-ink/10 bg-white hover:border-ink/20 text-slate"
                    }`}
                  >
                    <span className="text-xs font-bold block">{t.name}</span>
                    <span className="text-[10px] text-slate mt-0.5 block">{t.series}</span>
                  </button>
                );
              })}
            </div>

            {theme === "custom" ? (
              <div className="mt-3 rounded-2xl border border-dashed border-[#0c831f] bg-[#e8f8ec]/20 p-3.5 space-y-2">
                <p className="text-xs font-bold text-ink">Upload Your Custom Anime/Game Character Art:</p>
                <input
                  type="text"
                  placeholder="Artwork link, character description or Pinterest URL"
                  value={customArtNote}
                  onChange={(e) => setCustomArtNote(e.target.value)}
                  className="w-full rounded-xl border border-ink/15 bg-white px-3 py-1.5 text-xs focus:border-[#0c831f] focus:outline-none"
                />
              </div>
            ) : null}
          </div>

          {/* Light Tone (Only for LED items) */}
          {product === "LED_LAMP" || product === "LIGHTBOX" ? (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate mb-2">
                3. LED Illumination Tone
              </label>
              <div className="space-y-2">
                {(Object.keys(LIGHT_TONES) as LightTone[]).map((k) => {
                  const lt = LIGHT_TONES[k];
                  const active = lightTone === k;
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
                          name="animeLightTone"
                          checked={active}
                          onChange={() => setLightTone(k)}
                          className="accent-[#0c831f]"
                        />
                        <div>
                          <p className="text-xs font-bold text-ink">{lt.name}</p>
                          <p className="text-[11px] text-slate">{lt.desc}</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-ink">
                        {lt.add === 0 ? "Standard" : `+₹${lt.add}`}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* Base Laser Engraving */}
          {product === "LED_LAMP" ? (
            <div className="rounded-2xl border border-ink/10 bg-slate-50 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate">
                  4. Optional Wooden Base Laser Engraving
                </span>
                <span className="text-[10px] font-bold text-[#0c831f] bg-[#0c831f]/10 px-2 py-0.5 rounded-md">
                  FREE
                </span>
              </div>
              <input
                type="text"
                placeholder="e.g. For Aryan · Nakama Forever"
                value={customEngraving}
                onChange={(e) => setCustomEngraving(e.target.value)}
                className="w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-xs font-medium focus:border-[#0c831f] focus:outline-none"
              />
              <p className="text-[10px] text-slate">
                Precision CNC laser engraved directly into the natural beech wood base.
              </p>
            </div>
          ) : null}
        </div>

        {/* Right Column: Visual Setup Simulation & Summary */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-6 rounded-3xl border border-ink/10 bg-slate-50/70 p-5">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate mb-3">
              Room Setup Glow Render
            </h3>

            {/* Glowing Lamp Simulation */}
            <div className="relative mx-auto flex aspect-square w-full max-w-[280px] flex-col items-center justify-end rounded-2xl bg-gradient-to-b from-slate-950 via-slate-900 to-black p-5 text-center shadow-2xl overflow-hidden">
              {/* Silhouette glow */}
              <div
                className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${
                  lightTone === "WARM_WHITE"
                    ? "drop-shadow-[0_0_35px_rgba(251,191,36,0.65)]"
                    : lightTone === "RGB_REMOTE"
                    ? "drop-shadow-[0_0_35px_rgba(168,85,247,0.7)]"
                    : "drop-shadow-[0_0_35px_rgba(56,189,248,0.7)]"
                }`}
              >
                <div className="text-6xl sm:text-7xl">
                  {theme === "luffy"
                    ? "🏴‍☠️"
                    : theme === "zoro"
                    ? "⚔️"
                    : theme === "gojo"
                    ? "👁️"
                    : theme === "tanjiro"
                    ? "🌊"
                    : theme === "naruto"
                    ? "🦊"
                    : theme === "aot"
                    ? "🕊️"
                    : "✨"}
                </div>
              </div>

              {/* Character Tag */}
              <div className="relative z-10 w-full rounded-xl bg-black/60 backdrop-blur-xs p-2.5 border border-white/10 text-white">
                <p className="font-grotesk text-xs font-bold text-amber-300">
                  {currentThemeObj.name}
                </p>
                <p className="text-[10px] text-slate-300">{currentThemeObj.series}</p>
                {customEngraving.trim() ? (
                  <p className="text-[9px] font-mono text-emerald-400 mt-1">
                    Base: &quot;{customEngraving.trim()}&quot;
                  </p>
                ) : null}
              </div>

              {/* Wooden Base Render */}
              <div className="relative z-10 mt-2 h-4 w-3/4 rounded-sm bg-[#8c5225] border-t border-amber-300/40 shadow-md" />
            </div>

            {/* Technical Specifications */}
            <div className="mt-5 space-y-2 rounded-2xl border border-ink/10 bg-white p-3.5 text-xs">
              <h4 className="font-bold text-ink">Electronics &amp; Safety Rating</h4>
              <div className="flex justify-between text-slate">
                <span>Power Source:</span>
                <span className="font-semibold text-ink">5V USB (Phone charger/Laptop/Powerbank)</span>
              </div>
              <div className="flex justify-between text-slate">
                <span>Power Consumption:</span>
                <span className="font-semibold text-ink">2.5W (Ultra low power, ~₹2/month)</span>
              </div>
              <div className="flex justify-between text-slate">
                <span>Heat Generation:</span>
                <span className="font-bold text-[#0c831f]">Zero Heat (100% Safe For Study Desks)</span>
              </div>
              <div className="flex justify-between text-slate">
                <span>Optical Plate:</span>
                <span className="font-semibold text-ink">4mm Laser-Etched Cast Optical Acrylic</span>
              </div>
            </div>
          </div>

          <div className="border-t border-ink/10 pt-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-[11px] text-slate block">{PRODUCTS[product].name}</span>
                <b className="font-grotesk text-2xl font-bold text-ink">₹{totalPrice}</b>
              </div>
              <span className="text-xs font-bold text-[#0c831f]">
                Free Delivery in Vapi &amp; Sarigam
              </span>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#0c831f] py-3.5 text-sm font-bold text-white shadow-md hover:bg-[#096a18] active:translate-y-0.5 transition"
            >
              <span>🛒</span>
              <span>Add Anime Decor to Basket (₹{totalPrice})</span>
            </button>
            <p className="mt-2 text-center text-[10px] text-slate">
              ⚡ Packaged in shock-proof bubble casing with 1.2m USB cable included
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
