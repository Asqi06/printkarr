"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Wordmark } from "./Wordmark";
import { useAddresses, openAddressDrawer } from "@/lib/addressStore";
import { useCart, openCart } from "@/lib/cartStore";
import { useUser } from "@/lib/userStore";

const SEARCH_SUGGESTIONS = [
  "Search 'anime wall light' or 'led anime poster'...",
  "Search 'name plate shop near me'...",
  "Search 'business card printing near me'...",
  "Search 'anime wall hanging decor'...",
  "Search 'poster printing near me'...",
  "Search 'college notes xerox' & 'spiral binding'...",
];

const CATEGORY_CHIPS = [
  { href: "/order", label: "Online Xerox", icon: "🖨️" },
  { href: "/anime-decor", label: "Anime Wall Lights & Decor", icon: "💡", badge: "HOT" },
  { href: "/name-plates", label: "Custom Name Plates", icon: "📛" },
  { href: "/business-cards", label: "Business Cards", icon: "💼" },
  { href: "/posters", label: "Poster Printing", icon: "🖼️" },
  { href: "/stationery", label: "Stationery & Files", icon: "📁" },
  { href: "/pricing", label: "Print Rates", icon: "💰" },
  { href: "/track", label: "Track Order", icon: "🚚" },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { activeAddress } = useAddresses();
  const cart = useCart();
  const { user, loginWithGoogle } = useUser();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setPlaceholderIdx((prev) => (prev + 1) % SEARCH_SUGGESTIONS.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/stationery?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-edge shadow-xs">
      {/* ── Top Announcement Strip ── */}
      <div className="bg-[#f8cb46] px-4 py-1 text-center text-[11px] font-bold text-ink sm:text-xs">
        <div className="mx-auto flex max-w-[1550px] items-center justify-between">
          <span className="hidden md:inline text-[11px] font-semibold text-ink/80">
            📍 Vapi · Sarigam · Daman · Bhilad
          </span>
          <span className="mx-auto md:mx-0 flex items-center gap-1.5">
            <span>⚡ 30-Min Fast Delivery to your hostel or doorstep</span>
            <span className="hidden sm:inline">· Free delivery on orders ₹149+</span>
          </span>
          <Link
            href="/track"
            className="hidden md:inline text-[11px] font-bold text-ink hover:underline"
          >
            Track Order →
          </Link>
        </div>
      </div>

      {/* ── Main Wide Navbar (Clean, Spacious, Uncluttered) ── */}
      <div className="mx-auto flex h-16 w-full max-w-[1550px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Left: Logo & Location Dropdown */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          <Wordmark />

          <div className="hidden sm:block h-7 w-px bg-edge" />

          {/* Delivery Location Pill (Blinkit Style) */}
          <button
            type="button"
            onClick={openAddressDrawer}
            className="flex items-center gap-2 rounded-xl p-1.5 text-left hover:bg-slate-50 transition shrink-0 max-w-[180px] sm:max-w-[220px]"
            aria-label={`Current delivery location: ${activeAddress?.locality || "Vapi"}. Click to change`}
          >
            <span className="text-base text-[#0c831f] shrink-0" aria-hidden="true">
              📍
            </span>
            <div className="truncate">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0c831f] block leading-none">
                30 Mins Delivery
              </span>
              <span suppressHydrationWarning className="truncate text-xs font-bold text-ink block leading-tight mt-0.5">
                {mounted ? (activeAddress?.locality || activeAddress?.area || "Vapi, Gujarat") : "Vapi, Gujarat"} ▾
              </span>
            </div>
          </button>
        </div>

        {/* Center: Wide, Dominant Search Bar */}
        <form
          onSubmit={handleSearchSubmit}
          className="hidden md:flex flex-1 max-w-2xl min-w-[260px] items-center rounded-2xl border border-gray-200 bg-gray-50/90 px-3.5 py-2 text-xs text-ink focus-within:border-[#0c831f] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#0c831f]/20 transition shadow-2xs"
        >
          <span className="mr-2.5 text-slate text-sm shrink-0" aria-hidden="true">
            🔍
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={SEARCH_SUGGESTIONS[placeholderIdx]}
            className="w-full bg-transparent text-xs sm:text-sm text-ink placeholder:text-slate focus:outline-none"
            aria-label="Search xerox, anime wall light, name plate, business cards, posters"
          />
          {searchQuery ? (
            <button
              type="submit"
              className="ml-2 rounded-lg bg-[#0c831f] px-2.5 py-1 text-[11px] font-bold text-white hover:bg-[#096a18] shrink-0"
            >
              Search
            </button>
          ) : null}
        </form>

        {/* Right: Uncluttered Essential Actions */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          {/* Quick Print CTA */}
          <Link
            href="/order"
            className={`hidden sm:inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
              pathname === "/order"
                ? "bg-ink text-white"
                : "border border-edge bg-surface text-ink hover:border-[#0c831f]"
            }`}
          >
            <span>🖨️</span>
            <span>Online Xerox</span>
          </Link>

          {/* User Account / Google Login Pill */}
          {mounted && user.isLoggedIn ? (
            <Link
              href="/account"
              className="flex items-center gap-2 rounded-xl border border-edge bg-white px-3 py-1.5 text-xs font-bold text-ink hover:border-[#0c831f] transition"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0c831f] text-[11px] font-bold text-white">
                {user.name ? user.name[0] : "👤"}
              </span>
              <span className="hidden xl:inline truncate max-w-[80px]">
                {user.name.split(" ")[0]}
              </span>
              <span suppressHydrationWarning className="rounded-md bg-[#e8f8ec] px-1.5 py-0.5 text-[11px] font-mono font-bold text-[#0c831f]">
                ₹{user.walletBalance.toFixed(0)}
              </span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={loginWithGoogle}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-edge bg-white px-3.5 py-2 text-xs font-bold text-ink hover:bg-slate-50 transition"
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
            className="flex items-center gap-2 rounded-xl bg-[#0c831f] px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#096a18] active:translate-y-px transition shrink-0"
          >
            <span aria-hidden="true" className="text-sm">
              🛒
            </span>
            <span suppressHydrationWarning>
              {mounted && cart.totalCount > 0
                ? `${cart.totalCount} items · ₹${cart.total}`
                : "Cart"}
            </span>
          </button>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((o) => !o)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-edge sm:hidden"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* ── Mobile Search Bar (Visible on mobile/tablet screens) ── */}
      <div className="px-4 pb-2.5 md:hidden">
        <form
          onSubmit={handleSearchSubmit}
          className="flex w-full items-center rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-ink focus-within:border-[#0c831f] focus-within:bg-white"
        >
          <span className="mr-2 text-slate text-sm">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={SEARCH_SUGGESTIONS[placeholderIdx]}
            className="w-full bg-transparent text-xs text-ink placeholder:text-slate focus:outline-none"
          />
        </form>
      </div>

      {/* ── Secondary Quick-Pills Bar (Blinkit Style Category Discovery) ── */}
      <div className="border-t border-edge/70 bg-gray-50/60 py-1.5">
        <div className="mx-auto flex max-w-[1550px] items-center gap-2 overflow-x-auto px-4 sm:px-6 lg:px-8 scrollbar-none text-xs">
          {CATEGORY_CHIPS.map((chip) => (
            <Link
              key={chip.label}
              href={chip.href}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1 font-semibold transition shrink-0 ${
                pathname === chip.href
                  ? "bg-white text-[#0c831f] shadow-2xs border border-edge font-bold"
                  : "text-slate-700 hover:text-ink hover:bg-white/80"
              }`}
            >
              <span>{chip.icon}</span>
              <span>{chip.label}</span>
              {chip.badge ? (
                <span className="rounded-full bg-red-500 px-1.5 py-0.2 text-[9px] font-bold text-white">
                  {chip.badge}
                </span>
              ) : null}
            </Link>
          ))}
        </div>
      </div>

      {/* ── Mobile Drawer Menu ── */}
      {mobileMenuOpen ? (
        <div className="border-t border-edge bg-white p-4 sm:hidden space-y-2">
          {mounted && user.isLoggedIn ? (
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
              <span suppressHydrationWarning className="rounded-md bg-[#e8f8ec] px-2 py-0.5 text-xs font-bold text-[#0c831f]">
                Wallet ₹{user.walletBalance.toFixed(0)}
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

          <div className="pt-2 border-t border-edge space-y-1">
            {CATEGORY_CHIPS.map((chip) => (
              <Link
                key={chip.label}
                href={chip.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between rounded-xl p-2.5 font-semibold text-xs text-ink hover:bg-surface"
              >
                <div className="flex items-center gap-2">
                  <span>{chip.icon}</span>
                  <span>{chip.label}</span>
                </div>
                {chip.badge ? (
                  <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
                    {chip.badge}
                  </span>
                ) : null}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </header>
  );
}
