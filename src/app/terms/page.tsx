import type { Metadata } from "next";
import { PageIntro, Prose } from "@/components/ui";

export const metadata: Metadata = {
  title: "terms & conditions",
  description:
    "Terms of service for using printkarr: ordering, payments, delivery, cancellations and acceptable use.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <>
      <PageIntro
        eyebrow="legal"
        title="terms & conditions"
        sub="The plain-language version applies: you tell us what to print, we print it right and deliver it on time."
      />
      <Prose>
        <h2>The service</h2>
        <p>
          printkarr prints and delivers personal and business documents you
          upload, within our service zones in and around Vapi. Acceptance of an
          order depends on delivery availability and operational capacity; both
          are confirmed before you pay.
        </p>
        <h2>Orders and prices</h2>
        <p>
          Prices are calculated from your options (pages, colour, sides,
          copies, add-ons) plus the delivery fee and applicable taxes. The
          amount shown at checkout is final for that order; confirmed orders
          are not repriced afterwards.
        </p>
        <h2>Payments</h2>
        <p>
          Orders are pre-paid through the payment gateway shown at checkout.
          Payments are verified server-side. If a payment fails or is
          duplicated, the affected amount is refunded by the gateway&apos;s
          normal process.
        </p>
        <h2>Cancellations</h2>
        <p>
          You can cancel until printing starts: the order page shows whether
          it&apos;s still cancellable. After printing begins, the order is
          final print as run; quality issues are covered by the refund policy.
        </p>
        <h2>Delivery windows</h2>
        <p>
          Delivery times shown (such as &quot;30–40 minutes&quot;) are estimates
          for the selected zone and mode, not guarantees. Every delay we know
          about is communicated through tracking and notifications.
        </p>
        <h2>Quality</h2>
        <p>
          Orders are checked before packing. If a delivered order is wrong
          (wrong file, wrong settings, missing pages), we print and redeliver
          it or refund, per the refund policy. Report issues within 24 hours of
          delivery.
        </p>
        <h2>Acceptable use</h2>
        <p>
          You confirm you have the right to print everything you upload and
          that files are lawful to duplicate. We may decline orders with
          infringing, unlawful or unsafe content. Copyrighted school materials
          printed for personal study use are the customer&apos;s
          responsibility.
        </p>
        <h2>Your account</h2>
        <p>
          Guest checkout is allowed now; account features (order history,
          saved addresses) roll out with the ordering platform. You are
          responsible for the accuracy of the mobile number and address
          provided.
        </p>
      </Prose>
    </>
  );
}
