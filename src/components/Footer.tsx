import Link from "next/link";
import { Wordmark } from "./Wordmark";
import { Container } from "./ui";

const footerSections = [
  {
    title: "Online Xerox",
    items: [
      { href: "/order", label: "B&W Document Xerox (₹1.25/p)" },
      { href: "/order", label: "Vivid Colour Prints (₹4.75/p)" },
      { href: "/order", label: "Spiral & Thesis Binding" },
      { href: "/pricing", label: "Bulk Notes Xerox (Save 40%)" },
      { href: "/order", label: "Admit Card & Form Printing" },
    ],
  },
  {
    title: "Study & Stationery",
    items: [
      { href: "/stationery", label: "A4 Clear Report Folders (₹10)" },
      { href: "/stationery", label: "Cello Ball & Gel Pens (₹10)" },
      { href: "/stationery", label: "Neon Highlighters (₹25)" },
      { href: "/stationery", label: "Exam Geometry Pouches (₹35)" },
      { href: "/stationery", label: "Ruled College Notebooks (₹65)" },
    ],
  },
  {
    title: "Fast Delivery Zones",
    items: [
      { href: "/order", label: "Vapi (Chala, Gunjan, GIDC)" },
      { href: "/order", label: "Sarigam (LIT Campus Gate)" },
      { href: "/order", label: "Daman (Nani & Moti Daman)" },
      { href: "/order", label: "Bhilad & Surrounding Areas" },
      { href: "/how-it-works", label: "30-Min Delivery Promise" },
    ],
  },
  {
    title: "Account & Help",
    items: [
      { href: "/track", label: "Live Order Tracking" },
      { href: "/account", label: "My Account & Wallet" },
      { href: "/pricing", label: "Xerox Rates & Volume Slabs" },
      { href: "/contact", label: "WhatsApp Support (+91 90167 03180)" },
      { href: "/privacy", label: "Confidential File Deletion" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-[#111827] text-white">
      {/* Trust & Guarantee Banner */}
      <div className="border-b border-white/10 bg-[#0d1424] py-6">
        <Container>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2.5">
              <span className="text-xl">⚡</span>
              <div>
                <p className="text-xs font-bold text-white">30-Min Fast Delivery</p>
                <p className="text-[11px] text-gray-400">Direct to hostel or home</p>
              </div>
            </div>
            <div className="flex items-center justify-center sm:justify-start gap-2.5">
              <span className="text-xl">🔒</span>
              <div>
                <p className="text-xs font-bold text-white">100% Confidential</p>
                <p className="text-[11px] text-gray-400">Auto-deleted after printing</p>
              </div>
            </div>
            <div className="flex items-center justify-center sm:justify-start gap-2.5">
              <span className="text-xl">📄</span>
              <div>
                <p className="text-xs font-bold text-white">Crisp 75 &amp; 100 GSM</p>
                <p className="text-[11px] text-gray-400">Jam-free laser quality</p>
              </div>
            </div>
            <div className="flex items-center justify-center sm:justify-start gap-2.5">
              <span className="text-xl">💳</span>
              <div>
                <p className="text-xs font-bold text-white">Razorpay &amp; Wallet</p>
                <p className="text-[11px] text-gray-400">UPI, Cards, NetBanking</p>
              </div>
            </div>
          </div>
        </Container>
      </div>

      {/* Main Footer Links */}
      <Container className="py-12 sm:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr_1fr]">
          {/* Brand Info Column */}
          <div className="space-y-4">
            <Wordmark theme="dark" />
            <p className="text-xs leading-relaxed text-gray-400 max-w-xs">
              PrintKarr is India&apos;s fastest online xerox and stationery delivery network.
              Upload PDFs, pick print options, and get crisp documents at your gate in 30 minutes.
            </p>
            <div className="space-y-1.5 text-xs text-gray-400">
              <p className="flex items-center gap-1.5">
                <span>📍</span>
                <span>Central Print Hub: Vapi GIDC, Gujarat</span>
              </p>
              <p className="flex items-center gap-1.5">
                <span>📞</span>
                <span>Helpline: +91 90167 03180</span>
              </p>
              <p className="flex items-center gap-1.5">
                <span>⏰</span>
                <span>Open 8:30 AM to 10:00 PM (Mon-Sat)</span>
              </p>
            </div>
          </div>

          {/* Nav Columns */}
          {footerSections.map((section) => (
            <div key={section.title} className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#f8cb46]">
                {section.title}
              </h4>
              <ul className="space-y-2 text-xs text-gray-300">
                {section.items.map((item) => (
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

        {/* Bottom Legal & Copyright Bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-xs text-gray-400 sm:flex-row">
          <p>© 2026 PrintKarr Technologies Private Limited. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <Link href="/terms" className="hover:text-white transition">
              Terms of Service
            </Link>
            <span>·</span>
            <Link href="/privacy" className="hover:text-white transition">
              Privacy &amp; Deletion
            </Link>
            <span>·</span>
            <Link href="/refund-policy" className="hover:text-white transition">
              Refund Policy
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
