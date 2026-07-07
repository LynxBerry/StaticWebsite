'use client';

import { Word } from '../data/words';
import { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { PlantIcon } from './PlantIcon';
import { DropletsIcon } from './icons/DropletsIcon';
import { ScrollFadeHint } from './ScrollFadeHint';
import { useOverflow } from '../hooks/useOverflow';
import { GrapeIcon } from './icons/GrapeIcon';
import Legend from './Legend';
import EmptyState from './EmptyState';

interface FarmViewProps {
  words: Word[];
  getStatus: (en: string) => 'mastered' | 'due' | 'pending' | 'unlearned';
  getWordState: (en: string) => { level: number; nextReview: number };
  onGoToBank: () => void;
  onGoToSettings: () => void;
}

function tileClass(status: 'mastered' | 'due' | 'pending' | 'unlearned', level: number) {
  // Heatmap-style backgrounds: seed stage starts pale yellow and deepens
  // through greens as mastery grows. Unlearned slots stay dimmed.
  const base =
    'group relative flex flex-col items-center justify-center gap-1.5 p-3 px-1.5 rounded-[16px] ' +
    'transition-all duration-200 cursor-default ' +
    'border border-farm-border ' +
    'hover:-translate-y-0.5';

  if (status === 'unlearned') {
    return `${base} bg-white opacity-40`;
  }

  const heatColors: Record<number, string> = {
    1: 'bg-yellow-50',
    2: 'bg-green-50',
    3: 'bg-green-100',
    4: 'bg-green-200',
    5: 'bg-green-300',
    6: 'bg-green-400'
  };

  return `${base} ${heatColors[level] || heatColors[6]}`;
}

export default function FarmView({ words, getStatus, getWordState, onGoToBank, onGoToSettings }: FarmViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasOverflow = useOverflow(scrollRef);
  const [tooltip, setTooltip] = useState<{
    word: Word;
    status: 'mastered' | 'due' | 'pending' | 'unlearned';
    level: number;
    left: number;
    top: number;
  } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const showTooltip = (word: Word, status: 'mastered' | 'due' | 'pending' | 'unlearned', level: number) =>
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      setTooltip({
        word,
        status,
        level,
        left: rect.left + rect.width / 2,
        top: rect.top - 8
      });
    };

  const hideTooltip = () => setTooltip(null);

  if (words.length === 0) {
    return (
      <section className="flex-1 flex flex-col min-h-[60vh]" id="farm-view">
        <EmptyState
          icon={<GrapeIcon className="w-16 h-16" />}
          title="农场还是荒地"
          message="去词库添加单词，种下第一颗种子吧。"
          actionLabel="去添加单词"
          onAction={onGoToBank}
        />
      </section>
    );
  }

  return (
    <section className="flex-1 flex flex-col min-h-[60vh]" id="farm-view">
      <div className="mb-4">
        <h2 className="text-xl font-semibold font-display text-farm-text mb-1 flex items-center gap-2">
          <GrapeIcon className="w-6 h-6" /> 收成
        </h2>
      </div>

      <Legend />

      <div className="flat-card p-3 relative">
        <div ref={scrollRef} className="max-h-[58vh] overflow-y-auto no-scrollbar">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(4.5rem,1fr))] gap-2.5">
            {words.map((word) => {
              const status = getStatus(word.en);
              const ws = getWordState(word.en);
              return (
                <div
                  key={word.en}
                  className={tileClass(status, ws.level)}
                  onMouseEnter={showTooltip(word, status, ws.level)}
                  onMouseLeave={hideTooltip}
                >
                  {status === 'due' && (
                    <div className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center rounded-full bg-white/90 text-blue-500 shadow-sm border border-blue-100">
                      <DropletsIcon className="w-3 h-3" />
                    </div>
                  )}
                  {status === 'unlearned' ? (
                    <span className="w-5 h-5 rounded-full border border-dashed border-farm-textSecondary" />
                  ) : (
                    <PlantIcon level={ws.level} className="w-7 h-7" />
                  )}
                  {status !== 'unlearned' && (
                    <span className="text-[0.75rem] font-semibold text-farm-text text-center max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
                      {word.en}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        {hasOverflow && <ScrollFadeHint />}
      </div>

      {mounted && tooltip && createPortal(
        <div
          className="fixed z-50 px-2.5 py-1.5 rounded-xl bg-white text-farm-text text-xs whitespace-nowrap shadow-md border border-farm-border pointer-events-none"
          style={{
            left: tooltip.left,
            top: tooltip.top,
            transform: 'translate(-50%, -100%)'
          }}
        >
          {tooltip.word.en} · {tooltip.word.cn}
          <span className="text-farm-muted ml-1">
            {tooltip.status === 'unlearned' ? '待播种' : tooltip.status === 'due' ? `阶段 ${tooltip.level} · 需要浇水 💧` : `阶段 ${tooltip.level}`}
          </span>
        </div>,
        document.body
      )}
    </section>
  );
}
