import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui";
import { STATIONERY_CATALOGUE } from "@/lib/stationeryData";

export const metadata: Metadata = {
  title: "Name Plate Shop Near Me · Custom Acrylic & Wooden Name Plates in Vapi & Daman",
  description:
    "Looking for a custom name plate shop near you? Order golden acrylic door name plates, wooden engraved house plates, and doctor/office desk name plates with 30-min delivery in Vapi, Sarigam & Daman.",
  keywords: [
    "name plate shop near me",
    "acrylic name plate Vapi",
    "custom door name plate",
    "house name plate design",
    "doctor desk name plate",
    "wooden name plate shop",
    "flat number plate Daman",
    "name plate makers in Vapi",
  ],
  alternates: { canonical: "/name-plates" },
};

const nameplateFaqs = [
  {
    q: "Where can I find a custom name plate shop near me in Vapi or Daman?",
    a: "PrintKarr provides doorstep customization and delivery of acrylic, wooden, and brass name plates across Vapi (Chala, Gunjan, GIDC), Sarigam, and Daman within 30 to 45 minutes.",
  },
  {
    q: "Are your acrylic door name plates weatherproof and waterproof?",
    a: "Yes. All our acrylic door plates use exterior-grade cast acrylic with UV-embossed mirror gold/silver lettering that withstands sunlight, rain, and dust without fading.",
  },
  {
    q: "Can I customize the font, family name, and flat number?",
    a: "Yes! You can specify your exact name, flat/bungalow number, and font preferences. We send a digital preview before laser-cutting your plaque.",
  },
  {
    q: "What is the starting price for house and desk name plates?",
    a: "Desk name plates start at just ₹349, custom acrylic door plates start at ₹449, and handcrafted wooden plaques start at ₹499.",
  },
];

export default function NamePlatesPage() {
  const items = STATIONERY_CATALOGUE.filter((x) => x.category === "name-plates");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Store",
    name: "PrintKarr Name Plates & Custom Printing",
    description: "Custom acrylic, wooden, and metal name plates delivered in Vapi and Daman.",
    url: "https://printkarr.in/name-plates",
    areaServed: ["Vapi", "Sarigam", "Daman", "Bhilad", "Umbergaon"],
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
      name: "Custom Name Plates",
      itemListElement: items.map((item, idx) => ({
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
              <span>🚪</span>
              <span>Name Plate Shop Near Me · Vapi, Sarigam &amp; Daman</span>
            </div>
            <h1 className="font-grotesk text-3xl sm:text-5xl font-extrabold text-ink tracking-tight text-balance">
              Custom Door &amp; Desk Name Plates Made in Vapi
            </h1>
            <p className="text-sm sm:text-base text-slate leading-relaxed">
              Premium golden mirror acrylic name plates, laser-cut wooden door plaques, and executive desk
              name plates. Handcrafted locally with weatherproof finish and delivered in 30–45 mins.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/stationery?q=name+plate"
                className="rounded-xl bg-[#0c831f] px-6 py-3 text-xs font-bold text-white shadow-xs hover:bg-[#096a18] transition"
              >
                Browse All Name Plates →
              </Link>
              <Link
                href="/order"
                className="rounded-xl border border-edge bg-white px-5 py-3 text-xs font-bold text-ink hover:bg-slate-50 transition"
              >
                Need Documents Printed?
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* Product Showcase */}
      <Container className="py-12 space-y-12">
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-grotesk text-xl sm:text-2xl font-bold text-ink">
                Popular Name Plate Designs
              </h2>
              <p className="text-xs text-slate mt-0.5">
                Laser-cut with ultra-durable outdoor materials
              </p>
            </div>
            <span className="text-xs font-bold text-[#0c831f]">Fast Delivery in Vapi</span>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-3xl border border-edge bg-white p-5 shadow-xs flex flex-col justify-between hover:border-slate transition"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-3xl">{item.icon}</span>
                    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-900">
                      {item.badge}
                    </span>
                  </div>
                  <h3 className="font-grotesk text-base font-bold text-ink mt-3">{item.name}</h3>
                  <p className="text-xs text-slate mt-1 leading-relaxed">{item.description}</p>
                  <span className="text-[11px] text-slate-500 block mt-2 font-mono">{item.unit}</span>
                </div>

                <div className="mt-5 border-t border-edge pt-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate line-through">₹{item.mrp}</span>
                    <b className="font-grotesk text-lg font-bold text-ink block leading-none">
                      ₹{item.price}
                    </b>
                  </div>
                  <Link
                    href={`/stationery?q=${encodeURIComponent(item.name)}`}
                    className="rounded-xl bg-[#0c831f] px-4 py-2 text-xs font-bold text-white hover:bg-[#096a18] transition"
                  >
                    Order Now →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Local Areas Served */}
        <div className="rounded-3xl border border-edge bg-white p-6 sm:p-8 shadow-xs space-y-3">
          <h3 className="font-grotesk text-base font-bold text-ink">
            Serving Residential &amp; Commercial Spots Across Vapi &amp; Daman
          </h3>
          <p className="text-xs text-slate leading-relaxed">
            We deliver personalized name plates to flats and bungalows in Chala, Gunjan, Koparli Road, Vapi GIDC
            Phases 1-4, Chanod Colony, Dungra, Sarigam LIT Campus gates, and Daman (Nani Daman, Moti Daman &amp;
            Devka Beach Road).
          </p>
        </div>

        {/* AI & Local SEO FAQs */}
        <div className="rounded-3xl border border-edge bg-white p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <h2 className="font-grotesk text-xl font-bold text-ink">
              Frequently Asked Questions (Name Plates Near Me)
            </h2>
            <p className="text-xs text-slate mt-0.5">Clear answers for your custom name plate orders</p>
          </div>

          <div className="space-y-4 divide-y divide-edge/70">
            {nameplateFaqs.map((faq) => (
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
