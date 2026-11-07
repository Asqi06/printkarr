import type { Metadata } from "next";
import { Container, Chip, PageIntro, OrderLink } from "@/components/ui";
import { Reveal } from "@/components/Reveal";

export const metadata: Metadata = {
  title: "business printing",
  description:
    "Flyers, pamphlets, business cards, brochures and reports printed locally in Vapi. Get a quote for your next print run.",
  alternates: { canonical: "/business-printing" },
};

const services = [
  {
    t: "flyers & pamphlets",
    d: "Hand-out flyers for new stores, offers and events: from 50 copies, delivered to your shop door.",
    chips: ["on quote", "min 50"],
  },
  {
    t: "business cards",
    d: "Clean, matte-finish cards with your exact brand colours, proofed before the run.",
    chips: ["on quote", "min 100"],
  },
  {
    t: "brochures & menus",
    d: "Folded menus and brochures for showrooms, cafés and clinics, printed on good paper stock.",
    chips: ["on quote", "paper options"],
  },
  {
    t: "reports & documents",
    d: "Bound annual reports, tender documents and HR paperwork: confidential by default.",
    chips: ["binding", "stapling", "confidential"],
  },
];

export default function BusinessPrintingPage() {
  return (
    <>
      <PageIntro
        eyebrow="business printing"
        title={
          <>
            made locally, <span className="highlight">for local business.</span>
          </>
        }
        sub="Vapi's businesses don't need a Delhi vendor: they need a neighbourhood print partner that picks up and drops off. Proofed clearly, quoted honestly, delivered on time."
      />

      <Container className="py-12">
        <div className="flex flex-col">
          {services.map((s, i) => (
            <Reveal key={s.t} delay={i * 0.04}>
              <div className="grid gap-4 border-t border-ink/10 py-8 sm:grid-cols-[1fr_auto]">
                <div className="max-w-2xl">
                  <h2 className="font-grotesk text-2xl font-bold tracking-tight text-ink">
                    {s.t}
                  </h2>
                  <p className="mt-2 leading-relaxed text-slate">{s.d}</p>
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
      </Container>

      <section className="border-t border-ink/10 bg-white/50">
        <Container className="py-14">
          <div className="grid items-start gap-10 lg:grid-cols-2">
            <Reveal>
              <h2 className="font-grotesk text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                how a print run happens
              </h2>
              <ol className="mt-6 flex flex-col gap-4">
                {[
                  ["send your files", "pdf / cdr-friendly: or just the text for a first design."],
                  ["approve the proof", "colour, paper and fold-checked before a single sheet prints."],
                  ["settled clearly", "exact quantity × exact rate, nothing padded."],
                  ["delivery", "to your shop, office or factory gate on a promised date."],
                ].map(([t, d], i) => (
                  <li key={t} className="flex gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-karr font-ops text-xs font-semibold text-ink">
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-grotesk font-bold text-ink">{t}</p>
                      <p className="text-sm text-slate">{d}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </Reveal>
            <Reveal delay={0.08}>
              <div className="card flex flex-col gap-4 p-7">
                <p className="eyebrow text-slate">minimums change per product</p>
                <p className="text-sm leading-relaxed text-slate">
                  Print runs are quoted per job: quantity, paper and finishes
                  all affect pricing. Daily document printing doesn&apos;t need a
                  quote at all:
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <OrderLink />
                  <span className="font-ops text-xs text-slate">for reports &amp; forms</span>
                </div>
                <p className="font-ops text-xs leading-relaxed text-slate">
                  photos of recent runs &amp; paper samples: coming with the launch.
                </p>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>
    </>
  );
}
