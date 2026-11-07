/**
 * Small decorative compositions shared across pages.
 * Kept server-compatible (pure SVG, CSS animation only).
 */
export function RouteArt() {
  return (
    <svg viewBox="0 0 560 150" className="h-auto w-full" role="img" aria-label="Dotted route from a printer through a delivery bag to your doorstep">
      <g aria-hidden>
        <circle cx="70" cy="95" r="26" fill="#F8F6F0" stroke="#0E1A2B" strokeOpacity="0.18" strokeWidth="2" />
        <rect x="56" y="70" width="28" height="40" rx="7" fill="#0E1A2B" />
        <path d="M60 78h20" stroke="#FFC700" strokeWidth="3" strokeLinecap="round" />
        <path d="M62 98h16" stroke="#F8F6F0" strokeOpacity="0.7" strokeWidth="3" strokeLinecap="round" />
      </g>
      <path
        d="M110 92c60-40 120 30 180-6s110-40 150 4"
        fill="none"
        stroke="#0E1A2B"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="2 10"
        className="dash-anim"
        opacity="0.75"
      />
      <g aria-hidden>
        <rect x="278" y="34" width="46" height="52" rx="10" fill="#FFC700" />
        <path d="M290 40c2-12 22-12 24 0" fill="none" stroke="#0E1A2B" strokeWidth="4" strokeLinecap="round" />
        <rect x="288" y="52" width="26" height="18" rx="4" fill="#F8F6F0" />
      </g>
      <g aria-hidden>
        <path d="M474 60c-9 0-16 7.2-16 16 0 11 16 21 16 21s16-10 16-21c0-8.8-7-16-16-16Z" fill="#2D5BFF" />
        <circle cx="474" cy="76" r="6.5" fill="#F8F6F0" />
        <ellipse cx="474" cy="106" rx="22" ry="5" fill="#0E1A2B" opacity="0.1" />
      </g>
      <text x="474" y="136" textAnchor="middle" fontFamily="var(--font-jetbrains), monospace" fontSize="10" fill="#5B6577">
        your doorstep
      </text>
      <text x="70" y="136" textAnchor="middle" fontFamily="var(--font-jetbrains), monospace" fontSize="10" fill="#5B6577">
        our printer
      </text>
    </svg>
  );
}
