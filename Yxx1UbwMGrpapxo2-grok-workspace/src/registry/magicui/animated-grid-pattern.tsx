import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type CSSProperties,
} from "react";

import { cn } from "@/lib/cn";

export interface AnimatedGridPatternProps extends ComponentPropsWithoutRef<"svg"> {
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  strokeDasharray?: number;
  numSquares?: number;
  maxOpacity?: number;
  duration?: number;
  repeatDelay?: number;
}

type Square = {
  id: number;
  pos: [number, number];
  iteration: number;
};

// ponytail: CSS-keyframe port of magicui's blink (no motion dep for a
// decorative hero grid); upstream uses motion/react with identical timing.
export function AnimatedGridPattern({
  width = 40,
  height = 40,
  x = -1,
  y = -1,
  strokeDasharray = 0,
  numSquares = 50,
  className,
  maxOpacity = 0.5,
  duration = 4,
  repeatDelay = 0.5,
  ...props
}: AnimatedGridPatternProps) {
  const id = useId();
  const anim = `agp${id.replace(/[^a-zA-Z0-9]/g, "")}`;
  const containerRef = useRef<SVGSVGElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [squares, setSquares] = useState<Array<Square>>([]);

  const getPos = useCallback((): [number, number] => {
    return [
      Math.floor((Math.random() * dimensions.width) / width),
      Math.floor((Math.random() * dimensions.height) / height),
    ];
  }, [dimensions.height, dimensions.width, height, width]);

  const generateSquares = useCallback(
    (count: number) => {
      return Array.from({ length: count }, (_, i) => ({
        id: i,
        pos: getPos(),
        iteration: 0,
      }));
    },
    [getPos],
  );

  const updateSquarePosition = useCallback(
    (squareId: number) => {
      setSquares((currentSquares) => {
        const current = currentSquares[squareId];
        if (!current || current.id !== squareId) return currentSquares;

        const nextSquares = currentSquares.slice();
        nextSquares[squareId] = {
          ...current,
          pos: getPos(),
          iteration: current.iteration + 1,
        };

        return nextSquares;
      });
    },
    [getPos],
  );

  useEffect(() => {
    if (dimensions.width && dimensions.height) {
      setSquares(generateSquares(numSquares));
    }
  }, [dimensions.width, dimensions.height, generateSquares, numSquares]);

  useEffect(() => {
    const element = containerRef.current;
    let resizeObserver: ResizeObserver | null = null;

    if (element) {
      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setDimensions((currentDimensions) => {
            const nextWidth = entry.contentRect.width;
            const nextHeight = entry.contentRect.height;
            if (
              currentDimensions.width === nextWidth &&
              currentDimensions.height === nextHeight
            ) {
              return currentDimensions;
            }
            return { width: nextWidth, height: nextHeight };
          });
        }
      });

      resizeObserver.observe(element);
    }

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, []);

  // One blink = fade up (duration) + fade down (duration) + rest (repeatDelay),
  // matching upstream's forward + reverse + repeatDelay cycle. Remounting on
  // teleport (key bumps with iteration) restarts the animation with its stagger.
  const total = duration * 2 + repeatDelay;
  const peak = +((duration / total) * 100).toFixed(3);
  const fall = +(((duration * 2) / total) * 100).toFixed(3);

  return (
    <svg
      ref={containerRef}
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 h-full w-full fill-gray-400/30 stroke-gray-400/30",
        className,
      )}
      style={{ "--agp-max": maxOpacity } as CSSProperties}
      {...props}
    >
      <style>{`@keyframes ${anim}{0%{opacity:0}${peak}%{opacity:var(--agp-max)}${fall}%{opacity:0}100%{opacity:0}}`}</style>
      <defs>
        <pattern
          id={id}
          width={width}
          height={height}
          patternUnits="userSpaceOnUse"
          x={x}
          y={y}
        >
          <path
            d={`M.5 ${height}V.5H${width}`}
            fill="none"
            strokeDasharray={strokeDasharray}
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
      <svg x={x} y={y} className="overflow-visible">
        {squares.map(({ pos: [squareX, squareY], id, iteration }, index) => (
          <rect
            key={`${id}-${iteration}`}
            width={width - 1}
            height={height - 1}
            x={squareX * width + 1}
            y={squareY * height + 1}
            fill="currentColor"
            strokeWidth="0"
            style={{
              animation: `${anim} ${total}s ease-in-out ${index * 0.1}s 1 both`,
            }}
            onAnimationEnd={() => updateSquarePosition(id)}
          />
        ))}
      </svg>
    </svg>
  );
}
