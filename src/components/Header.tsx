"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Wordmark } from "./Wordmark";
import { useAddresses, openAddressDrawer } from "@/lib/addressStore";
import { useCart, openCart } from "@/lib/cartStore";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { activeAddress } = useAddresses();
  const cart = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchPlaceholderIdx, setSearchPlaceholderIdx] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  const placeholders = [
    "Search 'clear folder'...",
    "Search 'spiral binding'...",
    "Search 'Cello ball pens'...",
    "Search 'exam zip pouch'...",
    "Search 'highlighter'...",
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setSearchPlaceholderIdx((prev) => (prev + 1) % placeholders.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [placeholders.length]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/stationery?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-edge">
      {/* Top Banner: Real local service notice (R-17: honest local data) */}
      <div className="bg-[#f8cb46] px-4 py-1.5 text-center text-[11px] font-bold text-ink sm:text-xs">
        <span className="inline-flex items-center gap-1.5">
          <span>⚡ Local Print &amp; Stationery Desk</span>
          <span className="hidden sm:inline">
            · 30 to 45 min delivery in Vapi, Sarigam &amp; Daman (Free on orders ₹149+)
          </span>
        </span>
      </div>

      {/* Main Navigation Row */}
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        {/* Logo & 30-Min Tag */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Wordmark />
          <span className="hidden md:inline-flex items-center rounded-md bg-[#e8f8ec] px-2 py-0.5 text-[10px] font-bold text-[#0c831f] tracking-wide">
            30 MIN DESK
          </span>
        </div>

        {/* In-Context Location Switcher (R-26: functional drawer trigger) */}
        <button
          type="button"
          onClick={openAddressDrawer}
          className="flex items-center gap-1.5 rounded-xl border border-edge bg-surface px-3 py-1.5 text-left text-xs font-semibold text-ink hover:border-[#0c831f] hover:bg-[#e8f8ec]/30 transition shrink-0 max-w-[190px] sm:max-w-xs"
          aria-label={`Current delivery location: ${activeAddress?.locality || "Vapi"}. Click to change address`}
        >
          <span className="text-[#0c831f] text-sm" aria-hidden="true">📍</span>
          <div className="truncate">
            <span className="text-[10px] text-slate block leading-none font-normal">
              Delivery to
            </span>
            <span className="truncate font-bold text-ink block leading-tight">
              {activeAddress?.locality || activeAddress?.area || "Vapi, Gujarat"} ▾
            </span>
          </div>
        </button>

        {/* Search Bar (R-26: routes to stationery search) */}
        <form
          onSubmit={handleSearchSubmit}
          className="hidden lg:flex flex-1 max-w-md items-center rounded-xl border border-edge bg-surface px-3 py-1.5 text-xs text-ink focus-within:border-[#0c831f] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#0c831f]/20 transition"
        >
          <span className="mr-2 text-slate text-sm" aria-hidden="true">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={placeholders[searchPlaceholderIdx]}
            className="w-full bg-transparent text-xs text-ink placeholder:text-slate focus:outline-none"
            aria-label="Search printing services and stationery items"
          />
          {searchQuery ? (
            <button
              type="submit"
              className="text-[10px] font-bold text-[#0c831f] hover:underline shrink-0 ml-1"
            >
              Search
            </button>
          ) : null}
        </form>

        {/* Primary Navigation Actions */}
        <nav className="flex items-center gap-2 sm:gap-2.5" aria-label="Main Navigation">
          <Link
            href="/order"
            className={`hidden sm:inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
              pathname === "/order"
                ? "bg-ink text-white"
                : "text-ink hover:bg-slate-100"
            }`}
          >
            <span>🖨️</span>
            <span>Print Document</span>
          </Link>

          <Link
            href="/stationery"
            className={`hidden sm:inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
              pathname === "/stationery"
                ? "bg-ink text-white"
                : "text-ink hover:bg-slate-100"
            }`}
          >
            <span>📁</span>
            <span>Study Essentials</span>
          </Link>

          <Link
            href="/track"
            className={`hidden md:inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
              pathname === "/track"
                ? "bg-ink text-white"
                : "text-ink hover:bg-slate-100"
            }`}
          >
            <span>🚚</span>
            <span>Track Order</span>
          </Link>

          <Link
            href="/admin"
            className="hidden xl:inline-flex items-center gap-1 rounded-xl border border-edge px-2.5 py-1 text-[11px] font-semibold text-slate hover:text-ink hover:border-slate/40 transition"
          >
            Dark-Store Ops
          </Link>

          {/* Cart Button: High-conversion green pill */}
          <button
            type="button"
            onClick={openCart}
            aria-label={`View Cart: ${cart.totalCount} items, total ₹${cart.total}`}
            className="flex items-center gap-2 rounded-xl bg-[#0c831f] px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#096a18] active:translate-y-px transition"
          >
            <span aria-hidden="true">🛒</span>
            <span>
              {cart.totalCount > 0
                ? `${cart.totalCount} items · ₹${cart.total}`
                : "Cart"}
            </span>
          </button>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((o) => !o)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-edge sm:hidden"
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? "✕" : "☰"}
          </button>
        </nav>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen ? (
        <div className="border-t border-edge bg-white p-4 sm:hidden space-y-2">
          <Link
            href="/order"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 rounded-xl p-2.5 font-bold text-ink hover:bg-surface"
          >
            <span>🖨️</span> Order Print (PDF &amp; Photos)
          </Link>
          <Link
            href="/stationery"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 rounded-xl p-2.5 font-bold text-ink hover:bg-surface"
          >
            <span>📁</span> Stationery &amp; Essentials Store
          </Link>
          <Link
            href="/pricing"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 rounded-xl p-2.5 font-bold text-ink hover:bg-surface"
          >
            <span>💰</span> Printing Prices &amp; Slabs
          </Link>
          <Link
            href="/track"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 rounded-xl p-2.5 font-bold text-ink hover:bg-surface"
          >
            <span>🚚</span> Live Order Tracker
          </Link>
          <Link
            href="/admin"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 rounded-xl p-2.5 font-bold text-ink hover:bg-surface"
          >
            <span>⚙️</span> Dark-Store Admin Console
          </Link>
        </div>
      ) : null}
    </header>
  );
}
