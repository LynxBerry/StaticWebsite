interface LogoProps {
  size?: number;
  className?: string;
  glow?: boolean;
}

/**
 * Farm logo — the 🌳 tree emoji that also represents stage 5 (即将掌握)
 * in the plant growth system. Keeps brand identity consistent with the
 * in-app progression icons.
 */
export default function Logo({ size = 48, className = '', glow = false }: LogoProps) {
  return (
    <span
      className={`inline-flex items-center justify-center leading-none select-none ${glow ? 'drop-shadow-[0_4px_20px_rgba(112,176,112,0.4)]' : ''} ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.85 }}
      role="img"
      aria-label="单词农场"
    >
      🌳
    </span>
  );
}
