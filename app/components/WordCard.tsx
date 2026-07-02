'use client';

import { Word } from '../data/words';
import { WordState } from '../hooks/useVocabState';
import { formatDate, getPlantIcon } from '../lib/utils';
import { Button } from './ui/Button';

interface WordCardProps {
  word: Word;
  wordState: WordState;
  flipped: boolean;
  onFlip: () => void;
  onKnown: () => void;
  onAgain: () => void;
  isWrongMode?: boolean;
  remaining?: number;
  disabled: boolean;
}

export default function WordCard({
  word,
  wordState,
  flipped,
  onFlip,
  onKnown,
  onAgain,
  isWrongMode = false,
  remaining,
  disabled
}: WordCardProps) {
  return (
    <>
      <section
        className={`card aspect-[3/2] mb-3 ${disabled ? 'cursor-default' : 'cursor-pointer'} ${flipped ? 'flipped' : ''} ${isWrongMode ? 'wrong' : ''}`}
        onClick={() => !disabled && onFlip()}
      >
        <div className="card-inner relative w-full h-full transition-transform duration-500 rounded-2xl">
          <div className="card-front absolute inset-0 flex flex-col items-center justify-center p-6 rounded-2xl bg-gradient-to-br from-[rgba(255,247,237,0.92)] to-[rgba(255,237,213,0.88)] backdrop-blur-glass text-[#431407] shadow-[0_10px_30px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] border border-white/15">
            <span className="text-xs uppercase tracking-widest opacity-70 mb-3">
              {isWrongMode
                ? `错题复习 · ${getPlantIcon(wordState.level)} 阶段 ${wordState.level} · 还需答对 ${remaining} 次`
                : `英文 · ${getPlantIcon(wordState.level)} 阶段 ${wordState.level} · 下次复习 ${formatDate(wordState.nextReview)}`}
            </span>
            <h2 className="text-4xl font-bold">{word.en}</h2>
          </div>
          <div className="card-back absolute inset-0 flex flex-col items-center justify-center p-6 rounded-2xl bg-gradient-to-br from-orange-500/85 to-orange-600/80 backdrop-blur-glass text-farm-text [transform:rotateY(180deg)] shadow-[0_10px_30px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] border border-white/15">
            <span className="text-xs uppercase tracking-widest opacity-70 mb-3">
              {isWrongMode ? '中文 · 再想想？' : '中文'}
            </span>
            <p className="text-2xl font-semibold">{word.cn}</p>
          </div>
        </div>
      </section>

      <p className="text-sm text-farm-muted mb-6">
        {disabled
          ? '全部复习完成'
          : isWrongMode
            ? `错题必须连续答对 ${remaining} 次才能通过`
            : flipped
              ? '翻卡片后只能点不认识'
              : '认识直接点按钮，想不起来就点卡片'}
      </p>

      <div className="flex gap-3 mb-6">
        <Button variant="secondary" className="flex-1" onClick={onAgain} disabled={disabled}>
          😅 不认识
        </Button>
        <Button
          className="flex-1"
          onClick={onKnown}
          disabled={disabled || (!isWrongMode && flipped)}
        >
          😎 认识
        </Button>
      </div>
    </>
  );
}
