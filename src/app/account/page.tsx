"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useUser } from "@/lib/userStore";
import { useOrders } from "@/lib/ordersStore";
import { useAddresses, openAddressDrawer } from "@/lib/addressStore";
import { useCustomers } from "@/lib/customersStore";
import { WALLET_OFFERS, ACTIVE_COUPONS, REFERRAL_PROGRAM, type WalletOffer } from "@/lib/offersData";
import { openAuthModal } from "@/lib/authModalStore";
import { Container } from "@/components/ui";

export default function AccountPage() {
  const { user, logout, topUpWallet, loginWithGooglePayload } = useUser();
  const { orders } = useOrders();
  const { addresses } = useAddresses();
  const { getCustomerTransactions } = useCustomers();

  const [topUpAmount, setTopUpAmount] = useState<number | "">("");
  const [topUpSuccessMsg, setTopUpSuccessMsg] = useState("");
  const [copiedCoupon, setCopiedCoupon] = useState("");
  const [copiedRef, setCopiedRef] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("auth_success") === "1" && params.get("email")) {
      loginWithGooglePayload({
        email: params.get("email") || "",
        name: params.get("name") || "",
        picture: params.get("picture") || undefined,
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [loginWithGooglePayload]);

  const handleTopUpOffer = (offer: WalletOffer) => {
    topUpWallet(offer.amount, offer.bonus, offer.name);
    setTopUpSuccessMsg(
      `🎉 Successfully activated ${offer.name}! ₹${offer.totalCredit} added to your PrintKarr wallet.`
    );
    setTimeout(() => setTopUpSuccessMsg(""), 5000);
  };

  const handleCustomTopUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof topUpAmount !== "number" || topUpAmount < 10) return;
    let bonus = 0;
    if (topUpAmount >= 500) bonus = Math.round(topUpAmount * 0.15);
    else if (topUpAmount >= 250) bonus = Math.round(topUpAmount * 0.1);
    else if (topUpAmount >= 100) bonus = Math.round(topUpAmount * 0.05);

    topUpWallet(topUpAmount, bonus, "Custom Top-up");
    setTopUpSuccessMsg(
      `🎉 Successfully added ₹${topUpAmount}${bonus > 0 ? ` + ₹${bonus} Free Bonus` : ""} to your wallet!`
    );
    setTopUpAmount("");
    setTimeout(() => setTopUpSuccessMsg(""), 5000);
  };

  const handleCopyCoupon = (code: string) => {
    void navigator.clipboard.writeText(code);
    setCopiedCoupon(code);
    setTimeout(() => setCopiedCoupon(""), 3000);
  };

  const referralLink = `https://printkarr.in/?ref=${user.id || "welcome"}`;

  const handleCopyRef = () => {
    void navigator.clipboard.writeText(referralLink);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 3000);
  };

  const userOrders = orders.filter(
    (o) =>
      (user.phone && o.customer.phone === user.phone) ||
      (user.email && o.customer.phone.toLowerCase().includes(user.email.toLowerCase())) ||
      (user.name && o.customer.name.toLowerCase().includes(user.name.toLowerCase().split(" ")[0]))
  );

  const txHistory = user.id ? getCustomerTransactions(user.id) : [];

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-20">
      {/* Top Banner (Strictly Private to Logged-in Customer) */}
      <div className="border-b border-edge bg-white py-6">
        <Container>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0c831f] text-white text-lg font-bold shadow-xs">
                {user.isLoggedIn && user.name ? user.name[0] : "👤"}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-grotesk text-xl sm:text-2xl font-bold text-ink">
                    {user.isLoggedIn ? user.name : "My PrintKarr Account"}
                  </h1>
                  {user.isLoggedIn && user.isStudent ? (
                    <span className="rounded-full bg-[#f8cb46]/30 px-2.5 py-0.5 text-[10px] font-bold text-ink border border-[#f8cb46]">
                      🎓 Campus Pass
                    </span>
                  ) : null}
                  {user.isLoggedIn ? (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate border border-slate-200">
                      🔒 Private Account
                    </span>
                  ) : null}
                </div>
                <p className="text-xs text-slate mt-0.5">
                  {user.isLoggedIn
                    ? `${user.email || "Registered account"}${user.phone ? ` · ${user.phone}` : ""}${
                        user.collegeName ? ` · ${user.collegeName}` : ""
                      }`
                    : "Sign in with Google or your phone to view private wallet balance & track orders"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {user.isLoggedIn ? (
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-xl border border-edge bg-white px-3.5 py-1.5 text-xs font-bold text-slate hover:text-red-600 hover:border-red-200 transition"
                >
                  Sign Out
                </button>
              ) : (
                <button
                  type="button"
                  onClick={openAuthModal}
                  className="flex items-center gap-2 rounded-xl bg-[#0c831f] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#096a18] transition"
                >
                  <span>G</span>
                  <span>Sign In with Google / Mobile</span>
                </button>
              )}
            </div>
          </div>
        </Container>
      </div>

      <Container className="py-8 space-y-8">
        {/* Not Logged In Prompt */}
        {!user.isLoggedIn ? (
          <div className="rounded-3xl border border-edge bg-white p-8 text-center shadow-xs space-y-4">
            <span className="text-4xl block">👛</span>
            <h2 className="text-xl font-bold font-grotesk text-ink">
              Sign In to Access Your PrintKarr Wallet
            </h2>
            <p className="text-xs text-slate max-w-md mx-auto leading-relaxed">
              Your wallet balance, student discounts, and order records are linked to your private account.
              Sign in with Google or your mobile number to view your remaining balance and checkout with 1-click.
            </p>
            <button
              type="button"
              onClick={openAuthModal}
              className="inline-flex items-center gap-2 rounded-full bg-[#0c831f] px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#096a18] transition"
            >
              <span>Continue with Google / Mobile →</span>
            </button>
          </div>
        ) : null}

        {/* ── WALLET HERO & REMAINING BALANCE SECTION ── */}
        <section id="wallet" className="rounded-3xl border border-edge bg-white p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-edge pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0c831f]">
                  ⚡ Cashless PrintKarr Wallet
                </span>
                <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-[#0c831f] border border-emerald-200">
                  Active
                </span>
              </div>
              <h2 className="font-grotesk text-xl font-bold text-ink mt-1">
                Remaining Wallet Balance
              </h2>
              <p className="text-xs text-slate mt-0.5 max-w-md">
                1-click checkout for Xerox, documents, stationery &amp; custom prints. Zero transaction fees and instant delivery dispatch.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="rounded-2xl bg-[#e8f8ec] p-4 text-center sm:text-right border border-[#0c831f]/20">
                <span className="text-xs text-slate block font-medium">Available Balance</span>
                <span className="font-grotesk text-3xl font-extrabold text-[#0c831f]">
                  ₹{user.walletBalance.toFixed(2)}
                </span>
                <span className="text-[10px] text-slate block mt-0.5">Non-expiring credit</span>
              </div>

              <Link
                href="/order"
                className="rounded-2xl bg-[#0c831f] px-4 py-3 text-xs font-bold text-white text-center shadow-xs hover:bg-[#096a18] active:translate-y-0.5 transition flex flex-col justify-center"
              >
                <span>🛒 Shop with Wallet</span>
                <span className="text-[10px] opacity-90 font-normal">Order Xerox &amp; Prints →</span>
              </Link>
            </div>
          </div>

          {topUpSuccessMsg ? (
            <div className="mt-4 rounded-xl bg-[#e8f8ec] p-3 text-xs font-bold text-[#0c831f] border border-[#0c831f]/30">
              {topUpSuccessMsg}
            </div>
          ) : null}

          {/* ── USE WALLET TO SHOP MORE (Action Grid) ── */}
          <div className="mt-6 rounded-2xl border border-ink/10 bg-[#f8f9fa] p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-ink flex items-center gap-1.5">
                  <span>🛒</span>
                  <span>Use Your Remaining Balance To Shop More</span>
                </h3>
                <p className="text-[11px] text-slate mt-0.5">
                  Select a category to use your ₹{user.walletBalance.toFixed(2)} balance with instant 1-click checkout:
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Option 1: Xerox */}
              <Link
                href="/order"
                className="group rounded-xl border border-edge bg-white p-3.5 hover:border-[#0c831f] hover:shadow-xs transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">🖨️</span>
                    <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-[#0c831f]">
                      From ₹1.40
                    </span>
                  </div>
                  <h4 className="font-bold text-xs text-ink mt-2 group-hover:text-[#0c831f] transition">
                    Online Xerox &amp; Prints
                  </h4>
                  <p className="text-[11px] text-slate mt-0.5">
                    Assignments, thesis, spirals &amp; colour question banks.
                  </p>
                </div>
                <span className="mt-3 text-[11px] font-bold text-[#0c831f] flex items-center gap-1">
                  <span>Print Document</span>
                  <span>→</span>
                </span>
              </Link>

              {/* Option 2: Stationery */}
              <Link
                href="/stationery"
                className="group rounded-xl border border-edge bg-white p-3.5 hover:border-[#0c831f] hover:shadow-xs transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">📁</span>
                    <span className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">
                      Exam Prep
                    </span>
                  </div>
                  <h4 className="font-bold text-xs text-ink mt-2 group-hover:text-[#0c831f] transition">
                    Stationery &amp; Essentials
                  </h4>
                  <p className="text-[11px] text-slate mt-0.5">
                    Notebooks, transparent exam pads, pens &amp; files.
                  </p>
                </div>
                <span className="mt-3 text-[11px] font-bold text-[#0c831f] flex items-center gap-1">
                  <span>Browse Stationery</span>
                  <span>→</span>
                </span>
              </Link>

              {/* Option 3: Anime Wall Lights & Posters */}
              <Link
                href="/anime-decor"
                className="group rounded-xl border border-edge bg-white p-3.5 hover:border-[#0c831f] hover:shadow-xs transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">💡</span>
                    <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                      Hostel Hot
                    </span>
                  </div>
                  <h4 className="font-bold text-xs text-ink mt-2 group-hover:text-[#0c831f] transition">
                    Anime Lights &amp; Decor
                  </h4>
                  <p className="text-[11px] text-slate mt-0.5">
                    LED acrylic lamps, Naruto/Goku wall hangers &amp; posters.
                  </p>
                </div>
                <span className="mt-3 text-[11px] font-bold text-[#0c831f] flex items-center gap-1">
                  <span>Shop Decor</span>
                  <span>→</span>
                </span>
              </Link>

              {/* Option 4: Name Plates & Cards */}
              <Link
                href="/name-plates"
                className="group rounded-xl border border-edge bg-white p-3.5 hover:border-[#0c831f] hover:shadow-xs transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">📛</span>
                    <span className="rounded-md bg-purple-50 px-1.5 py-0.5 text-[10px] font-bold text-purple-700">
                      Custom
                    </span>
                  </div>
                  <h4 className="font-bold text-xs text-ink mt-2 group-hover:text-[#0c831f] transition">
                    Custom Name Plates
                  </h4>
                  <p className="text-[11px] text-slate mt-0.5">
                    Premium acrylic name plates for door, desk &amp; office.
                  </p>
                </div>
                <span className="mt-3 text-[11px] font-bold text-[#0c831f] flex items-center gap-1">
                  <span>Customise Plate</span>
                  <span>→</span>
                </span>
              </Link>
            </div>
          </div>

          {/* ── CAMPAIGN TOP-UP PACKS ── */}
          <div className="mt-7 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate">
                ⚡ Top-Up Packs &amp; Instant Bonus Credits
              </label>
              <span className="text-[11px] font-bold text-[#0c831f]">Recharge via Razorpay UPI / Cards</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {WALLET_OFFERS.map((offer) => (
                <div
                  key={offer.id}
                  className={`rounded-2xl border p-4 flex flex-col justify-between transition ${
                    offer.popular
                      ? "border-[#0c831f] bg-[#e8f8ec]/20 shadow-xs"
                      : "border-edge bg-white hover:border-slate"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-grotesk text-sm font-bold text-ink">
                        {offer.name}
                      </span>
                      {offer.badge ? (
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                            offer.popular
                              ? "bg-[#0c831f] text-white"
                              : "bg-amber-100 text-amber-900"
                          }`}
                        >
                          {offer.badge}
                        </span>
                      ) : null}
                    </div>

                    <p className="text-xs text-slate mt-1">{offer.tagline}</p>

                    <div className="my-3 flex items-baseline gap-2">
                      <span className="font-grotesk text-2xl font-extrabold text-ink">
                        ₹{offer.amount}
                      </span>
                      <span className="text-xs font-bold text-[#0c831f]">
                        → Get ₹{offer.totalCredit} in Wallet
                      </span>
                    </div>

                    <ul className="space-y-1 text-[11px] text-slate/80">
                      {offer.perks.map((p, idx) => (
                        <li key={idx} className="flex items-center gap-1.5">
                          <span className="text-[#0c831f] font-bold">✓</span>
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleTopUpOffer(offer)}
                    className="mt-4 w-full rounded-xl bg-[#0c831f] py-2 text-xs font-bold text-white shadow-xs hover:bg-[#096a18] active:translate-y-0.5 transition"
                  >
                    Recharge ₹{offer.amount}
                  </button>
                </div>
              ))}
            </div>

            {/* Custom Amount Form */}
            <div className="pt-2">
              <span className="text-[11px] font-semibold text-slate block mb-1">
                Or enter any custom recharge amount:
              </span>
              <form onSubmit={handleCustomTopUp} className="flex gap-2 max-w-sm">
                <input
                  type="number"
                  min="10"
                  step="10"
                  value={topUpAmount}
                  onChange={(e) =>
                    setTopUpAmount(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  placeholder="Enter amount (₹)"
                  className="flex-1 rounded-xl border border-edge px-3 py-1.5 text-xs text-ink focus:border-[#0c831f] focus:outline-none"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-ink px-4 py-1.5 text-xs font-bold text-white hover:bg-slate transition"
                >
                  Top-Up Wallet
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* ── TRANSACTION HISTORY / PASSBOOK ── */}
        {txHistory.length > 0 ? (
          <section className="rounded-3xl border border-edge bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-edge pb-4">
              <div>
                <h3 className="font-grotesk text-base font-bold text-ink">
                  Wallet Passbook &amp; Activity
                </h3>
                <p className="text-xs text-slate">
                  Your private top-ups, bonus credits, and 1-click print order debits
                </p>
              </div>
              <span className="text-xs font-bold text-[#0c831f]">
                {txHistory.length} Transactions
              </span>
            </div>

            <div className="space-y-2">
              {txHistory.map((tx) => (
                <div
                  key={tx.id}
                  className="rounded-xl border border-edge p-3 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-xl text-sm font-bold ${
                        tx.kind === "credit"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {tx.kind === "credit" ? "↓" : "↑"}
                    </span>
                    <div>
                      <p className="font-bold text-ink">{tx.label}</p>
                      <p className="text-[10px] text-slate">
                        {new Date(tx.at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`font-mono text-sm font-bold ${
                      tx.kind === "credit" ? "text-[#0c831f]" : "text-ink"
                    }`}
                  >
                    {tx.kind === "credit" ? `+₹${tx.amount}` : `-₹${Math.abs(tx.amount)}`}
                  </span>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* ── CAMPUS REFERRAL PROGRAM ── */}
        <section className="rounded-3xl border border-emerald-200 bg-emerald-50/50 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="text-3xl mt-0.5">🤝</span>
              <div>
                <h3 className="font-grotesk text-base font-bold text-emerald-950">
                  Campus Referral Program: Give ₹20, Earn ₹15 Cash
                </h3>
                <p className="text-xs text-emerald-900 mt-0.5">
                  Share your link with college classmates. They get <strong>₹20 off</strong> on their first order above ₹59, and you receive <strong>₹15 wallet cash</strong>!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyRef}
                className="rounded-xl border border-[#0c831f] bg-white px-3 py-1.5 text-xs font-bold text-[#0c831f] hover:bg-emerald-100 transition shadow-xs"
              >
                {copiedRef ? "✓ Link Copied!" : "📋 Copy Link"}
              </button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `Hey! Order fast printouts, Xerox & notes in 30 mins from PrintKarr. Use my link for ₹20 off: ${referralLink}`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl bg-[#25D366] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#1ebe5b] transition shadow-xs flex items-center gap-1.5"
              >
                <span>💬 WhatsApp Share</span>
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {REFERRAL_PROGRAM.milestones.map((m, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-emerald-200 bg-white p-3.5 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">🏆</span>
                  <div>
                    <p className="font-bold text-ink">{m.label}</p>
                    <p className="text-[10px] text-slate">Direct cash credited into your wallet</p>
                  </div>
                </div>
                <span className="font-mono text-xs font-bold text-[#0c831f]">
                  +₹{m.bonus}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ── ACTIVE COUPONS ── */}
        <section className="rounded-3xl border border-edge bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-edge pb-4">
            <div>
              <h3 className="font-grotesk text-base font-bold text-ink">
                Active Promo Codes &amp; Coupons
              </h3>
              <p className="text-xs text-slate">
                Apply these codes during checkout for instant discounts
              </p>
            </div>
            <span className="text-xs font-bold text-[#0c831f]">{ACTIVE_COUPONS.length} Active Codes</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ACTIVE_COUPONS.map((cp) => (
              <div
                key={cp.code}
                className="rounded-2xl border border-edge p-3.5 flex flex-col justify-between hover:border-slate transition"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-xs font-bold text-ink border border-ink/10">
                      {cp.code}
                    </span>
                    <span className="text-xs font-bold text-[#0c831f]">
                      {cp.type === "percent" ? `${cp.value}% OFF` : `₹${cp.value} OFF`}
                    </span>
                  </div>
                  <p className="text-xs text-slate mt-2 leading-relaxed">{cp.desc}</p>
                </div>

                <div className="mt-3 pt-2 border-t border-edge/60 flex items-center justify-between">
                  <span className="text-[10px] text-slate">Min Order: ₹{cp.minOrder}</span>
                  <button
                    type="button"
                    onClick={() => handleCopyCoupon(cp.code)}
                    className="text-xs font-bold text-[#0c831f] hover:underline"
                  >
                    {copiedCoupon === cp.code ? "✓ Copied" : "Copy Code"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── STUDENT CAMPUS BENEFITS ── */}
        {user.isLoggedIn && user.isStudent ? (
          <section className="rounded-3xl border border-amber-200 bg-amber-50/60 p-5 sm:p-6 shadow-xs">
            <div className="flex items-start gap-3">
              <span className="text-2xl mt-0.5">🎓</span>
              <div>
                <h3 className="font-grotesk text-sm font-bold text-amber-950">
                  Campus Student Delivery Benefits Active
                </h3>
                <p className="text-xs text-amber-900 mt-0.5">
                  Registered college: <strong>{user.collegeName}</strong>
                </p>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="rounded-xl bg-white/80 p-2.5 border border-amber-200">
                    <span className="font-bold text-ink block">Flat ₹5 Delivery</span>
                    <span className="text-[11px] text-slate">Direct to hostel or main campus gate</span>
                  </div>
                  <div className="rounded-xl bg-white/80 p-2.5 border border-amber-200">
                    <span className="font-bold text-ink block">Bulk Notes at ₹1.40/side</span>
                    <span className="text-[11px] text-slate">Save up to 40% on exam question banks</span>
                  </div>
                  <div className="rounded-xl bg-white/80 p-2.5 border border-amber-200">
                    <span className="font-bold text-ink block">Free Delivery at ₹149+</span>
                    <span className="text-[11px] text-slate">Automatic express dispatch across Vapi &amp; Sarigam</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {/* ── MY ORDERS SECTION ── */}
        <section className="rounded-3xl border border-edge bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-edge pb-4">
            <div>
              <h2 className="font-grotesk text-base font-bold text-ink">
                My Xerox &amp; Stationery Orders
              </h2>
              <p className="text-xs text-slate">
                Live delivery tracking, invoice downloads, and reorder history
              </p>
            </div>
            <Link
              href="/order"
              className="rounded-full bg-[#0c831f] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#096a18] transition"
            >
              + New Print
            </Link>
          </div>

          {userOrders.length === 0 ? (
            <div className="py-10 text-center">
              <span className="text-3xl block mb-2">📄</span>
              <p className="text-sm font-bold text-ink">No orders found yet</p>
              <p className="text-xs text-slate mt-1 max-w-sm mx-auto">
                Upload your assignments, thesis, or government forms to get them delivered in 30 minutes.
              </p>
              <Link
                href="/order"
                className="mt-4 inline-block rounded-full bg-[#0c831f] px-4 py-2 text-xs font-bold text-white shadow-xs"
              >
                Start an Online Xerox Order →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {userOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="rounded-2xl border border-edge p-4 hover:border-slate transition space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-edge/60 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-ink">{ord.id}</span>
                      <span className="text-xs text-slate">·</span>
                      <span className="text-xs text-slate">
                        {new Date(ord.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          ord.status === "DELIVERED"
                            ? "bg-[#e8f8ec] text-[#0c831f]"
                            : ord.status === "OUT_FOR_DELIVERY"
                            ? "bg-amber-100 text-amber-900"
                            : "bg-blue-100 text-blue-900"
                        }`}
                      >
                        {ord.status.replace(/_/g, " ")}
                      </span>
                      <Link
                        href={`/track?id=${ord.id}`}
                        className="rounded-lg border border-[#0c831f] px-2.5 py-1 text-xs font-bold text-[#0c831f] hover:bg-[#e8f8ec] transition"
                      >
                        Track Live →
                      </Link>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="font-bold text-ink">Order Items:</p>
                      <ul className="mt-1 space-y-0.5 text-slate">
                        {ord.prints.map((p) => (
                          <li key={p.id}>
                            📄 {p.fileName} ({p.pages}p × {p.copies} {p.printType === "bw" ? "B&W" : "Colour"})
                          </li>
                        ))}
                        {ord.stationery.map(({ item, quantity }) => (
                          <li key={item.id}>
                            {item.icon} {item.name} × {quantity}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <p className="font-bold text-ink">Delivery Location:</p>
                      <p className="text-slate mt-0.5 leading-snug">
                        {ord.customer.address}, {ord.customer.area}
                      </p>
                      <p className="mt-1 font-semibold text-ink">
                        Paid: <strong>₹{ord.total}</strong> ({ord.paymentMethod || "Razorpay Online"})
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── SAVED ADDRESSES ── */}
        <section className="rounded-3xl border border-edge bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-edge pb-4">
            <div>
              <h2 className="font-grotesk text-base font-bold text-ink">
                Saved Delivery Spots
              </h2>
              <p className="text-xs text-slate">
                Hostel rooms, campus gates, and home addresses for 30-min delivery
              </p>
            </div>
            <button
              type="button"
              onClick={openAddressDrawer}
              className="rounded-full border border-edge px-3.5 py-1.5 text-xs font-bold text-ink hover:border-[#0c831f] hover:text-[#0c831f] transition"
            >
              + Add Address
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className="rounded-2xl border border-edge p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate">
                      {addr.tag}
                    </span>
                    {addr.isDefault ? (
                      <span className="text-[10px] font-bold text-[#0c831f]">✓ Default</span>
                    ) : null}
                  </div>
                  <h4 className="text-xs font-bold text-ink mt-2">{addr.name}</h4>
                  <p className="text-[11px] text-slate mt-0.5">{addr.phone}</p>
                  <p className="text-xs text-slate mt-1 leading-snug">
                    {addr.address}, {addr.locality}, {addr.area} - {addr.pin}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={openAddressDrawer}
                  className="mt-3 text-left text-xs font-semibold text-[#0c831f] hover:underline"
                >
                  Edit spot ▾
                </button>
              </div>
            ))}
          </div>
        </section>
      </Container>
    </div>
  );
}
