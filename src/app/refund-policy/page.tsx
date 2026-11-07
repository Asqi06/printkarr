import type { Metadata } from "next";
import { PageIntro, Prose } from "@/components/ui";

export const metadata: Metadata = {
  title: "refund policy",
  description:
    "When printkarr refunds: failed payments, cancellable orders, print errors and missed deliveries.",
  alternates: { canonical: "/refund-policy" },
};

export default function RefundPolicyPage() {
  return (
    <>
      <PageIntro
        eyebrow="legal"
        title="refunds, without drama"
        sub="Printed wrong? Couldn't deliver? Here's exactly what happens."
      />
      <Prose>
        <h2>Failed payments</h2>
        <p>
          If payment fails, the order isn&apos;t created and you can retry. If
          money was debited but the order didn&apos;t confirm, the payment
          gateway auto-reverses authorisations; anything stuck longer gets
          manually refunded within 5–7 working days.
        </p>
        <h2>Cancellations</h2>
        <p>
          Orders cancelled before printing starts are refunded in full to the
          original payment method within 5–7 working days. Once printing has
          physically begun, the order can&apos;t be cancelled: that&apos;s
          paper already rolling.
        </p>
        <h2>Wrong or poor prints</h2>
        <p>
          If the delivered order doesn&apos;t match your configuration (wrong
          file, wrong settings applied, bad print quality, missing pages), we
          redo the order or refund the printing cost in full: including any
          related delivery fee. Report it from the order page or WhatsApp
          within 24 hours of delivery, with a photo where relevant.
        </p>
        <h2>Failed or late delivery</h2>
        <p>
          If we can&apos;t deliver, or delivery fails on our side, you get the
          full refund (printing + delivery). For delays, delivery fees are
          refunded when the delay is in our hands and material.
        </p>
        <h2>Coupons and discounts</h2>
        <p>
          Refunds are calculated on the amount actually paid. Coupon codes are
          single-use; a refunded order&apos;s coupon validity depends on the
          coupon&apos;s remaining limits.
        </p>
        <h2>How refunds arrive</h2>
        <p>
          All refunds go back to the original payment method: same account,
          same card or UPI: handled through the payment gateway. No cash,
          adjustments or credit-notes-as-favours.
        </p>
      </Prose>
    </>
  );
}
