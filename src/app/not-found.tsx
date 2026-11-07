import Link from "next/link";
import { Container, OrderLink } from "@/components/ui";

export default function NotFound() {
  return (
    <Container className="flex flex-col items-center gap-6 py-32 text-center">
      <p className="eyebrow text-slate">404 — page not found</p>
      <h1 className="font-grotesk text-4xl font-bold tracking-tight text-ink sm:text-6xl">
        this page <span className="highlight">didn&apos;t print.</span>
      </h1>
      <p className="max-w-md text-slate">
        The URL you followed doesn&apos;t exist. The ordering, pricing and
        tracking pages are all in working order, though.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <OrderLink />
        <Link href="/" className="btn btn-ghost">
          home →
        </Link>
      </div>
    </Container>
  );
}
