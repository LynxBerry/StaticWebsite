'use client';

import { Word } from '../data/words';
import { WordState, WrongItem } from '../lib/types';
import { Button } from './ui/Button';
import ProgressBar from './ui/ProgressBar';
import DonutChart from './ui/DonutChart';
import EmptyState from './EmptyState';
import { getPlantIcon } from '../lib/utils';

interface DashboardViewProps {
  words: Word[];
  dueCount: number;
  masteredCount: number;
  todayCount: number;
  todayRemaining: number;
  unlearnedCount: number;
  wrongQueue: WrongItem[];
  getWordState: (en: string) => WordState;
  getReviewStats: () => { initialDue: number; currentDue: number; done: number };
  onGoToStudy: () => void;
  onGoToLearn: () => void;
  onGoToFarm: () => void;
  onGoToBank: () => void;
  onGoToSettings: () => void;
}

const sectionClass = 'text-left p-5 glass-card';

export default function DashboardView({
  words,
  dueCount,
  masteredCount,
  todayCount,
  todayRemaining,
  unlearnedCount,
  wrongQueue,
  getWordState,
  getReviewStats,
  onGoToStudy,
  onGoToLearn,
  onGoToFarm,
  onGoToBank,
  onGoToSettings
}: DashboardViewProps) {
  // Empty library: primary CTA goes to the bank where the user can add
  // words (single or batch). Backup/restore lives in Settings and is
  // offered as the secondary path for users coming from another device.
  if (words.length === 0) {
    return (
      <section className="flex-1 flex flex-col min-h-[60vh]" id="dashboard-view">
        <EmptyState
          icon="🌱"
          title="欢迎使用 Sprout"
          message="还没有单词。去词库添加你的第一批单词，开始种下第一颗种子吧。"
          actionLabel="去添加单词"
          onAction={onGoToBank}
          secondaryLabel="恢复备份"
          onSecondary={onGoToSettings}
        />
      </section>
    );
  }

  const totalCount = words.length;
  const learnedCount = totalCount - unlearnedCount;
  const progressPercent = totalCount === 0 ? 0 : Math.round((masteredCount / totalCount) * 100);

  // Stage distribution (1-5 + mastered)
  const stageCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  words.forEach((word) => {
    const ws = getWordState(word.en);
    const level = Math.min(ws.level, 6);
    stageCounts[level] = (stageCounts[level] || 0) + 1;
  });

  return (
    <section className="flex-1 flex flex-col min-h-[60vh]" id="dashboard-view">
      {/* Today's action hero — two donuts side by side: review progress + new-word progress.
          Each donut shows its own completion ratio, so the user sees both daily tasks at once. */}
      <div className={`${sectionClass} mb-4`}>
        <h3 className="text-base font-semibold text-white/95 mb-4 font-display">今日</h3>
        {(() => {
          const review = getReviewStats();
          const reviewPct = review.initialDue > 0 ? Math.round((review.done / review.initialDue) * 100) : 100;
          const totalNew = todayCount + todayRemaining;
          const newPct = totalNew > 0 ? Math.round((todayCount / totalNew) * 100) : 100;

          // Both CTAs are always shown (layout stays stable); each is enabled
          // only when there's actual work for it. Review covers due words +
          // wrong queue; Learn covers today's new-word quota.
          const canReview = dueCount > 0 || wrongQueue.length > 0;
          const canLearn = todayRemaining > 0 && unlearnedCount > 0;

          return (
            <>
              <div className="grid grid-cols-2 gap-3 mb-4 relative">
                {/* Vertical divider between the two donuts — a faint hairline
                    etched into the glass, like the header's horizontal one. */}
                <div className="absolute top-2 bottom-2 left-1/2 w-px bg-gradient-to-b from-transparent via-white/15 to-transparent pointer-events-none" />
                {/* Review donut */}
                <div className="flex flex-col items-center gap-1.5">
                  <DonutChart
                    value={review.done}
                    max={review.initialDue || 1}
                    size={72}
                    stroke={7}
                    label={`${reviewPct}%`}
                    sublabel="复习"
                    ariaLabel={`今日复习进度 ${reviewPct}%`}
                  />
                  <div className="text-center">
                    <div className="text-xs text-white/90 font-semibold">复习</div>
                    <div className="text-[0.6875rem] text-white/55 tabular-nums">
                      {review.initialDue > 0
                        ? `${review.done} / ${review.initialDue}`
                        : '无到期'}
                    </div>
                  </div>
                </div>
                {/* New-word donut */}
                <div className="flex flex-col items-center gap-1.5">
                  <DonutChart
                    value={todayCount}
                    max={totalNew || 1}
                    size={72}
                    stroke={7}
                    label={`${newPct}%`}
                    sublabel="新词"
                    ariaLabel={`今日新词进度 ${newPct}%`}
                  />
                  <div className="text-center">
                    <div className="text-xs text-white/90 font-semibold">新词</div>
                    <div className="text-[0.6875rem] text-white/55 tabular-nums">
                      {totalNew > 0 ? `${todayCount} / ${totalNew}` : '无配额'}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  size="lg"
                  className="flex-1"
                  disabled={!canReview}
                  onClick={onGoToStudy}
                >
                  {wrongQueue.length > 0 && dueCount === 0 ? '练错题' : '去复习'}
                </Button>
                <Button
                  size="lg"
                  className="flex-1"
                  disabled={!canLearn}
                  onClick={onGoToLearn}
                >
                  学新词
                </Button>
              </div>
            </>
          );
        })()}
      </div>

      {/* Progress overview */}
      <div className={`${sectionClass} mb-4`}>
        <h3 className="text-base font-semibold text-white/95 mb-3 font-display">进度</h3>
        <div className="flex items-end justify-between mb-2">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{masteredCount}</span>
            <span className="text-sm text-white/70">/ {totalCount} 已掌握</span>
          </div>
          <span className="text-lg font-bold text-white">{progressPercent}%</span>
        </div>
        <ProgressBar value={masteredCount} max={totalCount} className="mb-3" />
        <div className="flex gap-4 text-xs text-white/70">
          <span>已学 <strong className="text-white">{learnedCount}</strong></span>
          <span>待播种 <strong className="text-white">{unlearnedCount}</strong></span>
          <button className="ml-auto text-white/70 hover:text-white hover:underline" onClick={onGoToFarm}>
            查看农场 →
          </button>
        </div>
      </div>

      {/* Stage distribution */}
      <div className={`${sectionClass} mb-4`}>
        <h3 className="text-base font-semibold text-white/95 mb-3 font-display">熟悉度分布</h3>
        <div className="space-y-1.5">
          {[1, 2, 3, 4, 5, 6].map((stage) => {
            const count = stageCounts[stage] || 0;
            const pct = learnedCount === 0 ? 0 : Math.round((count / learnedCount) * 100);
            return (
              <div key={stage} className="flex items-center gap-3">
                <span className="text-base w-8 text-center shrink-0">{getPlantIcon(stage)}</span>
                <ProgressBar value={count} max={learnedCount} className="flex-1" />
                <span className="text-xs text-white/70 w-8 text-right shrink-0">{count}</span>
              </div>
            );
          })}
        </div>
        {learnedCount === 0 && (
          <p className="text-xs text-white/55 mt-3 text-center">
            还没有开始学习，去播种你的第一个单词吧
          </p>
        )}
      </div>


    </section>
  );
}
