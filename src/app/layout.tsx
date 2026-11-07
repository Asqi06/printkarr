import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { site } from "@/lib/site";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AddressDrawer } from "@/components/AddressDrawer";
import { CartDrawer } from "@/components/CartDrawer";

const grotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "PrintKarr · 30-Min Instant Document Printing & Stationery in Vapi",
    template: "%s · PrintKarr",
  },
  description:
    "India's fastest document printing and stationery delivery. High quality B&W and colour printing, spiral binding, and office essentials delivered in 30–45 mins to Vapi, Sarigam, and Daman.",
  keywords: [
    "online printing in Vapi",
    "print delivery in Vapi",
    "online PDF printing Vapi",
    "document printing Vapi",
    "colour printing Vapi",
    "spiral binding Vapi",
    "stationery delivery Vapi",
    "Blinkit print alternative",
  ],
  openGraph: {
    siteName: "PrintKarr",
    locale: "en_IN",
    type: "website",
    description: "30-min document printing & stationery delivery in Vapi, Sarigam & Daman.",
  },
  alternates: { canonical: "/" },
};

const localBusiness = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "PrintKarr",
  description: site.description,
  url: site.url,
  areaServed: site.areas.map((name) => ({ "@type": "Place", name })),
  address: {
    "@type": "PostalAddress",
    addressLocality: "Vapi",
    addressRegion: "Gujarat",
    addressCountry: "IN",
  },
  openingHours: "Mo-Sa 08:30-22:00",
  slogan: "Print Kar. Pahunch Gaya.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${grotesk.variable} ${inter.variable} ${jetbrains.variable} h-full`}
    >
      <body className="flex min-h-full flex-col bg-[#f8f9fa] text-[#1c1c1c] antialiased">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <AddressDrawer />
        <CartDrawer />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusiness) }}
        />
      </body>
    </html>
  );
}
