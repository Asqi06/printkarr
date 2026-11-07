import type { Metadata } from "next";
import Link from "next/link";
import { Container, CropFrame, PageIntro, OrderLink } from "@/components/ui";
import { Reveal } from "@/components/Reveal";
import { FaqAccordion } from "@/components/FaqAccordion";
import { inr, pricing } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "pricing",
  description:
    "Clear per-side printing rates, double-sided discounts and delivery fees for Vapi, Sarigam, Bhilad and Daman. Transparent before you pay — every time.",
  alternates: { canonical: "/pricing" },
};

export default function PricingPage() {
  const a4 = pricing.prints.A4;
  return (
    <>
      <PageIntro
        eyebrow="pricing"
        title={
          <>
            printing shouldn&apos;t <span className="highlight">cost a fortune.</span>
          </>
        }
        sub="Per-side printing rates and honest delivery fees. You see the full number before you pay — configured by you, priced instantly."
      />

      {/* Print rates */}
      <Container className="py-12">
        <Reveal>
          <CropFrame className="max-w-3xl">
            <div className="card overflow-hidden">
              <div className="border-b border-ink/10 bg-paper/60 px-6 py-4">
                <p className="eyebrow text-slate">print rates · A4</p>
              </div>
              <table className="w-full text-sm sm:text-base">
                <thead>
                  <tr className="text-left font-ops text-xs text-slate">
                    <th className="px-6 py-3 font-medium">mode</th>
                    <th className="px-6 py-3 text-right font-medium">single-sided</th>
                    <th className="px-6 py-3 text-right font-medium">double-sided</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-ink/[0.07]">
                    <td className="px-6 py-4 font-medium text-ink">black &amp; white</td>
                    <td className="px-6 py-4 text-right font-ops font-semibold text-ink">
                      {inr(a4.bw.single)}/side
                    </td>
                    <td className="px-6 py-4 text-right font-ops font-semibold text-ink">
                      {inr(a4.bw.double)}/side
                    </td>
                  </tr>
                  <tr className="border-t border-ink/[0.07]">
                    <td className="px-6 py-4 font-medium text-ink">colour</td>
                    <td className="px-6 py-4 text-right font-ops font-semibold text-magenta">
                      {inr(a4.colour.single)}/side
                    </td>
                    <td className="px-6 py-4 text-right font-ops font-semibold text-magenta">
                      {inr(a4.colour.double)}/side
                    </td>
                  </tr>
                </tbody>
              </table>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink/10 bg-white px-6 py-4">
                <p className="font-ops text-xs text-slate">
                  add-ons: stapling {inr(pricing.addOns.stapling)}/copy · hole punch{" "}
                  {inr(pricing.addOns.holePunch)}/copy · A3 &amp; special paper: on request
                </p>
                <OrderLink className="px-4 py-2 text-sm" />
              </div>
            </div>
          </CropFrame>
        </Reveal>

        {/* Worked example */}
        <Reveal delay={0.06}>
          <div className="mt-10 grid max-w-4xl gap-6 sm:grid-cols-2">
            <div className="card p-6">
              <p className="eyebrow text-slate">example</p>
              <p className="mt-3 font-grotesk text-lg font-bold text-ink">
                50 pages, single-sided, 2 copies, B&amp;W
              </p>
              <p className="mt-2 font-ops text-3xl font-semibold text-ink">
                {inr(50 * 2 * a4.bw.single)}
              </p>
              <p className="mt-2 text-sm text-slate">
                50 printable sides × 2 copies × {inr(a4.bw.single)} a side.
              </p>
            </div>
            <div className="card p-6">
              <p className="eyebrow text-slate">example</p>
              <p className="mt-3 font-grotesk text-lg font-bold text-ink">
                50 pages, double-sided, 2 copies, B&amp;W
              </p>
              <p className="mt-2 font-ops text-3xl font-semibold text-ink">
                {inr(50 * 2 * a4.bw.double)}
              </p>
              <p className="mt-2 text-sm text-slate">
                Same content, printed on 50 sheets instead of 100 — charged{" "}
                {inr(a4.bw.double)} per printed side.
              </p>
            </div>
          </div>
        </Reveal>
      </Container>

      {/* Delivery */}
      <section className="border-y border-ink/10 bg-white/50">
        <Container className="py-14">
          <Reveal>
            <h2 className="font-grotesk text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              delivery fees
            </h2>
          </Reveal>
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {pricing.zones.map((z) => (
              <Reveal key={z.id}>
                <div className="card flex h-full flex-col p-6">
                  <p className="font-grotesk text-lg font-bold text-ink">{z.name}</p>
                  <p className="mt-1 font-ops text-xs text-slate">{z.areas.join(" · ")}</p>
                  <div className="mt-5 flex flex-col gap-3">
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="text-sm text-slate">express</span>
                      <span className="font-ops font-semibold text-ink">
                        {inr(z.express)} · {z.expressEta}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="text-sm text-slate">karr run</span>
                      <span className="font-ops font-semibold text-ink">
                        {inr(z.karrRun)} · {z.karrRunEta}
                      </span>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal>
            <div className="mt-8 flex flex-wrap gap-2">
              <span className="rounded-full bg-karr px-3 py-1.5 font-ops text-xs font-medium text-ink">
                first orders inside vapi: delivery on us
              </span>
              <span className="rounded-full border border-ink/15 px-3 py-1.5 font-ops text-xs text-slate">
                code FIRST35 · activated at launch
              </span>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* Fine print + FAQ */}
      <Container className="py-14">
        <Reveal>
          <div className="max-w-2xl">
            <h2 className="font-grotesk text-2xl font-bold tracking-tight text-ink">
              the honest fine print
            </h2>
            <ul className="mt-4 flex flex-col gap-2 text-sm leading-relaxed text-slate">
              <li>· Rates above are indicative and configurable — the checkout always shows the exact number.</li>
              <li>· You pay only for pages actually printed, counted per printed side.</li>
              <li>· Delivery fees depend on your zone and delivery mode; both are picked by you before payment.</li>
              <li>· Bulk quantities (common for classes and offices) get better rates on quote — see <Link className="text-cobalt underline underline-offset-4" href="/bulk-printing">bulk printing</Link>.</li>
              <li>· Taxes are added as per prevailing rules once GST details are final.</li>
            </ul>
          </div>
        </Reveal>
        <Reveal delay={0.06}>
          <div className="mt-14 max-w-3xl">
            <h2 className="font-grotesk text-2xl font-bold tracking-tight text-ink">
              pricing questions
            </h2>
            <FaqAccordion className="mt-6" limit={undefined} />
          </div>
        </Reveal>
      </Container>
    </>
  );
}
