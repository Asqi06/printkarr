import type { Metadata } from "next";
import { Container, PageIntro, OrderLink } from "@/components/ui";
import { Reveal } from "@/components/Reveal";
import { QuoteForm } from "@/components/QuoteForm";

export const metadata: Metadata = {
  title: "bulk printing",
  description:
    "Bulk printing for classes, schools, coaching centres, offices and factories in Vapi: priority production slots and doorstepped delivery.",
  alternates: { canonical: "/bulk-printing" },
};

const audiences = [
  ["coaching classes", "question banks, notes, test series: before the weekend, not after."],
  ["schools", "worksheets, circulars and forms for whole divisions, neatly sorted."],
  ["colleges", "entire class submissions printed together and delivered to the department."],
  ["offices & factories", "records, registers and operational documents on a repeat schedule."],
];

export default function BulkPrintingPage() {
  return (
    <>
      <PageIntro
        eyebrow="bulk printing"
        title={
          <>
            big assignments? <span className="highlight">we&apos;ve got this.</span>
          </>
        }
        sub="Entire class has submissions? Exam bank due Monday? Send the details, get a quote on WhatsApp, and the whole stack lands at your door: sorted, stapled and on time."
      />

      {/* audiences */}
      <Container className="py-12">
        <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
          {audiences.map(([t, d], i) => (
            <Reveal key={t} delay={i * 0.05}>
              <div className="border-t border-ink/15 pt-5">
                <h2 className="font-grotesk text-xl font-bold tracking-tight text-ink">{t}</h2>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-slate">{d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>

      {/* how it runs */}
      <section className="border-y border-ink/10 bg-ink text-paper">
        <Container className="py-14">
          <Reveal>
            <h2 className="max-w-2xl font-grotesk text-2xl font-bold tracking-tight text-paper sm:text-3xl">
              how bulk runs work
            </h2>
          </Reveal>
          <ol className="mt-8 grid gap-8 sm:grid-cols-4">
            {[
              ["request", "send pages × copies + deadline"],
              ["quote", "rate back on whatsapp, fast"],
              ["confirm", "pay online once, production slot reserved"],
              ["delivered", "sorted, packed, doorstepped on the date"],
            ].map(([t, d], i) => (
              <Reveal key={t} delay={i * 0.06}>
                <li className="flex flex-col gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-karr font-ops text-sm font-semibold text-ink">
                    {i + 1}
                  </span>
                  <span className="font-grotesk text-lg font-bold tracking-tight text-paper">{t}</span>
                  <span className="text-sm leading-relaxed text-paper/70">{d}</span>
                </li>
              </Reveal>
            ))}
          </ol>
          <Reveal delay={0.1}>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <p className="font-ops text-xs text-paper/70">
                got something medium-sized? the place below can still be faster -{" "}
              </p>
              <OrderLink className="px-4 py-2 text-sm" />
            </div>
          </Reveal>
        </Container>
      </section>

      {/* quote form */}
      <Container className="py-16">
        <Reveal>
          <div className="max-w-2xl">
            <h2 className="font-grotesk text-3xl font-bold tracking-tight text-ink text-balance">
              request a bulk quote
            </h2>
            <p className="mt-3 text-slate">
              Tell us what needs printing and when. Friendly pricing for repeat
              schedules: the more regular, the better.
            </p>
          </div>
        </Reveal>
        <Reveal delay={0.08}>
          <div className="mt-8">
            <QuoteForm />
          </div>
        </Reveal>
      </Container>
    </>
  );
}
