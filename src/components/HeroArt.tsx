"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Printkarr hero illustration — printer → prints → doorstep.
 * Hand-built matte shapes in brand colours; animated with Framer Motion,
 * falling back to static when prefers-reduced-motion.
 */
export function HeroArt() {
  const reduce = useReducedMotion();
  const float = (dur: number, delay = 0) => ({
    animate: reduce ? {} : { y: [0, -9, 0] },
    transition: reduce
      ? undefined
      : { duration: dur, repeat: Infinity, ease: "easeInOut" as const, delay },
  });

  return (
    <svg
      viewBox="0 0 520 440"
      className="h-auto w-full"
      role="img"
      aria-label="A printer printing documents that travel along a dotted route to a yellow delivery bag"
    >
      <defs>
        <pattern id="pk-dots" width="11" height="11" patternUnits="userSpaceOnUse">
          <circle cx="1.5" cy="1.5" r="1.2" fill="#0E1A2B" opacity="0.14" />
        </pattern>
      </defs>

      {/* backdrop shapes */}
      <g aria-hidden>
        <rect x="34" y="66" width="118" height="150" rx="14" fill="url(#pk-dots)" />
        <circle cx="392" cy="128" r="82" fill="#FFC700" opacity="0.92" />
        <path
          d="M60 96c26-28 74-30 96-4-30 22-70 26-96 4Z"
          fill="#2D5BFF"
          opacity="0.9"
        />
      </g>

      {/* floating envelope */}
      <motion.g {...float(6, 0.4)}>
        <g transform="rotate(-7 200 130)">
          <rect x="158" y="104" width="84" height="56" rx="8" fill="#F8F6F0" stroke="#0E1A2B" strokeOpacity="0.12" strokeWidth="2" />
          <path d="M162 112l38 26 38-26" fill="none" stroke="#5B6577" strokeWidth="2" strokeOpacity="0.55" strokeLinecap="round" />
          <rect x="192" y="128" width="16" height="10" rx="3" fill="#FFC700" />
        </g>
      </motion.g>

      {/* dotted route printer → bag → pin */}
      <path
        d="M262 246c22-38 62-34 84-8s44 22 58 12"
        fill="none"
        stroke="#0E1A2B"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="2 10"
        className="dash-anim"
        opacity="0.8"
      />

      {/* printer */}
      <g>
        <ellipse cx="180" cy="409" rx="124" ry="11" fill="#0E1A2B" opacity="0.08" />
        <motion.g {...float(5.4, 0)}>
          <rect x="264" y="196" width="96" height="66" rx="7" fill="#F8F6F0" stroke="#0E1A2B" strokeOpacity="0.12" strokeWidth="2" />
          <path d="M282 216h60M282 232h44M282 248h56" stroke="#5B6577" strokeWidth="2" strokeOpacity="0.4" strokeLinecap="round" />
          <rect x="146" y="102" width="86" height="60" rx="7" fill="#F8F6F0" stroke="#0E1A2B" strokeOpacity="0.12" strokeWidth="2" transform="rotate(6 189 132)" />
          <path d="M158 118l60 12" stroke="#5B6577" strokeWidth="2" strokeOpacity="0.35" strokeLinecap="round" transform="rotate(6 189 132)" />
          <rect x="66" y="264" width="232" height="122" rx="18" fill="#0E1A2B" />
          <rect x="66" y="248" width="232" height="30" rx="15" fill="#16283F" />
          <rect x="98" y="255" width="150" height="9" rx="4.5" fill="#F8F6F0" opacity="0.28" />
          <rect x="88" y="306" width="64" height="24" rx="7" fill="#FFC700" />
          <circle cx="102" cy="354" r="4" fill="#1FA971" />
          <circle cx="252" cy="310" r="5" fill="#2D5BFF" />
          <rect x="118" y="342" width="128" height="26" rx="9" fill="#F8F6F0" opacity="0.92" />
          <path d="M130 355h104" stroke="#0E1A2B" strokeWidth="2" strokeOpacity="0.25" strokeLinecap="round" />
          <rect x="84" y="386" width="26" height="10" rx="4" fill="#0E1A2B" />
          <rect x="254" y="386" width="26" height="10" rx="4" fill="#0E1A2B" />
        </motion.g>
      </g>

      {/* delivery bag */}
      <g>
        <ellipse cx="428" cy="412" rx="94" ry="10" fill="#0E1A2B" opacity="0.08" />
        <motion.g {...float(6.4, 0.9)}>
          <path d="M398 296c8-18 52-18 60 0" fill="none" stroke="#0E1A2B" strokeWidth="7" strokeLinecap="round" />
          <rect x="404" y="272" width="48" height="40" rx="6" fill="#F8F6F0" stroke="#0E1A2B" strokeOpacity="0.12" strokeWidth="2" transform="rotate(-5 428 292)" />
          <path d="M416 288h24M416 300h16" stroke="#5B6577" strokeWidth="2" strokeOpacity="0.4" strokeLinecap="round" transform="rotate(-5 428 292)" />
          <rect x="366" y="302" width="124" height="106" rx="16" fill="#FFC700" />
          <rect x="366" y="302" width="124" height="24" rx="12" fill="#E2AC00" opacity="0.55" />
          <rect x="386" y="344" width="84" height="34" rx="9" fill="#F8F6F0" />
          <circle cx="468" cy="330" r="7" fill="#E6007E" />
          <path d="M398 394h60" stroke="#0E1A2B" strokeWidth="3" strokeLinecap="round" strokeOpacity="0.35" />
        </motion.g>
      </g>

      {/* delivery pin */}
      <g>
        <ellipse cx="470" cy="236" rx="26" ry="6" fill="#0E1A2B" opacity="0.1" />
        <motion.g {...float(5.8, 0.2)}>
          <path
            d="M480 200c-10.5 0-19 8.4-19 18.8 0 13.1 19 25.2 19 25.2s19-12.1 19-25.2c0-10.4-8.5-18.8-19-18.8Z"
            fill="#2D5BFF"
          />
          <circle cx="480" cy="218" r="7.5" fill="#F8F6F0" />
        </motion.g>
      </g>
    </svg>
  );
}
