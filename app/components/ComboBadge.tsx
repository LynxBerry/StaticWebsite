'use client';

interface ComboBadgeProps {
  count: number;
}

export default function ComboBadge({ count }: ComboBadgeProps) {
  if (count < 2) return null;

  return (
    <div
      key={count} // re-trigger animation each time count changes
      className="animate-combo text-white pointer-events-none fixed top-20 left-1/2 -translate-x-1/2 z-40 px-5 py-2 rounded-full bg-harvest-500 font-bold text-lg"
    >
      🔥 连击 x{count}
    </div>
  );
}
