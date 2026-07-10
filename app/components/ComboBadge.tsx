'use client';

interface ComboBadgeProps {
  count: number;
}

/**
 * 连击徽章 —— 答对连续 ≥2 次时在单词卡上方浮现的奖励反馈。
 *
 * 在 WordCard 的 card section 内渲染：水平居中（`left-1/2 -translate-x-1/2`）、
 * 垂直贴卡片顶部（`top-2`），不遮挡中央的单词。`pointer-events-none` 不
 * 挡翻卡点击；combo-pop 动画（~1.8s）后自动隐去，不打断复习节奏。
 */
export default function ComboBadge({ count }: ComboBadgeProps) {
  if (count < 2) return null;

  return (
    <div
      className="pointer-events-none absolute top-2 left-1/2 -translate-x-1/2 z-40"
    >
      {/* Animation runs on the inner span so its transform (translateY/scale)
          doesn't clobber the outer -translate-x-1/2 that centers the badge. */}
      <span
        key={count} // re-trigger animation each time count changes
        className="animate-combo inline-block px-4 py-1.5 rounded-full bg-harvest-500 font-bold text-base text-white shadow-sprout"
      >
        🔥 连击 x{count}
      </span>
    </div>
  );
}
