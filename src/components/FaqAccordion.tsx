import { faqs } from "@/lib/faqs";

/** Minimal accessible accordion — native <details>, zero JS. */
export function FaqAccordion({
  limit,
  className = "",
}: {
  limit?: number;
  className?: string;
}) {
  const items = limit ? faqs.slice(0, limit) : faqs;
  return (
    <div className={`faq flex flex-col ${className}`}>
      {items.map((f, i) => (
        <details
          key={i}
          className="group border-b border-ink/10 last:border-b-0"
        >
          <summary className="flex items-center justify-between gap-6 px-0 py-5 sm:py-6">
            <span className="font-grotesk text-lg font-semibold tracking-tight text-ink sm:text-xl">
              {f.q}
            </span>
            <span
              aria-hidden
              className="faq-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ink/15 text-lg font-medium text-ink group-hover:border-ink/40"
            >
              +
            </span>
          </summary>
          <p className="max-w-3xl pb-6 text-base leading-relaxed text-slate">
            {f.a}
          </p>
        </details>
      ))}
    </div>
  );
}
