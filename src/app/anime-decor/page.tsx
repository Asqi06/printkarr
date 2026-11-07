import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui";
import { STATIONERY_CATALOGUE } from "@/lib/stationeryData";
import { AnimeDecorStudio } from "@/components/custom/AnimeDecorStudio";

export const metadata: Metadata = {
  title: "Anime Wall Light, LED Posters & Wall Hanging Decor · PrintKarr Vapi",
  description:
    "Shop anime wall lights, backlit LED anime posters, Japanese wooden scroll wall hangers, and manga panels room wall decor in Vapi, Sarigam & Daman. 30-min express delivery.",
  keywords: [
    "anime wall light",
    "anime wall hanging decor",
    "anime wall hanger",
    "wall decor anime",
    "led anime poster",
    "anime room decor Vapi",
    "Goku wall light",
    "Naruto LED frame",
    "manga wall collage kit",
    "anime merchandise near me",
  ],
  alternates: { canonical: "/anime-decor" },
};

const animeFaqs = [
  {
    q: "Where can I buy anime wall lights and LED anime posters in Vapi?",
    a: "PrintKarr crafts and delivers custom laser-engraved anime LED acrylic lights and backlit poster frames with 30-min delivery across Vapi, Sarigam, and Daman.",
  },
  {
    q: "How does the Anime LED Acrylic Wall Light work?",
    a: "It features an edge-lit optical acrylic silhouette that glows brightly with warm ambient light. Powered via any standard USB phone charger, power bank, or laptop.",
  },
  {
    q: "What characters and anime series are available?",
    a: "We stock designs from popular series including Solo Leveling, Demon Slayer, Jujutsu Kaisen (Gojo/Sukuna), One Piece (Luffy/Zoro), Naruto, and Dragon Ball Z. Custom art uploads are also accepted.",
  },
  {
    q: "What is an anime wooden scroll wall hanger?",
    a: "Our wall hanger uses natural teak magnetic wood bars that clamp onto premium canvas fabric art. It hangs cleanly with a rope cord and causes zero wall damage.",
  },
];

export default function AnimeDecorPage() {
  const items = STATIONERY_CATALOGUE.filter((x) => x.category === "anime-decor");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Store",
    name: "PrintKarr Anime Decor & LED Wall Lights",
    description: "Anime wall lights, LED backlit posters, wall hangers, and room decor.",
    url: "https://printkarr.in/anime-decor",
    areaServed: ["Vapi", "Sarigam", "Daman"],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Anime Wall Decor",
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
              <span>⚡</span>
              <span>Anime Room Decor · LED Wall Lights &amp; Hanging Art</span>
            </div>
            <h1 className="font-grotesk text-3xl sm:text-5xl font-extrabold text-ink tracking-tight text-balance">
              Anime Wall Lights, LED Posters &amp; Room Decor
            </h1>
            <p className="text-sm sm:text-base text-slate leading-relaxed">
              Transform your bedroom or study desk with glowing acrylic anime lights, magnetic wooden scroll
              hangers, and high-definition manga collage kits. Delivered in 30 minutes in Vapi and Sarigam.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/stationery?q=anime"
                className="rounded-xl bg-[#0c831f] px-6 py-3 text-xs font-bold text-white shadow-xs hover:bg-[#096a18] transition"
              >
                Shop Anime Decor →
              </Link>
              <Link
                href="/order"
                className="rounded-xl border border-edge bg-white px-5 py-3 text-xs font-bold text-ink hover:bg-slate-50 transition"
              >
                Print Custom Posters
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* Anime Decor Content */}
      <Container className="py-12 space-y-12">
        {/* Interactive Anime Lighting & Decor Studio */}
        <AnimeDecorStudio />

        {/* Technical Safety & Electronics Guide */}
        <div className="rounded-3xl border border-edge bg-white p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-edge pb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0c831f]">
              Electronics &amp; Optical Specifications
            </span>
            <h2 className="font-grotesk text-xl sm:text-2xl font-bold text-ink mt-0.5">
              Precision Laser Crafting &amp; Safety Rating
            </h2>
            <p className="text-xs text-slate mt-1">
              Low-power, eye-friendly LED illumination designed for study desks, bedside tables, and gaming rooms.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-edge bg-slate-50/60 p-4 space-y-2">
              <span className="text-2xl">💡</span>
              <h3 className="text-xs font-bold text-ink">Zero Heat Emission</h3>
              <p className="text-[11px] text-slate leading-relaxed">
                Powered by cool-running solid-state 2.5W LEDs. The optical acrylic sheet and wooden base stay 
                cool to touch even after 12+ continuous hours of illumination.
              </p>
              <div className="pt-1 text-[10px] font-mono text-slate-500">
                100% Safe For Kids &amp; Desks<br />
                Under 2.5W power draw
              </div>
            </div>

            <div className="rounded-2xl border border-edge bg-slate-50/60 p-4 space-y-2">
              <span className="text-2xl">⚡</span>
              <h3 className="text-xs font-bold text-ink">Universal 5V USB Powered</h3>
              <p className="text-[11px] text-slate leading-relaxed">
                Runs on any standard USB port: mobile charger adapter, laptop USB port, power bank, or extension board. 
                Supplied with a 1.2-meter braided USB cable with inline toggle switch.
              </p>
              <div className="pt-1 text-[10px] font-mono text-slate-500">
                5V / 1A USB input<br />
                Inline power button
              </div>
            </div>

            <div className="rounded-2xl border border-edge bg-slate-50/60 p-4 space-y-2">
              <span className="text-2xl">🪵</span>
              <h3 className="text-xs font-bold text-ink">Solid Beech &amp; Teak Wood</h3>
              <p className="text-[11px] text-slate leading-relaxed">
                Every base and magnetic scroll hanger is turned from real, natural beech and teak wood. Sanded smooth, 
                weighted for stability, and laser engraved with high precision.
              </p>
              <div className="pt-1 text-[10px] font-mono text-slate-500">
                Natural Grain Beechwood<br />
                Anti-scratch velvet feet
              </div>
            </div>

            <div className="rounded-2xl border border-edge bg-slate-50/60 p-4 space-y-2">
              <span className="text-2xl">🧲</span>
              <h3 className="text-xs font-bold text-ink">Neodymium Magnetic Clamping</h3>
              <p className="text-[11px] text-slate leading-relaxed">
                Our wooden scroll hangers use high-strength neodymium magnets embedded in wood. Clamp any poster in 5 seconds 
                without thumb tacks, tape residue, or holes.
              </p>
              <div className="pt-1 text-[10px] font-mono text-slate-500">
                Zero poster damage<br />
                Re-usable indefinitely
              </div>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-grotesk text-xl sm:text-2xl font-bold text-ink">
                Trending Anime Wall Decor
              </h2>
              <p className="text-xs text-slate mt-0.5">Top-rated glowing lights and wall hangers</p>
            </div>
            <span className="text-xs font-bold text-[#0c831f]">Express 30-Min Drop</span>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-3xl border border-edge bg-white p-5 shadow-xs flex flex-col justify-between hover:border-slate transition"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-3xl">{item.icon}</span>
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-900">
                      {item.badge}
                    </span>
                  </div>
                  <h3 className="font-grotesk text-sm font-bold text-ink mt-3">{item.name}</h3>
                  <p className="text-xs text-slate mt-1 leading-relaxed">{item.description}</p>
                  <span className="text-[11px] text-slate-500 block mt-2 font-mono">{item.unit}</span>
                </div>

                <div className="mt-5 border-t border-edge pt-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate line-through">₹{item.mrp}</span>
                    <b className="font-grotesk text-base font-bold text-ink block leading-none">
                      ₹{item.price}
                    </b>
                  </div>
                  <Link
                    href={`/stationery?q=${encodeURIComponent(item.name)}`}
                    className="rounded-xl bg-[#0c831f] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#096a18] transition"
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
              Anime Wall Decor &amp; Lights FAQs
            </h2>
            <p className="text-xs text-slate mt-0.5">Quick answers for room decor shoppers</p>
          </div>

          <div className="space-y-4 divide-y divide-edge/70">
            {animeFaqs.map((faq) => (
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
