import { SproutIcon } from './icons/SproutIcon';

interface LogoProps {
  size?: number;
  className?: string;
  glow?: boolean;
}

/**
 * Sprout logo — a sprout SVG inside a soft circular badge.
 * The badge uses a pale mint background with a subtle border and shadow
 * so it reads as a polished app icon rather than plain emoji text.
 */
export default function Logo({ size = 40, className = '', glow = false }: LogoProps) {
  const iconSize = Math.round(size * 0.55);
  return (
    <div
      role="img"
      aria-label="Sprout"
      className={`
        inline-flex items-center justify-center rounded-full
        bg-gradient-to-br from-[#f5f9f4] to-[#e8f3e6]
        border border-farm-borderSecondary
        shadow-sm
        ${glow ? 'shadow-[0_0_20px_rgba(112,176,112,0.25)]' : ''}
        ${className}
      `}
      style={{ width: size, height: size }}
    >
      <div style={{ width: iconSize, height: iconSize }}>
        <SproutIcon className="w-full h-full text-sprout-600" />
      </div>
    </div>
  );
}
