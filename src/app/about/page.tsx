import type { Metadata } from "next";
import { Container, CropFrame, PageIntro, OrderLink } from "@/components/ui";
import { Reveal } from "@/components/Reveal";
import { RouteArt } from "@/components/doodles";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "about",
  description:
    "printkarr is a hyperlocal printing and doorstep delivery platform for Vapi and nearby areas. Why go to a printing shop when the printing shop can come to you?",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      <PageIntro
        eyebrow="about printkarr"
        title={
          <>
            a little less running around, a little more{" "}
            <span className="highlight">getting things done.</span>
          </>
        }
        sub="Why go to a printing shop when the printing shop can come to you?"
      />

      <Container className="py-12">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <Reveal>
            <div className="prose flex max-w-xl flex-col gap-5 text-lg leading-relaxed text-slate">
              <p>
                The last page before a submission. A form that&apos;s due
                tomorrow. A 200-page record for the office. Around here, that
                usually means one thing: find the print shop, park badly, wait
                in line, explain instructions to the counter — then do it all
                again in reverse to collect.
              </p>
              <p className="text-ink">
                printkarr turns that errand into a three-tap order.
              </p>
              <p>
                We&apos;re built in {site.areas.join(", ")}, for the people
                here — students who shouldn&apos;t lose an evening to a queue,
                offices that need paperwork today, and shops that would rather
                not close during a print run.
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.08}>
            <CropFrame>
              <RouteArt />
            </CropFrame>
          </Reveal>
        </div>
      </Container>

      <section className="border-y border-ink/10 bg-ink text-paper">
        <Container className="py-16">
          <Reveal>
            <h2 className="max-w-2xl font-grotesk text-3xl font-bold tracking-tight text-paper sm:text-4xl">
              what we optimise for
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["your time", "the errand disappears into a tap"],
              ["clear prices", "you always know before you pay"],
              ["reliable timing", "promised windows we actually keep"],
              ["document privacy", "private until delivered, deleted soon after"],
            ].map(([t, d], i) => (
              <Reveal key={t} delay={i * 0.05}>
                <div className="border-t border-paper/20 pt-4">
                  <p className="font-ops text-xs text-karr">{`0${i + 1}`}</p>
                  <p className="mt-2 font-grotesk text-xl font-bold tracking-tight text-paper">{t}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-paper/70">{d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <Container className="py-16">
        <Reveal>
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="max-w-xl font-grotesk text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              first order? it&apos;ll be the easiest print you&apos;ve ever done.
            </h2>
            <OrderLink />
          </div>
        </Reveal>
      </Container>
    </>
  );
}
