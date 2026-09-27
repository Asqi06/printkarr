import React, { forwardRef, useRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/cn";

export interface DockProps extends VariantProps<typeof dockVariants> {
  className?: string;
  iconSize?: number;
  iconMagnification?: number;
  disableMagnification?: boolean;
  iconDistance?: number;
  direction?: "top" | "middle" | "bottom";
  children: React.ReactNode;
}

const DEFAULT_SIZE = 40;
const DEFAULT_MAGNIFICATION = 60;
const DEFAULT_DISTANCE = 140;
const DEFAULT_DISABLEMAGNIFICATION = false;

const dockVariants = cva(
  "supports-backdrop-blur:bg-white/10 supports-backdrop-blur:dark:bg-black/10 mx-auto mt-8 flex h-[58px] w-max items-center justify-center gap-2 rounded-2xl border p-2 backdrop-blur-md",
);

// ponytail: magnification without the motion dep — direct width/height writes
// smoothed by CSS transition; same 40→60px / 140px range as upstream.
const Dock = forwardRef<HTMLDivElement, DockProps>(
  (
    {
      className,
      children,
      iconSize = DEFAULT_SIZE,
      iconMagnification = DEFAULT_MAGNIFICATION,
      disableMagnification = DEFAULT_DISABLEMAGNIFICATION,
      iconDistance = DEFAULT_DISTANCE,
      direction = "middle",
      ...props
    },
    ref,
  ) => {
    const innerRef = useRef<HTMLDivElement | null>(null);
    const setRefs = (el: HTMLDivElement | null) => {
      innerRef.current = el;
      if (typeof ref === "function") ref(el);
      else if (ref) ref.current = el;
    };

    const paint = (clientX: number | null) => {
      const root = innerRef.current;
      if (!root) return;
      const reduce =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      root.querySelectorAll<HTMLElement>("[data-dock-icon]").forEach((ic) => {
        if (clientX === null || reduce || disableMagnification) {
          ic.style.width = `${iconSize}px`;
          ic.style.height = `${iconSize}px`;
          return;
        }
        const r = ic.getBoundingClientRect();
        const t = Math.max(0, 1 - Math.abs(clientX - (r.left + r.width / 2)) / iconDistance);
        const s = iconSize + (iconMagnification - iconSize) * t;
        ic.style.width = `${s}px`;
        ic.style.height = `${s}px`;
      });
    };

    const renderChildren = () => {
      return React.Children.map(children, (child) => {
        if (React.isValidElement<DockIconProps>(child) && child.type === DockIcon) {
          return React.cloneElement(child, {
            ...child.props,
            size: iconSize,
            magnification: iconMagnification,
            disableMagnification: disableMagnification,
            distance: iconDistance,
          });
        }
        return child;
      });
    };

    return (
      <div
        ref={setRefs}
        onMouseMove={(e) => paint(e.clientX)}
        onMouseLeave={() => paint(null)}
        {...props}
        className={cn(dockVariants({ className }), {
          "items-start": direction === "top",
          "items-center": direction === "middle",
          "items-end": direction === "bottom",
        })}
      >
        {renderChildren()}
      </div>
    );
  },
);

Dock.displayName = "Dock";

export interface DockIconProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: number;
  magnification?: number;
  disableMagnification?: boolean;
  distance?: number;
  className?: string;
  children?: React.ReactNode;
}

const DockIcon = ({
  size = DEFAULT_SIZE,
  magnification: _magnification,
  disableMagnification,
  distance: _distance,
  className,
  children,
  ...props
}: DockIconProps) => {
  const padding = Math.max(6, size * 0.2);
  return (
    <div
      data-dock-icon
      style={{ width: size, height: size, padding }}
      className={cn(
        "flex aspect-square cursor-pointer items-center justify-center rounded-full transition-[width,height] duration-150 ease-out",
        disableMagnification && "hover:bg-muted-foreground transition-colors",
        className,
      )}
      {...props}
    >
      <div>{children}</div>
    </div>
  );
};

DockIcon.displayName = "DockIcon";

export { Dock, DockIcon, dockVariants };
