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
  // Solid sprout green — matches the DonutChart arc end-color (#70b070) and
  // the primary button so progress reads with one consistent accent across
  // the app. Previously a from-[#c8e0c7]→sprout-500 linear gradient that
  // clashed with the conic-gradient donuts shown on the same screen.
  const fillClass = 'bg-sprout-500';

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex-1 h-2.5 rounded-full bg-farm-borderSecondary">
        <div
          className={`h-[calc(100%-4px)] my-[2px] ml-[2px] rounded-full ${fillClass} transition-all duration-sprout-slow ease-sprout-out`}
          style={{ width: `calc(${percent}% - 4px)` }}
        />
      </div>
      {showLabel && (
        <span className="flex-none text-sm text-farm-muted tabular-nums">
          {percent}%
        </span>
      )}
    </div>
  );
}
