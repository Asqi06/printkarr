import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui";
import { STATIONERY_CATALOGUE } from "@/lib/stationeryData";

export const metadata: Metadata = {
  title: "Business Card Printing Near Me · Visiting Cards Delivered in 30 Mins | PrintKarr",
  description:
    "Fast business card printing near you in Vapi, Sarigam & Daman. 350 GSM matte laminated, spot UV, and executive visiting cards printed and delivered in 30–45 mins.",
  keywords: [
    "business card printing near me",
    "visiting card printing Vapi",
    "visiting card shop near me",
    "urgent business cards 30 mins",
    "matte business cards Vapi",
    "spot UV visiting cards",
    "visiting card maker Sarigam",
    "corporate visiting cards Daman",
  ],
  alternates: { canonical: "/business-cards" },
};

const cardFaqs = [
  {
    q: "Where can I get urgent business card printing near me in Vapi or Sarigam?",
    a: "PrintKarr offers on-demand digital visiting card printing with express 30 to 45-minute doorstep delivery across Vapi GIDC, Chala, Gunjan, and Sarigam industrial areas.",
  },
  {
    q: "What paper thickness and finishes are used for business cards?",
    a: "We print exclusively on heavy 350 GSM premium European artboard with options for Velvet Matte Lamination, Glossy Lamination, and Raised Spot UV texture.",
  },
  {
    q: "Can I print in small batches like 100 cards?",
    a: "Yes! Unlike traditional offset presses that require 1000 cards minimum, our digital press prints packs of 100 cards starting at just ₹199.",
  },
  {
    q: "Can I upload my own PDF or Canva design?",
    a: "Yes. Simply upload your finished PDF, PNG, or Canva export. We run an automated preflight check to ensure your margins and bleed lines are perfectly cut.",
  },
];

export default function BusinessCardsPage() {
  const items = STATIONERY_CATALOGUE.filter((x) => x.category === "business-cards");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "PrintKarr Business Card Printing",
    description: "Fast digital business card & visiting card printing in Vapi, Gujarat.",
    url: "https://printkarr.in/business-cards",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Vapi",
      addressRegion: "Gujarat",
      postalCode: "396191",
      addressCountry: "IN",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: "20.3718",
      longitude: "72.9106",
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Business Cards",
      itemListElement: items.map((item) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Product",
          name: item.name,
          description: item.description,
          offers: {
            "@type": "Offer",
            price: item.price,
            priceCurrency: "INR",
          },
        },
      })),
    },
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-24">
      {/* Hero */}
      <section className="border-b border-edge bg-white py-12 sm:py-16">
        <Container>
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-edge bg-surface px-3.5 py-1 text-xs font-semibold text-slate">
              <span>💼</span>
              <span>Business Card Printing Near Me · 30-Min Fast Delivery</span>
            </div>
            <h1 className="font-grotesk text-3xl sm:text-5xl font-extrabold text-ink tracking-tight text-balance">
              Premium Visiting Cards Printed &amp; Delivered in 30 Mins
            </h1>
            <p className="text-sm sm:text-base text-slate leading-relaxed">
              Thick 350 GSM matte laminated and raised spot UV business cards. Fast digital turnaround for
              entrepreneurs, doctors, advocates, and industrial executives in Vapi, Sarigam, and Daman.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/stationery?q=business+card"
                className="rounded-xl bg-[#0c831f] px-6 py-3 text-xs font-bold text-white shadow-xs hover:bg-[#096a18] transition"
              >
                Order Visiting Cards (from ₹199) →
              </Link>
              <Link
                href="/order"
                className="rounded-xl border border-edge bg-white px-5 py-3 text-xs font-bold text-ink hover:bg-slate-50 transition"
              >
                Print Business Documents
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* Cards Grid */}
      <Container className="py-12 space-y-12">
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-grotesk text-xl sm:text-2xl font-bold text-ink">
                Visiting Card Formats
              </h2>
              <p className="text-xs text-slate mt-0.5">High definition digital laser printing</p>
            </div>
            <span className="text-xs font-bold text-[#0c831f]">Dispatched in 30 Mins</span>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-3xl border border-edge bg-white p-6 shadow-xs flex flex-col justify-between hover:border-slate transition"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-3xl">{item.icon}</span>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-900">
                      {item.badge}
                    </span>
                  </div>
                  <h3 className="font-grotesk text-base font-bold text-ink mt-3">{item.name}</h3>
                  <p className="text-xs text-slate mt-1 leading-relaxed">{item.description}</p>
                  <span className="text-[11px] text-slate-500 block mt-2 font-mono">{item.unit}</span>
                </div>

                <div className="mt-6 border-t border-edge pt-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate line-through">₹{item.mrp}</span>
                    <b className="font-grotesk text-xl font-bold text-ink block leading-none">
                      ₹{item.price}
                    </b>
                  </div>
                  <Link
                    href={`/stationery?q=${encodeURIComponent(item.name)}`}
                    className="rounded-xl bg-[#0c831f] px-5 py-2 text-xs font-bold text-white hover:bg-[#096a18] transition"
                  >
                    Order Pack of 100 →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI & Local SEO FAQs */}
        <div className="rounded-3xl border border-edge bg-white p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <h2 className="font-grotesk text-xl font-bold text-ink">
              Business Card Printing FAQs
            </h2>
            <p className="text-xs text-slate mt-0.5">Frequently asked questions about local visiting card orders</p>
          </div>

          <div className="space-y-4 divide-y divide-edge/70">
            {cardFaqs.map((faq) => (
              <div key={faq.q} className="pt-4 first:pt-0 space-y-1">
                <h4 className="text-xs sm:text-sm font-bold text-ink">{faq.q}</h4>
                <p className="text-xs text-slate leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </Container>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
