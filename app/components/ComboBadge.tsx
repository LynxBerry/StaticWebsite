'use client';

interface ComboBadgeProps {
  count: number;
}

export default function ComboBadge({ count }: ComboBadgeProps) {
  if (count < 2) return null;

  return (
    <div
      key={count} // re-trigger animation each time count changes
      className="animate-combo pointer-events-none fixed top-20 left-1/2 -translate-x-1/2 z-40 px-5 py-2 rounded-full bg-gradient-to-r from-orange-500/90 to-amber-500/90 text-farm-text font-bold text-lg shadow-[0_4px_20px_rgba(249,115,22,0.5)] backdrop-blur-glass border border-white/20"
    >
      🔥 连击 x{count}
    </div>
  );
}
