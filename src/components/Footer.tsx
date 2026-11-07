import Link from "next/link";
import { site } from "@/lib/site";
import { Wordmark } from "./Wordmark";
import { Container } from "./ui";

const nav: { title: string; items: { href: string; label: string }[] }[] = [
  {
    title: "PrintKarr",
    items: [
      { href: "/order", label: "Print Documents" },
      { href: "/stationery", label: "Stationery & Essentials" },
      { href: "/pricing", label: "Pricing & Volume Slabs" },
      { href: "/track", label: "Live Order Tracking" },
      { href: "/how-it-works", label: "How It Works" },
    ],
  },
  {
    title: "Services",
    items: [
      { href: "/bulk-printing", label: "Bulk & Thesis Printing" },
      { href: "/business-printing", label: "Business & Office Prints" },
      { href: "/admin", label: "Dark-Store Console" },
      { href: "/faq", label: "Customer FAQ" },
      { href: "/contact", label: "Contact & Helpdesk" },
    ],
  },
  {
    title: "Locations",
    items: [
      { href: "/order", label: "Vapi (Chala, GIDC, Gunjan)" },
      { href: "/order", label: "Sarigam & LIT Campus" },
      { href: "/order", label: "Daman (Nani & Moti Daman)" },
      { href: "/order", label: "Bhilad" },
    ],
  },
  {
    title: "Legal & Security",
    items: [
      { href: "/privacy", label: "Document Privacy & Deletion" },
      { href: "/terms", label: "Terms of Service" },
      { href: "/refund-policy", label: "Cancellation & Refunds" },
      { href: "/about", label: "About Our Dark-Stores" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-[#0e1a2b] text-[#f8f6f0]">
      <Container className="pb-10">
        <div className="grid gap-12 pt-16 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]">
          <div className="flex flex-col gap-4">
            <Wordmark link={false} />
            <p className="max-w-xs text-sm leading-relaxed text-[#f8f6f0]/70">
              Print kar. Pahunch gaya. High-speed document printing, spiral thesis binding, and
              impulse stationery delivered in 30–45 mins to your doorstep.
            </p>
            <div className="text-xs text-[#f8f6f0]/60 space-y-1">
              <p>📍 Central Dark-Store: Vapi GIDC Phase 1, Gujarat</p>
              <p>📞 Phone / WhatsApp: +91 90167 03180</p>
              <p>⏰ Open 8:30 AM – 10:00 PM (Monday to Saturday)</p>
            </div>
          </div>

          {nav.map((col) => (
            <div key={col.title} className="flex flex-col gap-3">
              <p className="font-ops text-xs font-semibold tracking-wider text-[#ffc700] uppercase">
                {col.title}
              </p>
              <ul className="flex flex-col gap-2 text-xs text-[#f8f6f0]/75">
                {col.items.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="transition hover:text-white hover:underline"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row text-xs text-[#f8f6f0]/50">
          <p>© 2026 PrintKarr Technologies Private Limited. All rights reserved.</p>
          <p className="flex items-center gap-2">
            <span>🔒 256-Bit SSL Encrypted</span>
            <span>·</span>
            <span>⚡ Dark-Store Instant Dispatch</span>
          </p>
        </div>
      </Container>
    </footer>
  );
}
