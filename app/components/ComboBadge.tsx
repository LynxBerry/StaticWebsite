'use client';

interface ComboBadgeProps {
  count: number;
}

export default function ComboBadge({ count }: ComboBadgeProps) {
  if (count < 2) return null;

  return (
    <div
      key={count} // re-trigger animation each time count changes
      className="animate-combo text-engrave-dark pointer-events-none fixed top-20 left-1/2 -translate-x-1/2 z-40 px-5 py-2 rounded-full bg-gradient-to-r from-[#fbbf24] to-[#f97316] text-white font-bold text-lg shadow-[0_4px_20px_rgba(251,191,36,0.5)]"
    >
      🔥 连击 x{count}
    </div>
  );
}
