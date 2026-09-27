import React, { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

import { cn } from "@/lib/cn";

export interface ConfettiBurstOptions {
  particleCount?: number;
  angle?: number;
  spread?: number;
  origin?: { x: number; y: number };
  colors?: string[];
  scalar?: number;
}

export type ConfettiRef = {
  fire: (opts?: ConfettiBurstOptions) => void;
};

interface ConfettiProps extends React.CanvasHTMLAttributes<HTMLCanvasElement> {
  manualstart?: boolean;
  className?: string;
}

const BRAND_COLORS = ["#1a5bff", "#33a6f4", "#FFD400", "#FA3D1D", "#FD02F5", "#22c55e"];

// ponytail: hand-rolled canvas physics instead of the canvas-confetti dep;
// same celebratory feel (upward cone, gravity, spin, auto-cleanup).
function paint(canvas: HTMLCanvasElement | null, opts: ConfettiBurstOptions) {
  if (!canvas) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const count = opts.particleCount ?? 60;
  const spreadRad = ((opts.spread ?? 100) * Math.PI) / 180;
  const colors = opts.colors ?? BRAND_COLORS;
  const scalar = opts.scalar ?? 1;
  const pr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(window.innerWidth * pr);
  canvas.height = Math.round(window.innerHeight * pr);
  const ox = (opts.origin?.x ?? 0.5) * window.innerWidth;
  const oy = (opts.origin?.y ?? 0.4) * window.innerHeight;
  type P = {
    x: number; y: number; vx: number; vy: number;
    w: number; h: number; r: number; vr: number;
    c: string; life: number; age: number; sd: number; dot: boolean;
  };
  const ps: P[] = [];
  for (let i = 0; i < count; i++) {
    const rad = (((opts.angle ?? 90) - 90) * Math.PI) / 180 + (Math.random() - 0.5) * spreadRad;
    const sp = (380 + Math.random() * 420) * scalar;
    ps.push({
      x: ox, y: oy,
      vx: Math.sin(rad) * sp,
      vy: -Math.cos(rad) * sp,
      w: 5 + Math.random() * 5, h: 8 + Math.random() * 7,
      r: Math.random() * Math.PI * 2, vr: (Math.random() - 0.5) * 12,
      c: colors[(Math.random() * colors.length) | 0],
      life: 1.8 + Math.random() * 1, age: 0,
      sd: Math.random() * 6.2832,
      dot: Math.random() < 0.3,
    });
  }
  let last = performance.now();
  const tick = (now: number) => {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(pr, pr);
    let alive = false;
    for (const p of ps) {
      p.age += dt;
      if (p.age >= p.life) continue;
      alive = true;
      p.vy += 1050 * dt;
      p.vx *= 1 - 1.6 * dt;
      p.vy *= 1 - 0.4 * dt;
      p.x += p.vx * dt;
      p.x += Math.sin(p.age * 5 + p.sd) * 24 * dt;
      p.y += p.vy * dt;
      p.r += p.vr * dt;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r);
      ctx.globalAlpha = p.age > p.life - 0.4 ? Math.max((p.life - p.age) / 0.4, 0) : 1;
      ctx.fillStyle = p.c;
      if (p.dot) {
        ctx.beginPath();
        ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      }
      ctx.restore();
    }
    ctx.restore();
    if (alive) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

export const Confetti = forwardRef<ConfettiRef, ConfettiProps>(function Confetti(
  { manualstart = false, className, ...rest },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useImperativeHandle(
    ref,
    () => ({
      fire: (opts: ConfettiBurstOptions = {}) => paint(canvasRef.current, opts),
    }),
    [],
  );
  useEffect(() => {
    if (!manualstart) {
      const t = setTimeout(() => paint(canvasRef.current, {}), 50);
      return () => clearTimeout(t);
    }
  }, [manualstart]);
  return (
    <canvas
      ref={canvasRef}
      className={cn("pointer-events-none fixed inset-0 z-[200]", className)}
      {...rest}
    />
  );
});

Confetti.displayName = "Confetti";
