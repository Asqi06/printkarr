"use client";

import { useState } from "react";
import Link from "next/link";
import { useUser } from "@/lib/userStore";
import { useOrders } from "@/lib/ordersStore";
import { useAddresses, openAddressDrawer } from "@/lib/addressStore";
import { useCustomers } from "@/lib/customersStore";
import { WALLET_OFFERS, ACTIVE_COUPONS, REFERRAL_PROGRAM, type WalletOffer } from "@/lib/offersData";
import { Container } from "@/components/ui";

export default function AccountPage() {
  const { user, loginWithGoogle, logout, topUpWallet, switchCustomer } = useUser();
  const { orders } = useOrders();
  const { addresses } = useAddresses();
  const { customers, getCustomerTransactions } = useCustomers();

  const [topUpAmount, setTopUpAmount] = useState<number | "">("");
  const [topUpSuccessMsg, setTopUpSuccessMsg] = useState("");
  const [copiedCoupon, setCopiedCoupon] = useState("");
  const [copiedRef, setCopiedRef] = useState(false);
  const [showAccountSwitcher, setShowAccountSwitcher] = useState(false);

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

  const referralLink = `https://printkarr.in/?ref=${user.id}`;

  const handleCopyRef = () => {
    void navigator.clipboard.writeText(referralLink);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 3000);
  };

  const userOrders = orders.filter(
    (o) =>
      o.customer.phone === user.phone ||
      o.customer.name.toLowerCase().includes(user.name.toLowerCase().split(" ")[0])
  );

  const txHistory = getCustomerTransactions(user.id);

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-20">
      {/* Top Banner */}
      <div className="border-b border-edge bg-white py-6">
        <Container>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0c831f] text-white text-lg font-bold shadow-xs">
                {user.name ? user.name[0] : "P"}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-grotesk text-xl sm:text-2xl font-bold text-ink">
                    {user.isLoggedIn ? user.name : "My PrintKarr Account"}
                  </h1>
                  {user.isStudent ? (
                    <span className="rounded-full bg-[#f8cb46]/30 px-2.5 py-0.5 text-[10px] font-bold text-ink border border-[#f8cb46]">
                      🎓 Campus Pass
                    </span>
                  ) : null}
                </div>
                <p className="text-xs text-slate mt-0.5">
                  {user.isLoggedIn
                    ? `${user.email} · ${user.phone}${user.collegeName ? ` · ${user.collegeName}` : ""}`
                    : "Sign in with Google to track orders and unlock student discounts"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAccountSwitcher(!showAccountSwitcher)}
                className="rounded-xl border border-ink/20 bg-slate-50 px-3 py-1.5 text-xs font-bold text-ink hover:bg-slate-100 transition"
              >
                👥 Switch Account ({customers.length})
              </button>

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
                  onClick={loginWithGoogle}
                  className="flex items-center gap-2 rounded-xl bg-ink px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate transition"
                >
                  <span>G</span>
                  <span>Continue with Google</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Account Switcher Drawer/Dropdown */}
          {showAccountSwitcher ? (
            <div className="mt-4 rounded-2xl border border-ink/10 bg-slate-50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate">
                  Registered Customer Profiles (Migrated from PrintKarr E:prntkr)
                </span>
                <span className="text-[11px] text-slate font-medium">Click to activate profile</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {customers.map((c) => {
                  const active = user.id === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        switchCustomer(c);
                        setShowAccountSwitcher(false);
                      }}
                      className={`rounded-xl border p-2.5 text-left transition flex items-center justify-between ${
                        active
                          ? "border-[#0c831f] bg-[#e8f8ec]/60 font-bold"
                          : "border-ink/10 bg-white hover:border-ink/20"
                      }`}
                    >
                      <div className="truncate pr-2">
                        <p className="text-xs font-bold text-ink truncate">{c.name}</p>
                        <p className="text-[10px] text-slate truncate">{c.college || c.email}</p>
                      </div>
                      <span className="rounded-lg bg-emerald-100 px-2 py-0.5 text-xs font-mono font-bold text-emerald-800 shrink-0">
                        ₹{c.walletBalance}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </Container>
      </div>

      <Container className="py-8 space-y-8">
        {/* Wallet Section */}
        <section className="rounded-3xl border border-edge bg-white p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-edge pb-5">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate">
                PrintKarr Cashless Wallet
              </span>
              <h2 className="font-grotesk text-xl font-bold text-ink mt-0.5">
                Instant 1-Click Payments for Xerox &amp; Stationery
              </h2>
              <p className="text-xs text-slate mt-0.5 max-w-md">
                Skip bank OTPs and UPI PIN delays. Pay for your daily notes and prints instantly at doorstep or campus gate.
              </p>
            </div>

            <div className="rounded-2xl bg-[#e8f8ec] p-4 text-center sm:text-right border border-[#0c831f]/20">
              <span className="text-xs text-slate block">Current Wallet Balance</span>
              <span className="font-grotesk text-3xl font-extrabold text-[#0c831f]">
                ₹{user.walletBalance.toFixed(2)}
              </span>
            </div>
          </div>

          {topUpSuccessMsg ? (
            <div className="mt-4 rounded-xl bg-[#e8f8ec] p-3 text-xs font-bold text-[#0c831f] border border-[#0c831f]/30">
              {topUpSuccessMsg}
            </div>
          ) : null}

          {/* Campaign Top-Up Packs (Exact Offers from E:prntkr) */}
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate">
                ⚡ Special Campaign Wallet Packs &amp; Student Bonuses
              </label>
              <span className="text-[11px] font-bold text-[#0c831f]">Auto-credited instantly</span>
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
                Or enter any custom top-up amount (e.g. ₹150, ₹300):
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

        {/* Wallet Ledger / Transactions */}
        {txHistory.length > 0 ? (
          <section className="rounded-3xl border border-edge bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-edge pb-4">
              <div>
                <h3 className="font-grotesk text-base font-bold text-ink">
                  Wallet Activity &amp; Transaction History
                </h3>
                <p className="text-xs text-slate">
                  Recent top-ups, bonus credits, and 1-click print order debits
                </p>
              </div>
              <span className="text-xs font-bold text-[#0c831f]">{txHistory.length} Transactions</span>
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

        {/* Campus Referral Program */}
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

        {/* Active Coupons from PrintKarr */}
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

        {/* Student Benefits Card */}
        {user.isStudent ? (
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

        {/* My Orders Section */}
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
                className="mt-4 inline-block rounded-full bg-[#0c831f] px-4 py-2 text-xs font-bold text-white"
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

        {/* Saved Addresses Section */}
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
