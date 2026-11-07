import Link from "next/link";

/** "printkarr" wordmark — lowercase grotesk, yellow block under "karr". */
export function Wordmark({
  small = false,
  link = true,
}: {
  small?: boolean;
  link?: boolean;
}) {
  const text = (
    <span
      className={`relative z-0 inline-block select-none font-grotesk font-bold tracking-tight text-ink ${
        small ? "text-[1.35rem]" : "text-2xl"
      }`}
    >
      print
      <span className="relative">
        karr
        <span
          aria-hidden
          className="absolute inset-x-[-2px] bottom-[0.08em] z-[-1] h-[0.42em] rounded-[3px] bg-karr"
        />
      </span>
    </span>
  );
  if (link) {
    return (
      <Link href="/" aria-label="printkarr — home" className="shrink-0">
        {text}
      </Link>
    );
  }
  return text;
}
