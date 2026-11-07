import type { Metadata } from "next";
import { Suspense } from "react";
import { Container, PageIntro } from "@/components/ui";
import { TrackClient } from "@/components/TrackClient";

export const metadata: Metadata = {
  title: "track order",
  description:
    "Track your printkarr order live: received → confirmed → printing → packed → on the way → delivered.",
  alternates: { canonical: "/track" },
};

export default function TrackPage() {
  return (
    <>
      <PageIntro
        eyebrow="order tracking"
        title={
          <>
            where are my <span className="highlight">prints?</span>
          </>
        }
        sub="Enter your order ID. Every step is timestamped and shown as it happens."
      />
      <Container className="pb-20">
        <Suspense fallback={<div className="card p-8 text-sm text-slate">loading…</div>}>
          <TrackClient />
        </Suspense>
      </Container>
    </>
  );
}
