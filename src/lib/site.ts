/**
 * Site-wide configuration for printkarr.in
 * Operational details (phone, WhatsApp, hours) land here once confirmed
 * with the shop; empty values render as "coming soon" as pre-launch honest
 * fallbacks. Update this one file when details are final.
 */
export const site = {
  name: "printkarr",
  url: "https://printkarr.in",
  tagline: "Print kar. Pahunch gaya.",
  description:
    "Upload your files, choose your print settings, and get them printed and delivered to your doorstep in Vapi. No shop visits, no queues, no running around.",
  /** Empty until the number is operationally confirmed. */
  whatsapp: "", // e.g. "919876543210"
  phone: "",
  email: "",
  hours: "Mon–Sat: 9:00 AM – 9:00 PM",
  areas: ["Vapi", "Sarigam", "Bhilad", "Daman"],
  social: {
    instagram: "", // profile URL once live
  },
} as const;

export function waLink(text: string): string | null {
  if (!site.whatsapp) return null;
  return `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(text)}`;
}
