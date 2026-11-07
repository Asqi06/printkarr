"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Wordmark } from "./Wordmark";
import { useAddresses, openAddressDrawer } from "@/lib/addressStore";
import { useCart, openCart } from "@/lib/cartStore";
import { useUser } from "@/lib/userStore";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { activeAddress } = useAddresses();
  const cart = useCart();
  const { user, loginWithGoogle } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchPlaceholderIdx, setSearchPlaceholderIdx] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  const placeholders = [
    "Search 'college assignment xerox'...",
    "Search 'spiral thesis binding'...",
    "Search 'A4 transparent folder'...",
    "Search 'Cello exam ball pen'...",
    "Search 'waterproof zip pouch'...",
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setSearchPlaceholderIdx((prev) => (prev + 1) % placeholders.length);
    }, 3200);
    return () => clearInterval(timer);
  }, [placeholders.length]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/stationery?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-edge shadow-xs">
      {/* Top Banner: Local Xerox & Free Delivery Promise */}
      <div className="bg-[#f8cb46] px-4 py-1.5 text-center text-[11px] font-bold text-ink sm:text-xs">
        <span className="inline-flex items-center gap-1.5">
          <span>⚡ Online Xerox Shop: Delivered to your doorstep in 30 minutes</span>
          <span className="hidden sm:inline">
            · Free delivery on orders ₹149+ in Vapi, Sarigam &amp; Daman
          </span>
        </span>
      </div>

      {/* Main Navigation Bar */}
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        {/* Logo and Fast Xerox Badge */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Wordmark />
          <span className="hidden md:inline-flex items-center rounded-md bg-[#e8f8ec] px-2 py-0.5 text-[10px] font-bold text-[#0c831f] tracking-wide">
            30 MIN XEROX
          </span>
        </div>

        {/* Delivery Address Pill */}
        <button
          type="button"
          onClick={openAddressDrawer}
          className="flex items-center gap-1.5 rounded-xl border border-edge bg-surface px-3 py-1.5 text-left text-xs font-semibold text-ink hover:border-[#0c831f] hover:bg-[#e8f8ec]/30 transition shrink-0 max-w-[190px] sm:max-w-xs"
          aria-label={`Current delivery location: ${activeAddress?.locality || "Vapi"}. Click to change`}
        >
          <span className="text-[#0c831f] text-sm" aria-hidden="true">📍</span>
          <div className="truncate">
            <span className="text-[10px] text-slate block leading-none font-normal">
              Deliver to
            </span>
            <span className="truncate font-bold text-ink block leading-tight">
              {activeAddress?.locality || activeAddress?.area || "Vapi, Gujarat"} ▾
            </span>
          </div>
        </button>

        {/* Search Bar */}
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
            aria-label="Search xerox, binding, and stationery"
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

        {/* Customer Centric Navigation Links (No internal admin in public header!) */}
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
            <span>Online Xerox</span>
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
            <span>Stationery Store</span>
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

          {/* User Account / Google Sign-In Pill */}
          {user.isLoggedIn ? (
            <Link
              href="/account"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-edge bg-surface px-3 py-1.5 text-xs font-bold text-ink hover:border-[#0c831f] transition"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0c831f] text-[10px] text-white">
                👤
              </span>
              <span className="truncate max-w-[85px]">{user.name.split(" ")[0]}</span>
              <span className="rounded-md bg-[#e8f8ec] px-1.5 py-0.2 text-[10px] text-[#0c831f] font-mono">
                ₹{user.walletBalance}
              </span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={loginWithGoogle}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-edge bg-white px-3 py-1.5 text-xs font-bold text-ink hover:bg-slate-50 transition"
            >
              <span>G</span>
              <span>Sign in</span>
            </button>
          )}

          {/* Cart Button */}
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

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen ? (
        <div className="border-t border-edge bg-white p-4 sm:hidden space-y-2">
          {user.isLoggedIn ? (
            <Link
              href="/account"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between rounded-xl bg-surface p-3 font-bold text-ink"
            >
              <div className="flex items-center gap-2">
                <span>👤</span>
                <div>
                  <p className="text-xs">{user.name}</p>
                  <p className="text-[10px] text-slate">{user.email}</p>
                </div>
              </div>
              <span className="rounded-md bg-[#e8f8ec] px-2 py-0.5 text-xs font-bold text-[#0c831f]">
                Wallet ₹{user.walletBalance}
              </span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => {
                loginWithGoogle();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-edge p-2.5 font-bold text-xs text-ink"
            >
              <span>G</span> Sign in with Google
            </button>
          )}

          <Link
            href="/order"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 rounded-xl p-2.5 font-bold text-ink hover:bg-surface"
          >
            <span>🖨️</span> Online Xerox (PDF, Notes, Forms)
          </Link>
          <Link
            href="/stationery"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 rounded-xl p-2.5 font-bold text-ink hover:bg-surface"
          >
            <span>📁</span> School &amp; College Stationery
          </Link>
          <Link
            href="/pricing"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 rounded-xl p-2.5 font-bold text-ink hover:bg-surface"
          >
            <span>💰</span> Xerox Rates &amp; Bulk Slabs
          </Link>
          <Link
            href="/track"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 rounded-xl p-2.5 font-bold text-ink hover:bg-surface"
          >
            <span>🚚</span> Live Order Tracker
          </Link>
        </div>
      ) : null}
    </header>
  );
}
