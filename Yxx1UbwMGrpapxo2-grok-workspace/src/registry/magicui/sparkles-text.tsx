import { useEffect, useState, type CSSProperties } from "react";

import { cn } from "@/lib/cn";

interface Sparkle {
  id: string;
  x: string;
  y: string;
  color: string;
  delay: number;
  scale: number;
}

interface SparklesTextProps {
  className?: string;
  children: React.ReactNode;
  sparklesCount?: number;
  colors?: {
    first: string;
    second: string;
  };
}

// ponytail: CSS-keyframe port of magicui's motion twinkle (no motion dep);
// same 0.8s opacity/scale/rotate cycle, random anchors, brand-blue default spot.
export const SparklesText: React.FC<SparklesTextProps> = ({
  children,
  colors = { first: "#9E7AFF", second: "#FE8BBB" },
  className,
  sparklesCount = 10,
  ...props
}) => {
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);

  useEffect(() => {
    const generateStar = (i: number): Sparkle => ({
      id: `${i}`,
      x: `${Math.random() * 100}%`,
      y: `${Math.random() * 100}%`,
      color: Math.random() > 0.5 ? colors.first : colors.second,
      delay: Math.random() * 2,
      scale: Math.random() * 1 + 0.3,
    });
    setSparkles(Array.from({ length: sparklesCount }, (_, i) => generateStar(i)));
  }, [colors.first, colors.second, sparklesCount]);

  return (
    <span className={cn("relative inline-block", className)} {...props}>
      <style>{`@keyframes sparkleTwinkle{0%{opacity:0;transform:scale(0) rotate(75deg)}50%{opacity:1;transform:scale(var(--ss,1)) rotate(120deg)}100%{opacity:0;transform:scale(0) rotate(150deg)}}`}</style>
      {sparkles.map((sparkle) => (
        <svg
          key={sparkle.id}
          aria-hidden="true"
          className="sparkle-svg pointer-events-none absolute z-20 opacity-0"
          style={
            {
              left: sparkle.x,
              top: sparkle.y,
              animationDelay: `${sparkle.delay}s`,
              "--ss": sparkle.scale,
              animation: "sparkleTwinkle .8s ease-in-out infinite",
              transformBox: "fill-box",
              transformOrigin: "center",
            } as CSSProperties
          }
          width="21"
          height="21"
          viewBox="0 0 21 21"
        >
          <path
            d="M9.82531 0.843845C10.0553 0.215178 10.9446 0.215178 11.1746 0.843845L11.8618 2.72026C12.4006 4.19229 12.3916 6.39157 13.5 7.5C14.6084 8.60843 16.8077 8.59935 18.2797 9.13822L20.1561 9.82534C20.7858 10.0553 20.7858 10.9447 20.1561 11.1747L18.2797 11.8618C16.8077 12.4007 14.6084 12.3916 13.5 13.5C12.3916 14.6084 12.4006 16.8077 11.8618 18.2798L11.1746 20.1562C10.9446 20.7858 10.0553 20.7858 9.82531 20.1562L9.13819 18.2798C8.59932 16.8077 8.60843 14.6084 7.5 13.5C6.39157 12.3916 4.19225 12.4007 2.72023 11.8618L0.843814 11.1747C0.215148 10.9447 0.215148 10.0553 0.843814 9.82534L2.72023 9.13822C4.19225 8.59935 6.39157 8.60843 7.5 7.5C8.60843 6.39157 8.59932 4.19229 9.13819 2.72026L9.82531 0.843845Z"
            fill={sparkle.color}
          />
        </svg>
      ))}
      <strong>{children}</strong>
    </span>
  );
};
