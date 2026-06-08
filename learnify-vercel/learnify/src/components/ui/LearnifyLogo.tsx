// Logo #2 — Badge Style (selected variant)
// Light mode: blue pill + dark wordmark
// Dark mode: dark pill + white wordmark

interface LogoProps {
  size?: "sm" | "md" | "lg";
  /** Override theme — defaults to CSS class-based dark mode */
  variant?: "light" | "dark";
}

const sizes = {
  sm:  { width: 130, height: 34, scale: 0.59 },
  md:  { width: 180, height: 46, scale: 0.82 },
  lg:  { width: 220, height: 56, scale: 1    },
};

export default function LearnifyLogo({ size = "md", variant }: LogoProps) {
  const { width, height, scale } = sizes[size];

  // Light variant SVG — Logo #2 Badge Style (white bg)
  const LightSVG = (
    <svg
      width={width}
      height={height}
      viewBox="0 0 220 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Learnify logo"
      role="img"
    >
      {/* Blue pill bg for icon */}
      <rect x="0" y="4" width="46" height="46" rx="14" fill="#1d4ed8"/>
      {/* L vertical bar (white) */}
      <rect x="8" y="10" width="7" height="28" rx="2" fill="white"/>
      {/* L horizontal bar (white) */}
      <rect x="8" y="32" width="24" height="7" rx="2" fill="white"/>
      {/* Rising graph line */}
      <polyline
        points="10,30 17,22 24,15 30,9"
        fill="none"
        stroke="#93c5fd"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Graph dots */}
      <circle cx="17" cy="22" r="2" fill="white" opacity=".7"/>
      <circle cx="24" cy="15" r="2" fill="white" opacity=".7"/>
      <circle cx="30" cy="9"  r="2.5" fill="white"/>
      {/* Wordmark — dark text + blue "ify" */}
      <text
        x="58" y="37"
        fontFamily="Montserrat, sans-serif"
        fontSize="28"
        fontWeight="800"
        fill="#0f172a"
        letterSpacing="-0.5"
      >
        learn<tspan fill="#1d4ed8">ify</tspan>
      </text>
    </svg>
  );

  // Dark variant SVG — dark pill + white wordmark + blue "ify"
  const DarkSVG = (
    <svg
      width={width}
      height={height}
      viewBox="0 0 220 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Learnify logo"
      role="img"
    >
      {/* Dark pill bg */}
      <rect x="0" y="4" width="46" height="46" rx="14" fill="#1e293b"/>
      {/* L vertical bar (blue) */}
      <rect x="8" y="10" width="7" height="28" rx="2" fill="#3b82f6"/>
      {/* L horizontal bar (blue) */}
      <rect x="8" y="32" width="24" height="7" rx="2" fill="#3b82f6"/>
      {/* Rising graph line */}
      <polyline
        points="10,30 17,22 24,15 30,9"
        fill="none"
        stroke="#93c5fd"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Graph dots */}
      <circle cx="17" cy="22" r="2" fill="#60a5fa"/>
      <circle cx="24" cy="15" r="2" fill="#60a5fa"/>
      <circle cx="30" cy="9"  r="2.5" fill="#bfdbfe"/>
      {/* Wordmark — white text + blue-400 "ify" */}
      <text
        x="58" y="37"
        fontFamily="Montserrat, sans-serif"
        fontSize="28"
        fontWeight="800"
        fill="white"
        letterSpacing="-0.5"
      >
        learn<tspan fill="#60a5fa">ify</tspan>
      </text>
    </svg>
  );

  if (variant === "light") return LightSVG;
  if (variant === "dark") return DarkSVG;

  // Auto: CSS dark mode using two overlaid divs
  return (
    <span className="inline-flex items-center">
      {/* Shown in light mode */}
      <span className="dark:hidden">{LightSVG}</span>
      {/* Shown in dark mode */}
      <span className="hidden dark:inline">{DarkSVG}</span>
    </span>
  );
}

// Icon-only variant (32px square, used in favicon previews, mobile etc.)
export function LearnifyIcon({ size = 36 }: { size?: number }) {
  return (
    <>
      {/* Light */}
      <span className="dark:hidden">
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
          <rect width="64" height="64" rx="16" fill="#1d4ed8"/>
          <rect x="12" y="12" width="9" height="34" rx="3" fill="white"/>
          <rect x="12" y="40" width="32" height="9" rx="3" fill="white"/>
          <polyline points="14,38 22,27 30,18 40,10" fill="none" stroke="#93c5fd" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="22" cy="27" r="3" fill="white" opacity=".7"/>
          <circle cx="30" cy="18" r="3" fill="white" opacity=".7"/>
          <circle cx="40" cy="10" r="3.5" fill="white"/>
        </svg>
      </span>
      {/* Dark */}
      <span className="hidden dark:inline">
        <svg width={size} height={size} viewBox="0 0 52 52" fill="none" aria-hidden="true">
          <rect width="52" height="52" rx="14" fill="#1e293b"/>
          <rect x="10" y="10" width="8" height="28" rx="2.5" fill="#3b82f6"/>
          <rect x="10" y="32" width="26" height="8" rx="2.5" fill="#3b82f6"/>
          <polyline points="12,30 19,22 26,15 33,9" fill="none" stroke="#93c5fd" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="19" cy="22" r="2.5" fill="#60a5fa"/>
          <circle cx="26" cy="15" r="2.5" fill="#60a5fa"/>
          <circle cx="33" cy="9"  r="3" fill="#bfdbfe"/>
        </svg>
      </span>
    </>
  );
}
