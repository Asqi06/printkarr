import type { Metadata } from "next";
import Script from "next/script";
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
    default: "PrintKarr · Online Xerox, Anime Wall Lights, Name Plates & Print Shop Near Me in Vapi",
    template: "%s · PrintKarr",
  },
  description:
    "Top-rated print shop near you in Vapi & Daman. Custom acrylic door name plates, anime wall lights & LED posters, visiting cards, HD poster printing, and 30-min online xerox.",
  keywords: [
    "name plate shop near me",
    "printing shop near me",
    "anime wall light",
    "anime wall hanging decor",
    "business card printing near me",
    "anime wall hanger",
    "wall decor anime",
    "poster printing near me",
    "print shop near me",
    "led anime poster",
    "xerox shop Vapi",
    "visiting card printing Vapi",
    "acrylic name plate Vapi",
    "Printkarr",
  ],
  openGraph: {
    siteName: "PrintKarr.in",
    locale: "en_IN",
    type: "website",
    description: "Online Xerox, custom name plates, anime LED wall lights, business cards & posters in Vapi.",
  },
  alternates: { canonical: "/" },
};

const localBusiness = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "PrintKarr · Online Xerox & Print Shop",
  alternateName: ["PrintKarr.in", "PrintKarr Name Plates & Anime Decor"],
  description:
    "Local print shop delivering custom acrylic name plates, anime wall lights, LED posters, business cards, HD posters, and xerox in 30 minutes across Vapi, Sarigam & Daman.",
  url: site.url,
  telephone: "+91-90167-03180",
  priceRange: "₹1.25 - ₹899",
  areaServed: ["Vapi", "Sarigam", "Daman", "Bhilad", "Umbergaon"].map((name) => ({
    "@type": "Place",
    name,
  })),
  address: {
    "@type": "PostalAddress",
    streetAddress: "Vapi GIDC Phase 1",
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
  openingHours: "Mo-Sa 08:30-22:00",
  knowsAbout: [
    "name plate shop near me",
    "printing shop near me",
    "anime wall light",
    "anime wall hanging decor",
    "business card printing near me",
    "anime wall hanger",
    "wall decor anime",
    "poster printing near me",
    "print shop near me",
    "led anime poster",
  ],
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
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusiness) }}
        />
      </body>
    </html>
  );
}
