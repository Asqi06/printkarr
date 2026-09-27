import { useEffect, useRef, type ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/cn";

interface NumberTickerProps extends ComponentPropsWithoutRef<"span"> {
  value: number;
  startValue?: number;
  direction?: "up" | "down";
  delay?: number;
  decimalPlaces?: number;
}

// ponytail: rAF spring port of magicui's motion ticker (no motion dep);
// stiffness 100 / damping 60 and en-US grouping match upstream exactly.
export function NumberTicker({
  value,
  startValue = 0,
  direction = "up",
  delay = 0,
  className,
  decimalPlaces = 0,
  ...props
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const to = direction === "down" ? startValue : value;
    const from = direction === "down" ? value : startValue;
    const fmt = (n: number) =>
      Intl.NumberFormat("en-US", {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
      }).format(Number(n.toFixed(decimalPlaces)));
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.textContent = fmt(to);
      return;
    }
    let raf = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let x = from;
    let v = 0;
    let last = 0;
    const step = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      v += (-100 * (x - to) - 60 * v) * dt;
      x += v * dt;
      if (el) el.textContent = fmt(x);
      if (Math.abs(x - to) < 0.5 * Math.pow(10, -decimalPlaces) && Math.abs(v) < 0.05) {
        if (el) el.textContent = fmt(to);
        return;
      }
      raf = requestAnimationFrame(step);
    };
    const io = new IntersectionObserver(
      (es) => {
        if (!es[0].isIntersecting) return;
        io.disconnect();
        timer = setTimeout(() => {
          last = performance.now();
          raf = requestAnimationFrame(step);
        }, delay * 1000);
      },
      { threshold: 0 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      if (timer !== null) clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [value, startValue, direction, delay, decimalPlaces]);

  return (
    <span
      ref={ref}
      className={cn("inline-block tracking-wider text-black tabular-nums dark:text-white", className)}
      {...props}
    >
      {startValue}
    </span>
  );
}
