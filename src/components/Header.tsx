"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Wordmark } from "./Wordmark";
import { useAddresses, openAddressDrawer } from "@/lib/addressStore";
import { useCart, openCart } from "@/lib/cartStore";

export function Header() {
  const pathname = usePathname();
  const { activeAddress } = useAddresses();
  const cart = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchPlaceholderIdx, setSearchPlaceholderIdx] = useState(0);

  const placeholders = [
    "Search 'spiral binding'...",
    "Search 'A4 clear folder'...",
    "Search 'Cello ball pens'...",
    "Search 'project thesis'...",
    "Search 'sticky notes'...",
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setSearchPlaceholderIdx((prev) => (prev + 1) % placeholders.length);
    }, 2800);
    return () => clearInterval(timer);
  }, [placeholders.length]);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-ink/10 shadow-xs">
      {/* Top Banner - Blinkit style */}
      <div className="bg-[#f8cb46] px-4 py-1.5 text-center text-[11px] font-bold text-ink sm:text-xs">
        <span className="inline-flex items-center gap-1.5">
          <span>⚡ India&apos;s Fastest Document &amp; Stationery Desk</span>
          <span className="hidden sm:inline">· Free Delivery on orders ₹149+ in Vapi, Sarigam &amp; Daman</span>
        </span>
      </div>

      {/* Main Header Row */}
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        {/* Brand & Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <Wordmark />
          <span className="hidden md:inline-flex items-center gap-1 rounded-full bg-[#0c831f]/10 px-2.5 py-0.5 text-[11px] font-extrabold text-[#0c831f] tracking-wide">
            ⚡ 30 MINS
          </span>
        </div>

        {/* In-Context Location Pill (Blinkit style) */}
        <button
          type="button"
          onClick={openAddressDrawer}
          className="flex items-center gap-1.5 rounded-full border border-ink/10 bg-slate-50 px-3 py-1.5 text-left text-xs font-semibold text-ink hover:border-[#0c831f] hover:bg-[#e8f8ec]/30 transition shrink-0 max-w-[190px] sm:max-w-xs"
          title="Change delivery location"
        >
          <span className="text-[#0c831f] text-sm">📍</span>
          <div className="truncate">
            <span className="text-[10px] text-slate block leading-none font-normal">
              Delivery in 30 mins to
            </span>
            <span className="truncate font-bold text-ink block leading-tight">
              {activeAddress?.locality || activeAddress?.area || "Vapi, Gujarat"} ▾
            </span>
          </div>
        </button>

        {/* Search Bar */}
        <div className="hidden lg:flex flex-1 max-w-md items-center rounded-full border border-ink/15 bg-slate-50 px-3.5 py-2 text-xs text-ink focus-within:border-[#0c831f] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#0c831f]/20 transition">
          <span className="mr-2 text-slate text-sm">🔍</span>
          <input
            type="text"
            placeholder={placeholders[searchPlaceholderIdx]}
            className="w-full bg-transparent text-xs text-ink placeholder:text-slate focus:outline-none"
          />
        </div>

        {/* Navigation Actions */}
        <nav className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/order"
            className={`hidden sm:inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold transition ${
              pathname === "/order"
                ? "bg-ink text-white"
                : "text-ink hover:bg-slate-100"
            }`}
          >
            🖨️ Print Doc
          </Link>

          <Link
            href="/stationery"
            className={`hidden sm:inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold transition ${
              pathname === "/stationery"
                ? "bg-ink text-white"
                : "text-ink hover:bg-slate-100"
            }`}
          >
            📁 Stationery
          </Link>

          <Link
            href="/track"
            className={`hidden md:inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold transition ${
              pathname === "/track"
                ? "bg-ink text-white"
                : "text-ink hover:bg-slate-100"
            }`}
          >
            🚚 Track
          </Link>

          <Link
            href="/admin"
            className="hidden lg:inline-flex items-center gap-1 rounded-full border border-ink/15 px-2.5 py-1 text-[11px] font-semibold text-slate hover:text-ink hover:border-ink/40 transition"
          >
            ⚙️ Dark-Store
          </Link>

          {/* Cart Pill - Blinkit green CTA */}
          <button
            type="button"
            onClick={openCart}
            className="flex items-center gap-2 rounded-full bg-[#0c831f] px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#096a18] active:translate-y-0.5 transition"
          >
            <span>🛒</span>
            <span className="hidden sm:inline">
              {cart.totalCount > 0
                ? `${cart.totalCount} items · ₹${cart.total}`
                : "Cart"}
            </span>
            {cart.totalCount > 0 ? (
              <span className="sm:hidden font-mono font-bold">
                {cart.totalCount} · ₹{cart.total}
              </span>
            ) : null}
          </button>

          {/* Mobile hamburger menu */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((o) => !o)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/15 sm:hidden"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? "✕" : "☰"}
          </button>
        </nav>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen ? (
        <div className="border-t border-ink/10 bg-white p-4 sm:hidden space-y-2">
          <Link
            href="/order"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 rounded-xl p-2.5 font-bold text-ink hover:bg-slate-50"
          >
            <span>🖨️</span> Order Print (PDF &amp; Photos)
          </Link>
          <Link
            href="/stationery"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 rounded-xl p-2.5 font-bold text-ink hover:bg-slate-50"
          >
            <span>📁</span> Stationery &amp; Essentials Store
          </Link>
          <Link
            href="/pricing"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 rounded-xl p-2.5 font-bold text-ink hover:bg-slate-50"
          >
            <span>💰</span> Printing Prices &amp; Slabs
          </Link>
          <Link
            href="/track"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 rounded-xl p-2.5 font-bold text-ink hover:bg-slate-50"
          >
            <span>🚚</span> Live Order Tracker
          </Link>
          <Link
            href="/admin"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 rounded-xl p-2.5 font-bold text-ink hover:bg-slate-50"
          >
            <span>⚙️</span> Dark-Store Admin Console
          </Link>
        </div>
      ) : null}
    </header>
  );
}
