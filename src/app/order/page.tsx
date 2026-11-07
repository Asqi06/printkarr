import type { Metadata } from "next";
import { OrderFlow } from "@/components/OrderFlow";
import { Container, PageIntro } from "@/components/ui";

export const metadata: Metadata = {
  title: "order prints",
  description:
    "Upload your PDF or images, set print settings, pick express or Karr Run delivery and get prints delivered at your doorstep in Vapi.",
  alternates: { canonical: "/order" },
};

export default function OrderPage() {
  return (
    <>
      <PageIntro
        eyebrow="order printing"
        title={
          <>
            start your print <span className="highlight">order</span>
          </>
        }
        sub="Files you picked flow in automatically. Configure, check the price, place it — done."
      />
      <Container className="pb-20">
        <OrderFlow />
      </Container>
    </>
  );
}
