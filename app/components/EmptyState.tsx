'use client';

import { Button } from './ui/Button';

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
      <h2 className="text-xl font-bold text-farm-text mb-2 font-display">{title}</h2>
      <p className="text-sm text-farm-muted mb-6 max-w-[280px] leading-relaxed">{message}</p>
      {actionLabel && onAction && (
        <Button size="lg" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
