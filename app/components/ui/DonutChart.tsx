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
 * Minimal donut chart rendered with CSS conic-gradient.
 *
 * The fill follows the arc from 12 o'clock clockwise, with a subtle
 * light-to-dark green gradient that travels along the progress direction.
 * The inner disc is white so it blends into the card surface.
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
  const pct = max === 0 ? 0 : Math.min(100, Math.max(0, (value / max) * 100));
  const radius = (size - stroke) / 2;
  const endAngleDeg = pct * 3.6;
  const endAngleRad = (endAngleDeg - 90) * (Math.PI / 180);
  const endX = size / 2 + radius * Math.cos(endAngleRad);
  const endY = size / 2 + radius * Math.sin(endAngleRad);

  return (
    <div
      className="relative shrink-0 rounded-full"
      style={{ width: size, height: size }}
      role="img"
      aria-label={ariaLabel ?? `${Math.round(pct)}%`}
    >
      {/* Track ring: grey stroke on transparent center. */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, transparent ${radius - stroke / 2}px, #e5e7eb ${radius - stroke / 2}px, #e5e7eb ${radius + stroke / 2}px, transparent ${radius + stroke / 2}px)`
        }}
      />
      {/* Fill ring: conic gradient follows the progress arc. */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(from 0deg, #c8e0c7 0%, #70b070 ${pct}%, transparent ${pct}%)`
        }}
      />
      {/* Rounded cap at the start of the arc (12 o'clock). */}
      {pct > 0 && pct < 100 && (
        <div
          className="absolute rounded-full"
          style={{
            width: stroke,
            height: stroke,
            backgroundColor: '#c8e0c7',
            left: size / 2 - stroke / 2,
            top: 0
          }}
        />
      )}
      {/* Rounded cap at the end of the progress arc. */}
      {pct > 0 && pct < 100 && (
        <div
          className="absolute rounded-full"
          style={{
            width: stroke,
            height: stroke,
            backgroundColor: '#70b070',
            left: endX - stroke / 2,
            top: endY - stroke / 2
          }}
        />
      )}
      {/* Inner disc: white to match the card background. */}
      <div
        className="absolute rounded-full bg-white flex flex-col items-center justify-center"
        style={{ top: stroke, right: stroke, bottom: stroke, left: stroke }}
      >
        {label && (
          <span
            className="font-bold text-farm-text leading-none"
            style={{ fontSize: size * 0.22 }}
          >
            {label}
          </span>
        )}
        {sublabel && (
          <span
            className="text-farm-muted leading-none mt-0.5"
            style={{ fontSize: size * 0.14 }}
          >
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}
