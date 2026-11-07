"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ACCEPTED,
  MAX_FILE_MB,
  detectPages,
  fileKind,
  fmtSize,
  loadUploads,
  newId,
  removeUpload,
  saveUpload,
  type UploadedMeta,
} from "@/lib/uploadStore";
import {
  countPages,
  inr,
  pricing,
  quoteFile,
  type FileConfig,
  type PaperSize,
  type PrintType,
  type SideType,
  type PaperGrade,
  type BindingType,
} from "@/lib/pricing";
import { useAddresses, openAddressDrawer } from "@/lib/addressStore";
import { useUser } from "@/lib/userStore";
import { triggerRazorpayPayment } from "@/lib/razorpay";
import { STATIONERY_CATALOGUE, type StationeryItem } from "@/lib/stationeryData";
import { createOrder } from "@/lib/ordersStore";
import { addMultiplePrints, useCart } from "@/lib/cartStore";

type Row = { meta: UploadedMeta; pagesUnknown: boolean };

function defaultConfig(pages: number): FileConfig {
  return {
    pages,
    printType: "bw",
    sideType: "single",
    paperSize: "A4",
    paperGrade: "75gsm",
    binding: "none",
    copies: 1,
    pageSpec: "",
    notes: "",
    stapling: false,
    holePunch: false,
  };
}

export function OrderFlow() {
  const router = useRouter();
  const { activeAddress } = useAddresses();
  const cart = useCart();
  const { user, deductWallet } = useUser();

  const [rows, setRows] = useState<Row[]>([]);
  const [cfg, setCfg] = useState<Record<string, FileConfig>>({});
  const [drag, setDrag] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [deliverySlot, setDeliverySlot] = useState<"express" | "campus" | "evening">("express");
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState("");
  const [addedStationery, setAddedStationery] = useState<{ item: StationeryItem; quantity: number }[]>([]);
  const [paymentChoice, setPaymentChoice] = useState<"RAZORPAY" | "WALLET" | "COD">("RAZORPAY");
  const [isPlacing, setIsPlacing] = useState(false);

  const hydrated = useRef(false);

  /* Hydrate uploads if already selected on homepage */
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    void loadUploads().then((items) => {
      if (items.length === 0) return;
      setRows(items.map(({ meta }) => ({ meta, pagesUnknown: meta.pages === null })));
      setCfg((c) => {
        const next = { ...c };
        for (const { meta } of items) {
          if (!next[meta.id]) next[meta.id] = defaultConfig(meta.pages ?? 1);
        }
        return next;
      });
    });
  }, []);

  const lines = useMemo(
    () =>
      rows.map((r) => {
        const c = cfg[r.meta.id] ?? defaultConfig(r.meta.pages ?? 1);
        return { row: r, cfg: c, line: quoteFile(c) };
      }),
    [rows, cfg]
  );

  // Combine items already in cart with any essentials toggled on this page
  const allStationery = useMemo(() => {
    const map = new Map<string, { item: StationeryItem; quantity: number }>();
    for (const s of cart.stationery) {
      map.set(s.item.id, { ...s });
    }
    for (const a of addedStationery) {
      const prev = map.get(a.item.id);
      if (prev) {
        map.set(a.item.id, { item: a.item, quantity: prev.quantity + a.quantity });
      } else {
        map.set(a.item.id, { ...a });
      }
    }
    return Array.from(map.values());
  }, [cart.stationery, addedStationery]);

  const currentPrintsTotal = lines.reduce((acc, l) => acc + l.line.total, 0);
  const existingPrintsTotal = cart.prints.reduce((acc, p) => acc + p.subtotal, 0);
  const printSubtotal = currentPrintsTotal + existingPrintsTotal;

  const stationerySubtotal = allStationery.reduce(
    (acc, x) => acc + x.item.price * x.quantity,
    0
  );
  const customPrintSubtotal = cart.customPrints.reduce(
    (acc, cp) => acc + (cp.totalPrice ?? ((cp.price ?? 0) * cp.quantity)),
    0
  );
  const subtotal = printSubtotal + stationerySubtotal + customPrintSubtotal;

  const isFreeDelivery = subtotal >= pricing.freeDeliveryThreshold;
  const freeRemaining = Math.max(0, pricing.freeDeliveryThreshold - subtotal);

  let deliveryFee = 0;
  if (!isFreeDelivery && subtotal > 0) {
    if (deliverySlot === "campus") deliveryFee = pricing.delivery.campus; // ₹5
    else if (deliverySlot === "express") deliveryFee = pricing.delivery.vapi; // ₹15 (mirrors E:prntkr)
    else deliveryFee = 0; // evening window is free
  }

  const grandTotal = Math.max(0, subtotal + deliveryFee - couponDiscount);
  const totalSides =
    lines.reduce((acc, l) => acc + l.line.pages * l.cfg.copies, 0) +
    cart.prints.reduce((acc, p) => acc + p.pages * p.copies, 0);

  function addFiles(list: FileList | File[]) {
    void (async () => {
      for (const f of Array.from(list)) {
        const kind = fileKind(f.name);
        if (!kind || f.size > MAX_FILE_MB * 1024 * 1024) continue;
        const id = newId();
        const pages = kind === "PDF" ? await detectPages(f) : 1;
        const meta: UploadedMeta = { id, name: f.name, size: f.size, type: f.type, pages };
        setRows((r) => [...r, { meta, pagesUnknown: pages === null }]);
        setCfg((c) => ({ ...c, [id]: defaultConfig(pages ?? 1) }));
        await saveUpload(f, meta);
      }
    })();
  }

  function removeFile(id: string) {
    setRows((r) => r.filter((x) => x.meta.id !== id));
    setCfg((c) => {
      const next = { ...c };
      delete next[id];
      return next;
    });
    void removeUpload(id);
  }

  function patchCfg(id: string, patch: Partial<FileConfig>) {
    setCfg((c) => ({ ...c, [id]: { ...(c[id] ?? defaultConfig(1)), ...patch } }));
  }

  function toggleImpulseItem(item: StationeryItem) {
    const existing = addedStationery.find((x) => x.item.id === item.id);
    if (existing) {
      setAddedStationery((prev) => prev.filter((x) => x.item.id !== item.id));
    } else {
      setAddedStationery((prev) => [...prev, { item, quantity: 1 }]);
    }
  }

  function handleApplyCoupon(e: React.FormEvent) {
    e.preventDefault();
    const code = couponCode.trim().toUpperCase();
    if (code === "WELCOME10") {
      const disc = Math.min(50, Math.round(subtotal * 0.1));
      setCouponDiscount(disc);
      setCouponMessage(`Saved ₹${disc} with WELCOME10!`);
    } else if (code === "STUDENT5") {
      setCouponDiscount(5);
      setCouponMessage("Student voucher applied (-₹5)");
    } else {
      setCouponDiscount(0);
      setCouponMessage("Invalid coupon code");
    }
  }

  function handleAddToCart() {
    if (lines.length === 0) return;
    const printCartItems = lines.map((l) => ({
      id: l.row.meta.id,
      fileName: l.row.meta.name,
      fileSize: l.row.meta.size,
      pages: l.line.pages,
      copies: l.cfg.copies,
      printType: l.cfg.printType,
      sideType: l.cfg.sideType,
      paperGrade: l.cfg.paperGrade,
      binding: l.cfg.binding,
      range: l.cfg.pageSpec,
      notes: l.cfg.notes,
      subtotal: l.line.total,
    }));

    addMultiplePrints(printCartItems);
    for (const extra of addedStationery) {
      cart.addStationery(extra.item, extra.quantity);
    }
    setAddedStationery([]);
    setRows([]);
    cart.openCart();
  }

  function handlePlaceOrder() {
    if (lines.length === 0 && cart.prints.length === 0 && allStationery.length === 0) return;

    const currentConfiguredPrints = lines.map((l) => ({
      id: l.row.meta.id,
      fileName: l.row.meta.name,
      fileSize: l.row.meta.size,
      pages: l.line.pages,
      copies: l.cfg.copies,
      printType: l.cfg.printType,
      sideType: l.cfg.sideType,
      paperGrade: l.cfg.paperGrade,
      binding: l.cfg.binding,
      range: l.cfg.pageSpec,
      notes: l.cfg.notes,
      subtotal: l.line.total,
    }));

    const allPrints = [...cart.prints, ...currentConfiguredPrints];

    const slotLabel =
      deliverySlot === "express"
        ? "⚡ Express (30–45 mins)"
        : deliverySlot === "campus"
        ? "🎓 Campus Gate Schedule"
        : "📦 Same-Day Evening Window";

    if (paymentChoice === "WALLET") {
      if (user.walletBalance < grandTotal) {
        alert(
          `Wallet balance (₹${user.walletBalance.toFixed(
            2
          )}) is insufficient for ₹${grandTotal}. Please top up in your account, select Razorpay online, or pay on delivery.`
        );
        return;
      }

      setIsPlacing(true);
      deductWallet(grandTotal);

      const order = createOrder({
        customer: activeAddress,
        prints: allPrints,
        customPrints: cart.customPrints,
        stationery: allStationery,
        subtotal,
        deliveryFee,
        discount: couponDiscount,
        total: grandTotal,
        paymentMethod: "WALLET",
        deliverySlot: slotLabel,
      });

      cart.clearCart();
      setIsPlacing(false);
      router.push(`/track?id=${order.id}`);
      return;
    }

    if (paymentChoice === "COD") {
      setIsPlacing(true);
      const order = createOrder({
        customer: activeAddress,
        prints: allPrints,
        customPrints: cart.customPrints,
        stationery: allStationery,
        subtotal,
        deliveryFee,
        discount: couponDiscount,
        total: grandTotal,
        paymentMethod: "COD",
        deliverySlot: slotLabel,
      });

      cart.clearCart();
      setIsPlacing(false);
      router.push(`/track?id=${order.id}`);
      return;
    }

    // Razorpay Flow
    setIsPlacing(true);
    void triggerRazorpayPayment({
      amount: grandTotal,
      name: "PrintKarr.in",
      description: `Online Xerox & Study Essentials (${allPrints.length} documents)`,
      prefill: {
        name: user.name,
        email: user.email,
        contact: user.phone,
      },
      onSuccess: (paymentId) => {
        const order = createOrder({
          customer: activeAddress,
          prints: allPrints,
          customPrints: cart.customPrints,
          stationery: allStationery,
          subtotal,
          deliveryFee,
          discount: couponDiscount,
          total: grandTotal,
          paymentMethod: "RAZORPAY",
          paymentId,
          deliverySlot: slotLabel,
        });

        cart.clearCart();
        setIsPlacing(false);
        router.push(`/track?id=${order.id}`);
      },
      onDismiss: () => {
        setIsPlacing(false);
      },
    });
  }

  const essentials = STATIONERY_CATALOGUE.slice(0, 4);

  return (
    <div className="min-h-screen bg-[#f4f6fb] pb-24">
      {/* Top Banner */}
      <div className="border-b border-ink/10 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-[#f8cb46] px-2.5 py-0.5 text-xs font-bold text-ink">
                  ⚡ 30-Min Online Xerox Shop
                </span>
                <span className="text-xs text-slate">Assignments, Thesis, Admit Cards &amp; Forms</span>
              </div>
              <h1 className="font-grotesk text-2xl sm:text-3xl font-extrabold text-ink mt-1">
                Online Xerox &amp; Document Printing
              </h1>
            </div>

            {/* In-Context Address Selector Pill */}
            <button
              type="button"
              onClick={openAddressDrawer}
              className="flex items-center gap-2 rounded-2xl border border-ink/15 bg-slate-50 px-3.5 py-2 text-left hover:border-[#0c831f] transition self-start sm:self-auto"
            >
              <span className="text-[#0c831f] text-base">📍</span>
              <div>
                <span className="text-[10px] text-slate block leading-none">Delivering to</span>
                <span className="text-xs font-bold text-ink block leading-tight">
                  {activeAddress.locality}, {activeAddress.area} ▾
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {/* Main 2-Column Responsive Layout */}
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] items-start">
          {/* Left Column: Uploads + Settings + Impulse */}
          <div className="space-y-6">
            {/* File Upload Zone */}
            <section className="rounded-3xl border border-ink/10 bg-white p-5 sm:p-6 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-grotesk text-base font-bold text-ink flex items-center gap-2">
                  <span>📄</span>
                  <span>Upload Documents</span>
                </h2>
                <span className="text-xs text-slate">PDF, PNG, JPG (up to 25MB)</span>
              </div>

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDrag(true);
                }}
                onDragLeave={() => setDrag(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDrag(false);
                  if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition ${
                  drag
                    ? "border-[#0c831f] bg-[#e8f8ec]/40"
                    : "border-ink/20 hover:border-[#0c831f] bg-slate-50/50"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept={ACCEPTED.map((x) => `.${x}`).join(",")}
                  className="hidden"
                  onChange={(e) => e.target.files && addFiles(e.target.files)}
                />
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f8cb46] text-2xl shadow-xs">
                  ⬆
                </span>
                <p className="font-grotesk text-sm font-bold text-ink mt-3">
                  Click to browse or drag &amp; drop your documents
                </p>
                <p className="text-xs text-slate mt-1">
                  Automatic page counting · 100% confidential &amp; encrypted
                </p>
              </div>

              {/* Uploaded Files Summary List */}
              {rows.length > 0 ? (
                <div className="mt-4 space-y-2 border-t border-ink/5 pt-4">
                  {rows.map(({ meta, pagesUnknown }) => (
                    <div
                      key={meta.id}
                      className="flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2.5 border border-ink/5"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-lg">📄</span>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold text-ink">{meta.name}</p>
                          <p className="text-[11px] text-slate">
                            {meta.pages !== null ? `${meta.pages} pages` : "Detecting pages…"} ·{" "}
                            {fmtSize(meta.size)}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(meta.id)}
                        className="text-xs text-red-500 font-semibold hover:underline shrink-0"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </section>

            {/* Print Specifications for Each File */}
            {lines.map(({ row, cfg: c, line }) => {
              const needsGutterWarning = ["spiral", "wiro", "hardcover"].includes(c.binding);

              return (
                <section
                  key={row.meta.id}
                  className="rounded-3xl border border-ink/10 bg-white p-5 sm:p-6 shadow-xs space-y-5"
                >
                  <div className="flex items-center justify-between border-b border-ink/10 pb-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate">
                        Print Configuration
                      </span>
                      <h3 className="font-grotesk text-sm font-bold text-ink truncate max-w-md mt-0.5">
                        {row.meta.name}
                      </h3>
                    </div>
                    <span className="rounded-full bg-[#0c831f]/10 px-2.5 py-0.5 text-xs font-extrabold text-[#0c831f]">
                      ₹{line.total}
                    </span>
                  </div>

                  {/* Colour Choice */}
                  <div>
                    <label className="block text-xs font-bold text-slate mb-1.5 uppercase tracking-wider">
                      Colour Mode
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: "bw", label: "⚫ Black & White", price: "from ₹1.50/side" },
                        { id: "colour", label: "🎨 Vivid Colour", price: "from ₹4.00/side" },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => patchCfg(row.meta.id, { printType: opt.id as PrintType })}
                          className={`rounded-2xl border p-3 text-left transition ${
                            c.printType === opt.id
                              ? "border-[#0c831f] bg-[#e8f8ec]/40 font-bold text-ink shadow-xs"
                              : "border-ink/10 hover:border-ink/30 bg-white text-slate"
                          }`}
                        >
                          <span className="block text-xs font-bold text-ink">{opt.label}</span>
                          <span className="block text-[11px] text-slate mt-0.5">{opt.price}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sides Choice */}
                  <div>
                    <label className="block text-xs font-bold text-slate mb-1.5 uppercase tracking-wider">
                      Sides
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: "single", label: "Single-Sided", desc: "Front page only" },
                        { id: "double", label: "Double-Sided", desc: "Front & back (Eco saving)" },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => patchCfg(row.meta.id, { sideType: opt.id as SideType })}
                          className={`rounded-2xl border p-3 text-left transition ${
                            c.sideType === opt.id
                              ? "border-[#0c831f] bg-[#e8f8ec]/40 font-bold text-ink shadow-xs"
                              : "border-ink/10 hover:border-ink/30 bg-white text-slate"
                          }`}
                        >
                          <span className="block text-xs font-bold text-ink">{opt.label}</span>
                          <span className="block text-[11px] text-slate mt-0.5">{opt.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Paper Quality Grade */}
                  <div>
                    <label className="block text-xs font-bold text-slate mb-1.5 uppercase tracking-wider">
                      Paper Grade
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: "75gsm", label: "75 GSM Standard Copy", desc: "Standard assignment paper" },
                        { id: "100gsm", label: "100 GSM Executive Bond", desc: "+₹1/sheet · Thesis & Resume" },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => patchCfg(row.meta.id, { paperGrade: opt.id as PaperGrade })}
                          className={`rounded-2xl border p-3 text-left transition ${
                            c.paperGrade === opt.id
                              ? "border-[#0c831f] bg-[#e8f8ec]/40 font-bold text-ink shadow-xs"
                              : "border-ink/10 hover:border-ink/30 bg-white text-slate"
                          }`}
                        >
                          <span className="block text-xs font-bold text-ink">{opt.label}</span>
                          <span className="block text-[11px] text-slate mt-0.5">{opt.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Finishing & Binding */}
                  <div>
                    <label className="block text-xs font-bold text-slate mb-1.5 uppercase tracking-wider">
                      Finishing &amp; Binding
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        { id: "none", label: "Loose Sheets", price: "Free" },
                        { id: "staple", label: "Corner Staple", price: "+₹2" },
                        { id: "spiral", label: "Spiral Bound", price: "+₹25" },
                        { id: "wiro", label: "Wiro Metal Loop", price: "+₹35" },
                        { id: "hardcover", label: "Hardcover Thesis", price: "+₹150" },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => patchCfg(row.meta.id, { binding: opt.id as BindingType })}
                          className={`rounded-2xl border p-2.5 text-left transition ${
                            c.binding === opt.id
                              ? "border-[#0c831f] bg-[#e8f8ec]/40 font-bold text-ink shadow-xs"
                              : "border-ink/10 hover:border-ink/30 bg-white text-slate"
                          }`}
                        >
                          <span className="block text-xs font-bold text-ink">{opt.label}</span>
                          <span className="block text-[11px] text-[#0c831f] font-semibold">
                            {opt.price}
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* Preflight Margin Warning for Spiral/Hardcover */}
                    {needsGutterWarning ? (
                      <div className="mt-2.5 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 flex items-start gap-2">
                        <span className="text-base">📐</span>
                        <div>
                          <strong>Binding Safety Check:</strong> Ensure your document has at least a
                          12–15mm left margin so punch holes do not cut into your text.
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {/* Copies & Page Range Stepper */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-ink/5">
                    <div>
                      <label className="block text-xs font-bold text-slate mb-1">
                        Number of Copies
                      </label>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center rounded-xl border border-ink/20 bg-white px-3 py-1.5 shadow-xs">
                          <button
                            type="button"
                            onClick={() => patchCfg(row.meta.id, { copies: Math.max(1, c.copies - 1) })}
                            className="font-bold text-ink text-base px-2 hover:text-[#0c831f]"
                          >
                            −
                          </button>
                          <span className="w-8 text-center font-bold text-sm text-ink">{c.copies}</span>
                          <button
                            type="button"
                            onClick={() => patchCfg(row.meta.id, { copies: Math.min(200, c.copies + 1) })}
                            className="font-bold text-ink text-base px-2 hover:text-[#0c831f]"
                          >
                            +
                          </button>
                        </div>
                        <span className="text-xs text-slate">
                          {line.pages * c.copies} printed sides
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate mb-1">
                        Page Range (Optional)
                      </label>
                      <input
                        type="text"
                        value={c.pageSpec}
                        onChange={(e) => patchCfg(row.meta.id, { pageSpec: e.target.value })}
                        placeholder="e.g. 1-5, 8, 12-20 (All if blank)"
                        className="w-full rounded-xl border border-ink/15 px-3 py-1.5 text-xs text-ink focus:border-[#0c831f] focus:outline-none"
                      />
                    </div>
                  </div>
                </section>
              );
            })}

            {/* Impulse Add-ons Carousel (Increase AOV) */}
            <section className="rounded-3xl border border-amber-200 bg-amber-50/40 p-5 sm:p-6 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 block">
                    ⚡ Frequently Added With Prints
                  </span>
                  <h3 className="font-grotesk text-sm font-bold text-ink mt-0.5">
                    Complete your document &amp; study kit
                  </h3>
                </div>
                <span className="text-xs text-amber-800">Delivered in same parcel</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {essentials.map((item) => {
                  const isAdded = addedStationery.some((x) => x.item.id === item.id);
                  return (
                    <div
                      key={item.id}
                      className={`rounded-2xl border p-3 flex flex-col justify-between transition ${
                        isAdded
                          ? "border-[#0c831f] bg-[#e8f8ec]/50 shadow-xs"
                          : "border-ink/10 bg-white"
                      }`}
                    >
                      <div>
                        <span className="text-2xl">{item.icon}</span>
                        <h4 className="text-xs font-bold text-ink line-clamp-1 mt-1">{item.name}</h4>
                        <span className="text-[10px] text-slate block">{item.unit}</span>
                      </div>
                      <div className="mt-2.5 flex items-center justify-between pt-1 border-t border-ink/5">
                        <b className="text-xs font-bold text-ink">₹{item.price}</b>
                        <button
                          type="button"
                          onClick={() => toggleImpulseItem(item)}
                          className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                            isAdded
                              ? "bg-[#0c831f] text-white"
                              : "border border-[#0c831f] text-[#0c831f] hover:bg-[#0c831f] hover:text-white"
                          }`}
                        >
                          {isAdded ? "✓ Added" : "+ Add"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          {/* Right Column: In-Context Address + Slots + Bill + Paybar */}
          <div className="space-y-5 lg:sticky lg:top-24">
            {/* Free Delivery Meter */}
            <div className="rounded-3xl border border-ink/10 bg-white p-4 shadow-xs">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">🚚</span>
                <div className="flex-1 text-xs">
                  {isFreeDelivery ? (
                    <p className="font-bold text-[#0c831f]">
                      🎉 You&apos;ve unlocked FREE express delivery!
                    </p>
                  ) : (
                    <p className="text-ink">
                      Add <strong className="text-[#0c831f]">₹{freeRemaining}</strong> more for{" "}
                      <strong>FREE delivery</strong>
                    </p>
                  )}
                  <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-[#0c831f] transition-all duration-300"
                      style={{
                        width: `${Math.min(100, Math.max(10, Math.round((subtotal / 149) * 100)))}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Deliver To Address Card (with in-context CHANGE button) */}
            <div className="rounded-3xl border border-ink/10 bg-white p-5 shadow-xs">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <span className="text-xl mt-0.5">📍</span>
                  <div>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate">
                      Deliver to {activeAddress.tag}
                    </span>
                    <p className="text-sm font-bold text-ink mt-1">
                      {activeAddress.name} · {activeAddress.phone}
                    </p>
                    <p className="text-xs text-slate mt-0.5 leading-snug">
                      {activeAddress.address}, {activeAddress.locality}, {activeAddress.area} -{" "}
                      {activeAddress.pin}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={openAddressDrawer}
                  className="rounded-xl border border-[#0c831f] px-3 py-1 text-xs font-bold text-[#0c831f] hover:bg-[#e8f8ec] transition shrink-0"
                >
                  CHANGE
                </button>
              </div>
            </div>

            {/* Delivery Slots */}
            <div className="rounded-3xl border border-ink/10 bg-white p-5 shadow-xs space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate">
                Select Delivery Slot
              </h3>
              <div className="space-y-2">
                {[
                  {
                    id: "express" as const,
                    label: "⚡ Express 30-Min Delivery",
                    desc: "Immediate print and fast rider dispatch to your doorstep",
                    fee: isFreeDelivery ? "FREE" : "₹15",
                  },
                  {
                    id: "campus" as const,
                    label: "🎓 Campus and College Gate Handover",
                    desc: "LIT Sarigam and ROFEL main gate delivery",
                    fee: isFreeDelivery ? "FREE" : "₹5",
                  },
                  {
                    id: "evening" as const,
                    label: "📦 Same-Day Evening (6 PM - 8 PM)",
                    desc: "Scheduled batch delivery to your address",
                    fee: "FREE",
                  },
                ].map((s) => (
                  <label
                    key={s.id}
                    className={`flex cursor-pointer items-center justify-between rounded-2xl border p-3 text-xs transition ${
                      deliverySlot === s.id
                        ? "border-[#0c831f] bg-[#e8f8ec]/40 font-bold text-ink shadow-xs"
                        : "border-ink/10 hover:border-ink/20 text-slate"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="orderDeliverySlot"
                        checked={deliverySlot === s.id}
                        onChange={() => setDeliverySlot(s.id)}
                        className="accent-[#0c831f]"
                      />
                      <div>
                        <p className="font-bold text-ink">{s.label}</p>
                        <p className="text-[11px] text-slate">{s.desc}</p>
                      </div>
                    </div>
                    <b className={s.fee === "FREE" ? "text-[#0c831f]" : "text-ink"}>{s.fee}</b>
                  </label>
                ))}
              </div>
            </div>

            {/* Coupon Box */}
            <div className="rounded-3xl border border-ink/10 bg-white p-4 shadow-xs">
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Coupon code (e.g. WELCOME10)"
                  className="flex-1 rounded-xl border border-ink/15 px-3 py-1.5 text-xs font-mono uppercase focus:border-[#0c831f] focus:outline-none"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-ink px-4 py-1.5 text-xs font-bold text-white hover:bg-slate transition"
                >
                  Apply
                </button>
              </form>
              {couponMessage ? (
                <p className="text-[11px] font-semibold text-[#0c831f] mt-1.5">{couponMessage}</p>
              ) : null}
            </div>

            {/* Payment Choice */}
            <div className="rounded-3xl border border-ink/10 bg-white p-4 sm:p-5 shadow-xs space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate">
                Payment Option
              </h3>
              <div className="space-y-2">
                <label
                  className={`flex cursor-pointer items-center justify-between rounded-2xl border p-3 text-xs transition ${
                    paymentChoice === "RAZORPAY"
                      ? "border-[#0c831f] bg-[#e8f8ec]/40 font-bold text-ink shadow-xs"
                      : "border-ink/10 hover:border-ink/20 text-slate"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="flowPaymentChoice"
                      checked={paymentChoice === "RAZORPAY"}
                      onChange={() => setPaymentChoice("RAZORPAY")}
                      className="accent-[#0c831f]"
                    />
                    <div>
                      <p className="font-bold text-ink">💳 Razorpay Online Payment</p>
                      <p className="text-[11px] text-slate">UPI, Google Pay, PhonePe, Cards, NetBanking</p>
                    </div>
                  </div>
                  <span className="rounded-md bg-[#0c831f]/10 px-2 py-0.5 text-[10px] font-bold text-[#0c831f]">
                    SECURE
                  </span>
                </label>

                <label
                  className={`flex cursor-pointer items-center justify-between rounded-2xl border p-3 text-xs transition ${
                    paymentChoice === "WALLET"
                      ? "border-[#0c831f] bg-[#e8f8ec]/40 font-bold text-ink shadow-xs"
                      : "border-ink/10 hover:border-ink/20 text-slate"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="flowPaymentChoice"
                      checked={paymentChoice === "WALLET"}
                      onChange={() => setPaymentChoice("WALLET")}
                      className="accent-[#0c831f]"
                    />
                    <div>
                      <p className="font-bold text-ink">👛 PrintKarr Wallet Balance</p>
                      <p className="text-[11px] text-slate">
                        Available: ₹{user.walletBalance.toFixed(2)} · 1-click checkout
                      </p>
                    </div>
                  </div>
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold text-ink">
                    ₹{user.walletBalance.toFixed(0)}
                  </span>
                </label>

                <label
                  className={`flex cursor-pointer items-center justify-between rounded-2xl border p-3 text-xs transition ${
                    paymentChoice === "COD"
                      ? "border-[#0c831f] bg-[#e8f8ec]/40 font-bold text-ink shadow-xs"
                      : "border-ink/10 hover:border-ink/20 text-slate"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="flowPaymentChoice"
                      checked={paymentChoice === "COD"}
                      onChange={() => setPaymentChoice("COD")}
                      className="accent-[#0c831f]"
                    />
                    <div>
                      <p className="font-bold text-ink">💵 Cash / QR on Delivery</p>
                      <p className="text-[11px] text-slate">
                        Pay cash or scan rider UPI QR code at your door or college gate
                      </p>
                    </div>
                  </div>
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-ink">
                    FLEXIBLE
                  </span>
                </label>
              </div>
            </div>

            {/* Bill Details */}
            <div className="rounded-3xl border border-ink/10 bg-white p-5 shadow-xs space-y-2.5 text-xs">
              <h3 className="font-bold uppercase tracking-wider text-slate">Bill Details</h3>
              <div className="flex justify-between text-slate">
                <span>Document Printing ({totalSides} sides)</span>
                <span className="font-semibold text-ink">₹{printSubtotal}</span>
              </div>
              {customPrintSubtotal > 0 ? (
                <div className="flex justify-between text-slate">
                  <span>Custom Prints &amp; Decor ({cart.customPrints.length} items)</span>
                  <span className="font-semibold text-ink">₹{customPrintSubtotal}</span>
                </div>
              ) : null}
              {stationerySubtotal > 0 ? (
                <div className="flex justify-between text-slate">
                  <span>Stationery &amp; Study Essentials ({allStationery.length} items)</span>
                  <span className="font-semibold text-ink">₹{stationerySubtotal}</span>
                </div>
              ) : null}
              <div className="flex justify-between text-slate">
                <span>Delivery Partner Fee</span>
                <span className="font-semibold text-ink">
                  {deliveryFee === 0 ? <span className="text-[#0c831f] font-bold">FREE</span> : `₹${deliveryFee}`}
                </span>
              </div>
              {couponDiscount > 0 ? (
                <div className="flex justify-between text-[#0c831f] font-semibold">
                  <span>Coupon Discount</span>
                  <span>-₹{couponDiscount}</span>
                </div>
              ) : null}
              <div className="border-t border-ink/10 pt-2.5 flex justify-between font-extrabold text-base text-ink">
                <span>Grand Total</span>
                <span>₹{grandTotal}</span>
              </div>
            </div>

            {/* Action Buttons: Add to Cart OR Pay Online */}
            <div className="space-y-2.5">
              <button
                type="button"
                disabled={(lines.length === 0 && allStationery.length === 0) || isPlacing}
                onClick={handlePlaceOrder}
                className="w-full flex items-center justify-between rounded-2xl bg-[#0c831f] px-5 py-4 text-white shadow-lg hover:bg-[#096a18] active:translate-y-0.5 transition font-bold disabled:opacity-50"
              >
                <div className="text-left">
                  <span className="text-xs font-normal opacity-90 block">Total to Pay</span>
                  <span className="text-xl leading-tight">₹{grandTotal}</span>
                </div>
                <span className="text-sm font-bold">
                  {isPlacing ? "Processing Order…" : "Pay Online &amp; Print →"}
                </span>
              </button>

              <button
                type="button"
                disabled={lines.length === 0}
                onClick={handleAddToCart}
                className="w-full rounded-2xl border-2 border-[#0c831f] bg-white py-3 text-xs font-bold text-[#0c831f] hover:bg-[#e8f8ec] transition disabled:opacity-50"
              >
                + Add Documents to Basket &amp; View All
              </button>
            </div>

            <p className="text-center text-[11px] text-slate">
              🔒 100% Safe Razorpay &amp; UPI Payments · Auto-deleted after delivery
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
