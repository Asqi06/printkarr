import type { Metadata } from "next";
import { Container, Chip, PageIntro } from "@/components/ui";
import { Reveal } from "@/components/Reveal";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "contact",
  description:
    "Questions about an order, bulk printing or delivery areas in Vapi? Reach the printkarr team by WhatsApp, phone or email.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  const hasWhatsApp = Boolean(site.whatsapp);
  const hasPhone = Boolean(site.phone);
  const hasEmail = Boolean(site.email);

  return (
    <>
      <PageIntro
        eyebrow="contact"
        title={
          <>
            talk to a <span className="highlight">human.</span>
          </>
        }
        sub="Order question, bulk quote, delivery area check or just figuring out how this works — we're around."
      />

      <Container className="py-12">
        <div className="grid gap-10 lg:grid-cols-2">
          <Reveal>
            <div className="flex flex-col gap-6">
              <Row
                label="whatsapp"
                value={hasWhatsApp ? "message us — fastest option" : "number being confirmed for launch"}
                live={hasWhatsApp}
              />
              <Row
                label="phone"
                value={hasPhone ? site.phone : "being confirmed for launch"}
                live={hasPhone}
              />
              <Row
                label="email"
                value={hasEmail ? site.email : "being confirmed for launch"}
                live={hasEmail}
              />
              <div className="card p-6">
                <p className="eyebrow text-slate">hours</p>
                <p className="mt-2 font-ops text-sm text-ink">{site.hours}</p>
                <p className="mt-4 eyebrow text-slate">delivery areas</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {site.areas.map((a) => (
                    <Chip key={a}>{a}</Chip>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="card flex h-full flex-col gap-4 bg-ink p-7 text-paper sm:p-9">
              <p className="eyebrow text-karr">before you ask</p>
              <ul className="flex flex-col gap-4 text-sm leading-relaxed text-paper/85">
                <li>
                  <strong className="text-paper">Order tracking?</strong> Use{" "}
                  <a href="/track" className="text-karr underline underline-offset-4">track order</a>{" "}
                  with your order ID.
                </li>
                <li>
                  <strong className="text-paper">Print pricing?</strong> It&apos;s all on{" "}
                  <a href="/pricing" className="text-karr underline underline-offset-4">the pricing page</a>{" "}
                  — live at checkout too.
                </li>
                <li>
                  <strong className="text-paper">Bulk or business?</strong> The{" "}
                  <a href="/bulk-printing" className="text-karr underline underline-offset-4">bulk quote form</a>{" "}
                  gets a faster answer than any inbox.
                </li>
                <li>
                  <strong className="text-paper">Documents private?</strong> Yes — files stay private and are
                  auto-deleted after your order wraps up.
                </li>
              </ul>
            </div>
          </Reveal>
        </div>
      </Container>
    </>
  );
}

function Row({
  label,
  value,
  live = false,
}: {
  label: string;
  value: string;
  live?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-ink/10 py-4">
      <span className="eyebrow text-slate">{label}</span>
      <span className={`text-sm ${live ? "font-semibold text-ink" : "text-slate"}`}>
        {value}
      </span>
    </div>
  );
}
