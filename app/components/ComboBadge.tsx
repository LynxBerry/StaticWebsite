'use client';

interface ComboBadgeProps {
  count: number;
}

export default function ComboBadge({ count }: ComboBadgeProps) {
  if (count < 2) return null;

  return (
    <div
      key={count} // re-trigger animation each time count changes
      className="animate-combo pointer-events-none fixed top-20 left-1/2 -translate-x-1/2 z-40 px-5 py-2 rounded-full bg-gradient-to-r from-[#70B070] to-[#5CA85C] text-white font-bold text-lg shadow-[0_4px_20px_rgba(112,176,112,0.5)] border border-white/20"
    >
      🔥 连击 x{count}
    </div>
  );
}
