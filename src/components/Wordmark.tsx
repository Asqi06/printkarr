import Link from "next/link";

export function Wordmark({
  small = false,
  link = true,
  theme = "light",
}: {
  small?: boolean;
  link?: boolean;
  theme?: "light" | "dark";
}) {
  const content = (
    <div className="flex items-center gap-1.5 shrink-0">
      <img
        src="/logo-white.png"
        alt="Printkarr.in: Online Xerox and Printing"
        className={`object-contain transition ${
          small ? "h-6 sm:h-7 w-auto" : "h-7 sm:h-8 w-auto"
        } ${theme === "light" ? "brightness-0" : ""}`}
      />
    </div>
  );

  if (link) {
    return (
      <Link
        href="/"
        aria-label="Printkarr.in Home: Online Xerox Shop"
        className="shrink-0 flex items-center"
      >
        {content}
      </Link>
    );
  }
  return content;
}
