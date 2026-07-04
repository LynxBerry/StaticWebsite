'use client';

interface ProgressBarProps {
  value: number;
  max?: number;
  color?: 'primary' | 'success';
  showLabel?: boolean;
  className?: string;
}

export default function ProgressBar({
  value,
  max = 100,
  color = 'primary',
  showLabel = false,
  className = ''
}: ProgressBarProps) {
  const percent = max === 0 ? 0 : Math.min(100, Math.max(0, Math.round((value / max) * 100)));
  // Neutral grey-white fill, zero hue, low saturation. Reads clearly
  // against the dark photo backdrop via its opacity contrast with the
  // translucent track.
  // Light green-tinted fill — neutral enough to stay calm, but carries a
  // hint of the brand sprout green so it ties into the warm-farm palette.
  const fillClass = 'bg-gradient-to-r from-[#e8f0d8] to-[#a8c890]';

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex-1 h-2.5 rounded-full bg-white/15">
        <div
          className={`h-[calc(100%-4px)] my-[2px] ml-[2px] rounded-full ${fillClass} transition-all duration-sprout-slow ease-sprout-out`}
          style={{ width: `calc(${percent}% - 4px)` }}
        />
      </div>
      {showLabel && (
        <span className="flex-none text-sm text-white/80 tabular-nums">
          {percent}%
        </span>
      )}
    </div>
  );
}
