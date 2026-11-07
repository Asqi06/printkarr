"use client";

import { useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  STATIONERY_CATALOGUE,
  STATIONERY_CATEGORIES,
  type StationeryItem,
} from "@/lib/stationeryData";
import { useCart, addStationery, updateStationeryQuantity, openCart } from "@/lib/cartStore";
import { useAddresses, openAddressDrawer } from "@/lib/addressStore";

function StationeryContent() {
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") || "";
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchFilter, setSearchFilter] = useState(urlQuery);

  const cart = useCart();
  const { activeAddress } = useAddresses();

  const filteredItems = useMemo(() => {
    let list =
      activeCategory === "all"
        ? STATIONERY_CATALOGUE
        : STATIONERY_CATALOGUE.filter((item) => item.category === activeCategory);

    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      list = list.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.unit.toLowerCase().includes(q)
      );
    }
    return list;
  }, [activeCategory, searchFilter]);

  const getItemQuantityInCart = (id: string): number => {
    const found = cart.stationery.find((s) => s.item.id === id);
    return found ? found.quantity : 0;
  };

  return (
    <div className="min-h-screen bg-surface pb-28">
      {/* ── Top Local Service Banner ── */}
      <div className="border-b border-edge bg-white shadow-xs">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-[#f8cb46] px-2.5 py-0.5 text-xs font-bold text-ink">
                  ⚡ 30-Min Instant Delivery
                </span>
                <span className="text-xs text-slate">Delivered in same parcel with your prints</span>
              </div>
              <h1 className="font-grotesk text-2xl sm:text-3xl font-extrabold text-ink mt-1">
                Stationery, Custom Prints &amp; Anime Decor
              </h1>
              <p className="text-xs sm:text-sm text-slate mt-0.5">
                Anime LED wall lights, custom name plates, business cards, HD posters, folders, and study essentials.
              </p>
            </div>

            <button
              type="button"
              onClick={openAddressDrawer}
              className="flex items-center gap-2 rounded-xl border border-edge bg-surface px-3.5 py-2 text-left hover:border-[#0c831f] transition self-start sm:self-auto"
              aria-label={`Current delivery address: ${activeAddress.locality}. Click to change`}
            >
              <span className="text-[#0c831f] text-base" aria-hidden="true">📍</span>
              <div>
                <span className="text-[10px] text-slate block leading-none">Delivering to</span>
                <span className="text-xs font-bold text-ink block leading-tight">
                  {activeAddress.locality}, {activeAddress.area} ▾
                </span>
              </div>
            </button>
          </div>

          {/* Free Delivery Meter (R-17: honest ₹149 threshold tracking) */}
          <div className="mt-4 rounded-xl bg-[#e8f8ec] p-3 text-xs flex items-center justify-between">
            <span className="font-semibold text-[#0c831f] flex items-center gap-1.5">
              <span aria-hidden="true">🚚</span>
              {cart.isFreeDelivery ? (
                <strong>You have unlocked FREE delivery on this order!</strong>
              ) : (
                <span>
                  Add <strong>₹{cart.freeDeliveryRemaining}</strong> more to unlock FREE express delivery (orders ₹149+)
                </span>
              )}
            </span>
            <span className="text-[11px] font-bold text-[#0c831f]">
              {cart.isFreeDelivery ? "FREE UNLOCKED" : `₹${cart.subtotal}/₹149`}
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6">
        {/* Search & Category Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none" role="tablist">
            {STATIONERY_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={activeCategory === cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                  activeCategory === cat.id
                    ? "bg-[#0c831f] text-white shadow-xs"
                    : "bg-white text-ink border border-edge hover:border-slate/40"
                }`}
              >
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Quick Filter Input */}
          <div className="relative sm:w-64">
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Filter essentials..."
              className="w-full rounded-xl border border-edge bg-white px-3 py-1.5 text-xs text-ink placeholder:text-slate focus:border-[#0c831f] focus:outline-none"
              aria-label="Filter products by name or description"
            />
            {searchFilter ? (
              <button
                type="button"
                onClick={() => setSearchFilter("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate hover:text-ink"
                aria-label="Clear filter"
              >
                ✕
              </button>
            ) : null}
          </div>
        </div>

        {/* Product Grid */}
        {filteredItems.length === 0 ? (
          <div className="rounded-2xl border border-edge bg-white p-12 text-center">
            <span className="text-3xl block mb-2" aria-hidden="true">🔍</span>
            <h3 className="font-grotesk text-base font-bold text-ink">No items found</h3>
            <p className="text-xs text-slate mt-1">
              No products match &quot;{searchFilter}&quot;. Try clearing your search filter.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchFilter("");
                setActiveCategory("all");
              }}
              className="mt-3 rounded-xl bg-ink px-4 py-1.5 text-xs font-bold text-white hover:bg-slate transition"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 sm:gap-4">
            {filteredItems.map((item) => {
              const qty = getItemQuantityInCart(item.id);
              const discountPct = Math.round(((item.mrp - item.price) / item.mrp) * 100);

              return (
                <div
                  key={item.id}
                  className="flex flex-col justify-between rounded-2xl border border-edge bg-white p-3.5 shadow-xs transition hover:shadow-sm"
                >
                  <div>
                    {/* Visual & Badges */}
                    <div className="relative flex h-32 w-full items-center justify-center rounded-xl bg-surface text-5xl">
                      <span aria-hidden="true">{item.icon}</span>
                      <span className="absolute top-2 left-2 rounded-md bg-[#f8cb46] px-1.5 py-0.5 text-[10px] font-bold text-ink">
                        30 MINS
                      </span>
                      {discountPct > 0 ? (
                        <span className="absolute bottom-2 left-2 rounded-md bg-[#0c831f] px-1.5 py-0.5 text-[10px] font-bold text-white">
                          {discountPct}% OFF
                        </span>
                      ) : null}
                    </div>

                    {/* Details */}
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

                  {/* Price & Cart Stepper */}
                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-edge/60">
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
                        aria-label={`Add ${item.name} to basket`}
                        className="rounded-xl border border-[#0c831f] bg-[#e8f8ec]/40 px-3.5 py-1 text-xs font-extrabold text-[#0c831f] hover:bg-[#0c831f] hover:text-white transition"
                      >
                        + ADD
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 rounded-xl bg-[#0c831f] px-2 py-1 text-white shadow-xs">
                        <button
                          type="button"
                          onClick={() => updateStationeryQuantity(item.id, qty - 1)}
                          aria-label={`Remove one ${item.name}`}
                          className="flex h-5 w-4 items-center justify-center font-bold text-sm hover:opacity-80"
                        >
                          −
                        </button>
                        <span className="min-w-[14px] text-center text-xs font-bold">{qty}</span>
                        <button
                          type="button"
                          onClick={() => updateStationeryQuantity(item.id, qty + 1)}
                          aria-label={`Add one more ${item.name}`}
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
        )}
      </div>

      {/* Floating Checkout Bar (High-conversion sticky summary) */}
      {cart.totalCount > 0 ? (
        <aside
          aria-label="Floating checkout summary"
          className="fixed bottom-0 inset-x-0 z-30 border-t border-edge bg-white p-3 sm:p-4 shadow-xl"
        >
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f8cb46] text-xl" aria-hidden="true">
                🛒
              </span>
              <div>
                <p className="text-xs font-bold text-ink">
                  {cart.totalCount} {cart.totalCount === 1 ? "item" : "items"} in basket ·{" "}
                  <strong className="text-sm font-extrabold text-[#0c831f]">₹{cart.total}</strong>
                </p>
                <p className="text-[11px] text-slate">
                  {cart.isFreeDelivery
                    ? "Free delivery unlocked"
                    : `Add ₹${cart.freeDeliveryRemaining} for free delivery`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/order"
                className="hidden sm:inline-flex items-center gap-1 rounded-xl border border-edge px-4 py-2 text-xs font-bold text-ink hover:bg-surface transition"
              >
                + Add Document Print
              </Link>
              <button
                type="button"
                onClick={openCart}
                className="flex items-center gap-2 rounded-xl bg-[#0c831f] px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-[#096a18] active:translate-y-px transition"
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

export default function StationeryPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface p-12 text-center text-sm text-slate">
          Loading study &amp; office essentials...
        </div>
      }
    >
      <StationeryContent />
    </Suspense>
  );
}
