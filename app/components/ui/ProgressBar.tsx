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
  const fillColor = color === 'success' ? 'bg-sprout-500' : 'bg-farm-accent';

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex-1 h-2 rounded-full bg-farm-borderSecondary overflow-hidden">
        <div
          className={`h-full rounded-full ${fillColor} transition-all duration-sprout-slow ease-sprout-out`}
          style={{ width: `${percent}%` }}
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
