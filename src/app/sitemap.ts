import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

const routes = [
  "",
  "/order",
  "/pricing",
  "/how-it-works",
  "/bulk-printing",
  "/business-printing",
  "/track",
  "/about",
  "/contact",
  "/faq",
  "/privacy",
  "/terms",
  "/refund-policy",
];

export default function sitemap(): MetadataRoute.Sitemap {
  // Fixed build date — prerendering forbids non-deterministic values
  const lastModified = new Date("2026-11-05");
  return routes.map((r) => ({
    url: `${site.url}${r}`,
    lastModified,
    changeFrequency: r === "" ? "daily" : "weekly",
    priority: r === "" || r === "/order" ? 1 : r === "/track" ? 0.7 : 0.8,
  }));
}
