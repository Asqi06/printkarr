import type { Metadata } from "next";
import { PageIntro, Prose } from "@/components/ui";

export const metadata: Metadata = {
  title: "privacy policy",
  description:
    "How printkarr handles your documents: private storage, no public links, signed access only, automatic file deletion.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <>
      <PageIntro
        eyebrow="legal"
        title="your documents are private. written down, not promised."
        sub="Printing orders contain some of your most sensitive paperwork. Here is exactly how we treat it."
      />
      <Prose>
        <h2>What you upload</h2>
        <p>
          Files you upload are stored privately on printkarr&apos;s servers.
          They are never publicly linkable. Every download of your file happens
          through short-lived, signed links issued only to authorised printkarr
          staff working on your order or to you, the account owner.
        </p>
        <h2>Who can see your files</h2>
        <p>
          Only the printkarr team members assigned to print, pack and deliver
          your order. Access is role-based and logged. We do not sell, share or
          “analyse” your documents for any other purpose.
        </p>
        <h2>How long files stay</h2>
        <p>
          Your files remain accessible to authorised staff while your order is
          active, and are automatically deleted within 24 hours of an order
          being delivered, cancelled or refunded as part of our retention
          policy. Financial records (order and payment information) are
          retained separately as legally required, but they contain no copies
          of your documents.
        </p>
        <h2>Payments</h2>
        <p>
          Payments run through a payment gateway (Razorpay or an equivalent).
          Your card, UPI or bank credentials are processed by the gateway and
          never reach printkarr servers. We store only the payment status and
          the reference needed for refunds and receipts.
        </p>
        <h2>Data we keep as an account holder</h2>
        <ul>
          <li>Name and mobile number (for delivery and OTP verification).</li>
          <li>Delivery addresses you choose to save.</li>
          <li>Order history and receipts.</li>
        </ul>
        <h2>Your requests</h2>
        <p>
          Want your account data or an address removed? Message us and we&apos;ll
          do it, subject to legally required retention of payment records.
        </p>
        <h2>Changes</h2>
        <p>
          If these practices change materially, this page will be updated
          before the change goes live. This preview version reflects the
          website as built today; the ordering platform launches under these
          same rules.
        </p>
        <p>
          Contact for privacy questions: see the{" "}
          <a href="/contact">contact page</a>.
        </p>
      </Prose>
    </>
  );
}
