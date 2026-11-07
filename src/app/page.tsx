import Link from "next/link";
import { HeroArt } from "@/components/HeroArt";
import { QuickUpload } from "@/components/QuickUpload";
import { FaqAccordion } from "@/components/FaqAccordion";
import { Reveal } from "@/components/Reveal";
import { Chip, Container, Hi, CropFrame, OrderLink, SectionHead } from "@/components/ui";
import { pricing, inr } from "@/lib/pricing";

export default function Home() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="halftone absolute top-10 right-0 hidden h-64 w-56 opacity-40 lg:block" />
        <Container className="pt-14 pb-16 sm:pt-20 sm:pb-24">
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
            <div className="flex flex-col gap-7">
              <p className="eyebrow text-slate">
                <span aria-hidden className="mr-2 inline-block h-2 w-2 rounded-full bg-karr" />
                print kar. pahunch gaya.
              </p>
              <h1 className="font-grotesk text-[2.6rem] leading-[1.02] font-bold tracking-tight text-ink text-balance sm:text-6xl lg:text-[4.35rem]">
                your printer shop is <Hi>now in your pocket</Hi>
              </h1>
              <p className="max-w-lg text-lg leading-relaxed text-slate">
                Upload your files, choose how you want them printed, and get
                everything delivered to your doorstep. No shop visits. No
                queues. No running around.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <OrderLink />
                <Link href="/how-it-works" className={OrderGHOST}>
                  how it works
                </Link>
              </div>
              <div className="mt-1 flex flex-wrap gap-2">
                <Chip>b&amp;w from ₹2/side</Chip>
                <Chip>express in 30–40 min</Chip>
                <Chip>doorstep delivery</Chip>
              </div>
            </div>
            <CropFrame className="max-w-[560px] justify-self-center lg:justify-self-end">
              <HeroArt />
            </CropFrame>
          </div>
        </Container>
      </section>

      {/* ── Quick upload ────────────────────────────────────────────── */}
      <section id="upload" className="border-y border-ink/10 bg-white/50">
        <Container className="py-16 sm:py-20">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <Reveal>
              <SectionHead
                eyebrow="01 — start here"
                title={
                  <>
                    got a <Hi>PDF?</Hi> let&apos;s get it printed.
                  </>
                }
                sub="Pick your files now — they travel with you into the order. Set everything else in under a minute."
              />
              <ul className="mt-6 flex flex-col gap-2.5 text-sm text-slate">
                <li className="flex gap-2.5">
                  <Tick /> Only pay for the pages you print — select ranges like 1–10, 12.
                </li>
                <li className="flex gap-2.5">
                  <Tick /> Guest checkout: no account needed for your first order.
                </li>
                <li className="flex gap-2.5">
                  <Tick /> Files are private and auto-deleted once your order wraps up.
                </li>
              </ul>
            </Reveal>
            <Reveal delay={0.08}>
              <QuickUpload />
            </Reveal>
          </div>
        </Container>
      </section>

      {/* ── Benefits ───────────────────────────────────────────────── */}
      <section>
        <Container className="py-16 sm:py-24">
          <Reveal>
            <SectionHead
              eyebrow="02 — why printkarr"
              title={
                <>
                  your time is <Hi>better spent</Hi> elsewhere.
                </>
              }
              sub="Why stand in line at a shop when the shop can come to you?"
            />
          </Reveal>
          <div className="mt-12 grid gap-x-10 gap-y-12 sm:grid-cols-2">
            {benefits.map((b, i) => (
              <Reveal key={b.t} delay={i * 0.06}>
                <div className="flex flex-col gap-3 border-t border-ink/15 pt-5">
                  <p className="font-ops text-xs text-slate">0{i + 1}</p>
                  <h3 className="font-grotesk text-2xl font-bold tracking-tight text-ink">
                    {b.t}
                  </h3>
                  <p className="max-w-sm leading-relaxed text-slate">{b.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* ── How it works ────────────────────────────────────────────── */}
      <section className="border-y border-ink/10 bg-ink text-paper">
        <Container className="py-16 sm:py-24">
          <Reveal>
            <SectionHead
              tone="paper"
              eyebrow="03 — how it works"
              title={<>three steps. <Hi>that&apos;s it.</Hi></>}
              sub="The whole thing takes less time than finding your keys."
            />
          </Reveal>
          <div className="mt-14 grid gap-12 md:grid-cols-3 md:gap-8">
            {[
              {
                n: "01",
                t: "upload your files",
                d: "PDF from your phone, laptop or Drive. Multi-file orders welcome.",
                art: <StepGlyph kind="upload" />,
              },
              {
                n: "02",
                t: "choose print settings",
                d: "Colour or B&W, single or double-sided, copies, page ranges — priced as you configure.",
                art: <StepGlyph kind="configure" />,
              },
              {
                n: "03",
                t: "get them delivered",
                d: "Express or scheduled Karr Run, straight to your door. Track it live.",
                art: <StepGlyph kind="deliver" />,
              },
            ].map((s, i) => (
              <Reveal key={s.n} delay={i * 0.08}>
                <div className="relative flex flex-col gap-5">
                  {i < 2 ? (
                    <span
                      aria-hidden
                      className="absolute top-7 left-[calc(50%+2.5rem)] hidden h-px w-[calc(100%-6rem)] route-h-paper opacity-40 md:block"
                    />
                  ) : null}
                  {s.art}
                  <p className="font-ops text-sm font-semibold text-karr">{s.n}</p>
                  <h3 className="font-grotesk text-2xl font-bold tracking-tight text-paper sm:text-[1.7rem]">
                    {s.t}
                  </h3>
                  <p className="max-w-sm leading-relaxed text-paper/70">{s.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* ── Services ───────────────────────────────────────────────── */}
      <section>
        <Container className="py-16 sm:py-24">
          <Reveal>
            <SectionHead
              eyebrow="04 — what we print"
              title={
                <>
                  whatever needs printing, <Hi>start here.</Hi>
                </>
              }
              sub="Everyday documents and bigger jobs — one platform, printed locally."
            />
          </Reveal>
          <div className="mt-10 flex flex-col">
            {[
              {
                t: "college notes & assignments",
                d: "That submission isn't going to print itself.",
                p: "from ₹2/side",
                href: "/order",
              },
              {
                t: "school projects & worksheets",
                d: "Last-night-before-deadline friendly.",
                p: "from ₹2/side",
                href: "/order",
              },
              {
                t: "office documents & reports",
                d: "Presentations and paperwork, printed during working hours — not your lunch break.",
                p: "from ₹2/side",
                href: "/order",
              },
              {
                t: "forms & legal prints",
                d: "Agreements, applications, CA documents — clean and on time.",
                p: "from ₹2/side",
                href: "/order",
              },
              {
                t: "bulk printing",
                d: "Entire class has submissions? We've got this.",
                p: "priority slots",
                href: "/bulk-printing",
              },
              {
                t: "business printing",
                d: "Flyers, pamphlets, cards and brochures for local businesses.",
                p: "on quote",
                href: "/business-printing",
              },
            ].map((s, i) => (
              <Reveal key={s.t} delay={Math.min(i * 0.04, 0.2)}>
                <Link
                  href={s.href}
                  className="group grid grid-cols-[auto_1fr] items-baseline gap-x-5 border-b border-ink/10 py-5 transition-colors hover:bg-white/60 sm:grid-cols-[3rem_1fr_auto_auto] sm:items-center sm:gap-6 sm:px-2"
                >
                  <span className="font-ops text-xs text-slate">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-4">
                    <span className="font-grotesk text-xl font-bold tracking-tight text-ink group-hover:underline group-hover:decoration-karr group-hover:decoration-4 group-hover:underline-offset-8">
                      {s.t}
                    </span>
                    <span className="max-w-md text-sm text-slate">{s.d}</span>
                  </span>
                  <span className="mt-2 font-ops text-xs whitespace-nowrap text-slate sm:mt-0 sm:text-sm">
                    {s.p}
                  </span>
                  <span
                    aria-hidden
                    className="mt-2 justify-self-end font-grotesk text-xl text-ink transition-transform group-hover:translate-x-1 sm:mt-0"
                  >
                    →
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* ── Express vs Karr Run ─────────────────────────────────────── */}
      <section className="border-y border-ink/10 bg-white/50">
        <Container className="py-16 sm:py-24">
          <Reveal>
            <SectionHead
              eyebrow="05 — delivery"
              title={
                <>
                  today-hurry or <Hi>today-chill?</Hi>
                </>
              }
              sub="Two ways to get your prints, priced honestly for each."
            />
          </Reveal>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <Reveal>
              <div className="card flex h-full flex-col gap-6 bg-ink p-7 text-paper sm:p-9">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="font-grotesk text-3xl font-bold tracking-tight">
                    express
                  </h3>
                  <Chip tone="karr">urgent</Chip>
                </div>
                <p className="max-w-md leading-relaxed text-paper/75">
                  You, your one order, and a rider whose only job is your
                  doorstep. For submissions and deadlines that won&apos;t wait.
                </p>
                <ul className="flex flex-col gap-2.5 text-sm text-paper/80">
                  <li className="flex gap-2.5"><Tick tone="paper" /> individual rush delivery</li>
                  <li className="flex gap-2.5"><Tick tone="paper" /> ~30–40 min inside Vapi</li>
                  <li className="flex gap-2.5"><Tick tone="paper" /> live status on /track</li>
                </ul>
                <div className="mt-auto flex items-end justify-between gap-4 border-t border-paper/15 pt-5">
                  <div>
                    <p className="font-ops text-xs text-paper/60">from</p>
                    <p className="font-ops text-3xl font-semibold text-karr">
                      {inr(pricing.zones[0].express)}
                    </p>
                  </div>
                  <OrderLink className={OrderKARR} />
                </div>
              </div>
            </Reveal>
            <Reveal delay={0.08}>
              <div className="card flex h-full flex-col gap-6 p-7 sm:p-9">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="font-grotesk text-3xl font-bold tracking-tight text-ink">
                    karr run
                  </h3>
                  <Chip>scheduled · batch</Chip>
                </div>
                <p className="max-w-md leading-relaxed text-slate">
                  Scheduled delivery rounds that bundle neighbourly orders
                  together — the easy, cheaper way to today&apos;s print.
                </p>
                <ul className="flex flex-col gap-2.5 text-sm text-slate">
                  <li className="flex gap-2.5"><Tick /> fixed delivery window</li>
                  <li className="flex gap-2.5"><Tick /> lower fee than express</li>
                  <li className="flex gap-2.5"><Tick /> great for planned orders</li>
                </ul>
                <div className="mt-auto flex items-end justify-between gap-4 border-t border-ink/10 pt-5">
                  <div>
                    <p className="font-ops text-xs text-slate">from</p>
                    <p className="font-ops text-3xl font-semibold text-ink">
                      {inr(pricing.zones[0].karrRun)}
                    </p>
                  </div>
                  <OrderLink className={OrderGHOST} />
                </div>
              </div>
            </Reveal>
          </div>
          <Reveal>
            <p className="mt-6 font-ops text-xs leading-relaxed text-slate">
              delivery fees &amp; ETAs depend on your zone and live capacity —
              both are shown before payment. fees above are for Vapi city.
            </p>
          </Reveal>
        </Container>
      </section>

      {/* ── Pricing preview ────────────────────────────────────────── */}
      <section id="pricing">
        <Container className="py-16 sm:py-24">
          <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:items-center">
            <Reveal>
              <SectionHead
                eyebrow="06 — pricing"
                title={
                  <>
                    printing shouldn&apos;t <Hi>cost a fortune.</Hi>
                  </>
                }
                sub="Transparent per-side rates. Double-sided costs less per printed side. You see the full number before you pay — always."
              />
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href="/pricing" className={OrderKARR}>
                  view pricing
                </Link>
                <p className="font-ops text-xs text-slate">
                  indicative rates · final numbers at checkout
                </p>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <CropFrame>
                <div className="card divide-y divide-ink/10 p-2 sm:p-4">
                  <PriceRow
                    label="black & white · single-sided"
                    value={`${inr(pricing.prints.A4.bw.single)}/side`}
                  />
                  <PriceRow
                    label="black & white · double-sided"
                    value={`${inr(pricing.prints.A4.bw.double)}/side`}
                  />
                  <PriceRow
                    label="colour · single-sided"
                    value={`${inr(pricing.prints.A4.colour.single)}/side`}
                    accent
                  />
                  <PriceRow
                    label="colour · double-sided"
                    value={`${inr(pricing.prints.A4.colour.double)}/side`}
                    accent
                  />
                  <PriceRow
                    label="express delivery · vapi city"
                    value={inr(pricing.zones[0].express)}
                  />
                  <PriceRow
                    label="karr run delivery · vapi city"
                    value={inr(pricing.zones[0].karrRun)}
                  />
                </div>
              </CropFrame>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* ── Service areas ──────────────────────────────────────────── */}
      <section className="border-y border-ink/10 bg-white/50">
        <Container className="py-16 sm:py-24">
          <Reveal>
            <SectionHead
              eyebrow="07 — service areas"
              title={
                <>
                  from our printer <Hi>to your doorstep.</Hi>
                </>
              }
              sub="We ride the route so you don't have to. Serviceability is confirmed at checkout — before you pay, not after."
            />
          </Reveal>
          <Reveal delay={0.08}>
            <div className="relative mt-14 overflow-hidden rounded-2xl border border-ink/10 bg-paper p-6 sm:p-10">
              <div aria-hidden className="halftone absolute inset-0 opacity-30" />
              <div className="relative flex flex-col gap-8">
                <div className="relative">
                  <span className="route-h absolute top-4 right-4 left-4 opacity-70" aria-hidden />
                  <ul className="relative flex flex-wrap items-start gap-4 sm:justify-between">
                    {["vapi", "sarigam", "bhilad", "daman"].map((t, i) => (
                      <li key={t} className="flex flex-col items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-ink bg-karr font-ops text-xs font-semibold">
                          {i + 1}
                        </span>
                        <span className="font-ops text-xs font-medium text-ink">{t}</span>
                      </li>
                    ))}
                    <li className="flex flex-col items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-paper">
                        <svg width="11" height="13" viewBox="0 0 12 14" fill="none" aria-hidden>
                          <path d="M6 1C3.2 1 1 3.2 1 6c0 3.5 5 7 5 7s5-3.5 5-7c0-2.8-2.2-5-5-5Zm0 6.5A1.5 1.5 0 1 1 6 4a1.5 1.5 0 0 1 0 3.5Z" stroke="currentColor" strokeWidth="1.4" />
                        </svg>
                      </span>
                      <span className="font-ops text-xs font-medium text-ink">your doorstep</span>
                    </li>
                  </ul>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Chip>zone 1 · vapi city</Chip>
                  <Chip>zone 2 · sarigam / bhilad / daman</Chip>
                  <Chip tone="karr">first orders inside vapi: delivery on us</Chip>
                </div>
              </div>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────── */}
      <section>
        <Container className="py-16 sm:py-24">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <Reveal>
              <SectionHead
                eyebrow="08 — questions"
                title={
                  <>
                    good <Hi>questions,</Hi> quick answers.
                  </>
                }
              />
              <Link href="/faq" className="mt-6 inline-flex font-grotesk font-semibold text-ink underline decoration-karr decoration-4 underline-offset-8 hover:decoration-magenta">
                all questions →
              </Link>
            </Reveal>
            <Reveal delay={0.08}>
              <FaqAccordion limit={6} />
            </Reveal>
          </div>
        </Container>
      </section>

      {/* ── Final CTA ───────────────────────────────────────────────── */}
      <section className="border-t border-ink/10 bg-ink text-paper">
        <Container className="py-20 text-center sm:py-28">
          <Reveal>
            <p className="eyebrow mx-auto text-karr">
              <span aria-hidden className="mr-2 inline-block h-2 w-2 rounded-full bg-magenta" />
              print kar. pahunch gaya.
            </p>
            <h2 className="mx-auto mt-6 max-w-3xl font-grotesk text-4xl leading-[1.05] font-bold tracking-tight text-paper text-balance sm:text-6xl">
              next time you need prints, <Hi>stay right where you are.</Hi>
            </h2>
            <p className="mx-auto mt-6 max-w-md text-lg text-paper/70">
              Send us your documents. We&apos;ll take care of the printing.
            </p>
            <div className="mt-9 flex justify-center">
              <OrderLink />
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  );
}

const OrderKARR = "btn btn-karr";
const OrderGHOST = "btn btn-ghost";

const benefits = [
  {
    t: "skip the shop visit",
    d: "No travelling just to print a few pages. The queue stays where it belongs — nowhere near you.",
  },
  {
    t: "order from anywhere",
    d: "Your phone is all you need. From the last bench of the classroom or last desk of the office.",
  },
  {
    t: "know what you're paying",
    d: "Transparent printing and delivery prices — configured, counted and shown before you pay.",
  },
  {
    t: "get it at your doorstep",
    d: "Spend your time on things that actually matter. We'll handle the printing and the running.",
  },
];

function PriceRow({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 px-3 py-4 sm:px-4">
      <span className="text-sm text-slate">{label}</span>
      <span
        className={`font-ops text-base font-semibold whitespace-nowrap sm:text-lg ${
          accent ? "text-magenta" : "text-ink"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function Tick({ tone = "ink" }: { tone?: "ink" | "paper" }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      className={`mt-0.5 shrink-0 ${tone === "paper" ? "text-karr" : "text-cobalt"}`}
    >
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.6" />
      <path d="M5 8.2l2 2 4-4.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StepGlyph({ kind }: { kind: "upload" | "configure" | "deliver" }) {
  if (kind === "upload") {
    return (
      <svg width="72" height="56" viewBox="0 0 72 56" fill="none" aria-hidden>
        <rect x="8" y="14" width="34" height="40" rx="4" fill="#F8F6F0" stroke="#F8F6F0" strokeOpacity="0.35" strokeWidth="2" transform="rotate(-7 25 34)" />
        <rect x="22" y="6" width="34" height="44" rx="4" fill="#F8F6F0" />
        <path d="M30 20h18M30 28h13M30 36h16" stroke="#0E1A2B" strokeWidth="2.4" strokeLinecap="round" strokeOpacity="0.7" />
        <circle cx="56" cy="12" r="9" fill="#FFC700" />
        <path d="M56 8.5v7M52.5 12h7" stroke="#0E1A2B" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  if (kind === "configure") {
    return (
      <svg width="72" height="56" viewBox="0 0 72 56" fill="none" aria-hidden>
        <rect x="6" y="6" width="46" height="44" rx="8" fill="#F8F6F0" stroke="#F8F6F0" strokeOpacity="0.35" strokeWidth="2" />
        <path d="M14 18h30M14 28h30M14 38h30" stroke="#0E1A2B" strokeOpacity="0.25" strokeWidth="2" strokeLinecap="round" />
        <circle cx="40" cy="18" r="6" fill="#FFC700" stroke="#0E1A2B" strokeWidth="2" />
        <circle cx="24" cy="28" r="6" fill="#2D5BFF" stroke="#0E1A2B" strokeWidth="2" />
        <circle cx="46" cy="38" r="6" fill="#FFC700" stroke="#0E1A2B" strokeWidth="2" />
        <circle cx="58" cy="44" r="7" fill="#E6007E" />
      </svg>
    );
  }
  return (
    <svg width="72" height="56" viewBox="0 0 72 56" fill="none" aria-hidden>
      <path d="M20 8c6-6 22-6 26 0" stroke="#F8F6F0" strokeWidth="4" strokeLinecap="round" />
      <rect x="12" y="6" width="42" height="30" rx="8" fill="#FFC700" />
      <rect x="18" y="1" width="30" height="16" rx="4" fill="#F8F6F0" stroke="#F8F6F0" strokeOpacity="0.35" strokeWidth="2" />
      <path d="M24 10h18M24 17h12" stroke="#0E1A2B" strokeOpacity="0.6" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 54c14-6 30-6 44 0" stroke="#F8F6F0" strokeOpacity="0.6" strokeWidth="2" strokeLinecap="round" strokeDasharray="2 6" />
      <path d="M58 34c-5 0-9 4-9 9 0 7 9 12 9 12s9-5 9-12c0-5-4-9-9-9Z" fill="#2D5BFF" />
      <circle cx="58" cy="43" r="3.5" fill="#F8F6F0" />
    </svg>
  );
}
