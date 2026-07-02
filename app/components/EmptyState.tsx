'use client';

interface EmptyStateProps {
  /** 主图标/emoji */
  icon?: string;
  /** 标题 */
  title: string;
  /** 描述文字 */
  message: string;
  /** 可选的跳转按钮文字（不传则不显示按钮） */
  actionLabel?: string;
  /** 按钮点击回调 */
  onAction?: () => void;
}

const primaryBtn =
  `relative overflow-hidden rounded-xl px-6 py-3 text-base font-semibold text-farm-text transition-all duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)] bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 shadow-[0_4px_16px_rgba(249,115,22,0.4),inset_0_1px_0_rgba(255,255,255,0.2)] [text-shadow:0_1px_2px_rgba(0,0,0,0.2)] before:absolute before:inset-0 before:content-[''] before:bg-gradient-to-b before:from-white/20 before:to-transparent before:opacity-60 before:transition-opacity before:duration-250 hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-[0_8px_24px_rgba(249,115,22,0.55),inset_0_1px_0_rgba(255,255,255,0.25)] hover:before:opacity-100 active:-translate-y-px active:scale-[0.98]`;

export default function EmptyState({
  icon = '🌱',
  title,
  message,
  actionLabel,
  onAction
}: EmptyStateProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] text-center px-6">
      <div className="text-6xl mb-4 opacity-80">{icon}</div>
      <h2 className="text-xl font-bold text-farm-text mb-2">{title}</h2>
      <p className="text-sm text-farm-muted mb-6 max-w-[280px] leading-relaxed">{message}</p>
      {actionLabel && onAction && (
        <button className={primaryBtn} onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
