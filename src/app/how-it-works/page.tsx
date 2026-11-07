import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageIntro, OrderLink, Chip } from "@/components/ui";
import { Reveal } from "@/components/Reveal";
import { RouteArt } from "@/components/doodles";
import { FaqAccordion } from "@/components/FaqAccordion";

export const metadata: Metadata = {
  title: "how it works",
  description:
    "Upload files, choose print settings, pay online and get prints delivered to your doorstep in Vapi. Three steps, no shop visit.",
  alternates: { canonical: "/how-it-works" },
};

const steps = [
  {
    n: "01",
    t: "upload your files",
    d: "Pick files from your phone or laptop: PDF (recommended), JPG, PNG. Select exact page ranges like 1–10, 12, 15–20 so you only pay for what you actually need printed. Multiple files? All welcome in one order.",
    chips: ["pdf preferred", "page ranges", "multi-file"],
  },
  {
    n: "02",
    t: "choose your print settings",
    d: "Colour or B&W, single or double-sided, copies, paper size, stapling. Every option updates the price as you set it: the number you see is the number you pay.",
    chips: ["live pricing", "double-sided saves", "transparent total"],
  },
  {
    n: "03",
    t: "pay and get it delivered",
    d: "Pick Express for urgency or the scheduled Karr Run for a friendlier fee. Pay online, then watch it move: received → printing → packed → on the way → delivered.",
    chips: ["upi · cards · netbanking", "express 30–40 min", "track live"],
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <PageIntro
        eyebrow="how it works"
        title={
          <>
            three steps. <span className="highlight">that&apos;s it.</span>
          </>
        }
        sub="Upload → configure → pay → print → deliver. The whole thing takes less time than finding your keys."
      />

      <Container className="py-12">
        <div className="flex flex-col gap-0">
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.05}>
              <div className="relative grid gap-5 border-t border-ink/10 py-10 sm:grid-cols-[7rem_1fr_auto] sm:gap-8">
                <span className="font-grotesk text-5xl font-bold tracking-tight text-ink/90 sm:text-6xl">
                  {s.n}
                </span>
                <div className="max-w-xl">
                  <h2 className="font-grotesk text-2xl font-bold tracking-tight text-ink">
                    {s.t}
                  </h2>
                  <p className="mt-3 leading-relaxed text-slate">{s.d}</p>
                </div>
                <div className="flex flex-wrap content-start gap-2 sm:justify-end">
                  {s.chips.map((c) => (
                    <Chip key={c}>{c}</Chip>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={0.1}>
          <div className="grid items-center gap-8 border-t border-ink/10 py-12 lg:grid-cols-[1fr_1.2fr]">
            <h2 className="font-grotesk text-3xl font-bold tracking-tight text-ink text-balance">
              and then: <span className="highlight">printed, packed, delivered.</span>
            </h2>
            <RouteArt />
          </div>
        </Reveal>
        <Reveal>
          <div className="flex flex-wrap items-center gap-4">
            <OrderLink />
            <p className="font-ops text-xs text-slate">
              guest checkout · no account needed for a first order
            </p>
          </div>
        </Reveal>
      </Container>

      <section className="border-t border-ink/10 bg-white/50">
        <Container className="py-16">
          <Reveal>
            <h2 className="font-grotesk text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              questions people ask before their first order
            </h2>
          </Reveal>
          <Reveal delay={0.06}>
            <div className="mt-8 max-w-3xl">
              <FaqAccordion limit={5} />
              <Link
                href="/faq"
                className="mt-8 inline-flex font-grotesk font-semibold text-ink underline decoration-karr decoration-4 underline-offset-8"
              >
                read all FAQs →
              </Link>
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
