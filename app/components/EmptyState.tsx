'use client';

import { Button } from './ui/Button';

interface EmptyStateProps {
  /** 主图标/emoji */
  icon?: string;
  /** 标题 */
  title: string;
  /** 描述文字 */
  message: string;
  /** 可选的主按钮文字（不传则不显示按钮） */
  actionLabel?: string;
  /** 主按钮点击回调 */
  onAction?: () => void;
  /** 可选的次级按钮文字（与主按钮并排显示） */
  secondaryLabel?: string;
  /** 次级按钮点击回调 */
  onSecondary?: () => void;
}

export default function EmptyState({
  icon = '🌱',
  title,
  message,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary
}: EmptyStateProps) {
  const hasPrimary = actionLabel && onAction;
  const hasSecondary = secondaryLabel && onSecondary;
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] text-center px-6">
      <div className="text-6xl mb-4 opacity-90">{icon}</div>
      <h2 className="text-xl font-bold text-white mb-2 font-display">{title}</h2>
      <p className="text-sm text-white/70 mb-6 max-w-[280px] leading-relaxed">{message}</p>
      {(hasPrimary || hasSecondary) && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {hasPrimary && (
            <Button size="lg" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
          {hasSecondary && (
            <Button variant="secondary" size="lg" onClick={onSecondary}>
              {secondaryLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
