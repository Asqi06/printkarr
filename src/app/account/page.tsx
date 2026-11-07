"use client";

import { useState } from "react";
import Link from "next/link";
import { useUser } from "@/lib/userStore";
import { useOrders } from "@/lib/ordersStore";
import { useAddresses, openAddressDrawer } from "@/lib/addressStore";
import { Container } from "@/components/ui";

export default function AccountPage() {
  const { user, loginWithGoogle, logout, topUpWallet } = useUser();
  const { orders } = useOrders();
  const { addresses } = useAddresses();

  const [topUpAmount, setTopUpAmount] = useState<number | "">("");
  const [topUpSuccessMsg, setTopUpSuccessMsg] = useState("");

  const handleTopUp = (amount: number) => {
    const newBal = topUpWallet(amount);
    let bonus = 0;
    if (amount >= 500) bonus = Math.round(amount * 0.15);
    else if (amount >= 250) bonus = Math.round(amount * 0.1);
    else if (amount >= 100) bonus = Math.round(amount * 0.05);

    setTopUpSuccessMsg(
      `🎉 Successfully added ₹${amount}${bonus > 0 ? ` + ₹${bonus} Free Bonus` : ""} to your wallet!`
    );
    setTimeout(() => setTopUpSuccessMsg(""), 4500);
  };

  const handleCustomTopUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof topUpAmount !== "number" || topUpAmount < 10) return;
    handleTopUp(topUpAmount);
    setTopUpAmount("");
  };

  const userOrders = orders.filter(
    (o) =>
      o.customer.phone === user.phone ||
      o.customer.name.toLowerCase().includes(user.name.toLowerCase().split(" ")[0])
  );

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
                      🎓 Student Pass
                    </span>
                  ) : null}
                </div>
                <p className="text-xs text-slate mt-0.5">
                  {user.isLoggedIn
                    ? `${user.email} · ${user.phone}`
                    : "Sign in with Google to track orders and unlock student discounts"}
                </p>
              </div>
            </div>

            {user.isLoggedIn ? (
              <button
                type="button"
                onClick={logout}
                className="self-start sm:self-auto rounded-xl border border-edge bg-white px-3.5 py-1.5 text-xs font-bold text-slate hover:text-red-600 hover:border-red-200 transition"
              >
                Sign Out
              </button>
            ) : (
              <button
                type="button"
                onClick={loginWithGoogle}
                className="self-start sm:self-auto flex items-center gap-2 rounded-xl bg-ink px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate transition"
              >
                <span>G</span>
                <span>Continue with Google</span>
              </button>
            )}
          </div>
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
              <h2 className="font-grotesk text-lg font-bold text-ink mt-0.5">
                Instant 1-Click Payments for Xerox &amp; Stationery
              </h2>
              <p className="text-xs text-slate mt-0.5 max-w-md">
                Skip bank OTPs and UPI PIN delays. Pay for your daily notes and prints instantly.
              </p>
            </div>

            <div className="rounded-2xl bg-[#e8f8ec] p-4 text-center sm:text-right border border-[#0c831f]/20">
              <span className="text-xs text-slate block">Current Wallet Balance</span>
              <span className="font-grotesk text-2xl font-extrabold text-[#0c831f]">
                ₹{user.walletBalance.toFixed(2)}
              </span>
            </div>
          </div>

          {topUpSuccessMsg ? (
            <div className="mt-4 rounded-xl bg-[#e8f8ec] p-3 text-xs font-bold text-[#0c831f] border border-[#0c831f]/30">
              {topUpSuccessMsg}
            </div>
          ) : null}

          {/* Wallet Top-Up Bonus Tiers */}
          <div className="mt-5 space-y-3">
            <label className="block text-xs font-bold text-ink">
              ⚡ Quick Top-Up with Student Savings Bonus
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handleTopUp(100)}
                className="rounded-2xl border border-edge p-3.5 text-left hover:border-[#0c831f] hover:bg-[#e8f8ec]/30 transition group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-ink">+ ₹100</span>
                  <span className="rounded-md bg-[#0c831f]/10 px-2 py-0.5 text-[10px] font-bold text-[#0c831f]">
                    +5% Bonus
                  </span>
                </div>
                <p className="text-xs text-slate mt-1">Get ₹105 in wallet</p>
              </button>

              <button
                type="button"
                onClick={() => handleTopUp(250)}
                className="rounded-2xl border border-[#0c831f] bg-[#e8f8ec]/20 p-3.5 text-left hover:bg-[#e8f8ec]/40 transition group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-ink">+ ₹250</span>
                  <span className="rounded-md bg-[#0c831f] px-2 py-0.5 text-[10px] font-bold text-white">
                    +10% Popular
                  </span>
                </div>
                <p className="text-xs text-slate mt-1">Get ₹275 in wallet</p>
              </button>

              <button
                type="button"
                onClick={() => handleTopUp(500)}
                className="rounded-2xl border border-edge p-3.5 text-left hover:border-[#0c831f] hover:bg-[#e8f8ec]/30 transition group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-ink">+ ₹500</span>
                  <span className="rounded-md bg-[#f8cb46] px-2 py-0.5 text-[10px] font-bold text-ink">
                    +15% Best Value
                  </span>
                </div>
                <p className="text-xs text-slate mt-1">Get ₹575 in wallet</p>
              </button>
            </div>

            {/* Custom Amount */}
            <form onSubmit={handleCustomTopUp} className="flex gap-2 max-w-sm pt-2">
              <input
                type="number"
                min="10"
                step="10"
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="Enter custom amount (e.g. ₹150)"
                className="flex-1 rounded-xl border border-edge px-3 py-1.5 text-xs text-ink focus:border-[#0c831f] focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-xl bg-ink px-4 py-1.5 text-xs font-bold text-white hover:bg-slate transition"
              >
                Top-Up
              </button>
            </form>
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
                    <span className="font-bold text-ink block">Bulk Notes at ₹1.25/page</span>
                    <span className="text-[11px] text-slate">Save up to 40% on exam question banks</span>
                  </div>
                  <div className="rounded-xl bg-white/80 p-2.5 border border-amber-200">
                    <span className="font-bold text-ink block">Free Spiral Binding</span>
                    <span className="text-[11px] text-slate">On project reports above 80 pages</span>
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
