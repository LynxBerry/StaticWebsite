interface LogoProps {
  size?: number;
  className?: string;
  glow?: boolean;
}

/**
 * Farm basket logo — a basket of "word fruits" with a sprout, matching the
 * farm/harvest theme. Used in the page header and login card.
 *
 * Uses a plain <img> (not next/image) so the transparent background is
 * preserved exactly — next/image can composite a white bg for some PNGs.
 */
export default function Logo({ size = 48, className = '', glow = false }: LogoProps) {
  return (
    <img
      src="/farm-logo.png"
      alt="单词农场"
      width={size}
      height={size}
      draggable={false}
      className={`rounded-2xl ${glow ? 'drop-shadow-[0_4px_20px_rgba(251,146,60,0.45)]' : ''} ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
