import { useEffect, useState, type CSSProperties } from "react";

import { cn } from "@/lib/cn";

interface MeteorsProps {
  number?: number;
  minDelay?: number;
  maxDelay?: number;
  minDuration?: number;
  maxDuration?: number;
  angle?: number;
  className?: string;
}

// ponytail: verbatim upstream behavior (random vw positions, per-meteor
// timing, sweep keyframes live in styles.css); no motion dep needed —
// the motion is pure CSS.
export const Meteors = ({
  number = 20,
  minDelay = 0.2,
  maxDelay = 1.2,
  minDuration = 2,
  maxDuration = 10,
  angle = 215,
  className,
}: MeteorsProps) => {
  const [meteorStyles, setMeteorStyles] = useState<Array<CSSProperties>>([]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const styles = [...new Array(number)].map(
      () =>
        ({
          "--angle": `${-angle}deg`,
          top: "-5%",
          left: `calc(0% + ${Math.floor(Math.random() * window.innerWidth)}px)`,
          animationDelay: `${Math.random() * (maxDelay - minDelay) + minDelay}s`,
          animationDuration: `${Math.floor(Math.random() * (maxDuration - minDuration) + minDuration)}s`,
        }) as CSSProperties,
    );
    setMeteorStyles(styles);
  }, [number, minDelay, maxDelay, minDuration, maxDuration, angle]);

  return (
    <>
      {[...meteorStyles].map((style, idx) => (
        <span
          key={idx}
          style={{ ...style }}
          className={cn(
            "meteor-fall pointer-events-none absolute size-0.5 rounded-full bg-zinc-500 shadow-[0_0_0_1px_#ffffff10]",
            className,
          )}
        >
          <span className="pointer-events-none absolute top-1/2 -z-10 h-px w-[50px] -translate-y-1/2 bg-gradient-to-r from-zinc-500 to-transparent" />
        </span>
      ))}
    </>
  );
};
