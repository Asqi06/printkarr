import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

const routes = [
  "",
  "/order",
  "/name-plates",
  "/anime-decor",
  "/business-cards",
  "/posters",
  "/stationery",
  "/account",
  "/pricing",
  "/track",
  "/how-it-works",
  "/bulk-printing",
  "/business-printing",
  "/about",
  "/contact",
  "/faq",
  "/privacy",
  "/terms",
  "/refund-policy",
];

export default function sitemap(): MetadataRoute.Sitemap {
  // Deterministic date to satisfy Next.js static prerendering
  const lastModified = new Date("2026-11-07");
  return routes.map((r) => {
    let priority = 0.7;
    if (r === "" || r === "/order") priority = 1.0;
    else if (
      r === "/name-plates" ||
      r === "/anime-decor" ||
      r === "/business-cards" ||
      r === "/posters" ||
      r === "/stationery"
    )
      priority = 0.9;
    else if (r === "/track" || r === "/account") priority = 0.8;

    return {
      url: `${site.url}${r}`,
      lastModified,
      changeFrequency: r === "" || r === "/order" ? "daily" : "weekly",
      priority,
    };
  });
}
