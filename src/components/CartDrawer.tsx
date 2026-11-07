"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCart,
  closeCart,
  updateStationeryQuantity,
  removePrint,
  addStationery,
  setDeliverySlot,
  applyCoupon,
  removeCoupon,
  type DeliverySlot,
} from "@/lib/cartStore";
import { useAddresses, openAddressDrawer } from "@/lib/addressStore";
import { STATIONERY_CATALOGUE, type StationeryItem } from "@/lib/stationeryData";
import { createOrder } from "@/lib/ordersStore";

export function CartDrawer() {
  const router = useRouter();
  const cart = useCart();
  const { activeAddress } = useAddresses();
  const [couponInput, setCouponInput] = useState("");
  const [couponMsg, setCouponMsg] = useState("");
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  useEffect(() => {
    if (!cart.isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCart();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cart.isOpen]);

  if (!cart.isOpen) return null;

  // Filter 4 impulse items not already in cart
  const inCartIds = new Set(cart.stationery.map((s) => s.item.id));
  const impulseItems = STATIONERY_CATALOGUE.filter((item) => !inCartIds.has(item.id)).slice(0, 4);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    const res = cart.applyCoupon(couponInput);
    setCouponMsg(res.message);
  };

  const handleCheckout = () => {
    setIsCheckingOut(true);
    setTimeout(() => {
      const order = createOrder({
        customer: activeAddress,
        prints: cart.prints,
        stationery: cart.stationery,
        subtotal: cart.subtotal,
        deliveryFee: cart.deliveryFee,
        discount: cart.couponDiscount,
        total: cart.total,
        deliverySlot:
          cart.deliverySlot === "express"
            ? "⚡ Express (30–45 mins)"
            : cart.deliverySlot === "campus"
            ? "🎓 Campus Gate Schedule"
            : "📦 Same-Day Evening",
      });

      cart.clearCart();
      cart.closeCart();
      setIsCheckingOut(false);
      router.push(`/track?id=${order.id}`);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-ink/60 backdrop-blur-xs transition-opacity duration-200">
      <div
        className="relative flex h-full w-full max-w-md flex-col bg-slate-50 shadow-2xl transition-transform duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-ink/10 bg-white px-5 py-4">
          <div className="flex items-center gap-2.5">
            <h2 id="cart-drawer-title" className="font-grotesk text-lg font-bold text-ink">
              My Basket
            </h2>
            <span className="rounded-full bg-[#0c831f]/10 px-2.5 py-0.5 text-xs font-bold text-[#0c831f]">
              {cart.totalCount} {cart.totalCount === 1 ? "item" : "items"}
            </span>
          </div>
          <button
            type="button"
            onClick={closeCart}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-ink hover:bg-slate-200 transition"
            aria-label="Close cart"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Items Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Free Delivery Meter */}
          <div className="rounded-2xl border border-ink/10 bg-white p-3.5 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="text-xl">🚚</span>
              <div className="flex-1 text-xs">
                {cart.isFreeDelivery ? (
                  <p className="font-bold text-[#0c831f]">
                    🎉 You&apos;ve unlocked FREE express delivery!
                  </p>
                ) : (
                  <p className="text-ink">
                    Add <strong className="text-[#0c831f]">₹{cart.freeDeliveryRemaining}</strong> more for{" "}
                    <strong>FREE delivery</strong>
                  </p>
                )}
                <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-[#0c831f] transition-all duration-300"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(10, Math.round((cart.subtotal / 149) * 100))
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Address Card with in-context CHANGE button */}
          <div className="rounded-2xl border border-ink/10 bg-white p-3.5 shadow-xs">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2.5">
                <span className="text-lg mt-0.5">📍</span>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate">
                      Delivering to {activeAddress?.tag || "Home"}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-ink leading-tight mt-0.5">
                    {activeAddress?.address}, {activeAddress?.locality}
                  </p>
                  <p className="text-[11px] text-slate mt-0.5">
                    {activeAddress?.name} · {activeAddress?.phone}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={openAddressDrawer}
                className="shrink-0 rounded-lg border border-[#0c831f] px-2.5 py-1 text-xs font-bold text-[#0c831f] hover:bg-[#e8f8ec] transition"
              >
                CHANGE
              </button>
            </div>
          </div>

          {/* Cart Empty State */}
          {cart.totalCount === 0 ? (
            <div className="py-12 text-center">
              <span className="text-4xl block mb-2">🛒</span>
              <h3 className="font-grotesk text-base font-bold text-ink">
                Your basket is empty
              </h3>
              <p className="text-xs text-slate mt-1 max-w-xs mx-auto">
                Upload a document to print or add stationery essentials for instant 30-min delivery.
              </p>
              <div className="mt-4 flex justify-center gap-2">
                <Link
                  href="/order"
                  onClick={closeCart}
                  className="rounded-full bg-[#0c831f] px-4 py-2 text-xs font-bold text-white shadow-xs"
                >
                  Start a Print →
                </Link>
                <Link
                  href="/stationery"
                  onClick={closeCart}
                  className="rounded-full border border-ink/20 px-4 py-2 text-xs font-bold text-ink"
                >
                  Shop Essentials
                </Link>
              </div>
            </div>
          ) : null}

          {/* Print Jobs Section */}
          {cart.prints.length > 0 ? (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate px-1">
                Print Documents ({cart.prints.length})
              </h3>
              {cart.prints.map((p) => (
                <div
                  key={p.id}
                  className="rounded-2xl border border-ink/10 bg-white p-3.5 shadow-xs flex items-start justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-xl border border-amber-200">
                      📄
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-ink line-clamp-1">{p.fileName}</h4>
                      <p className="text-xs text-slate mt-0.5">
                        {p.pages} pages × {p.copies} {p.copies === 1 ? "copy" : "copies"} ·{" "}
                        <span className="font-semibold text-ink">
                          {p.printType === "bw" ? "B&W" : "Colour"}
                        </span>{" "}
                        · {p.sideType === "single" ? "Single side" : "Double side"}
                      </p>
                      {p.binding !== "none" ? (
                        <span className="mt-1 inline-block rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate">
                          📎 {p.binding} binding
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <b className="text-sm font-bold text-ink">₹{p.subtotal}</b>
                    <button
                      type="button"
                      onClick={() => removePrint(p.id)}
                      className="block text-[11px] text-red-500 hover:underline mt-1"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {/* Stationery Items Section */}
          {cart.stationery.length > 0 ? (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate px-1">
                Stationery &amp; Essentials ({cart.stationery.length})
              </h3>
              {cart.stationery.map(({ item, quantity }) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-ink/10 bg-white p-3.5 shadow-xs flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <h4 className="text-xs font-bold text-ink leading-snug">{item.name}</h4>
                      <p className="text-[11px] text-slate">{item.unit}</p>
                      <b className="text-xs font-bold text-ink mt-0.5 block">
                        ₹{item.price * quantity}
                      </b>
                    </div>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-2 rounded-xl border border-[#0c831f] bg-[#e8f8ec]/40 px-2 py-1">
                    <button
                      type="button"
                      onClick={() => updateStationeryQuantity(item.id, quantity - 1)}
                      className="flex h-5 w-5 items-center justify-center font-bold text-[#0c831f] text-sm hover:opacity-75"
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="min-w-[14px] text-center text-xs font-bold text-ink">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateStationeryQuantity(item.id, quantity + 1)}
                      className="flex h-5 w-5 items-center justify-center font-bold text-[#0c831f] text-sm hover:opacity-75"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {/* Impulse Cross-Sell Essentials */}
          {impulseItems.length > 0 ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-3.5 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="font-grotesk text-xs font-bold text-amber-950 flex items-center gap-1">
                  ⚡ Frequently Added Essentials
                </span>
                <span className="text-[10px] text-amber-700">Delivers in same parcel</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {impulseItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-ink/10 bg-white p-2.5 flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-xl">{item.icon}</span>
                      <h5 className="text-[11px] font-bold text-ink line-clamp-1 mt-1">
                        {item.name}
                      </h5>
                      <span className="text-[10px] text-slate block">{item.unit}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <b className="text-xs font-bold text-ink">₹{item.price}</b>
                      <button
                        type="button"
                        onClick={() => addStationery(item, 1)}
                        className="rounded-lg bg-[#0c831f] px-2 py-0.5 text-[11px] font-bold text-white hover:bg-[#096a18] transition"
                      >
                        + Add
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Delivery Slot Choice */}
          {cart.totalCount > 0 ? (
            <div className="rounded-2xl border border-ink/10 bg-white p-3.5 shadow-xs space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate">
                Delivery Option
              </h4>
              <div className="space-y-1.5">
                {[
                  {
                    id: "express" as DeliverySlot,
                    label: "⚡ Express Dark-Store (30–45 mins)",
                    desc: "Fulfilled immediately from local print desk",
                    price: cart.isFreeDelivery ? "FREE" : "₹20",
                  },
                  {
                    id: "campus" as DeliverySlot,
                    label: "🎓 Campus / College Gate Window",
                    desc: "LIT Sarigam & ROFEL Vapi main gate handover",
                    price: cart.isFreeDelivery ? "FREE" : "₹5",
                  },
                  {
                    id: "evening" as DeliverySlot,
                    label: "📦 Same-Day Evening (6 PM - 8 PM)",
                    desc: "Batch scheduled drop",
                    price: "FREE",
                  },
                ].map((slot) => (
                  <label
                    key={slot.id}
                    className={`flex cursor-pointer items-center justify-between rounded-xl border p-2.5 text-xs transition ${
                      cart.deliverySlot === slot.id
                        ? "border-[#0c831f] bg-[#e8f8ec]/40 font-semibold text-ink"
                        : "border-ink/10 hover:border-ink/20 text-slate"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="drawerSlot"
                        checked={cart.deliverySlot === slot.id}
                        onChange={() => setDeliverySlot(slot.id)}
                        className="accent-[#0c831f]"
                      />
                      <div>
                        <p className="font-bold text-ink">{slot.label}</p>
                        <p className="text-[10px] text-slate">{slot.desc}</p>
                      </div>
                    </div>
                    <span
                      className={`font-bold ${
                        slot.price === "FREE" ? "text-[#0c831f]" : "text-ink"
                      }`}
                    >
                      {slot.price}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ) : null}

          {/* Coupon Code Section */}
          {cart.totalCount > 0 ? (
            <div className="rounded-2xl border border-ink/10 bg-white p-3.5 shadow-xs">
              {!cart.couponCode ? (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="Enter coupon (e.g. WELCOME10)"
                    className="flex-1 rounded-xl border border-ink/15 px-3 py-1.5 text-xs font-mono uppercase focus:border-[#0c831f] focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-ink px-3 py-1.5 text-xs font-bold text-white hover:bg-slate transition"
                  >
                    Apply
                  </button>
                </form>
              ) : (
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#0c831f] flex items-center gap-1">
                    🏷️ Coupon <strong>{cart.couponCode}</strong> applied (-₹{cart.couponDiscount})
                  </span>
                  <button
                    type="button"
                    onClick={removeCoupon}
                    className="text-red-500 font-semibold hover:underline"
                  >
                    Remove
                  </button>
                </div>
              )}
              {couponMsg ? (
                <p className="text-[11px] text-slate mt-1.5 font-medium">{couponMsg}</p>
              ) : null}
            </div>
          ) : null}

          {/* Bill Summary */}
          {cart.totalCount > 0 ? (
            <div className="rounded-2xl border border-ink/10 bg-white p-3.5 shadow-xs space-y-2 text-xs">
              <h4 className="font-bold uppercase tracking-wider text-slate">Bill Details</h4>
              {cart.printTotal > 0 ? (
                <div className="flex justify-between text-slate">
                  <span>Document Printing Total</span>
                  <span className="text-ink font-semibold">₹{cart.printTotal}</span>
                </div>
              ) : null}
              {cart.stationeryTotal > 0 ? (
                <div className="flex justify-between text-slate">
                  <span>Stationery &amp; Essentials</span>
                  <span className="text-ink font-semibold">₹{cart.stationeryTotal}</span>
                </div>
              ) : null}
              <div className="flex justify-between text-slate">
                <span>Delivery Partner Fee</span>
                <span className="font-semibold text-ink">
                  {cart.deliveryFee === 0 ? (
                    <span className="text-[#0c831f] font-bold">FREE</span>
                  ) : (
                    `₹${cart.deliveryFee}`
                  )}
                </span>
              </div>
              {cart.couponDiscount > 0 ? (
                <div className="flex justify-between text-[#0c831f] font-semibold">
                  <span>Coupon Discount</span>
                  <span>-₹{cart.couponDiscount}</span>
                </div>
              ) : null}
              <div className="border-t border-ink/10 pt-2 flex justify-between font-bold text-sm text-ink">
                <span>To Pay</span>
                <span>₹{cart.total}</span>
              </div>
            </div>
          ) : null}
        </div>

        {/* Sticky Paybar at Drawer Bottom */}
        {cart.totalCount > 0 ? (
          <div className="border-t border-ink/10 bg-white p-4 shadow-lg">
            <button
              type="button"
              disabled={isCheckingOut}
              onClick={handleCheckout}
              className="w-full flex items-center justify-between rounded-2xl bg-[#0c831f] px-5 py-3.5 text-white shadow-md hover:bg-[#096a18] active:translate-y-0.5 transition font-bold"
            >
              <div className="text-left">
                <span className="text-xs font-normal opacity-90 block">Grand Total</span>
                <span className="text-lg leading-tight">₹{cart.total}</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm font-bold">
                <span>{isCheckingOut ? "Placing Order…" : "Place Order →"}</span>
              </div>
            </button>
            <p className="mt-2 text-center text-[10px] text-slate">
              🔒 100% Safe Payments · Fulfilled by PrintKarr Dark-Store
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
