"use client";

import { useState } from "react";
import Link from "next/link";
import { useOrders, updateOrderStatus, type OrderStatus, type OrderRecord } from "@/lib/ordersStore";
import { useCustomers, type CustomerRecord } from "@/lib/customersStore";
import { WALLET_OFFERS, ACTIVE_COUPONS, REFERRAL_PROGRAM } from "@/lib/offersData";

const ORDER_TABS: { id: OrderStatus | "ALL"; label: string; icon: string }[] = [
  { id: "ALL", label: "All Orders", icon: "📋" },
  { id: "RECEIVED", label: "New (Needs Print)", icon: "⚡" },
  { id: "PRINTING", label: "In Printing", icon: "🖨️" },
  { id: "PACKED", label: "Ready / Packed", icon: "📦" },
  { id: "OUT_FOR_DELIVERY", label: "Out for Delivery", icon: "🛵" },
  { id: "DELIVERED", label: "Delivered", icon: "✅" },
];

export default function AdminPage() {
  const { orders } = useOrders();
  const { customers, creditCustomerWallet } = useCustomers();

  const [activeSection, setActiveSection] = useState<"ORDERS" | "CUSTOMERS" | "OFFERS">("ORDERS");
  const [activeOrderTab, setActiveOrderTab] = useState<OrderStatus | "ALL">("ALL");
  const [customerSearch, setCustomerSearch] = useState("");

  // Customer Credit Modal State
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);
  const [creditAmount, setCreditAmount] = useState<number | "">("");
  const [creditReason, setCreditReason] = useState("");
  const [creditSuccessMsg, setCreditSuccessMsg] = useState("");

  const filteredOrders =
    activeOrderTab === "ALL" ? orders : orders.filter((o) => o.status === activeOrderTab);

  const getOrderTabCount = (tabId: OrderStatus | "ALL") => {
    if (tabId === "ALL") return orders.length;
    return orders.filter((o) => o.status === tabId).length;
  };

  const handleNextStatus = (order: OrderRecord) => {
    const nextMap: Record<OrderStatus, OrderStatus | null> = {
      RECEIVED: "PRINTING",
      PRINTING: "PACKED",
      PACKED: "OUT_FOR_DELIVERY",
      OUT_FOR_DELIVERY: "DELIVERED",
      DELIVERED: null,
      CANCELLED: null,
    };
    const next = nextMap[order.status];
    if (next) {
      updateOrderStatus(order.id, next);
    }
  };

  const nextActionLabel: Record<OrderStatus, string> = {
    RECEIVED: "🖨️ Start Printing",
    PRINTING: "📦 Mark Printed & Pack",
    PACKED: "🛵 Handover to Rider",
    OUT_FOR_DELIVERY: "✅ Confirm Delivered",
    DELIVERED: "Delivered",
    CANCELLED: "Cancelled",
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.phone.includes(customerSearch) ||
      c.email.toLowerCase().includes(customerSearch.toLowerCase()) ||
      (c.college && c.college.toLowerCase().includes(customerSearch.toLowerCase()))
  );

  const totalWalletLiability = customers.reduce((acc, c) => acc + c.walletBalance, 0);

  const handleApplyAdminCredit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || typeof creditAmount !== "number" || creditAmount <= 0) return;

    creditCustomerWallet(
      selectedCustomer.id,
      creditAmount,
      creditReason.trim() || `Admin Credit by Store Owner`,
      "admin-credit"
    );

    setCreditSuccessMsg(
      `✓ Successfully credited ₹${creditAmount} to ${selectedCustomer.name}'s wallet!`
    );
    setCreditAmount("");
    setCreditReason("");
    setTimeout(() => {
      setCreditSuccessMsg("");
      setSelectedCustomer(null);
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-[#f4f6fb] pb-16">
      {/* Top Banner */}
      <div className="border-b border-ink/10 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                  ● Central Desk Online
                </span>
                <span className="text-xs text-slate">Vapi GIDC Dark-Store Hub</span>
              </div>
              <h1 className="font-grotesk text-2xl sm:text-3xl font-extrabold text-ink mt-1">
                PrintKarr Dark-Store Operations
              </h1>
              <p className="text-xs sm:text-sm text-slate">
                Orders dispatch desk, registered campus customers, and campaign wallet controls.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/account"
                className="rounded-xl border border-ink/15 px-3 py-1.5 text-xs font-bold text-ink hover:bg-slate-50 transition"
              >
                My Account ↗
              </Link>
              <Link
                href="/"
                className="rounded-xl bg-ink px-3 py-1.5 text-xs font-bold text-white hover:bg-slate transition"
              >
                View Website ↗
              </Link>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-ink/10 bg-white p-3.5 shadow-xs">
              <span className="text-xs text-slate block">Today&apos;s Revenue</span>
              <b className="text-xl font-extrabold text-ink mt-0.5 block">
                ₹{orders.reduce((acc, o) => acc + o.total, 0)}
              </b>
              <span className="text-[10px] text-emerald-600 font-bold mt-1 block">
                ↑ 100% Paid online
              </span>
            </div>

            <div className="rounded-2xl border border-ink/10 bg-white p-3.5 shadow-xs">
              <span className="text-xs text-slate block">Registered Customers</span>
              <b className="text-xl font-extrabold text-ink mt-0.5 block">
                {customers.length} students
              </b>
              <span className="text-[10px] text-slate font-medium mt-1 block">
                LIT &amp; ROFEL colleges
              </span>
            </div>

            <div className="rounded-2xl border border-ink/10 bg-white p-3.5 shadow-xs">
              <span className="text-xs text-slate block">Wallet Balance Sum</span>
              <b className="text-xl font-extrabold text-[#0c831f] mt-0.5 block">
                ₹{totalWalletLiability}
              </b>
              <span className="text-[10px] text-slate font-medium mt-1 block">
                Active customer balance
              </span>
            </div>

            <div className="rounded-2xl border border-ink/10 bg-white p-3.5 shadow-xs">
              <span className="text-xs text-slate block">Active Orders</span>
              <b className="text-xl font-extrabold text-amber-600 mt-0.5 block">
                {orders.filter((o) => o.status !== "DELIVERED" && o.status !== "CANCELLED").length} orders
              </b>
              <span className="text-[10px] text-slate font-medium mt-1 block">
                Queue &amp; Dispatched
              </span>
            </div>
          </div>

          {/* Automatic Print Agent Status Strip */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-emerald-50/80 border border-emerald-200 px-4 py-2.5 text-xs">
            <div className="flex items-center gap-2.5">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#0c831f]" />
              </span>
              <span className="font-bold text-ink">
                Automatic Print Agent:{" "}
                <span className="text-[#0c831f]">Connected (Epson L3250 Series Network)</span>
              </span>
              <span className="hidden sm:inline text-slate">
                · Polling `/api/agent/next` with serial job lock
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-slate">SumatraPDF Monitored Spooler</span>
              <span className="rounded-md bg-white border border-emerald-300 px-2 py-0.5 font-bold text-[#0c831f] text-[10px]">
                AUTO-PRINT READY
              </span>
            </div>
          </div>
                Processing in dark-store
              </span>
            </div>
          </div>

          {/* Main Top Section Selector Navigation */}
          <div className="mt-6 flex items-center gap-2 border-t border-ink/10 pt-4">
            <button
              type="button"
              onClick={() => setActiveSection("ORDERS")}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition flex items-center gap-1.5 ${
                activeSection === "ORDERS"
                  ? "bg-ink text-white shadow-xs"
                  : "bg-slate-100 text-slate hover:text-ink"
              }`}
            >
              <span>📦</span>
              <span>Orders Queue ({orders.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection("CUSTOMERS")}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition flex items-center gap-1.5 ${
                activeSection === "CUSTOMERS"
                  ? "bg-ink text-white shadow-xs"
                  : "bg-slate-100 text-slate hover:text-ink"
              }`}
            >
              <span>👥</span>
              <span>Customers &amp; Wallets ({customers.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection("OFFERS")}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition flex items-center gap-1.5 ${
                activeSection === "OFFERS"
                  ? "bg-ink text-white shadow-xs"
                  : "bg-slate-100 text-slate hover:text-ink"
              }`}
            >
              <span>🏷️</span>
              <span>Coupons &amp; Campaign Packs ({ACTIVE_COUPONS.length})</span>
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {/* ==================================================================== */}
        {/* SECTION 1: ORDERS QUEUE */}
        {/* ==================================================================== */}
        {activeSection === "ORDERS" ? (
          <div>
            {/* Status Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {ORDER_TABS.map((tab) => {
                const count = getOrderTabCount(tab.id);
                const isActive = activeOrderTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveOrderTab(tab.id)}
                    className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition ${
                      isActive
                        ? "bg-ink text-white shadow-xs"
                        : "bg-white text-ink border border-ink/10 hover:border-ink/30"
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                    <span
                      className={`rounded-full px-2 py-0.2 text-[10px] font-extrabold ${
                        isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Orders Queue List */}
            <div className="mt-5 space-y-4">
              {filteredOrders.length === 0 ? (
                <div className="rounded-3xl border border-ink/10 bg-white p-12 text-center">
                  <span className="text-4xl block mb-2">🎉</span>
                  <h3 className="font-grotesk text-lg font-bold text-ink">
                    All caught up in this queue!
                  </h3>
                  <p className="text-xs text-slate mt-1 max-w-sm mx-auto">
                    No orders waiting in &quot;{ORDER_TABS.find((t) => t.id === activeOrderTab)?.label}&quot;.
                  </p>
                </div>
              ) : (
                filteredOrders.map((order) => {
                  const statusColors: Record<OrderStatus, string> = {
                    RECEIVED: "bg-amber-100 text-amber-900 border-amber-300",
                    PRINTING: "bg-blue-100 text-blue-900 border-blue-300",
                    PACKED: "bg-purple-100 text-purple-900 border-purple-300",
                    OUT_FOR_DELIVERY: "bg-emerald-100 text-emerald-900 border-emerald-300",
                    DELIVERED: "bg-slate-100 text-slate-800 border-slate-300",
                    CANCELLED: "bg-red-100 text-red-800 border-red-300",
                  };

                  return (
                    <div
                      key={order.id}
                      className="rounded-3xl border border-ink/10 bg-white p-5 sm:p-6 shadow-xs hover:border-ink/20 transition"
                    >
                      <div className="grid gap-6 lg:grid-cols-12">
                        {/* Order Header & Customer */}
                        <div className="lg:col-span-5 space-y-3 border-b lg:border-b-0 lg:border-r border-ink/10 pb-4 lg:pb-0 lg:pr-6">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-base font-extrabold text-ink">
                              {order.id}
                            </span>
                            <span
                              className={`rounded-full border px-3 py-0.5 text-xs font-bold ${
                                statusColors[order.status]
                              }`}
                            >
                              {order.status.replace(/_/g, " ")}
                            </span>
                          </div>

                          <div className="rounded-2xl bg-slate-50 p-3 space-y-1 text-xs">
                            <p className="font-bold text-ink flex items-center gap-1.5">
                              <span>👤</span>
                              <span>{order.customer.name}</span>
                            </p>
                            <p className="text-slate flex items-center gap-1.5 font-mono">
                              <span>📞</span>
                              <span>{order.customer.phone}</span>
                            </p>
                            <p className="text-slate flex items-start gap-1.5 pt-0.5">
                              <span>📍</span>
                              <span className="leading-snug">
                                {order.customer.address}, {order.customer.area} - {order.customer.pin}
                              </span>
                            </p>
                            <div className="pt-1 flex items-center gap-2">
                              <span className="rounded-md bg-white border border-ink/10 px-2 py-0.5 text-[10px] font-bold text-slate">
                                Slot: {order.deliverySlot}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-xs pt-1">
                            <span className="text-slate">Grand Total:</span>
                            <b className="font-grotesk text-base font-extrabold text-ink">
                              ₹{order.total}
                            </b>
                          </div>
                        </div>

                        {/* Order Items & Next Action */}
                        <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
                          <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-slate">
                              Print Tray &amp; Items to Pack:
                            </span>

                            {order.prints.map((p) => (
                              <div
                                key={p.id}
                                className="mt-1.5 rounded-2xl border border-ink/10 bg-slate-50 p-3 space-y-2"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <h4 className="text-xs font-bold text-ink flex items-center gap-1.5">
                                      <span>📄</span>
                                      <span>{p.fileName}</span>
                                    </h4>
                                    <p className="text-[11px] text-slate mt-0.5">
                                      {p.pages} pages × {p.copies} {p.copies === 1 ? "copy" : "copies"}
                                    </p>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      alert(`Downloading ${p.fileName} for dark-store print spooler…`)
                                    }
                                    className="rounded-xl border border-ink/20 bg-white px-2.5 py-1 text-xs font-bold text-ink hover:bg-slate-100 transition shadow-xs"
                                  >
                                    ⬇ Print Spooler
                                  </button>
                                </div>

                                <div className="flex flex-wrap gap-1.5">
                                  <span className="rounded-md bg-white border border-ink/10 px-2 py-0.5 text-[10px] font-bold text-ink">
                                    {p.printType === "bw" ? "⚫ B&W" : "🎨 Colour"}
                                  </span>
                                  <span className="rounded-md bg-white border border-ink/10 px-2 py-0.5 text-[10px] font-bold text-ink">
                                    {p.sideType === "single" ? "Single Side" : "Double Side"}
                                  </span>
                                  <span className="rounded-md bg-white border border-ink/10 px-2 py-0.5 text-[10px] font-bold text-ink">
                                    {p.paperGrade === "75gsm" ? "75 GSM Standard" : "100 GSM Bond"}
                                  </span>
                                  {p.binding !== "none" ? (
                                    <span className="rounded-md bg-amber-100 border border-amber-300 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                                      📎 {p.binding.toUpperCase()}
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            ))}

                            {/* Custom Prints */}
                            {order.customPrints && order.customPrints.length > 0 ? (
                              <div className="mt-2 space-y-1.5">
                                {order.customPrints.map((cp) => (
                                  <div
                                    key={cp.id}
                                    className="rounded-2xl border border-purple-200 bg-purple-50/50 p-2.5 flex items-center justify-between text-xs"
                                  >
                                    <div>
                                      <p className="font-bold text-purple-950">✨ {cp.title}</p>
                                      <p className="text-[11px] text-purple-900">{cp.specs || cp.specification}</p>
                                    </div>
                                    <b className="text-ink">₹{cp.totalPrice ?? (cp.price ? cp.price * cp.quantity : 0)}</b>
                                  </div>
                                ))}
                              </div>
                            ) : null}

                            {/* Stationery items */}
                            {order.stationery.length > 0 ? (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {order.stationery.map(({ item, quantity }) => (
                                  <span
                                    key={item.id}
                                    className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs text-ink font-medium"
                                  >
                                    {item.icon} {item.name} × {quantity}
                                  </span>
                                ))}
                              </div>
                            ) : null}
                          </div>

                          {/* 1-Click Status Action Bar */}
                          <div className="pt-2">
                            {order.status !== "DELIVERED" && order.status !== "CANCELLED" ? (
                              <button
                                type="button"
                                onClick={() => handleNextStatus(order)}
                                className="w-full rounded-2xl bg-[#0c831f] py-3 text-sm font-bold text-white shadow-md hover:bg-[#096a18] active:translate-y-0.5 transition flex items-center justify-center gap-2"
                              >
                                <span>{nextActionLabel[order.status]} →</span>
                              </button>
                            ) : (
                              <div className="rounded-xl bg-emerald-50 p-2.5 text-center text-xs font-bold text-emerald-800">
                                ✓ Order Fulfilled &amp; Completed
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : null}

        {/* ==================================================================== */}
        {/* SECTION 2: CUSTOMERS & WALLET BALANCES (MIGRATED FROM E:PRNTKR) */}
        {/* ==================================================================== */}
        {activeSection === "CUSTOMERS" ? (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-ink/10 shadow-xs">
              <div>
                <h2 className="font-grotesk text-lg font-bold text-ink">
                  Registered Campus Customers &amp; Wallet Ledger
                </h2>
                <p className="text-xs text-slate">
                  Migrated from E:\prntkr\data\db.json · Instant wallet balance adjustment &amp; profile lookup
                </p>
              </div>

              <div className="w-full sm:w-72">
                <input
                  type="text"
                  placeholder="Search by name, phone, or college..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="w-full rounded-xl border border-ink/15 px-3 py-1.5 text-xs focus:border-[#0c831f] focus:outline-none"
                />
              </div>
            </div>

            {/* Customer Credit Modal */}
            {selectedCustomer ? (
              <div className="rounded-3xl border border-[#0c831f] bg-[#e8f8ec]/30 p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-[#0c831f]/20 pb-2">
                  <h3 className="font-grotesk text-sm font-bold text-ink flex items-center gap-2">
                    <span>💳</span>
                    <span>
                      Add Admin Wallet Credit for <strong>{selectedCustomer.name}</strong>
                    </span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setSelectedCustomer(null)}
                    className="text-xs font-bold text-slate hover:text-red-500"
                  >
                    ✕ Close
                  </button>
                </div>

                {creditSuccessMsg ? (
                  <p className="text-xs font-bold text-[#0c831f]">{creditSuccessMsg}</p>
                ) : null}

                <form onSubmit={handleApplyAdminCredit} className="flex flex-wrap items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    placeholder="Credit Amount (₹)"
                    value={creditAmount}
                    onChange={(e) =>
                      setCreditAmount(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    className="rounded-xl border border-ink/20 bg-white px-3 py-2 text-xs font-bold w-36 focus:border-[#0c831f] focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Reason (e.g. Verified Top-up or Student Offer)"
                    value={creditReason}
                    onChange={(e) => setCreditReason(e.target.value)}
                    className="flex-1 rounded-xl border border-ink/20 bg-white px-3 py-2 text-xs min-w-[200px] focus:border-[#0c831f] focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-[#0c831f] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#096a18] transition"
                  >
                    Credit Wallet Now
                  </button>
                </form>
              </div>
            ) : null}

            {/* Customers Table */}
            <div className="rounded-3xl border border-ink/10 bg-white overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-ink/10 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate">
                    <tr>
                      <th className="px-5 py-3.5">Customer / Student</th>
                      <th className="px-5 py-3.5">Contact &amp; Email</th>
                      <th className="px-5 py-3.5">College / Institution</th>
                      <th className="px-5 py-3.5">Delivery Addresses</th>
                      <th className="px-5 py-3.5 text-right">Wallet Balance</th>
                      <th className="px-5 py-3.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink/10">
                    {filteredCustomers.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/70 transition">
                        <td className="px-5 py-4">
                          <p className="font-bold text-ink">{c.name}</p>
                          <span className="font-mono text-[10px] text-slate">{c.id}</span>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-mono text-slate">{c.phone || "No phone"}</p>
                          <p className="text-[11px] text-slate/80">{c.email}</p>
                        </td>
                        <td className="px-5 py-4">
                          {c.college ? (
                            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-900">
                              🎓 {c.college}
                            </span>
                          ) : (
                            <span className="text-slate italic text-[11px]">General User</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          {c.addresses.length > 0 ? (
                            <p className="text-[11px] text-slate max-w-xs truncate">
                              📍 {c.addresses[0].address}, {c.addresses[0].area}
                              {c.addresses.length > 1 ? ` (+${c.addresses.length - 1} more)` : ""}
                            </p>
                          ) : (
                            <span className="text-slate/60 text-[11px]">No address saved</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className="font-mono font-bold text-sm text-[#0c831f] bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                            ₹{c.walletBalance}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <button
                            type="button"
                            onClick={() => setSelectedCustomer(c)}
                            className="rounded-lg border border-[#0c831f] px-3 py-1 text-xs font-bold text-[#0c831f] hover:bg-[#e8f8ec] transition"
                          >
                            + Credit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}

        {/* ==================================================================== */}
        {/* SECTION 3: OFFERS, CAMPAIGN PACKS & COUPONS */}
        {/* ==================================================================== */}
        {activeSection === "OFFERS" ? (
          <div className="space-y-6">
            {/* Wallet Campaign Top-Up Packs */}
            <div className="rounded-3xl border border-ink/10 bg-white p-6 shadow-xs space-y-4">
              <div className="border-b border-ink/10 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#0c831f]">
                  Active In-Store Offers
                </span>
                <h3 className="font-grotesk text-lg font-bold text-ink mt-0.5">
                  Campaign Top-Up Wallet Packs (from E:\prntkr)
                </h3>
                <p className="text-xs text-slate">
                  Bonus tiers automatically credited to customer wallets when they recharge.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {WALLET_OFFERS.map((o) => (
                  <div key={o.id} className="rounded-2xl border border-edge p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <b className="text-sm font-bold text-ink">{o.name}</b>
                      {o.badge ? (
                        <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                          {o.badge}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-xs text-slate">{o.tagline}</p>
                    <div className="pt-2 flex items-baseline justify-between border-t border-edge text-xs">
                      <span>Amount: <strong>₹{o.amount}</strong></span>
                      <span className="text-[#0c831f] font-bold">Total Credit: ₹{o.totalCredit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Coupons Grid */}
            <div className="rounded-3xl border border-ink/10 bg-white p-6 shadow-xs space-y-4">
              <div className="border-b border-ink/10 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#0c831f]">
                  Promo Discount Codes
                </span>
                <h3 className="font-grotesk text-lg font-bold text-ink mt-0.5">
                  Active Checkout Coupons
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {ACTIVE_COUPONS.map((cp) => (
                  <div key={cp.code} className="rounded-2xl border border-edge p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-xs font-extrabold text-ink">
                        {cp.code}
                      </span>
                      <span className="font-bold text-xs text-[#0c831f]">
                        {cp.type === "percent" ? `${cp.value}% OFF` : `₹${cp.value} OFF`}
                      </span>
                    </div>
                    <p className="text-xs text-slate">{cp.desc}</p>
                    <p className="text-[10px] text-slate pt-1 font-semibold">
                      Min Order: ₹{cp.minOrder}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Referral Rules */}
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50/50 p-6 shadow-xs space-y-3">
              <h3 className="font-grotesk text-base font-bold text-emerald-950">
                Campus Referral Configuration
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="rounded-xl bg-white p-3 border border-emerald-200">
                  <span className="text-slate block">Invited Friend Perk:</span>
                  <b className="text-ink text-sm">₹{REFERRAL_PROGRAM.friendDiscount} Instant Discount</b>
                  <span className="text-[10px] text-slate block mt-0.5">On orders ≥ ₹{REFERRAL_PROGRAM.friendMinOrder}</span>
                </div>
                <div className="rounded-xl bg-white p-3 border border-emerald-200">
                  <span className="text-slate block">Referrer Cash Reward:</span>
                  <b className="text-[#0c831f] text-sm">₹{REFERRAL_PROGRAM.referrerCredit} Wallet Credit</b>
                  <span className="text-[10px] text-slate block mt-0.5">Credited on friend&apos;s first purchase</span>
                </div>
                <div className="rounded-xl bg-white p-3 border border-emerald-200">
                  <span className="text-slate block">Milestones:</span>
                  <b className="text-ink text-sm">3 friends = ₹50 · 5 friends = ₹100</b>
                  <span className="text-[10px] text-slate block mt-0.5">Automated milestone rewards</span>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
