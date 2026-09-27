import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { toast, Toaster } from "sonner";
import {
  ArrowUpRight,
  ArrowRight,
  Building2,
  Check,
  Clock3,
  Cloud,
  Globe2,
  House,
  Lock,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  Phone,
  Printer,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Timer,
  Upload,
  Users,
  X,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { NumberTicker } from "@/registry/magicui/number-ticker";
import { SparklesText } from "@/registry/magicui/sparkles-text";
import { AnimatedBeam } from "@/registry/magicui/animated-beam";
import { Confetti, type ConfettiRef } from "@/registry/magicui/confetti";
import { Meteors } from "@/registry/magicui/meteors";
import { Dock, DockIcon } from "@/registry/magicui/dock";
import { RuixenGradientFooter } from "@/components/ui/ruixen-gradient-footer";
import { InfiniteRibbon } from "@/components/ui/infinite-ribbon";


const PHONE = "080-4122-9900";
const EMAIL = "team@printkarr.in";
const ADDRESS = "14, 100 Feet Road, Indiranagar, Bengaluru 560038";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-bg text-ink">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-navy focus:px-4 focus:py-2 focus:text-paper"
      >
        Skip to content
      </a>
      <SiteHeader />
      <main id="main">{children}</main>
      <SiteFooter />
      <DockNav />
      <QuickDock />
      <Toaster position="top-center" richColors />
    </div>
  );
}

function BrandWord({ className }: { className?: string }) {
  return (
    <span className={cn("font-display font-semibold tracking-tight", className)}>
      <span className="text-paper">Print</span>
      <span className="text-blue-bright">Karr</span>
    </span>
  );
}

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      to="/"
      className={cn(
        "inline-flex items-center rounded-full bg-navy shadow-[0_10px_30px_-18px_rgb(7_24_51_/_0.8)]",
        compact ? "px-3 py-1.5" : "px-3.5 py-2",
      )}
      aria-label="PrintKarr home"
    >
      <BrandWord className={compact ? "text-lg" : "text-xl"} />
    </Link>
  );
}

function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-40 px-4 pt-4 sm:px-6">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <div className="pointer-events-auto">
          <Logo />
        </div>
        <div className="pointer-events-auto flex items-center gap-2">
          <Link
            to="/contact"
            className="hidden rounded-full bg-paper px-4 py-2 text-sm font-semibold text-ink ring-1 ring-line transition-transform duration-150 ease-out hover:ring-primary active:scale-[0.96] sm:inline-flex"
          >
            Contact Us
          </Link>
          <button
            type="button"
            className="inline-flex size-11 items-center justify-center rounded-full bg-paper text-ink ring-1 ring-line sm:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>
      {open ? (
        <nav className="pointer-events-auto mx-auto mt-3 max-w-6xl rounded-3xl bg-paper p-4 shadow-card ring-1 ring-line sm:hidden">
          {[
            ["/", "Home"],
            ["/how-it-works", "How it works"],
            ["/franchise", "Franchise"],
            ["/xerox", "Xerox shops"],
            ["/about", "About"],
            ["/contact", "Contact"],
          ].map(([to, label]) => (
            <Link
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className="block rounded-2xl px-3 py-3 text-sm font-medium hover:bg-pale"
            >
              {label}
            </Link>
          ))}
        </nav>
      ) : null}
    </header>
  );
}

function DockNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const items = [
    { to: "/about", label: "About Us" },
    { to: "/how-it-works", label: "Features" },
    { to: "/", label: "PrintKarr", home: true },
    { to: "/franchise", label: "Franchise" },
    { to: "/contact", label: "Contact us" },
  ] as const;
  return (
    <nav
      className="fixed bottom-4 left-1/2 z-40 hidden -translate-x-1/2 items-center rounded-full bg-paper/95 p-1.5 shadow-card ring-1 ring-line backdrop-blur md:flex"
      aria-label="Primary"
    >
      {items.map((item) => {
        const active = pathname === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-colors duration-150",
              "home" in item && item.home
                ? "bg-pale px-5 font-display font-semibold text-primary"
                : active
                  ? "text-primary"
                  : "text-muted hover:text-ink",
            )}
          >
            {"home" in item && item.home ? (
              <>
                <span className="text-navy">Print</span>
                <span className="text-primary">Karr</span>
              </>
            ) : (
              item.label
            )}
          </Link>
        );
      })}
    </nav>
  );
}

function QuickDock() {
  const item =
    "flex size-full items-center justify-center rounded-full text-muted transition-colors hover:bg-pale hover:text-primary";
  return (
    <nav
      aria-label="Quick actions"
      className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2 md:hidden"
    >
      <Dock direction="middle" className="mt-0">
        <DockIcon>
          <Link to="/" aria-label="Home" title="Home" className={item}>
            <House className="size-4" />
          </Link>
        </DockIcon>
        <DockIcon>
          <Link to="/franchise" aria-label="Franchise" title="Franchise" className={item}>
            <Building2 className="size-4" />
          </Link>
        </DockIcon>
        <DockIcon>
          <Link to="/contact" aria-label="Contact" title="Contact" className={item}>
            <Mail className="size-4" />
          </Link>
        </DockIcon>
        <span aria-hidden="true" className="mx-1 h-8 w-px shrink-0 bg-line" />
        <DockIcon>
          <a
            href="https://wa.me/919016703180?text=Hi%20Printkarr!%20I%20need%20help%20with%20printing."
            target="_blank"
            rel="noopener"
            aria-label="WhatsApp us"
            title="WhatsApp us"
            className={item}
          >
            <MessageCircle className="size-4" />
          </a>
        </DockIcon>
      </Dock>
    </nav>
  );
}

function SiteFooter() {
  return (
    <RuixenGradientFooter
      gradientHeight="40vh"
      className="border-t border-line bg-paper px-4 pt-16 sm:px-6"
    >
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
            India's first & only self-service printing vending kiosk. Instant, private,
            24/7 — no shop, no queue, no USB.
          </p>
          <p className="mt-6 text-sm text-ink">
            Have a Xerox shop? Join the modern way of running a print desk.
          </p>
          <Link
            to="/xerox"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-fg transition-transform duration-150 active:scale-[0.96]"
          >
            View details <ArrowUpRight className="size-4" />
          </Link>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Navigation</p>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link to="/xerox" className="hover:text-primary">
                Xerox Shops
              </Link>
            </li>
            <li>
              <Link to="/how-it-works" className="hover:text-primary">
                How it works
              </Link>
            </li>
            <li>
              <Link to="/franchise" className="hover:text-primary">
                Franchise
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-primary">
                Contact Us
              </Link>
            </li>
            <li>
              <Link to="/blogs" className="hover:text-primary">
                Blogs
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Social</p>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <a href="https://x.com" className="hover:text-primary" target="_blank" rel="noreferrer">
                Twitter / X
              </a>
            </li>
            <li>
              <a href="https://instagram.com" className="hover:text-primary" target="_blank" rel="noreferrer">
                Instagram
              </a>
            </li>
            <li>
              <a href="https://maps.google.com" className="hover:text-primary" target="_blank" rel="noreferrer">
                Google Business
              </a>
            </li>
            <li>
              <a href="https://linkedin.com" className="hover:text-primary" target="_blank" rel="noreferrer">
                LinkedIn
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="mx-auto mt-12 flex max-w-6xl flex-col gap-3 border-t border-line pt-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} PrintKarr · PrintKarr Technologies Private Limited</p>
        <div className="flex gap-4">
          <Link to="/terms" className="hover:text-ink">
            Terms & Conditions
          </Link>
          <Link to="/privacy" className="hover:text-ink">
            Privacy Policy
          </Link>
        </div>
      </div>
    </RuixenGradientFooter>
  );
}

function useParallax<T extends HTMLElement>(speed: number) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = el.getBoundingClientRect();
      const offset = (rect.top + rect.height / 2 - window.innerHeight / 2) * speed;
      el.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0)`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [speed]);
  return ref;
}

function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-pale px-3 py-1.5 text-xs font-semibold text-primary ring-1 ring-primary/15">
      {children}
    </span>
  );
}

function PrimaryLink({
  to,
  children,
}: {
  to: "/contact" | "/franchise" | "/xerox" | "/how-it-works";
  children: ReactNode;
}) {
  return (
    <Link
      to={to}
      className="group relative inline-block w-auto cursor-pointer overflow-hidden rounded-full border bg-paper px-6 py-2 text-center text-sm font-semibold text-ink"
    >
      <span className="flex items-center justify-center gap-2">
        <span className="h-2 w-2 rounded-full bg-primary transition-all duration-300 group-hover:scale-[100.8]" />
        <span className="inline-block transition-all duration-300 group-hover:translate-x-12 group-hover:opacity-0">
          {children}
        </span>
      </span>
      <span
        aria-hidden="true"
        className="absolute top-0 z-10 flex h-full w-full translate-x-12 items-center justify-center gap-2 text-primary-fg opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100"
      >
        {children}
        <ArrowRight className="size-6" />
      </span>
    </Link>
  );
}

function GhostLink({
  to,
  children,
}: {
  to: "/contact" | "/franchise";
  children: ReactNode;
}) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-2 rounded-full bg-paper px-5 py-3 text-sm font-semibold text-ink ring-1 ring-line transition-transform duration-150 ease-out hover:ring-primary active:scale-[0.96]"
    >
      {children} <ArrowUpRight className="size-4" />
    </Link>
  );
}

function HeroCopy() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const onScroll = () => {
      const hero = document.getElementById("hero-stage");
      if (!hero) return;
      const span = Math.max(hero.offsetHeight - window.innerHeight, 1);
      const p = Math.min(1, Math.max(0, -hero.getBoundingClientRect().top / span));
      if (reduce) {
        el.style.opacity = "1";
        return;
      }
      el.style.opacity = String(Math.max(0, 1 - p * 1.85));
      el.style.transform = `translate3d(0, ${(p * -36).toFixed(1)}px, 0)`;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div
      ref={ref}
      className="relative z-20 mx-auto flex max-w-4xl flex-col items-center px-4 pt-24 text-center sm:pt-28"
    >
      <Pill>
        <Sparkles className="size-3.5" /> India's First, Smartest, Fastest & Only
      </Pill>
      <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.08] tracking-[-0.04em] text-ink sm:text-5xl md:text-6xl">
        Meet{" "}
        <SparklesText
          sparklesCount={6}
          colors={{ first: "#4d86ff", second: "#a4d9ff" }}
          className="text-[1em]"
        >
          <span className="text-primary">PrintKarr</span>
        </SparklesText>
        , Your Anytime, Anywhere Instant Printing Kiosk
      </h1>
      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <PrimaryLink to="/contact">Contact Us</PrimaryLink>
        <GhostLink to="/franchise">Start a Franchise</GhostLink>
      </div>
    </div>
  );
}

function FloatBadge({
  className,
  speed,
  icon,
  label,
  floatDelay = "0s",
  floatDuration = "5.6s",
}: {
  className?: string;
  speed: number;
  icon: ReactNode;
  label: string;
  floatDelay?: string;
  floatDuration?: string;
}) {
  const ref = useParallax<HTMLDivElement>(speed);
  return (
    <div
      ref={ref}
      className={cn(
        "absolute z-10 hidden w-40 flex-col items-center gap-2 sm:flex",
        className,
      )}
    >
      <div
        className="pk-float-slow flex flex-col items-center gap-2"
        style={{ animationDelay: floatDelay, animationDuration: floatDuration }}
      >
        <span className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-fg shadow-card ring-4 ring-paper">
          {icon}
        </span>
        <span className="rounded-full bg-paper px-3 py-1.5 text-center text-xs font-semibold leading-snug text-ink shadow-card ring-1 ring-line">
          {label}
        </span>
      </div>
    </div>
  );
}

export function HomePage() {
  const grid = useParallax<HTMLDivElement>(0.12);
  return (
    <>
      <section id="hero-stage" className="relative h-[220vh]">
        <div className="sticky top-0 h-dvh overflow-hidden">
          <div ref={grid} className="pointer-events-none absolute inset-0">
            <div aria-hidden="true" className="grid-veil absolute inset-0 opacity-70" />
          </div>
          <HeroCopy />
          <img
            src="/images/kiosk-hero.png"
            alt="PrintKarr self-service printing kiosk"
            className="hero-fade absolute inset-0 top-28 h-[calc(100%-2rem)] w-full object-contain"
          />
          <FloatBadge
            className="left-[8%] top-[42%]"
            speed={-0.08}
            icon={<ShieldCheck className="size-6" />}
            label="100% Secured Documents"
            floatDelay="0s"
            floatDuration="5.6s"
          />
          <FloatBadge
            className="right-[8%] top-[38%]"
            speed={-0.12}
            icon={<Timer className="size-6" />}
            label="Print Under 60 Seconds"
            floatDelay="-1.8s"
            floatDuration="6.4s"
          />
          <FloatBadge
            className="left-[12%] top-[62%]"
            speed={-0.05}
            icon={<Clock3 className="size-6" />}
            label="24/7 Availability"
            floatDelay="-3.6s"
            floatDuration="7.1s"
          />
          <div className="absolute bottom-6 right-6 z-20 hidden text-[10px] font-semibold tracking-[0.28em] text-muted sm:block">
            SCROLL
          </div>
        </div>
      </section>

      <InfiniteRibbon duration={30} repeat={6} className="bg-primary text-primary-fg">
        Instant prints under 60 seconds ✦ From ₹2 per page ✦ Open 24×7 ✦ No
        app needed ✦ Private by design ✦{" "}
      </InfiniteRibbon>

      <HowToSection />
      <FeaturesSection />
      <CompareSection />
      <IndiaSection />
      <HostBanner />
    </>
  );
}

const FLOW_NODES = [
  { label: "User Phone", icon: <Smartphone className="size-6" /> },
  { label: "WhatsApp / Upload", icon: <Upload className="size-6" /> },
  { label: "Cloud Processing", icon: <Cloud className="size-6" /> },
  { label: "Kiosk", icon: <Printer className="size-6" /> },
];

function HowToSection() {
  const title = useParallax<HTMLDivElement>(-0.04);
  const rowRefs = useRef<(HTMLElement | null)[]>([]);
  const flowRef = useRef<HTMLDivElement>(null);
  const nodeA = useRef<HTMLDivElement>(null);
  const nodeB = useRef<HTMLDivElement>(null);
  const nodeC = useRef<HTMLDivElement>(null);
  const nodeD = useRef<HTMLDivElement>(null);
  const nodeRefFor = [nodeA, nodeB, nodeC, nodeD];
  useEffect(() => {
    const rows = rowRefs.current;
    if (!("IntersectionObserver" in window)) {
      rows.forEach((r) => r?.classList.add("lit"));
      return;
    }
    const io = new IntersectionObserver(
      (es) => {
        es.forEach((en) => {
          if (en.isIntersecting) {
            (en.target as HTMLElement).classList.add("lit");
            io.unobserve(en.target);
          }
        });
      },
      { threshold: 0.55, rootMargin: "-8% 0px" },
    );
    rows.forEach((r) => {
      if (r) io.observe(r);
    });
    return () => io.disconnect();
  }, []);
  return (
    <section className="relative px-4 py-24 sm:px-6">
      <div ref={title} className="mx-auto max-w-6xl text-center">
        <Pill>
          <Smartphone className="size-3.5" /> How to Use?
        </Pill>
        <h2 className="mt-4 font-display text-3xl font-semibold tracking-[-0.03em] sm:text-5xl">
          How to Print using a
          <br />
          <span className="text-primary">PrintKarr</span> kiosk?
        </h2>
        <p className="mt-3 text-muted">Fast. Secure. Completely Contactless.</p>
      </div>
      <div className="mx-auto mt-12 flex max-w-3xl flex-col gap-3">
        {STEPS.map((s, i) => (
          <article
            key={s.n}
            ref={(el) => {
              rowRefs.current[i] = el;
            }}
            className="pk-feed-row"
          >
            <span className="pk-feed-ic">{s.n}</span>
            <span className="pk-feed-tx">
              <b>
                {s.title}
                <i>· STEP {i + 1}</i>
              </b>
              <p>{s.body}</p>
            </span>
            <span className="tag">{s.tag}</span>
          </article>
        ))}
      </div>
      <p className="pk-flow-cap">Your file’s journey</p>
      <div ref={flowRef} className="pk-flow mx-auto max-w-5xl">
        <AnimatedBeam containerRef={flowRef} fromRef={nodeA} toRef={nodeB} duration={3} gradientStartColor="#6cc1fb" gradientStopColor="#0d86e0" />
        <AnimatedBeam containerRef={flowRef} fromRef={nodeB} toRef={nodeC} duration={3} gradientStartColor="#6cc1fb" gradientStopColor="#0d86e0" />
        <AnimatedBeam containerRef={flowRef} fromRef={nodeC} toRef={nodeD} duration={3} gradientStartColor="#6cc1fb" gradientStopColor="#0d86e0" />
        <div className="pk-flow-row">
          {FLOW_NODES.map((n, i) => (
            <div key={n.label} ref={nodeRefFor[i]} className="pk-node">
              <span className="ball">{n.icon}</span>
              <span>{n.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const STEPS = [
  {
    n: "01",
    title: "Scan the Kiosk QR",
    body: "Each PrintKarr vending machine has its own unique QR — scan it using your mobile camera.",
    tag: "Scan with camera",
  },
  {
    n: "02",
    title: "Upload Your Document",
    body: "Choose your file from phone, laptop, or Drive. No sign-up required.",
    tag: "No sign-up",
  },
  {
    n: "03",
    title: "Set Print Preference",
    body: "Set copies, B&W or colour, duplex, and orientation before you pay.",
    tag: "B&W · Colour · Duplex",
  },
  {
    n: "04",
    title: "Get Your Print Instantly",
    body: "Enter the 4-digit OTP or scan the dynamic QR on the kiosk to collect your print.",
    tag: "4-digit OTP",
  },
];

function FeaturesSection() {
  const cards = [
    {
      icon: <Lock className="size-5" />,
      title: "Your Documents Are Completely Safe",
      body: "Files are encrypted, never shared, and automatically deleted after printing. You’re the only one who can access them.",
    },
    {
      icon: <Timer className="size-5" />,
      title: "Print in Under 60 Seconds",
      body: "From scanning the kiosk QR to collecting your print — the entire process is lightning-fast and seamless.",
    },
    {
      icon: <Clock3 className="size-5" />,
      title: "Always Available — 24/7",
      body: "Print even when shops are shut — early mornings, late nights, weekends, and holidays.",
    },
    {
      icon: <Star className="size-5" />,
      title: "India’s Only Self-Service Print Solution",
      body: "No shop visits. No waiting in line. Print directly from your phone — anytime.",
    },
    {
      icon: <Smartphone className="size-5" />,
      title: "100% Contactless & Hassle-Free",
      body: "No touching shared devices, no pen drives, no staff needed. Just scan, upload & print.",
    },
    {
      icon: <Users className="size-5" />,
      title: "Perfect for Students, Professionals & Travellers",
      body: "Need a last-minute assignment, ticket, or ID proof? PrintKarr has your back, wherever you are.",
    },
  ];
  return (
    <section id="features" className="px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl text-center">
        <Pill>
          <Zap className="size-3.5" /> Features
        </Pill>
        <h2 className="mt-4 font-display text-3xl font-semibold tracking-[-0.03em] sm:text-5xl">
          So, Why PrintKarr is the best
          <br />
          way to print?
        </h2>
        <p className="mt-3 text-muted">Smarter Printing for a Busy World</p>
      </div>
      <div className="mx-auto mt-10 grid max-w-6xl gap-4 md:grid-cols-3">
        {cards.map((c, i) => (
          <article
            key={c.title}
            className={cn(
              "group relative overflow-hidden rounded-[28px] bg-paper p-6 text-left shadow-[0_1px_0_rgb(12_28_51_/_0.04)] ring-1 ring-line transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_30px_60px_-28px_rgba(13,134,224,.55)] hover:ring-primary/30",
              (i === 0 || i === 3) && "md:col-span-2",
            )}
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 [background:radial-gradient(420px_200px_at_85%_0%,rgba(108,193,251,.18),transparent_65%)]"
            />
            <span className="relative flex size-10 items-center justify-center rounded-2xl bg-pale text-primary transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6">
              {c.icon}
            </span>
            <h3 className="relative mt-4 font-display text-lg font-semibold">{c.title}</h3>
            <p className="relative mt-2 text-sm leading-relaxed text-muted">{c.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function CompareSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const confettiRef = useRef<ConfettiRef>(null);
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      (es) => {
        if (!es[0].isIntersecting) return;
        io.disconnect();
        const r = el.getBoundingClientRect();
        confettiRef.current?.fire({
          particleCount: 55,
          origin: {
            x: (r.left + r.width / 2) / window.innerWidth,
            y: Math.min(Math.max(r.top / window.innerHeight, 0.15), 0.7),
          },
        });
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const left = [
    "Limited working hours",
    "Long queues and delayed service",
    "Files often visible to shop staff",
    "Shopkeepers often download to print",
    "Requires staff interaction",
  ];
  const right = [
    "24×7 access",
    "Instant prints under 60 seconds",
    "Private, encrypted & auto-deleted",
    "No one downloads your file",
    "No human interaction needed",
  ];
  return (
    <section ref={sectionRef} className="px-4 py-20 sm:px-6">
      <Confetti ref={confettiRef} manualstart />
      <div className="mx-auto max-w-6xl text-center">
        <Pill>
          <Printer className="size-3.5" /> Smarter vs Traditional
        </Pill>
        <h2 className="mt-4 font-display text-3xl font-semibold tracking-[-0.03em] sm:text-5xl">
          And, why <span className="text-primary">PrintKarr</span> stands out?
        </h2>
        <p className="mt-3 text-muted">Self-Service Printing vs. Traditional Print Shops</p>
      </div>
      <div className="mx-auto mt-10 grid max-w-4xl overflow-hidden rounded-[32px] bg-paper ring-1 ring-line md:grid-cols-2">
        <div className="p-8">
          <h3 className="font-display text-lg font-semibold text-muted">Traditional Print Shops</h3>
          <ul className="mt-5 space-y-3 text-sm">
            {left.map((t) => (
              <li key={t} className="flex gap-3 text-muted">
                <span className="mt-0.5 flex size-5 items-center justify-center rounded-full bg-danger/10 text-danger">
                  <X className="size-3" />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-pale p-8 transition-all duration-500 hover:bg-[#e3edff] hover:shadow-[inset_0_0_0_1px_rgba(26,91,255,.35),0_18px_44px_-20px_rgba(13,134,224,.55)]">
          <h3 className="font-display text-lg font-semibold text-primary">PrintKarr</h3>
          <ul className="mt-5 space-y-3 text-sm">
            {right.map((t) => (
              <li key={t} className="group flex gap-3 text-ink -mx-2 rounded-xl px-2 py-1.5 transition-all duration-300 hover:bg-white/75 hover:shadow-[0_8px_20px_-12px_rgba(13,134,224,.5)]">
                <span className="mt-0.5 flex size-5 items-center justify-center rounded-full bg-primary text-primary-fg transition-shadow duration-300 group-hover:shadow-[0_0_0_4px_rgba(26,91,255,.18)]">
                  <Check className="size-3" />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function IndiaMap() {
  const outline =
    "M250 22 L278 42 308 52 338 78 358 98 378 118 418 128 448 140 468 166 462 192 438 206 408 200 398 232 392 272 382 312 368 352 348 402 328 452 308 500 288 534 268 546 254 518 244 488 228 448 214 408 198 368 178 338 148 318 108 308 68 314 44 298 54 274 84 258 100 238 120 208 140 172 164 138 190 98 216 58 Z";
  return (
    <svg viewBox="0 0 500 580" className="h-auto w-full max-w-md" aria-hidden="true">
      <path fill="var(--color-pale)" d={outline} />
      <path
        fill="var(--color-primary)"
        d="M68 300c-22 4-38 22-28 38 10 16 38 14 52 2 16-14 10-36-8-42-6-2-12-0-16 2z"
      />
      <path
        fill="var(--color-primary)"
        d="M170 210c30 14 40 54 26 82-16 30-54 38-76 18-24-22-18-64 8-84 16-12 28-22 42-16z"
      />
      <path
        fill="var(--color-blue-bright)"
        d="M230 330c24 16 28 56 10 80-20 26-56 28-72 8-18-22-8-58 12-76 16-14 32-26 50-12z"
      />
      <path
        fill="var(--color-primary)"
        opacity="0.88"
        d="M250 120c24 8 36 36 26 56-10 22-36 30-52 18-18-12-22-40-8-56 12-14 22-24 34-18z"
      />
      <ellipse cx="292" cy="558" rx="16" ry="18" fill="var(--color-pale)" />
    </svg>
  );
}

function IndiaSection() {
  const map = useParallax<HTMLDivElement>(-0.07);
  const stats = [
    { v: 64, suffix: "+", l: "Active Kiosks", icon: <MapPin className="size-4" /> },
    { v: 22, suffix: "+", l: "Cities", icon: <Building2 className="size-4" /> },
    { v: 11, suffix: "+", l: "States", icon: <Globe2 className="size-4" /> },
  ];
  return (
    <section className="px-4 py-20 sm:px-6">
      <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-[1.1fr_0.9fr]">
        <div>
          <Pill>
            <MapPin className="size-3.5" /> Where To Find Us
          </Pill>
          <h2 className="mt-4 font-display text-3xl font-semibold tracking-[-0.03em] sm:text-5xl">
            Across India,
            <br />
            <span className="text-primary">Growing Every Day</span>
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
            PrintKarr is expanding across cities and states, bringing self-service instant printing
            closer to where people need it most.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {stats.map((s) => (
              <div key={s.l} className="rounded-3xl bg-pale p-4">
                <span className="flex size-8 items-center justify-center rounded-full bg-paper text-primary">
                  {s.icon}
                </span>
                <p className="mt-3 font-display text-2xl font-semibold tabular-nums">
                  <NumberTicker value={s.v} className="text-ink" />
                  {s.suffix}
                </p>
                <p className="text-xs text-muted">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
        <div ref={map} className="flex justify-center">
          <IndiaMap />
        </div>
      </div>
    </section>
  );
}

function HostBanner() {
  return (
    <section className="px-4 pb-20 sm:px-6">
      <div className="relative mx-auto flex max-w-6xl flex-col overflow-hidden rounded-[32px] bg-navy text-paper md:flex-row md:items-center">
        <Meteors number={14} />
        <div className="z-10 flex-1 p-8 md:p-12">
          <h2 className="font-display text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
            Want to offer 24/7 printing to students, employees, or visitors?
          </h2>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-paper/70">
            You can host your own PrintKarr machine in your college, hostel, co-working space or
            public area.
          </p>
          <Link
            to="/contact"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-fg transition-transform duration-150 active:scale-[0.96]"
          >
            Request Installation <ArrowUpRight className="size-4" />
          </Link>
        </div>
        <div className="relative h-64 w-full md:h-72 md:w-[42%]">
          <img
            src="/images/host-cta.jpg"
            alt="Student smiling while requesting a print from her phone"
            className="h-full w-full object-cover object-[50%_20%]"
          />
          <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-navy to-transparent" />
        </div>
      </div>
    </section>
  );
}

export function HowItWorksPage() {
  return (
    <PageShell>
      <div className="px-4 pb-20 pt-28 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <Pill>How it works</Pill>
          <h1 className="mt-4 font-display text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
            Four taps. One print. Sixty seconds.
          </h1>
          <p className="mt-4 text-muted">
            PrintKarr never asks you to stand at a counter, share a pen drive, or wait for a shop to
            open. The kiosk is the shop.
          </p>
        </div>
        <HowToSection />
        <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-3">
          {[
            {
              t: "No app required",
              d: "The kiosk QR opens a lightweight web flow. Camera in, document out.",
            },
            {
              t: "Pay on the phone",
              d: "UPI and cards, encrypted end to end. The kiosk never stores a payment method.",
            },
            {
              t: "Collect with OTP",
              d: "A rotating 4-digit code or on-screen QR releases the job. Nobody else can.",
            },
          ].map((x) => (
            <article key={x.t} className="rounded-[28px] bg-paper p-6 ring-1 ring-line">
              <h3 className="font-display text-lg font-semibold">{x.t}</h3>
              <p className="mt-2 text-sm text-muted">{x.d}</p>
            </article>
          ))}
        </div>
      </div>
    </PageShell>
  );
}

export function AboutPage() {
  return (
    <PageShell>
      <div className="px-4 pb-24 pt-28 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <Pill>About PrintKarr</Pill>
          <blockquote className="mt-6 font-display text-2xl font-medium leading-snug tracking-[-0.03em] sm:text-4xl">
            “If groceries can reach us in minutes, why is printing still stuck behind a shutter at
            9 pm? PrintKarr is our answer to that question.”
          </blockquote>
          <p className="mt-4 text-sm font-semibold text-primary">— Anirudh Verma, Founder</p>
          <div className="mt-12 space-y-5 text-base leading-relaxed text-muted">
            <p>
              PrintKarr is India’s self-service printing kiosk, built to make document printing
              instant, private, and available any hour of the day.
            </p>
            <p>
              The idea came from a problem we lived: rushing to print assignments, tickets, and
              affidavits only to find the shop closed, overcrowded, or asking for a USB we didn’t
              carry. Waiting in a queue for something this simple never made sense.
            </p>
            <p>
              With encrypted file handling, auto-delete after print, and a machine that never takes
              a lunch break, PrintKarr is how document printing should work in a digital-first
              India.
            </p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            <article className="rounded-[28px] bg-pale p-6">
              <h2 className="font-display text-xl font-semibold">Mission</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Fully automated, staff-free printing operations in every campus, transit hub, and
                workplace that still depends on a xerox counter.
              </p>
            </article>
            <article className="rounded-[28px] bg-navy p-6 text-paper">
              <h2 className="font-display text-xl font-semibold">Vision</h2>
              <p className="mt-2 text-sm leading-relaxed text-paper/70">
                Build India’s largest network of smart printing kiosks — the default place you go
                when a document needs to exist on paper, now.
              </p>
            </article>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

export function FranchisePage() {
  return (
    <PageShell>
      <div className="px-4 pb-24 pt-28 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <Pill>Franchise & Partnerships</Pill>
          <h1 className="mt-4 font-display text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
            Own the kiosk. We run the platform.
          </h1>
          <p className="mt-4 text-muted">
            Partnership models for entrepreneurs and space owners — passive or active income through
            automated instant printing, backed by a fully managed stack.
          </p>
        </div>
        <div className="mx-auto mt-12 grid max-w-6xl gap-4 md:grid-cols-3">
          {[
            {
              t: "Franchise-Owned",
              d: "You own the kiosk. PrintKarr runs the platform.",
              you: ["No staff required", "Provide space, power, internet", "Refill paper & consumables"],
              us: ["Orders & payments", "Support & maintenance", "Software, backend, monitoring"],
              who: "Entrepreneurs, retailers, investors",
            },
            {
              t: "Space Partner",
              d: "You provide the square footage. We handle the rest.",
              you: ["Space, power, internet", "Keep the area accessible", "That’s it"],
              us: ["Hardware deployment", "Orders & payments", "Support & monitoring"],
              who: "Colleges, malls, offices, hostels, transit",
            },
            {
              t: "Custom Partnership",
              d: "White-label, multi-kiosk, or campus-wide integrations.",
              you: ["Location network", "Brand or workflow needs", "A named operator"],
              us: ["Custom hardware mix", "Dedicated workflows", "SLA & reporting"],
              who: "Universities, enterprises, government",
            },
          ].map((m) => (
            <article key={m.t} className="flex flex-col rounded-[28px] bg-paper p-6 ring-1 ring-line">
              <h2 className="font-display text-xl font-semibold">{m.t}</h2>
              <p className="mt-2 text-sm text-muted">{m.d}</p>
              <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-primary">Your role</p>
              <ul className="mt-2 space-y-1 text-sm">
                {m.you.map((x) => (
                  <li key={x}>· {x}</li>
                ))}
              </ul>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-primary">Our role</p>
              <ul className="mt-2 space-y-1 text-sm">
                {m.us.map((x) => (
                  <li key={x}>· {x}</li>
                ))}
              </ul>
              <p className="mt-auto pt-5 text-xs text-muted">Best for: {m.who}</p>
            </article>
          ))}
        </div>

        <div className="mx-auto mt-16 grid max-w-4xl gap-4 md:grid-cols-2">
          <article className="rounded-[28px] bg-navy p-8 text-paper">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-bright">PrintKarr PRO</p>
            <h3 className="mt-2 font-display text-3xl font-semibold">₹2.89 L + GST</h3>
            <p className="mt-2 text-sm text-paper/70">Designed for high-footfall locations.</p>
            <ul className="mt-5 space-y-2 text-sm">
              <li>· Faster print speeds</li>
              <li>· 1,950-sheet paper capacity</li>
              <li>· Heavy-duty printing module</li>
            </ul>
          </article>
          <article className="rounded-[28px] bg-paper p-8 ring-1 ring-line">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">PrintKarr MINI</p>
            <h3 className="mt-2 font-display text-3xl font-semibold">₹1.35 L + GST</h3>
            <p className="mt-2 text-sm text-muted">Ideal for low and medium-footfall sites.</p>
            <ul className="mt-5 space-y-2 text-sm">
              <li>· Moderate print speeds</li>
              <li>· 650-sheet paper capacity</li>
              <li>· Reliable printing module</li>
            </ul>
          </article>
        </div>

        <ol className="mx-auto mt-16 grid max-w-5xl gap-4 sm:grid-cols-4">
          {[
            ["01", "Submit application", "Share details and a preferred location."],
            ["02", "Site review", "We check footfall, power, and network."],
            ["03", "Paperwork", "Agreement, payment, and install window."],
            ["04", "Launch in 10 days", "Kiosk live. You start earning."],
          ].map(([n, t, d]) => (
            <li key={n} className="rounded-[28px] bg-pale p-5">
              <p className="font-display text-2xl font-semibold text-primary">{n}</p>
              <h3 className="mt-2 font-display font-semibold">{t}</h3>
              <p className="mt-1 text-sm text-muted">{d}</p>
            </li>
          ))}
        </ol>

        <div className="mx-auto mt-16 max-w-2xl">
          <h2 className="text-center font-display text-3xl font-semibold">Apply to partner</h2>
          <LeadForm intent="franchise" />
        </div>

        <div className="mx-auto mt-16 max-w-3xl space-y-3">
          <h2 className="mb-6 text-center font-display text-3xl font-semibold">Frequently asked</h2>
          {[
            [
              "What is PrintKarr?",
              "A printing platform that connects customers, kiosks, and print shops in one digital ecosystem — automate orders, skip queues, and keep files private.",
            ],
            [
              "Who can become a partner?",
              "Xerox shop owners, entrepreneurs, campus administrators, and anyone with high-footfall space and a power socket.",
            ],
            [
              "Do you provide support after launch?",
              "Yes. Hardware warranty, remote monitoring, software updates, and a support desk for refunds and escalations.",
            ],
            [
              "What does a kiosk cost to run?",
              "A 4 sq ft footprint, modest electricity and internet, paper and ink that scale with volume, and a 10% platform commission on gross prints.",
            ],
          ].map(([q, a]) => (
            <details key={q} className="rounded-3xl bg-paper p-5 ring-1 ring-line">
              <summary className="cursor-pointer font-display font-semibold">{q}</summary>
              <p className="mt-2 text-sm leading-relaxed text-muted">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </PageShell>
  );
}

export function XeroxPage() {
  return (
    <PageShell>
      <div className="px-4 pb-24 pt-28 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <Pill>Xerox shops</Pill>
          <h1 className="mt-4 font-display text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
            The modern way of running a Xerox shop
          </h1>
          <p className="mt-4 text-muted">
            Customers pick you, upload, and pay online. You unlock the job with an OTP — no file
            sitting on your desktop, no settings to guess.
          </p>
        </div>
        <div className="mx-auto mt-12 grid max-w-5xl gap-4 md:grid-cols-3">
          {[
            {
              t: "Track orders & earnings",
              d: "See prints, popular jobs, and payouts in one dashboard.",
            },
            {
              t: "Zero rework",
              d: "Colour, pages, and copies are set by the customer before they pay.",
            },
            {
              t: "Any printer",
              d: "Every brand you already own is supported. We sit on top, not instead.",
            },
          ].map((c) => (
            <article key={c.t} className="rounded-[28px] bg-paper p-6 ring-1 ring-line">
              <h2 className="font-display text-lg font-semibold">{c.t}</h2>
              <p className="mt-2 text-sm text-muted">{c.d}</p>
            </article>
          ))}
        </div>
        <ol className="mx-auto mt-12 max-w-3xl space-y-4">
          {[
            "Customer selects your shop on PrintKarr",
            "They upload a document and choose print settings",
            "They pay online and receive an OTP",
            "You enter the OTP — no file download required",
            "Click print and hand over the pages",
          ].map((t, i) => (
            <li key={t} className="flex gap-4 rounded-3xl bg-pale p-4">
              <span className="font-display text-xl font-semibold text-primary">0{i + 1}</span>
              <span className="pt-1 text-sm font-medium">{t}</span>
            </li>
          ))}
        </ol>
        <div className="mt-12 text-center">
          <PrimaryLink to="/contact">Onboard your shop</PrimaryLink>
        </div>
      </div>
    </PageShell>
  );
}

export function ContactPage() {
  return (
    <PageShell>
      <div className="px-4 pb-24 pt-28 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[0.9fr_1.1fr]">
          <div>
            <Pill>Contact</Pill>
            <h1 className="mt-4 font-display text-4xl font-semibold tracking-[-0.04em]">
              Let’s put a kiosk where the queues are.
            </h1>
            <ul className="mt-8 space-y-4 text-sm">
              <li className="flex gap-3">
                <Phone className="mt-0.5 size-4 text-primary" />
                <div>
                  <p className="font-semibold">{PHONE}</p>
                  <p className="text-muted">Please dial with the leading 0</p>
                </div>
              </li>
              <li className="flex gap-3">
                <Mail className="mt-0.5 size-4 text-primary" />
                <a className="font-semibold hover:text-primary" href={`mailto:${EMAIL}`}>
                  {EMAIL}
                </a>
              </li>
              <li className="flex gap-3">
                <MapPin className="mt-0.5 size-4 text-primary" />
                <p>
                  PrintKarr Technologies Private Limited
                  <br />
                  {ADDRESS}
                </p>
              </li>
            </ul>
          </div>
          <LeadForm intent="contact" />
        </div>
      </div>
    </PageShell>
  );
}

function LeadForm({ intent }: { intent: "contact" | "franchise" }) {
  const [sent, setSent] = useState(false);
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    const key = "printkarr-leads";
    let prev: unknown[] = [];
    try {
      prev = JSON.parse(localStorage.getItem(key) || "[]") as unknown[];
      if (!Array.isArray(prev)) prev = [];
    } catch {
      prev = [];
    }
    localStorage.setItem(key, JSON.stringify([{ intent, at: Date.now(), ...data }, ...prev].slice(0, 50)));
    setSent(true);
    toast.success("Received. We’ll reply within one business day.");
    e.currentTarget.reset();
  };
  return (
    <form
      onSubmit={onSubmit}
      className="rounded-[32px] bg-paper p-6 ring-1 ring-line sm:p-8"
    >
      <label className="block text-sm font-medium">
        How would you like to partner?
        <select
          name="model"
          required
          className="mt-2 w-full rounded-2xl bg-bg px-4 py-3 text-sm outline-none ring-1 ring-line focus:ring-2 focus:ring-primary"
          defaultValue=""
        >
          <option value="" disabled>
            Choose one
          </option>
          <option>Own a PrintKarr kiosk</option>
          <option>Have a location to host</option>
          <option>Need a custom solution</option>
          <option>Onboard my Xerox shop</option>
          <option>Just saying hello</option>
        </select>
      </label>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium">
          Name
          <input
            name="name"
            required
            className="mt-2 w-full rounded-2xl bg-bg px-4 py-3 text-sm outline-none ring-1 ring-line focus:ring-2 focus:ring-primary"
          />
        </label>
        <label className="block text-sm font-medium">
          Phone
          <input
            name="phone"
            required
            inputMode="tel"
            className="mt-2 w-full rounded-2xl bg-bg px-4 py-3 text-sm outline-none ring-1 ring-line focus:ring-2 focus:ring-primary"
          />
        </label>
      </div>
      <label className="mt-4 block text-sm font-medium">
        Email
        <input
          name="email"
          type="email"
          required
          className="mt-2 w-full rounded-2xl bg-bg px-4 py-3 text-sm outline-none ring-1 ring-line focus:ring-2 focus:ring-primary"
        />
      </label>
      <label className="mt-4 block text-sm font-medium">
        City / campus
        <input
          name="city"
          className="mt-2 w-full rounded-2xl bg-bg px-4 py-3 text-sm outline-none ring-1 ring-line focus:ring-2 focus:ring-primary"
        />
      </label>
      <label className="mt-4 block text-sm font-medium">
        Message
        <textarea
          name="message"
          rows={4}
          className="mt-2 w-full resize-none rounded-2xl bg-bg px-4 py-3 text-sm outline-none ring-1 ring-line focus:ring-2 focus:ring-primary"
        />
      </label>
      <button
        type="submit"
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-fg transition-transform duration-150 active:scale-[0.96]"
      >
        {sent ? "Sent — send another" : "Submit"} <ArrowUpRight className="size-4" />
      </button>
    </form>
  );
}

export const POSTS = [
  {
    slug: "running-a-printkarr-kiosk",
    title: "What it actually costs to run a PrintKarr kiosk every month",
    excerpt: "Four square feet, a socket, and a predictable stack of paper. The rest scales with prints.",
    body: [
      "A PrintKarr kiosk needs just four square feet. College corridors, university lobbies, government office entrances, libraries, and commercial buildings are all fair game.",
      "Because the service is useful to students and staff, many institutions trial a unit rent-free. After that, space typically lands between ₹1,500 and ₹2,000 a month.",
      "Electricity for 24/7 operation is usually under ₹750. Internet under ₹600. Paper and ink move with volume; ink is supplied through PrintKarr so the per-print cost stays honest. Miscellaneous: ₹500–₹800. Platform commission is 10% of gross monthly revenue — only when the machine is earning.",
    ],
  },
  {
    slug: "replacing-xerox-queues",
    title: "Why self-service printing is replacing the xerox queue",
    excerpt: "The shop didn’t vanish. The waiting did.",
    body: [
      "Traditional counters still matter for spiral binding and passport photos. They fail at the thing people need at 11.40 pm: a PDF, on paper, now.",
      "PrintKarr splits that job away from the shop. Encrypted upload, prepaid settings, OTP collect. The file is never a USB, never a WhatsApp, never a desktop folder.",
      "Shops that partner with us keep the complex jobs and inherit a digital queue for the simple ones. Both sides print more.",
    ],
  },
  {
    slug: "colleges-24-7-print",
    title: "How campuses are installing 24/7 print without hiring a night shift",
    excerpt: "Hostels don’t close. Assignments don’t wait. The xerox shop does.",
    body: [
      "Every dean we meet has the same story: a line out the door at 8.50 am, and a locked shutter when the project is due at midnight.",
      "A hosted PrintKarr machine sits in a corridor with CCTV and a power drop. Students scan, pay, collect. No attendant, no argument about colour vs B&W — they chose before they paid.",
      "Administrators like the audit trail. Students like that it works on Sunday. That’s the whole product.",
    ],
  },
];

export function BlogsPage() {
  return (
    <PageShell>
      <div className="px-4 pb-24 pt-28 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <Pill>Journal</Pill>
          <h1 className="mt-4 font-display text-4xl font-semibold">Notes from the print floor</h1>
        </div>
        <div className="mx-auto mt-10 grid max-w-5xl gap-4 md:grid-cols-3">
          {POSTS.map((p) => (
            <Link
              key={p.slug}
              to="/blogs/$slug"
              params={{ slug: p.slug }}
              className="rounded-[28px] bg-paper p-6 ring-1 ring-line transition-transform duration-150 hover:-translate-y-0.5"
            >
              <h2 className="font-display text-lg font-semibold">{p.title}</h2>
              <p className="mt-2 text-sm text-muted">{p.excerpt}</p>
            </Link>
          ))}
        </div>
      </div>
    </PageShell>
  );
}

export function BlogArticlePage({ slug }: { slug: string }) {
  const post = useMemo(() => POSTS.find((p) => p.slug === slug), [slug]);
  if (!post) {
    return (
      <PageShell>
        <div className="px-4 py-32 text-center">
          <h1 className="font-display text-3xl font-semibold">Story not found</h1>
          <Link to="/blogs" className="mt-4 inline-block text-primary">
            Back to blogs
          </Link>
        </div>
      </PageShell>
    );
  }
  return (
    <PageShell>
      <article className="mx-auto max-w-2xl px-4 pb-24 pt-28 sm:px-6">
        <Link to="/blogs" className="text-sm font-semibold text-primary">
          ← Journal
        </Link>
        <h1 className="mt-4 font-display text-4xl font-semibold tracking-[-0.03em]">{post.title}</h1>
        <p className="mt-3 text-muted">{post.excerpt}</p>
        <div className="mt-8 space-y-4 text-base leading-relaxed text-ink">
          {post.body.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
      </article>
    </PageShell>
  );
}

export function TermsPage() {
  return (
    <PageShell>
      <article className="mx-auto max-w-2xl px-4 pb-24 pt-28 text-sm leading-relaxed text-muted sm:px-6">
        <h1 className="font-display text-4xl font-semibold text-ink">Terms & Conditions</h1>
        <p className="mt-6">
          PrintKarr kiosks and the companion web flow are provided by PrintKarr Technologies Private
          Limited. By scanning a kiosk QR, uploading a document, or applying as a partner, you agree
          to these terms.
        </p>
        <h2 className="mt-8 font-display text-xl font-semibold text-ink">Print jobs</h2>
        <p className="mt-2">
          You confirm you have the right to print the file you upload. We do not inspect document
          contents. Jobs are encrypted in transit, processed to complete the print, and deleted
          afterwards. Uncollected jobs expire.
        </p>
        <h2 className="mt-8 font-display text-xl font-semibold text-ink">Payments & refunds</h2>
        <p className="mt-2">
          Print fees are prepaid. Hardware misfires are refunded to the original method after a kiosk
          health check. Change of mind after a successful print is not refundable.
        </p>
        <h2 className="mt-8 font-display text-xl font-semibold text-ink">Partners</h2>
        <p className="mt-2">
          Franchise hardware remains subject to the partnership agreement. Platform commission, SLA,
          and consumable supply are defined there, not on this page.
        </p>
      </article>
    </PageShell>
  );
}

export function PrivacyPage() {
  return (
    <PageShell>
      <article className="mx-auto max-w-2xl px-4 pb-24 pt-28 text-sm leading-relaxed text-muted sm:px-6">
        <h1 className="font-display text-4xl font-semibold text-ink">Privacy Policy</h1>
        <p className="mt-6">
          We collect the minimum needed to print a document or reply to a partnership enquiry: file
          bytes for the life of the job, a phone or email if you submit a form, and payment tokens
          handled by our processor.
        </p>
        <h2 className="mt-8 font-display text-xl font-semibold text-ink">Documents</h2>
        <p className="mt-2">
          Uploaded files are encrypted, never written to partner shop desktops, and deleted after
          print or expiry. Kiosk screens do not preview your pages to bystanders.
        </p>
        <h2 className="mt-8 font-display text-xl font-semibold text-ink">Forms</h2>
        <p className="mt-2">
          Contact and franchise forms on this demo site are stored in your browser only
          (localStorage) so you can try the flow. A production deployment would send them to
          {` ${EMAIL}`}.
        </p>
        <h2 className="mt-8 font-display text-xl font-semibold text-ink">Contact</h2>
        <p className="mt-2">
          Privacy questions: {EMAIL}. Postal: {ADDRESS}.
        </p>
      </article>
    </PageShell>
  );
}

export function HomeRoute() {
  return (
    <PageShell>
      <HomePage />
    </PageShell>
  );
}
