import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui";
import { STATIONERY_CATALOGUE } from "@/lib/stationeryData";
import { PosterStudio } from "@/components/custom/PosterStudio";

export const metadata: Metadata = {
  title: "Poster Printing Near Me · HD Glossy A3, A4 & A2 Posters | PrintKarr",
  description:
    "Looking for poster printing near you? Order custom HD glossy A3, A4, and A2 poster prints, movie & anime posters, and exhibition displays with 30-min delivery in Vapi, Sarigam & Daman.",
  keywords: [
    "poster printing near me",
    "print shop near me",
    "printing shop near me",
    "A3 poster printing Vapi",
    "custom poster prints",
    "glossy photo poster",
    "anime poster prints",
    "large format poster Daman",
  ],
  alternates: { canonical: "/posters" },
};

const posterFaqs = [
  {
    q: "Where can I get high quality poster printing near me in Vapi?",
    a: "PrintKarr offers studio-quality A4, A3, and giant A2 poster prints on heavy 300 GSM photo paper with 30-minute delivery in Vapi, Sarigam, and Daman.",
  },
  {
    q: "What paper types are used for posters?",
    a: "We print on heavy 300 GSM European Glossy Photo Paper and Anti-Glare Matte Cardstock using 12-colour vivid digital pigment printers that do not bleed or smudge.",
  },
  {
    q: "Can I print custom photos, anime art, or event posters?",
    a: "Yes! You can upload any high-resolution image, artwork, movie still, or college event banner. We auto-check resolution for sharp, pixel-perfect results.",
  },
  {
    q: "What is the starting price for poster printing?",
    a: "Custom A4 photo posters start at just ₹29, full-size A3 posters start at ₹49, and giant A2 posters start at ₹129.",
  },
];

export default function PostersPage() {
  const items = STATIONERY_CATALOGUE.filter((x) => x.category === "posters");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Store",
    name: "PrintKarr HD Poster Printing Shop",
    description: "High-definition A3, A4, and A2 poster printing near you in Vapi & Daman.",
    url: "https://printkarr.in/posters",
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
      name: "HD Posters",
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
              <span>🖼️</span>
              <span>Poster Printing Near Me · Print Shop in Vapi &amp; Daman</span>
            </div>
            <h1 className="font-grotesk text-3xl sm:text-5xl font-extrabold text-ink tracking-tight text-balance">
              HD Poster Printing On Heavy 300 GSM Photo Paper
            </h1>
            <p className="text-sm sm:text-base text-slate leading-relaxed">
              Vibrant 12-colour digital photo posters in A4, A3, and giant A2 sizes. Perfect for anime wall art,
              gaming rooms, college exhibitions, and events in Vapi, Sarigam, and Daman.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/stationery?q=poster"
                className="rounded-xl bg-[#0c831f] px-6 py-3 text-xs font-bold text-white shadow-xs hover:bg-[#096a18] transition"
              >
                Order Custom Posters (from ₹29) →
              </Link>
              <Link
                href="/order"
                className="rounded-xl border border-edge bg-white px-5 py-3 text-xs font-bold text-ink hover:bg-slate-50 transition"
              >
                Print Documents &amp; Xerox
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* Posters Main Content */}
      <Container className="py-12 space-y-12">
        {/* Interactive Studio Configurator */}
        <PosterStudio />

        {/* Technical Printing Specifications & File Guidelines */}
        <div className="rounded-3xl border border-edge bg-white p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-edge pb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0c831f]">
              Technical Preflight &amp; Print Guidelines
            </span>
            <h2 className="font-grotesk text-xl sm:text-2xl font-bold text-ink mt-0.5">
              Everything You Need to Know Before Printing
            </h2>
            <p className="text-xs text-slate mt-1">
              Ensure razor-sharp, museum-quality poster reproduction with zero blur or color shift.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-edge bg-slate-50/60 p-4 space-y-2">
              <span className="text-2xl">📐</span>
              <h3 className="text-xs font-bold text-ink">Resolution &amp; DPI Target</h3>
              <p className="text-[11px] text-slate leading-relaxed">
                For pixel-perfect prints, prepare images at <strong>300 DPI</strong> at actual print dimensions. 
                Minimum acceptable resolution for wall viewing is <strong>150 DPI</strong>.
              </p>
              <div className="pt-1 text-[10px] font-mono text-slate-500">
                A3: 3508 × 4960 px<br />
                A4: 2480 × 3508 px<br />
                12×18: 3600 × 5400 px
              </div>
            </div>

            <div className="rounded-2xl border border-edge bg-slate-50/60 p-4 space-y-2">
              <span className="text-2xl">🎨</span>
              <h3 className="text-xs font-bold text-ink">CMYK vs RGB Colorspace</h3>
              <p className="text-[11px] text-slate leading-relaxed">
                Digital displays illuminate in sRGB; print machines use 12-color pigment CMYK. We automatically
                map neon RGB tones to the deepest possible CMYK gamuts without mudding tones.
              </p>
              <div className="pt-1 text-[10px] font-mono text-slate-500">
                12-Color Pigment Gamut<br />
                Fade-resistant for 50+ years
              </div>
            </div>

            <div className="rounded-2xl border border-edge bg-slate-50/60 p-4 space-y-2">
              <span className="text-2xl">✂️</span>
              <h3 className="text-xs font-bold text-ink">3mm Bleed &amp; Trim Line</h3>
              <p className="text-[11px] text-slate leading-relaxed">
                Keep vital design elements, text, and signatures at least <strong>5mm inside</strong> the canvas edge. 
                Full-bleed artwork is trimmed edge-to-edge so no white borders remain.
              </p>
              <div className="pt-1 text-[10px] font-mono text-slate-500">
                Bleed: +3mm per edge<br />
                Precision hydraulic cutter
              </div>
            </div>

            <div className="rounded-2xl border border-edge bg-slate-50/60 p-4 space-y-2">
              <span className="text-2xl">🛡️</span>
              <h3 className="text-xs font-bold text-ink">Paper &amp; Protective Laminates</h3>
              <p className="text-[11px] text-slate leading-relaxed">
                Choose between <strong>300 GSM High Gloss</strong> for punchy photography, or <strong>280 GSM Velvet Matte</strong> 
                for zero-reflection gallery displays. Add thermal lamination for moisture and UV resistance.
              </p>
              <div className="pt-1 text-[10px] font-mono text-slate-500">
                Thermal Gloss (+₹15)<br />
                Soft-Touch Velvet (+₹25)
              </div>
            </div>
          </div>
        </div>

        {/* Posters Grid */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-grotesk text-xl sm:text-2xl font-bold text-ink">
                Popular Pre-Made Poster Formats
              </h2>
              <p className="text-xs text-slate mt-0.5">Heavy 300 GSM photo stock with smudge-proof inks</p>
            </div>
            <span className="text-xs font-bold text-[#0c831f]">30-Min Fast Drop</span>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-3xl border border-edge bg-white p-6 shadow-xs flex flex-col justify-between hover:border-slate transition"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-3xl">{item.icon}</span>
                    <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-blue-900">
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
                    className="rounded-xl bg-[#0c831f] px-4 py-2 text-xs font-bold text-white hover:bg-[#096a18] transition"
                  >
                    + Add to Cart
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
              Poster &amp; Print Shop FAQs
            </h2>
            <p className="text-xs text-slate mt-0.5">Quick answers for local poster and document printing</p>
          </div>

          <div className="space-y-4 divide-y divide-edge/70">
            {posterFaqs.map((faq) => (
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
