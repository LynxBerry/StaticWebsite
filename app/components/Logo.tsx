interface LogoProps {
  size?: number;
  className?: string;
  glow?: boolean;
}

/**
 * Sprout logo — a tree emoji (🌳) rendered as text. Simple, recognizable,
 * and on-theme (growth). Sized via the `size` prop (in px).
 */
export default function Logo({ size = 40, className = '', glow = false }: LogoProps) {
  return (
    <span
      role="img"
      aria-label="Sprout"
      className={`${glow ? 'drop-shadow-[0_0_12px_rgba(112,176,112,0.5)]' : ''} ${className}`}
      style={{ fontSize: size, lineHeight: 1, display: 'inline-block' }}
    >
      🌳
    </span>
  );
}
