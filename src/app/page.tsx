"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { QuickUpload } from "@/components/QuickUpload";
import { STATIONERY_CATALOGUE } from "@/lib/stationeryData";
import { useCart, addStationery, openCart } from "@/lib/cartStore";
import { useAddresses, openAddressDrawer } from "@/lib/addressStore";

export default function Home() {
  const router = useRouter();
  const cart = useCart();
  const { activeAddress } = useAddresses();

  const featuredEssentials = STATIONERY_CATALOGUE.slice(0, 6);

  const getItemQuantityInCart = (id: string): number => {
    const found = cart.stationery.find((s) => s.item.id === id);
    return found ? found.quantity : 0;
  };

  return (
    <div className="flex flex-col gap-12 pb-20">
      {/* ── 1. Hero: Clean Startup App Header (R-05, R-20) ── */}
      <section className="border-b border-edge bg-white pt-10 pb-12 sm:pt-14 sm:pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-edge bg-surface px-3 py-1 text-xs font-semibold text-slate">
                <span className="flex h-2 w-2 rounded-full bg-[#0c831f]" aria-hidden="true" />
                <span>30-minute dark-store print desk in Vapi &amp; Sarigam</span>
              </div>

              <h1 className="font-grotesk text-3xl sm:text-5xl lg:text-[3.25rem] font-extrabold tracking-tight text-ink leading-[1.08] text-balance">
                Your printer shop, delivered to your door in 30 minutes.
              </h1>

              <p className="max-w-xl text-sm sm:text-base text-slate leading-relaxed">
                Upload assignments, thesis reports, or government forms. We print on high-speed laser
                presses, pack with exam-ready stationery, and deliver straight to your home, hostel, or
                office.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link
                  href="/order"
                  className="rounded-xl bg-[#0c831f] px-6 py-3 text-sm font-bold text-white shadow-xs hover:bg-[#096a18] active:translate-y-px transition"
                >
                  Start a Print Order →
                </Link>
                <Link
                  href="/stationery"
                  className="rounded-xl border border-edge bg-white px-5 py-3 text-sm font-semibold text-ink hover:border-slate/40 hover:bg-slate-50 active:translate-y-px transition"
                >
                  Shop Study Essentials (from ₹10)
                </Link>
              </div>

              {/* Real Value Pillars (R-17: honest factual data, no buzzwords) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-edge text-xs">
                <div>
                  <b className="font-bold text-ink block text-sm">₹1.50/side</b>
                  <span className="text-slate">Clean B&amp;W Laser</span>
                </div>
                <div>
                  <b className="font-bold text-ink block text-sm">30-45 Mins</b>
                  <span className="text-slate">Vapi &amp; Sarigam</span>
                </div>
                <div>
                  <b className="font-bold text-ink block text-sm">Free at ₹149</b>
                  <span className="text-[#0c831f]">Zero delivery fee</span>
                </div>
                <div>
                  <b className="font-bold text-ink block text-sm">Auto-Purged</b>
                  <span className="text-slate">100% Private files</span>
                </div>
              </div>
            </div>

            {/* Quick Upload Box on Hero (Direct Conversion Utility) */}
            <div className="rounded-2xl border border-edge bg-surface p-5 sm:p-6 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate">
                  Quick Upload (PDF or Photo)
                </span>
                <span className="text-[11px] text-[#0c831f] font-semibold">
                  Instant Page Counting
                </span>
              </div>
              <QuickUpload />
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. Ready-Made Document Kits (Directly Increases AOV!) ── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#0c831f]">
              ⚡ Complete Submission Kits
            </span>
            <h2 className="font-grotesk text-2xl font-bold text-ink mt-0.5">
              Everything in one parcel, ready to submit
            </h2>
            <p className="text-xs text-slate mt-0.5">
              Bundles crafted for students and offices to save time and eliminate stationery runs.
            </p>
          </div>
          <Link
            href="/order"
            className="text-xs font-bold text-[#0c831f] hover:underline shrink-0"
          >
            Custom order instead →
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {/* Kit 1 */}
          <div className="rounded-2xl border border-edge bg-white p-5 flex flex-col justify-between shadow-xs hover:border-[#0c831f] transition">
            <div className="space-y-3">
              <span className="inline-block rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                Most Popular for Assignments
              </span>
              <h3 className="font-grotesk text-lg font-bold text-ink">
                Assignment Ready Kit
              </h3>
              <p className="text-xs text-slate leading-relaxed">
                Clean B&amp;W laser prints stapled or loose, packed inside an A4 transparent protective
                folder with a Cello Gripper pen.
              </p>
              <ul className="text-xs text-slate space-y-1.5 pt-1">
                <li className="flex items-center gap-2">
                  <span className="text-[#0c831f]">✓</span> Laser B&amp;W printing
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#0c831f]">✓</span> 1x A4 Clear Document Folder (₹10)
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#0c831f]">✓</span> 1x Cello Gripper Ball Pen (₹10)
                </li>
              </ul>
            </div>

            <div className="mt-6 pt-4 border-t border-edge flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate block">Starts at</span>
                <b className="text-base font-extrabold text-ink">₹35</b>
              </div>
              <Link
                href="/order"
                className="rounded-xl bg-[#0c831f] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#096a18] transition"
              >
                Customize Kit →
              </Link>
            </div>
          </div>

          {/* Kit 2 */}
          <div className="rounded-2xl border-2 border-[#0c831f] bg-white p-5 flex flex-col justify-between shadow-sm relative">
            <div className="space-y-3">
              <span className="inline-block rounded-md bg-[#0c831f] px-2 py-0.5 text-[10px] font-bold text-white">
                College Project Standard
              </span>
              <h3 className="font-grotesk text-lg font-bold text-ink">
                Project &amp; Thesis Kit
              </h3>
              <p className="text-xs text-slate leading-relaxed">
                Full spiral or wiro bound report with 100 GSM executive bond paper, clear plastic front
                cover, and heavy back sheet.
              </p>
              <ul className="text-xs text-slate space-y-1.5 pt-1">
                <li className="flex items-center gap-2">
                  <span className="text-[#0c831f]">✓</span> 100 GSM Executive Bond Paper
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#0c831f]">✓</span> Professional Spiral or Wiro Binding
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#0c831f]">✓</span> 1x Neon Study Highlighter
                </li>
              </ul>
            </div>

            <div className="mt-6 pt-4 border-t border-edge flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate block">Starts at</span>
                <b className="text-base font-extrabold text-ink">₹145</b>
                <span className="text-[10px] text-[#0c831f] font-bold block">Free delivery eligible</span>
              </div>
              <Link
                href="/order"
                className="rounded-xl bg-[#0c831f] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#096a18] transition"
              >
                Customize Kit →
              </Link>
            </div>
          </div>

          {/* Kit 3 */}
          <div className="rounded-2xl border border-edge bg-white p-5 flex flex-col justify-between shadow-xs hover:border-[#0c831f] transition">
            <div className="space-y-3">
              <span className="inline-block rounded-md bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-900">
                Official &amp; Exam Forms
              </span>
              <h3 className="font-grotesk text-lg font-bold text-ink">
                Exam &amp; Attestation Kit
              </h3>
              <p className="text-xs text-slate leading-relaxed">
                Crisp single-sided government or admit card prints with a waterproof zipper pouch and
                official black signing pen.
              </p>
              <ul className="text-xs text-slate space-y-1.5 pt-1">
                <li className="flex items-center gap-2">
                  <span className="text-[#0c831f]">✓</span> High-contrast official single-side print
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#0c831f]">✓</span> 1x Waterproof Exam Zip Pouch (₹30)
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#0c831f]">✓</span> 1x Permanent Signing Pen (₹20)
                </li>
              </ul>
            </div>

            <div className="mt-6 pt-4 border-t border-edge flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate block">Starts at</span>
                <b className="text-base font-extrabold text-ink">₹55</b>
              </div>
              <Link
                href="/order"
                className="rounded-xl bg-[#0c831f] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#096a18] transition"
              >
                Customize Kit →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Quick-Commerce Study Essentials Grid (Increases AOV) ── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#0c831f]">
              📁 Study &amp; Office Essentials
            </span>
            <h2 className="font-grotesk text-2xl font-bold text-ink mt-0.5">
              Add essentials to your print order
            </h2>
            <p className="text-xs text-slate mt-0.5">
              Delivered in the same parcel with zero extra delivery fee.
            </p>
          </div>
          <Link
            href="/stationery"
            className="text-xs font-bold text-[#0c831f] hover:underline shrink-0"
          >
            View all 14 essentials →
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 sm:gap-4">
          {featuredEssentials.map((item) => {
            const qty = getItemQuantityInCart(item.id);
            return (
              <div
                key={item.id}
                className="rounded-2xl border border-edge bg-white p-3.5 flex flex-col justify-between shadow-xs hover:shadow-sm transition"
              >
                <div>
                  <div className="flex h-24 w-full items-center justify-center rounded-xl bg-surface text-4xl">
                    <span aria-hidden="true">{item.icon}</span>
                  </div>
                  <h4 className="font-bold text-xs text-ink line-clamp-2 mt-2 leading-tight">
                    {item.name}
                  </h4>
                  <span className="text-[10px] text-slate block mt-0.5">{item.unit}</span>
                </div>

                <div className="mt-3 pt-2 border-t border-edge/60 flex items-center justify-between">
                  <b className="text-xs font-bold text-ink">₹{item.price}</b>
                  {qty === 0 ? (
                    <button
                      type="button"
                      onClick={() => addStationery(item, 1)}
                      className="rounded-lg border border-[#0c831f] bg-[#e8f8ec]/40 px-2.5 py-0.5 text-[11px] font-bold text-[#0c831f] hover:bg-[#0c831f] hover:text-white transition"
                    >
                      + ADD
                    </button>
                  ) : (
                    <span className="text-[11px] font-bold text-[#0c831f] bg-[#e8f8ec] px-2 py-0.5 rounded-md">
                      ✓ In Cart ({qty})
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 4. Transparent Rates & Volume Slabs (Honest, Clear, R-17) ── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="rounded-3xl border border-edge bg-white p-6 sm:p-8 shadow-xs">
          <div className="max-w-2xl mb-6">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0c831f]">
              💰 Transparent Pricing
            </span>
            <h2 className="font-grotesk text-2xl font-bold text-ink mt-0.5">
              Fair print pricing with automatic volume savings
            </h2>
            <p className="text-xs text-slate mt-1">
              No hidden fees, no surge charges on standard slots. Bigger print orders automatically
              unlock volume discounts.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-edge bg-surface p-4">
              <span className="text-xs font-bold text-slate block">Standard B&amp;W</span>
              <b className="text-2xl font-extrabold text-ink mt-1 block">₹1.50</b>
              <span className="text-xs text-slate">per printed side (A4)</span>
              <p className="text-[11px] text-[#0c831f] font-semibold mt-2">
                Drops to ₹1.00/side on orders over 50 pages
              </p>
            </div>

            <div className="rounded-2xl border border-edge bg-surface p-4">
              <span className="text-xs font-bold text-slate block">Vivid Colour</span>
              <b className="text-2xl font-extrabold text-ink mt-1 block">₹4.00</b>
              <span className="text-xs text-slate">per printed side (A4)</span>
              <p className="text-[11px] text-[#0c831f] font-semibold mt-2">
                Drops to ₹3.00/side on orders over 50 pages
              </p>
            </div>

            <div className="rounded-2xl border border-edge bg-surface p-4">
              <span className="text-xs font-bold text-slate block">Express Delivery</span>
              <b className="text-2xl font-extrabold text-ink mt-1 block">FREE</b>
              <span className="text-xs text-slate">on orders ₹149 or higher</span>
              <p className="text-[11px] text-slate mt-2">
                Flat ₹5 for college gates · Flat ₹20 for small orders
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. Real Local Operational FAQ (R-28: Real Concerns, No Fluff) ── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="max-w-2xl mb-6">
          <span className="text-xs font-bold uppercase tracking-wider text-[#0c831f]">
            ❓ Frequently Asked Questions
          </span>
          <h2 className="font-grotesk text-2xl font-bold text-ink mt-0.5">
            Clear answers about printing and delivery
          </h2>
        </div>

        <div className="space-y-3">
          {[
            {
              q: "How do you protect the privacy of my documents?",
              a: "Your files are sent over an encrypted HTTPS connection straight to our local dark-store print queue. They are never indexed, shared, or retained. Once your order is handed over and confirmed, the files are permanently purged from the print desk spool.",
            },
            {
              q: "How does college gate delivery work at LIT Sarigam or ROFEL Vapi?",
              a: "When placing your order, select 'Campus / College Gate Drop'. Our rider will arrive at the main security gate and send you an arrival notification with a 4-digit OTP. You simply walk to the gate, share the OTP, and receive your sealed parcel.",
            },
            {
              q: "Can I combine stationery items with my print order?",
              a: "Yes. Any stationery item you add from our Study Essentials store is packed into the exact same tamper-evident parcel with your printed document. Combining them also helps you cross the ₹149 free delivery threshold.",
            },
            {
              q: "What paper grades and binding types are available?",
              a: "We offer 75 GSM Standard Copy paper (ideal for assignments and daily reading) and 100 GSM Executive Bond paper (recommended for resumes and thesis submissions). Binding options include Corner Staple (₹2), Spiral Bound (₹25), Wiro Loop (₹35), and Hardcover Thesis (₹150).",
            },
          ].map((faq, i) => (
            <details
              key={i}
              className="group rounded-2xl border border-edge bg-white p-4 shadow-xs"
            >
              <summary className="font-bold text-sm text-ink flex items-center justify-between list-none">
                <span>{faq.q}</span>
                <span className="text-slate group-open:rotate-180 transition-transform">▾</span>
              </summary>
              <p className="text-xs sm:text-sm text-slate mt-3 leading-relaxed pt-2 border-t border-edge/60">
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
