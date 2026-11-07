"use client";

import { useState } from "react";
import Link from "next/link";
import {
  STATIONERY_CATALOGUE,
  STATIONERY_CATEGORIES,
  type StationeryItem,
} from "@/lib/stationeryData";
import { useCart, addStationery, updateStationeryQuantity, openCart } from "@/lib/cartStore";
import { useAddresses, openAddressDrawer } from "@/lib/addressStore";

export default function StationeryPage() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const cart = useCart();
  const { activeAddress } = useAddresses();

  const filteredItems =
    activeCategory === "all"
      ? STATIONERY_CATALOGUE
      : STATIONERY_CATALOGUE.filter((item) => item.category === activeCategory);

  const getItemQuantityInCart = (id: string): number => {
    const found = cart.stationery.find((s) => s.item.id === id);
    return found ? found.quantity : 0;
  };

  return (
    <div className="min-h-screen bg-[#f4f6fb] pb-24">
      {/* Top Banner */}
      <div className="border-b border-ink/10 bg-white shadow-xs">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-[#f8cb46] px-2.5 py-0.5 text-xs font-bold text-ink">
                  ⚡ Blinkit 30-Min Dark Store
                </span>
                <span className="text-xs text-slate">· Delivered with your prints</span>
              </div>
              <h1 className="font-grotesk text-2xl sm:text-3xl font-extrabold text-ink mt-1">
                Stationery &amp; Study Essentials
              </h1>
              <p className="text-xs sm:text-sm text-slate mt-0.5">
                Exam-ready folders, highlighters, notebook registers, and office desk tools.
              </p>
            </div>

            <button
              type="button"
              onClick={openAddressDrawer}
              className="flex items-center gap-2 rounded-2xl border border-ink/15 bg-slate-50 px-3.5 py-2 text-left hover:border-[#0c831f] transition self-start sm:self-auto"
            >
              <span className="text-[#0c831f] text-base">📍</span>
              <div>
                <span className="text-[10px] text-slate block leading-none">Delivering to</span>
                <span className="text-xs font-bold text-ink block leading-tight">
                  {activeAddress.locality}, {activeAddress.area} ▾
                </span>
              </div>
            </button>
          </div>

          {/* Free delivery tracker */}
          <div className="mt-4 rounded-xl bg-[#e8f8ec] p-3 text-xs flex items-center justify-between">
            <span className="font-semibold text-[#0c831f] flex items-center gap-1.5">
              <span>🚚</span>
              {cart.isFreeDelivery ? (
                <strong>You&apos;ve unlocked FREE delivery on this order!</strong>
              ) : (
                <span>
                  Add <strong>₹{cart.freeDeliveryRemaining}</strong> more to unlock FREE express delivery (over ₹149)
                </span>
              )}
            </span>
            <span className="text-[11px] font-bold text-[#0c831f]">
              {cart.isFreeDelivery ? "100% OFF" : `₹${cart.subtotal}/₹149`}
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {STATIONERY_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition ${
                activeCategory === cat.id
                  ? "bg-[#0c831f] text-white shadow-xs"
                  : "bg-white text-ink border border-ink/10 hover:border-ink/30"
              }`}
            >
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Product Cards Grid */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 sm:gap-4">
          {filteredItems.map((item) => {
            const qty = getItemQuantityInCart(item.id);
            const discountPct = Math.round(((item.mrp - item.price) / item.mrp) * 100);

            return (
              <div
                key={item.id}
                className="group flex flex-col justify-between rounded-2xl border border-ink/10 bg-white p-3.5 shadow-xs transition hover:shadow-md"
              >
                <div>
                  {/* Image/Icon Box */}
                  <div className="relative flex h-32 w-full items-center justify-center rounded-xl bg-slate-50 text-5xl">
                    <span>{item.icon}</span>
                    <span className="absolute top-2 left-2 rounded-md bg-[#f8cb46] px-1.5 py-0.5 text-[10px] font-extrabold text-ink tracking-tight">
                      ⚡ 30 MINS
                    </span>
                    {discountPct > 0 ? (
                      <span className="absolute bottom-2 left-2 rounded-md bg-[#0c831f] px-1.5 py-0.5 text-[10px] font-bold text-white">
                        {discountPct}% OFF
                      </span>
                    ) : null}
                  </div>

                  {/* Product Details */}
                  <div className="mt-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate">
                      {item.unit}
                    </span>
                    <h3 className="text-xs sm:text-sm font-bold text-ink line-clamp-2 leading-snug mt-0.5">
                      {item.name}
                    </h3>
                    <p className="text-[11px] text-slate line-clamp-2 mt-1 hidden sm:block">
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Price & Add Action */}
                <div className="mt-3 flex items-center justify-between pt-2 border-t border-ink/5">
                  <div>
                    <b className="text-sm sm:text-base font-extrabold text-ink">₹{item.price}</b>
                    {item.mrp > item.price ? (
                      <span className="ml-1 text-[11px] text-slate line-through">
                        ₹{item.mrp}
                      </span>
                    ) : null}
                  </div>

                  {qty === 0 ? (
                    <button
                      type="button"
                      onClick={() => addStationery(item, 1)}
                      className="rounded-xl border-2 border-[#0c831f] bg-[#e8f8ec]/40 px-3.5 py-1 text-xs font-extrabold text-[#0c831f] hover:bg-[#0c831f] hover:text-white transition"
                    >
                      + ADD
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 rounded-xl bg-[#0c831f] px-2 py-1 text-white shadow-xs">
                      <button
                        type="button"
                        onClick={() => updateStationeryQuantity(item.id, qty - 1)}
                        className="flex h-5 w-4 items-center justify-center font-bold text-sm hover:opacity-80"
                      >
                        −
                      </button>
                      <span className="min-w-[14px] text-center text-xs font-bold">{qty}</span>
                      <button
                        type="button"
                        onClick={() => updateStationeryQuantity(item.id, qty + 1)}
                        className="flex h-5 w-4 items-center justify-center font-bold text-sm hover:opacity-80"
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Bottom Cart Bar */}
      {cart.totalCount > 0 ? (
        <aside
          aria-label="Floating checkout bar"
          className="fixed bottom-0 inset-x-0 z-30 border-t border-ink/10 bg-white p-3 sm:p-4 shadow-2xl"
        >
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f8cb46] text-xl">
                🛒
              </span>
              <div>
                <p className="text-xs font-bold text-ink">
                  {cart.totalCount} {cart.totalCount === 1 ? "item" : "items"} in basket ·{" "}
                  <strong className="text-sm font-extrabold text-[#0c831f]">₹{cart.total}</strong>
                </p>
                <p className="text-[11px] text-slate">
                  {cart.isFreeDelivery
                    ? "🎉 Free delivery unlocked"
                    : `Add ₹${cart.freeDeliveryRemaining} for free delivery`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/order"
                className="hidden sm:inline-flex items-center gap-1 rounded-2xl border border-ink/20 px-4 py-2.5 text-xs font-bold text-ink hover:bg-slate-50 transition"
              >
                + Add Document Print
              </Link>
              <button
                type="button"
                onClick={openCart}
                className="flex items-center gap-2 rounded-2xl bg-[#0c831f] px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-[#096a18] active:translate-y-0.5 transition"
              >
                <span>View Basket &amp; Pay →</span>
              </button>
            </div>
          </div>
        </aside>
      ) : null}
    </div>
  );
}
