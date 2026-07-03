'use client';

interface DonutChartProps {
  /** Value 0..max, mapped to the filled arc. */
  value: number;
  /** Total scale. Defaults to 100 (so value is a percentage). */
  max?: number;
  /** Diameter in px. Defaults to 56. */
  size?: number;
  /** Stroke width in px. Defaults to 6. */
  stroke?: number;
  /** Optional center label (e.g. "5/9"). */
  label?: string;
  /** Optional center sublabel (e.g. "已学"). */
  sublabel?: string;
  /** Accessible description for screen readers. */
  ariaLabel?: string;
}

/**
 * Minimal SVG donut chart — no chart library, no deps.
 *
 * Two concentric arcs: a translucent track and a grey-white fill, matching
 * the ProgressBar palette (neutral grey-white, low saturation). Animate the
 * fill arc on mount so the chart "draws" itself.
 *
 * Used in the Dashboard "今日" card to show the day's completion ratio.
 */
export default function DonutChart({
  value,
  max = 100,
  size = 56,
  stroke = 6,
  label,
  sublabel,
  ariaLabel
}: DonutChartProps) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = max === 0 ? 0 : Math.min(1, Math.max(0, value / max));
  // A tiny gap so a 0% ring still shows a faint full track.
  const dashOffset = circumference * (1 - pct);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={ariaLabel ?? `${Math.round(pct * 100)}%`}
      className="shrink-0"
    >
      {/* Track: translucent white ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth={stroke}
      />
      {/* Fill: grey-white arc, rotated so it starts at 12 o'clock */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="url(#donut-fill)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{
          transition: 'stroke-dashoffset 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}
      />
      {/* Shared gradient def — grey-white, same family as ProgressBar fill */}
      <defs>
        <linearGradient id="donut-fill" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f5f5f5" />
          <stop offset="100%" stopColor="#d4d4d4" />
        </linearGradient>
      </defs>
      {/* Optional center label */}
      {label && (
        <text
          x="50%"
          y={sublabel ? '46%' : '54%'}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="rgba(255,255,255,0.95)"
          fontSize={size * 0.22}
          fontWeight="700"
        >
          {label}
        </text>
      )}
      {sublabel && (
        <text
          x="50%"
          y="66%"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="rgba(255,255,255,0.55)"
          fontSize={size * 0.14}
        >
          {sublabel}
        </text>
      )}
    </svg>
  );
}
