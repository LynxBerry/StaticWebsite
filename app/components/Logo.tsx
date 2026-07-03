interface LogoProps {
  size?: number;
  className?: string;
  glow?: boolean;
}

/**
 * Sprout logo. Uses the cropped transparent PNG from public/sprout-logo.png.
 * No rounded corners on the container so the full image shows without
 * clipping — make sure the source PNG is cropped to the graphic you want.
 */
export default function Logo({ size = 48, className = '', glow = false }: LogoProps) {
  return (
    <img
      src="/sprout-logo.png"
      alt="Sprout"
      width={size}
      height={size}
      draggable={false}
      className={`${glow ? 'drop-shadow-[0_4px_20px_rgba(112,176,112,0.4)]' : ''} ${className}`}
      style={{ width: 'auto', height: size, objectFit: 'contain' }}
    />
  );
}
