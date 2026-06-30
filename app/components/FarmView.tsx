'use client';

import { Word } from '../data/words';
import { getPlantIcon } from '../lib/utils';
import Legend from './Legend';

interface FarmViewProps {
  words: Word[];
  getStatus: (en: string) => 'mastered' | 'due' | 'pending' | 'unlearned';
  getWordState: (en: string) => { level: number; nextReview: number };
}

function tileClass(status: 'mastered' | 'due' | 'pending' | 'unlearned') {
  const base =
    'flex flex-col items-center justify-center gap-1.5 p-3 px-1.5 rounded-xl border transition-all duration-200 cursor-default backdrop-blur-lg bg-[rgba(42,24,11,0.55)] border-farm-muted/10 hover:-translate-y-0.5 hover:bg-[rgba(42,24,11,0.75)]';
  switch (status) {
    case 'due':
      return `${base} border-orange-500/60 shadow-[0_0_16px_rgba(249,115,22,0.25)] bg-[rgba(67,20,7,0.6)]`;
    case 'mastered':
      return `${base} border-green-500/50 bg-[rgba(20,40,20,0.55)]`;
    default:
      return base;
  }
}

export default function FarmView({ words, getStatus, getWordState }: FarmViewProps) {
  return (
    <section className="flex-1 flex flex-col min-h-[60vh]" id="farm-view">
      <div className="mb-4">
        <h2 className="text-xl text-farm-muted mb-1">🌾 收成</h2>
        <p className="text-sm text-farm-muted/80">每棵植物代表一个单词，成长阶段反映熟悉度</p>
      </div>

      <Legend />

      <div className="grid grid-cols-[repeat(auto-fill,minmax(4.5rem,1fr))] gap-3 max-h-[60vh] overflow-y-auto p-2">
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
                <span className="w-5 h-5 rounded-full bg-[rgba(120,53,15,0.4)] border border-dashed border-farm-muted/25" />
              ) : (
                <span className="text-[1.75rem] leading-none">{getPlantIcon(ws.level)}</span>
              )}
              {status !== 'unlearned' && (
                <span className="text-[0.6875rem] text-farm-text text-center max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
                  {word.en}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
