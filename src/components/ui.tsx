import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

/* ── Yellow highlighter swipe ──────────────────────────────────────────── */
export function Hi({ children }: { children: ReactNode }) {
  return <span className="highlight">{children}</span>;
}

/* ── Editorial section eyebrow, e.g. "02 — HOW IT WORKS" ───────────────── */
export function Eyebrow({
  children,
  tone = "ink",
}: {
  children: ReactNode;
  tone?: "ink" | "paper";
}) {
  return (
    <p
      className={`eyebrow ${
        tone === "paper" ? "text-karr" : "text-slate"
      }`}
    >
      {children}
    </p>
  );
}

/* ── Section heading block ─────────────────────────────────────────────── */
export function SectionHead({
  eyebrow,
  title,
  sub,
  tone = "ink",
  className = "",
}: {
  eyebrow?: string;
  title: ReactNode;
  sub?: ReactNode;
  tone?: "ink" | "paper";
  className?: string;
}) {
  return (
    <div className={`flex max-w-2xl flex-col gap-4 ${className}`}>
      {eyebrow ? (
        <Eyebrow tone={tone}>{eyebrow}</Eyebrow>
      ) : null}
      <h2
        className={`font-grotesk text-3xl leading-[1.08] font-bold tracking-tight text-balance sm:text-[2.75rem] ${
          tone === "paper" ? "text-paper" : "text-ink"
        }`}
      >
        {title}
      </h2>
      {sub ? (
        <p
          className={`text-base leading-relaxed sm:text-lg ${
            tone === "paper" ? "text-paper/70" : "text-slate"
          }`}
        >
          {sub}
        </p>
      ) : null}
    </div>
  );
}

/* ── Container ─────────────────────────────────────────────────────────── */
export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-6xl px-5 sm:px-8 ${className}`}>
      {children}
    </div>
  );
}

/* ── Crop marks — printing registration corners, used sparingly ────────── */
export function CropFrame({
  children,
  tone = "ink",
  className = "",
}: {
  children: ReactNode;
  tone?: "ink" | "paper";
  className?: string;
}) {
  const bg = tone === "paper" ? "rgba(248,246,240,0.5)" : "rgba(14,26,43,0.35)";
  type Corner = { h: CSSProperties; v: CSSProperties };
  const corners: Corner[] = [
    // top-left, top-right, bottom-left, bottom-right
    { h: { top: 0, left: 0 }, v: { top: 0, left: 0 } },
    { h: { top: 0, right: 0 }, v: { top: 0, right: 0 } },
    { h: { bottom: 0, left: 0 }, v: { bottom: 0, left: 0 } },
    { h: { bottom: 0, right: 0 }, v: { bottom: 0, right: 0 } },
  ];
  return (
    <span className={`relative block ${className}`}>
      {children}
      {corners.map((c, i) => (
        <span key={i} aria-hidden className="pointer-events-none absolute inset-0">
          <span style={{ ...c.h, background: bg, height: 2, width: 14, position: "absolute" }} />
          <span style={{ ...c.v, background: bg, height: 14, width: 2, position: "absolute" }} />
        </span>
      ))}
    </span>
  );
}

/* ── Small operational chip (JetBrains Mono) ───────────────────────────── */
export function Chip({
  children,
  tone = "paper",
}: {
  children: ReactNode;
  tone?: "paper" | "ink" | "karr";
}) {
  const tones = {
    paper: "border-ink/15 bg-white text-slate",
    ink: "border-paper/20 bg-ink text-paper",
    karr: "border-transparent bg-karr text-ink",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-ops text-xs font-medium whitespace-nowrap ${
        tone === "paper" ? "text-ink" : ""
      } ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

/* ── CTA links ─────────────────────────────────────────────────────────── */
export const CTAs = {
  karr: "btn btn-karr",
  ink: "btn btn-ink",
  ghost: "btn btn-ghost",
  ghostPaper: "btn btn-ghost-paper",
};

/* ── Inner-page intro ──────────────────────────────────────────────────── */
export function PageIntro({
  eyebrow,
  title,
  sub,
}: {
  eyebrow: string;
  title: ReactNode;
  sub?: ReactNode;
}) {
  return (
    <Container className="pt-14 pb-4 sm:pt-20">
      <p className="eyebrow text-slate">{eyebrow}</p>
      <h1 className="mt-4 max-w-3xl font-grotesk text-4xl leading-[1.05] font-bold tracking-tight text-ink text-balance sm:text-6xl">
        {title}
      </h1>
      {sub ? (
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate">{sub}</p>
      ) : null}
    </Container>
  );
}

export function Prose({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <Container
      className={`pb-16 [&_h2]:mt-10 [&_h2]:font-grotesk [&_h2]:text-xl [&_h2]:font-bold [&_p]:mt-3 [&_p]:leading-relaxed [&_p]:text-slate [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:text-slate [&_li]:mt-2 [&_a]:text-cobalt [&_a]:underline [&_a]:underline-offset-4 ${className}`}
    >
      {children}
    </Container>
  );
}

export function OrderLink({
  className = CTAs.karr,
  children = "print kar →",
}: {
  className?: string;
  children?: ReactNode;
}) {
  return (
    <Link href="/order" className={className}>
      {children}
    </Link>
  );
}
