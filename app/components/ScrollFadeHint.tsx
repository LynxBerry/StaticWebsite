export function ScrollFadeHint() {
  return (
    <div className="absolute bottom-3 left-3 right-3 h-12 bg-gradient-to-t from-white/95 to-transparent pointer-events-none rounded-b-[16px] flex flex-col items-center justify-end pb-2">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-farm-textSecondary/60 -mb-2"
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-farm-textSecondary/60"
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
    </div>
  );
}
