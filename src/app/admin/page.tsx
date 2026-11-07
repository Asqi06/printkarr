"use client";

import { useState } from "react";
import Link from "next/link";
import { useOrders, updateOrderStatus, type OrderStatus, type OrderRecord } from "@/lib/ordersStore";

const TABS: { id: OrderStatus | "ALL"; label: string; icon: string }[] = [
  { id: "ALL", label: "All Orders", icon: "📋" },
  { id: "RECEIVED", label: "New (Needs Print)", icon: "⚡" },
  { id: "PRINTING", label: "In Printing", icon: "🖨️" },
  { id: "PACKED", label: "Ready / Packed", icon: "📦" },
  { id: "OUT_FOR_DELIVERY", label: "Out for Delivery", icon: "🛵" },
  { id: "DELIVERED", label: "Delivered", icon: "✅" },
];

export default function AdminPage() {
  const { orders } = useOrders();
  const [activeTab, setActiveTab] = useState<OrderStatus | "ALL">("ALL");

  const filteredOrders =
    activeTab === "ALL" ? orders : orders.filter((o) => o.status === activeTab);

  const getTabCount = (tabId: OrderStatus | "ALL") => {
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
                1-click print preparation, stationery packing slips, and rider dispatches.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/order"
                className="rounded-xl border border-ink/15 px-3 py-1.5 text-xs font-bold text-ink hover:bg-slate-50 transition"
              >
                + Test Customer Order
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
              <span className="text-xs text-slate block">Total Print Jobs</span>
              <b className="text-xl font-extrabold text-ink mt-0.5 block">
                {orders.length} orders
              </b>
              <span className="text-[10px] text-slate font-medium mt-1 block">
                Vapi &amp; Sarigam desk
              </span>
            </div>

            <div className="rounded-2xl border border-ink/10 bg-white p-3.5 shadow-xs">
              <span className="text-xs text-slate block">Printing Now</span>
              <b className="text-xl font-extrabold text-[#0c831f] mt-0.5 block">
                {orders.filter((o) => o.status === "PRINTING").length} active
              </b>
              <span className="text-[10px] text-slate font-medium mt-1 block">
                In spool tray
              </span>
            </div>

            <div className="rounded-2xl border border-ink/10 bg-white p-3.5 shadow-xs">
              <span className="text-xs text-slate block">Ready for Dispatch</span>
              <b className="text-xl font-extrabold text-amber-600 mt-0.5 block">
                {orders.filter((o) => o.status === "PACKED").length} parcels
              </b>
              <span className="text-[10px] text-slate font-medium mt-1 block">
                Awaiting rider pickup
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {/* Status Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {TABS.map((tab) => {
            const count = getTabCount(tab.id);
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
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
                No orders waiting in &quot;{TABS.find((t) => t.id === activeTab)?.label}&quot;.
              </p>
            </div>
          ) : (
            filteredOrders.map((order) => {
              const statusColors: Record<OrderStatus, string> = {
                RECEIVED: "bg-amber-100 text-amber-900 border-amber-300",
                PRINTING: "bg-blue-100 text-blue-900 border-blue-300",
                PACKED: "bg-purple-100 text-purple-900 border-purple-300",
                OUT_FOR_DELIVERY: "bg-indigo-100 text-indigo-900 border-indigo-300",
                DELIVERED: "bg-emerald-100 text-emerald-900 border-emerald-300",
                CANCELLED: "bg-rose-100 text-rose-900 border-rose-300",
              };

              return (
                <div
                  key={order.id}
                  className="rounded-3xl border border-ink/10 bg-white p-5 shadow-xs transition hover:shadow-md"
                >
                  {/* Order Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-ink/10 pb-4 gap-3">
                    <div className="flex items-center gap-3">
                      <b className="font-mono text-base sm:text-lg font-extrabold text-ink">
                        #{order.id}
                      </b>
                      <span
                        className={`rounded-full px-3 py-0.5 text-xs font-bold border ${
                          statusColors[order.status]
                        }`}
                      >
                        {order.status.replaceAll("_", " ")}
                      </span>
                      <span className="text-xs text-slate">
                        {new Date(order.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate">
                        OTP: <strong className="text-ink text-sm">{order.otp}</strong>
                      </span>
                      <span className="h-4 w-px bg-ink/10" />
                      <b className="text-base font-extrabold text-[#0c831f]">
                        ₹{order.total}
                      </b>
                    </div>
                  </div>

                  {/* 2-Column Packing Slip Grid */}
                  <div className="grid gap-6 pt-4 lg:grid-cols-2">
                    {/* Left Column: Customer & Delivery Info */}
                    <div className="space-y-3">
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate">
                          Customer &amp; Handover Spot
                        </span>
                        <div className="mt-1 flex items-center justify-between">
                          <p className="font-bold text-sm text-ink">{order.customer.name}</p>
                          <div className="flex gap-2">
                            <a
                              href={`https://wa.me/${order.customer.phone.replace(/\D/g, "")}?text=Hi%20${encodeURIComponent(
                                order.customer.name
                              )},%20your%20PrintKarr%20order%20${order.id}%20is%20being%20prepared!`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-lg bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition"
                            >
                              💬 WhatsApp
                            </a>
                            <a
                              href={`tel:${order.customer.phone}`}
                              className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-ink hover:bg-slate-200 transition"
                            >
                              📞 Call
                            </a>
                          </div>
                        </div>
                        <p className="text-xs text-slate font-mono mt-0.5">
                          {order.customer.phone}
                        </p>
                        <p className="text-xs text-ink mt-1 font-medium">
                          📍 {order.customer.address}, {order.customer.area} - {order.customer.pin}
                        </p>
                        <p className="text-xs font-semibold text-amber-700 mt-1">
                          ⚡ {order.deliverySlot}
                        </p>
                      </div>

                      {/* Attached Stationery Checklist */}
                      {order.stationery.length > 0 ? (
                        <div className="rounded-2xl border border-ink/10 bg-slate-50 p-3">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate block mb-1.5">
                            Stationery Packing Checklist
                          </span>
                          <div className="space-y-1">
                            {order.stationery.map(({ item, quantity }) => (
                              <div
                                key={item.id}
                                className="flex items-center justify-between text-xs"
                              >
                                <span className="flex items-center gap-1.5 text-ink font-semibold">
                                  <span>{item.icon}</span>
                                  <span>
                                    {quantity}x {item.name}
                                  </span>
                                </span>
                                <span className="text-[11px] font-bold text-slate">
                                  Pack &amp; Seal
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>

                    {/* Right Column: Print Spec Details & PDF Download */}
                    <div className="space-y-3">
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate">
                          Print Job Specifications
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
                                  alert(`Downloading ${p.fileName} for dark-store print tray…`)
                                }
                                className="rounded-xl border border-ink/20 bg-white px-2.5 py-1 text-xs font-bold text-ink hover:bg-slate-100 transition shadow-xs"
                              >
                                ⬇ Download PDF
                              </button>
                            </div>

                            {/* Spec Pills */}
                            <div className="flex flex-wrap gap-1.5">
                              <span className="rounded-md bg-white border border-ink/10 px-2 py-0.5 text-[10px] font-bold text-ink">
                                {p.printType === "bw" ? "⚫ B&W" : "🎨 Colour"}
                              </span>
                              <span className="rounded-md bg-white border border-ink/10 px-2 py-0.5 text-[10px] font-bold text-ink">
                                {p.sideType === "single" ? "Single Side" : "Double Side (Front-Back)"}
                              </span>
                              <span className="rounded-md bg-white border border-ink/10 px-2 py-0.5 text-[10px] font-bold text-ink">
                                {p.paperGrade === "75gsm" ? "75 GSM Standard" : "100 GSM Bond"}
                              </span>
                              {p.binding !== "none" ? (
                                <span className="rounded-md bg-amber-100 border border-amber-300 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                                  📎 {p.binding.toUpperCase()} BINDING
                                </span>
                              ) : null}
                            </div>
                          </div>
                        ))}
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
    </div>
  );
}
