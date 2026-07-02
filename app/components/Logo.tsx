interface LogoProps {
  size?: number;
  className?: string;
  glow?: boolean;
}

/**
 * Sprout logo — same motif as the favicon (app/icon.svg): orange gradient
 * rounded square with a white sprout. Used in the page header and login.
 */
export default function Logo({ size = 48, className = '', glow = false }: LogoProps) {
  return (
    <div
      className={`inline-flex items-center justify-center ${glow ? 'drop-shadow-[0_4px_20px_rgba(251,146,60,0.45)]' : ''} ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="logo-bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fb923c" />
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="14" fill="url(#logo-bg)" />
        <g fill="none" stroke="#fff7ed" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M32 46 L32 28" />
          <path d="M32 32 C 24 30, 18 24, 18 16 C 26 16, 32 22, 32 32 Z" fill="#fff7ed" />
          <path d="M32 30 C 40 28, 46 22, 46 14 C 38 14, 32 20, 32 30 Z" fill="#fff7ed" />
        </g>
        <circle cx="32" cy="28" r="2.4" fill="#fb923c" />
      </svg>
    </div>
  );
}
