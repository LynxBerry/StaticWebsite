'use client';

interface StalePromptProps {
  onRefresh: () => void;
  onDismiss: () => void;
}

const primaryBtn =
  `relative overflow-hidden rounded-xl px-6 py-3 text-base font-semibold text-farm-text transition-all duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)] bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 shadow-[0_4px_16px_rgba(249,115,22,0.4),inset_0_1px_0_rgba(255,255,255,0.2)] [text-shadow:0_1px_2px_rgba(0,0,0,0.2)] before:absolute before:inset-0 before:content-[''] before:bg-gradient-to-b before:from-white/20 before:to-transparent before:opacity-60 before:transition-opacity before:duration-250 hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-[0_8px_24px_rgba(249,115,22,0.55),inset_0_1px_0_rgba(255,255,255,0.25)] hover:before:opacity-100 active:-translate-y-px active:scale-[0.98]`;

const secondaryBtn =
  `rounded-xl px-4 py-3 text-sm font-semibold text-farm-muted transition-all duration-200 hover:text-farm-text`;

export default function StalePrompt({ onRefresh, onDismiss }: StalePromptProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label="页面已闲置"
    >
      <div className="w-full max-w-[340px] text-center p-6 bg-farm-card backdrop-blur-glass border border-farm-border rounded-2xl shadow-glass">
        <div className="text-5xl mb-3">⏰</div>
        <h2 className="text-lg font-bold text-farm-text mb-2">页面闲置了一阵子</h2>
        <p className="text-sm text-farm-muted mb-6 leading-relaxed">
          为了看到其他设备的最新进度，建议刷新一下页面。
        </p>
        <div className="flex flex-col gap-2">
          <button className={primaryBtn} onClick={onRefresh}>
            刷新页面
          </button>
          <button className={secondaryBtn} onClick={onDismiss}>
            稍后再说
          </button>
        </div>
      </div>
    </div>
  );
}
