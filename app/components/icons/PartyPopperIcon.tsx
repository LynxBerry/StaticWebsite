export function PartyPopperIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <defs>
        <linearGradient id="partyCone" x1="2" y1="22" x2="12.7" y2="18" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#facc15" />
        </linearGradient>
      </defs>

      {/* Confetti dots */}
      <circle cx="4" cy="3" r="1.2" fill="#ef4444" stroke="none" />
      <circle cx="22" cy="8" r="1.2" fill="#3b82f6" stroke="none" />
      <circle cx="15" cy="2" r="1.2" fill="#22c55e" stroke="none" />
      <circle cx="22" cy="20" r="1.2" fill="#a855f7" stroke="none" />

      {/* Streamers */}
      <path d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10" stroke="#ec4899" />
      <path d="m22 13-.82-.33c-.86-.34-1.82.2-1.98 1.11-.11.7-.72 1.22-1.43 1.22H17" stroke="#06b6d4" />
      <path d="m11 2 .33.82c.34.86-.2 1.82-1.11 1.98C9.52 4.9 9 5.52 9 6.23V7" stroke="#f97316" />

      {/* Party cone + burst */}
      <path d="M5.8 11.3 2 22l10.7-3.79" fill="url(#partyCone)" stroke="#d97706" />
      <path
        d="M11 13c1.93 1.93 2.83 4.17 2 5-.83.83-3.07-.07-5-2-1.93-1.93-2.83-4.17-2-5 .83-.83 3.07.07 5 2Z"
        fill="#fef08a"
        stroke="#eab308"
      />
    </svg>
  );
}
