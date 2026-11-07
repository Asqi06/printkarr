"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useOrders, type OrderRecord, type OrderStatus } from "@/lib/ordersStore";

const STAGES: { id: OrderStatus; label: string; icon: string; desc: string }[] = [
  {
    id: "RECEIVED",
    label: "Order Placed & Confirmed",
    icon: "✅",
    desc: "Payment verified. Print hub has accepted your order.",
  },
  {
    id: "PRINTING",
    label: "Document In Printing",
    icon: "🖨️",
    desc: "Laser print spool running. Quality check in progress.",
  },
  {
    id: "PACKED",
    label: "Packed & Sealed",
    icon: "📦",
    desc: "Document sealed in waterproof pouch with stationery add-ons.",
  },
  {
    id: "OUT_FOR_DELIVERY",
    label: "Out for Delivery",
    icon: "🛵",
    desc: "Delivery partner is on the way to your doorstep.",
  },
  {
    id: "DELIVERED",
    label: "Delivered",
    icon: "🎉",
    desc: "Handover completed at your location.",
  },
];

export function TrackClient() {
  const searchParams = useSearchParams();
  const paramId = (searchParams.get("id") || "").trim().toUpperCase();

  const { orders } = useOrders();
  const [searchInput, setSearchInput] = useState(paramId);

  // Find active order or fallback to first order
  const currentOrder =
    (paramId ? orders.find((o) => o.id.toUpperCase() === paramId) : null) ||
    (searchInput ? orders.find((o) => o.id.toUpperCase() === searchInput) : null) ||
    orders[0] ||
    null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const currentStageIndex = currentOrder
    ? STAGES.findIndex((s) => s.id === currentOrder.status)
    : 0;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Search Input Box */}
      <form onSubmit={handleSearch} className="rounded-3xl border border-ink/10 bg-white p-4 shadow-xs">
        <label className="block text-xs font-bold text-slate mb-1">
          Track by Order ID
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value.toUpperCase())}
            placeholder="e.g. PK-92841"
            className="flex-1 rounded-xl border border-ink/15 px-3.5 py-2 text-sm font-mono uppercase focus:border-[#0c831f] focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-xl bg-[#0c831f] px-5 py-2 text-xs font-bold text-white hover:bg-[#096a18] transition"
          >
            Track Order
          </button>
        </div>
      </form>

      {currentOrder ? (
        <div className="space-y-6">
          {/* Top Live ETA Card */}
          <div className="rounded-3xl border border-ink/10 bg-white p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                    ⚡ Live Status · {currentOrder.status.replaceAll("_", " ")}
                  </span>
                  <span className="text-xs text-slate font-mono">#{currentOrder.id}</span>
                </div>
                <h2 className="font-grotesk text-2xl sm:text-3xl font-extrabold text-ink mt-2">
                  {currentOrder.eta}
                </h2>
                <p className="text-xs sm:text-sm text-slate mt-1">
                  Fulfilled from PrintKarr Dark-Store · Delivering to {currentOrder.customer.address},{" "}
                  {currentOrder.customer.area}
                </p>
              </div>

              {/* Delivery OTP Badge */}
              <div className="rounded-2xl border-2 border-dashed border-[#0c831f] bg-[#e8f8ec] p-4 text-center sm:text-right shrink-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate block">
                  Delivery OTP
                </span>
                <b className="font-mono text-2xl font-extrabold text-[#0c831f] tracking-widest block">
                  {currentOrder.otp}
                </b>
                <span className="text-[10px] text-slate block mt-0.5">
                  Share with rider upon arrival
                </span>
              </div>
            </div>

            {/* Rider Details Bar */}
            {currentOrder.rider ? (
              <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-slate-50 p-4 border border-ink/5">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f8cb46] text-xl shadow-xs">
                    🛵
                  </span>
                  <div>
                    <h3 className="text-xs font-bold text-ink">{currentOrder.rider.name}</h3>
                    <p className="text-[11px] text-slate font-mono">
                      {currentOrder.rider.vehicle} · Verified Dark-Store Rider
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`https://wa.me/${currentOrder.rider.phone.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition"
                  >
                    💬 WhatsApp Rider
                  </a>
                  <a
                    href={`tel:${currentOrder.rider.phone}`}
                    className="rounded-xl border border-ink/20 bg-white px-3 py-1.5 text-xs font-bold text-ink hover:bg-slate-100 transition"
                  >
                    📞 Call
                  </a>
                </div>
              </div>
            ) : null}
          </div>

          {/* Blinkit Visual Timeline */}
          <div className="rounded-3xl border border-ink/10 bg-white p-6 shadow-xs">
            <h3 className="font-grotesk text-base font-bold text-ink mb-6">
              Order Timeline
            </h3>

            <div className="relative pl-6 space-y-8 before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-ink/10">
              {STAGES.map((stage, idx) => {
                const isPassed = currentStageIndex >= idx;
                const isCurrent = currentStageIndex === idx;

                return (
                  <div key={stage.id} className="relative flex items-start gap-4">
                    {/* Circle Pip */}
                    <div
                      className={`absolute -left-6 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold shadow-xs transition ${
                        isCurrent
                          ? "bg-[#0c831f] text-white ring-4 ring-[#e8f8ec]"
                          : isPassed
                          ? "bg-[#0c831f] text-white"
                          : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      {isPassed ? "✓" : idx + 1}
                    </div>

                    <div className="pl-4">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{stage.icon}</span>
                        <h4
                          className={`text-sm font-bold ${
                            isPassed ? "text-ink" : "text-slate"
                          }`}
                        >
                          {stage.label}
                        </h4>
                        {isCurrent ? (
                          <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-extrabold text-amber-900 animate-pulse">
                            IN PROGRESS
                          </span>
                        ) : null}
                      </div>
                      <p className="text-xs text-slate mt-0.5">{stage.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Packing Slip & Items Summary */}
          <div className="rounded-3xl border border-ink/10 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-ink/10 pb-3">
              <h3 className="font-grotesk text-base font-bold text-ink">
                Items in This Parcel
              </h3>
              <button
                type="button"
                onClick={() => alert("Downloading tax invoice & packing slip PDF…")}
                className="text-xs font-bold text-[#0c831f] hover:underline"
              >
                ⬇ Download Invoice
              </button>
            </div>

            {/* Prints List */}
            {currentOrder.prints.map((p) => (
              <div
                key={p.id}
                className="flex items-start justify-between rounded-2xl bg-slate-50 p-3.5 border border-ink/5"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl mt-0.5">📄</span>
                  <div>
                    <h4 className="text-xs font-bold text-ink">{p.fileName}</h4>
                    <p className="text-[11px] text-slate mt-0.5">
                      {p.pages} pages × {p.copies} {p.copies === 1 ? "copy" : "copies"} ·{" "}
                      <span className="font-semibold text-ink">
                        {p.printType === "bw" ? "B&W" : "Colour"}
                      </span>{" "}
                      · {p.sideType === "single" ? "Single side" : "Double side"}
                    </p>
                    {p.binding !== "none" ? (
                      <span className="mt-1 inline-block rounded-md bg-white border border-ink/10 px-2 py-0.5 text-[10px] font-bold text-ink">
                        📎 {p.binding} binding
                      </span>
                    ) : null}
                  </div>
                </div>
                <b className="text-xs font-bold text-ink">₹{p.subtotal}</b>
              </div>
            ))}

            {/* Stationery List */}
            {currentOrder.stationery.map(({ item, quantity }) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-2xl bg-slate-50 p-3 border border-ink/5"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">{item.icon}</span>
                  <div>
                    <h4 className="text-xs font-bold text-ink">{item.name}</h4>
                    <p className="text-[11px] text-slate">Qty: {quantity}</p>
                  </div>
                </div>
                <b className="text-xs font-bold text-ink">₹{item.price * quantity}</b>
              </div>
            ))}

            {/* Bill Total Line */}
            <div className="border-t border-ink/10 pt-3 flex items-center justify-between font-extrabold text-sm text-ink">
              <div>
                <span>Total Paid</span>
                <span className="block text-[10px] font-normal text-slate">
                  Via {currentOrder.paymentMethod || "Razorpay Online"}
                </span>
              </div>
              <span>₹{currentOrder.total}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-ink/10 bg-white p-12 text-center">
          <span className="text-4xl block mb-2">🔍</span>
          <h3 className="font-grotesk text-lg font-bold text-ink">Order Not Found</h3>
          <p className="text-xs text-slate mt-1 max-w-sm mx-auto">
            Please check the Order ID and try again, or start a new print order.
          </p>
          <Link
            href="/order"
            className="mt-4 inline-block rounded-full bg-[#0c831f] px-5 py-2 text-xs font-bold text-white shadow-xs"
          >
            Start a Print →
          </Link>
        </div>
      )}
    </div>
  );
}
