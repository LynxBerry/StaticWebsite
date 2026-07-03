'use client';

import { Word } from '../data/words';
import { WordState, WrongItem } from '../lib/types';
import { Button } from './ui/Button';
import ProgressBar from './ui/ProgressBar';
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
  onGoToStudy: () => void;
  onGoToLearn: () => void;
  onGoToFarm: () => void;
  onGoToSettings: () => void;
}

const sectionClass = 'text-left p-5 bg-farm-bg border border-farm-borderSecondary rounded-[18px] shadow-[0_1px_2px_#f0f0ec]';

export default function DashboardView({
  words,
  dueCount,
  masteredCount,
  todayCount,
  todayRemaining,
  unlearnedCount,
  wrongQueue,
  getWordState,
  onGoToStudy,
  onGoToLearn,
  onGoToFarm,
  onGoToSettings
}: DashboardViewProps) {
  // Empty library: guide to import
  if (words.length === 0) {
    return (
      <section className="flex-1 flex flex-col min-h-[60vh]" id="dashboard-view">
        <EmptyState
          icon="🌱"
          title="欢迎使用 Sprout"
          message="还没有单词。先去设置导入你的词库，开始种下第一颗种子吧。"
          actionLabel="去导入单词"
          onAction={onGoToSettings}
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
      {/* Today's action hero */}
      <div className={`${sectionClass} mb-4`}>
        <h3 className="text-base font-semibold text-farm-text mb-3 font-display">今日</h3>
        {dueCount > 0 ? (
          <>
            <div className="flex items-end justify-between mb-3">
              <div>
                <span className="text-4xl font-bold text-[#3D7A4D]">{dueCount}</span>
                <span className="text-sm text-farm-muted ml-2">个单词待复习</span>
              </div>
              <Button size="lg" onClick={onGoToStudy}>开始复习</Button>
            </div>
          </>
        ) : wrongQueue.length > 0 ? (
          <div className="flex items-end justify-between mb-3">
            <div>
              <span className="text-4xl font-bold text-farm-red">{wrongQueue.length}</span>
              <span className="text-sm text-farm-muted ml-2">个错题待通过</span>
            </div>
            <Button size="lg" onClick={onGoToStudy}>去练错题</Button>
          </div>
        ) : (
          <div className="flex items-end justify-between mb-3">
            <div>
              <span className="text-3xl">🎉</span>
              <span className="text-sm text-farm-muted ml-2">今日复习已完成</span>
            </div>
            {todayRemaining > 0 && unlearnedCount > 0 && (
              <Button size="lg" onClick={onGoToLearn}>学新词</Button>
            )}
          </div>
        )}
        <div className="flex gap-4 text-xs text-farm-muted">
          <span>今日新学 <strong className="text-farm-text">{todayCount}</strong>/{todayCount + todayRemaining}</span>
          {wrongQueue.length > 0 && (
            <span>错题队列 <strong className="text-farm-text">{wrongQueue.length}</strong></span>
          )}
        </div>
      </div>

      {/* Progress overview */}
      <div className={`${sectionClass} mb-4`}>
        <h3 className="text-base font-semibold text-farm-text mb-3 font-display">进度</h3>
        <div className="flex items-end justify-between mb-2">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-farm-text">{masteredCount}</span>
            <span className="text-sm text-farm-muted">/ {totalCount} 已掌握</span>
          </div>
          <span className="text-lg font-bold text-[#3D7A4D]">{progressPercent}%</span>
        </div>
        <ProgressBar value={masteredCount} max={totalCount} className="mb-3" />
        <div className="flex gap-4 text-xs text-farm-muted">
          <span>已学 <strong className="text-farm-text">{learnedCount}</strong></span>
          <span>待播种 <strong className="text-farm-text">{unlearnedCount}</strong></span>
          <button className="ml-auto text-[#3D7A4D] hover:underline" onClick={onGoToFarm}>
            查看农场 →
          </button>
        </div>
      </div>

      {/* Stage distribution */}
      <div className={`${sectionClass} mb-4`}>
        <h3 className="text-base font-semibold text-farm-text mb-3 font-display">熟悉度分布</h3>
        <div className="space-y-1.5">
          {[1, 2, 3, 4, 5, 6].map((stage) => {
            const count = stageCounts[stage] || 0;
            const pct = learnedCount === 0 ? 0 : Math.round((count / learnedCount) * 100);
            return (
              <div key={stage} className="flex items-center gap-3">
                <span className="text-base w-8 text-center">{getPlantIcon(stage)}</span>
                <ProgressBar value={count} max={learnedCount} className="flex-1" />
                <span className="text-xs text-farm-muted w-8 text-right">{count}</span>
              </div>
            );
          })}
        </div>
        {learnedCount === 0 && (
          <p className="text-xs text-farm-muted mt-3 text-center">
            还没有开始学习，去播种你的第一个单词吧
          </p>
        )}
      </div>

      {/* Quick actions */}
      <div className="flex gap-3">
        <Button variant="secondary" size="lg" className="flex-1" onClick={onGoToLearn} disabled={todayRemaining === 0 || unlearnedCount === 0}>
          播种新词
        </Button>
        <Button variant="secondary" size="lg" className="flex-1" onClick={onGoToSettings}>
          设置
        </Button>
      </div>
    </section>
  );
}
