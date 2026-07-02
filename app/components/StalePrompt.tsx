'use client';

import { Button } from './ui/Button';

interface StalePromptProps {
  onRefresh: () => void;
  onDismiss: () => void;
}

export default function StalePrompt({ onRefresh, onDismiss }: StalePromptProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label="页面已闲置"
    >
      <div className="w-full max-w-[340px] text-center p-6 bg-farm-card backdrop-blur-glass border border-farm-border rounded-2xl shadow-glass">
        <div className="text-5xl mb-4">⏰</div>
        <h2 className="text-lg font-bold text-farm-text mb-2 font-display">页面闲置了一阵子</h2>
        <p className="text-sm text-farm-muted mb-6 leading-relaxed">
          为了看到其他设备的最新进度，建议刷新一下页面。
        </p>
        <div className="flex flex-col gap-2">
          <Button fullWidth onClick={onRefresh} className="px-6 py-3">
            刷新页面
          </Button>
          <Button variant="secondary" fullWidth onClick={onDismiss} size="sm">
            稍后再说
          </Button>
        </div>
      </div>
    </div>
  );
}
