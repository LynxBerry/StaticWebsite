'use client';

import { Word } from '../data/words';
import { getPlantIcon } from '../lib/utils';
import Legend from './Legend';
import EmptyState from './EmptyState';

interface FarmViewProps {
  words: Word[];
  getStatus: (en: string) => 'mastered' | 'due' | 'pending' | 'unlearned';
  getWordState: (en: string) => { level: number; nextReview: number };
  onGoToBank: () => void;
  onGoToSettings: () => void;
}

function tileClass(status: 'mastered' | 'due' | 'pending' | 'unlearned') {
  // Flat tile on a light background. Status is conveyed by the plant icon
  // itself (growth stage) plus opacity for unlearned slots — no extra color
  // bars, keep it clean.
  const base =
    'flex flex-col items-center justify-center gap-1.5 p-3 px-1.5 rounded-[16px] ' +
    'transition-all duration-200 cursor-default ' +
    'bg-white border border-farm-border ' +
    'hover:-translate-y-0.5 hover:bg-farm-bg';
  switch (status) {
    case 'due':
      // Subtle warm tint to flag attention, no glow.
      return `${base} bg-harvest-50`;
    case 'mastered':
    case 'pending':
      return base;
    default:
      // Unlearned: dim to read as an empty slot.
      return `${base} opacity-40`;
  }
}

export default function FarmView({ words, getStatus, getWordState, onGoToBank, onGoToSettings }: FarmViewProps) {
  if (words.length === 0) {
    return (
      <section className="flex-1 flex flex-col min-h-[60vh]" id="farm-view">
        <EmptyState
          icon="🌾"
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
        <h2 className="text-xl font-semibold font-display text-farm-text mb-1">🌾 收成</h2>
        <p className="text-sm text-farm-muted">每棵植物代表一个单词，成长阶段反映熟悉度</p>
      </div>

      <Legend />

      <div className="flat-card p-3 max-h-[58vh] overflow-y-auto no-scrollbar">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(4.5rem,1fr))] gap-2.5">
          {words.map((word) => {
            const status = getStatus(word.en);
            const ws = getWordState(word.en);
            return (
              <div
                key={word.en}
                className={tileClass(status)}
                title={`${word.en} · ${word.cn} · ${status === 'unlearned' ? '待播种' : `阶段 ${ws.level}`}`}
              >
                {status === 'unlearned' ? (
                  <span className="w-5 h-5 rounded-full border border-dashed border-farm-textSecondary" />
                ) : (
                  <span className="text-[1.75rem] leading-none">{getPlantIcon(ws.level)}</span>
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
    </section>
  );
}
