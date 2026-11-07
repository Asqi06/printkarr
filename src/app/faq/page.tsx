import type { Metadata } from "next";
import { Container, PageIntro, OrderLink } from "@/components/ui";
import { Reveal } from "@/components/Reveal";
import { FaqAccordion } from "@/components/FaqAccordion";
import { faqs } from "@/lib/faqs";

export const metadata: Metadata = {
  title: "faq",
  description:
    "Answers to common questions: files, page selection, double-sided printing, delivery times, privacy, bulk orders and tracking.",
  alternates: { canonical: "/faq" },
};

const ld = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function FaqPage() {
  return (
    <>
      <PageIntro
        eyebrow="faq"
        title={
          <>
            everything you&apos;d <span className="highlight">ask at the counter</span>
          </>
        }
        sub="Short, honest answers. If your question isn't here, message us."
      />
      <Container className="pb-20">
        <Reveal>
          <div className="max-w-3xl">
            <FaqAccordion />
          </div>
        </Reveal>
        <Reveal delay={0.06}>
          <div className="mt-12 flex flex-wrap items-center gap-4">
            <OrderLink />
            <p className="font-ops text-xs text-slate">
              still unsure? <a href="/contact" className="text-cobalt underline underline-offset-4">contact us</a>
            </p>
          </div>
        </Reveal>
      </Container>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
      />
    </>
  );
}
