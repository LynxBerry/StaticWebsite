'use client';

import { Word } from '../data/words';
import { WordState } from '../hooks/useVocabState';
import { formatDate, getPlantIcon } from '../lib/utils';
import { Button } from './ui/Button';
import SpeakButton from './ui/SpeakButton';

interface WordCardProps {
  word: Word;
  wordState: WordState;
  flipped: boolean;
  feedback?: 'correct' | 'wrong' | null;
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
  feedback = null,
  onFlip,
  onKnown,
  onAgain,
  isWrongMode = false,
  remaining,
  disabled
}: WordCardProps) {
  const feedbackClass = feedback === 'correct' ? 'animate-pop' : feedback === 'wrong' ? 'animate-shake' : '';
  return (
    <div className="flat-card mb-6 p-1.5">
      <section
        className={`card aspect-[3/2] ${feedbackClass} ${disabled ? 'cursor-default' : 'cursor-pointer'} ${flipped ? 'flipped' : ''} ${isWrongMode ? 'wrong' : ''}`}
        onClick={() => !disabled && onFlip()}
      >
        <div className="card-inner relative w-full h-full transition-transform duration-500 rounded-[16px]">
          <div className="card-front word-card-face text-engrave-light absolute inset-0 flex flex-col items-center justify-center p-6">
            <span className="text-xs uppercase tracking-widest opacity-70 mb-4">
              {isWrongMode
                ? `错题复习 · ${getPlantIcon(wordState.level)} 阶段 ${wordState.level} · 还需答对 ${remaining} 次`
                : `英文 · ${getPlantIcon(wordState.level)} 阶段 ${wordState.level} · 下次复习 ${formatDate(wordState.nextReview)}`}
            </span>
            <div className="flex items-center gap-3">
              <h2 className="text-4xl font-bold">{word.en}</h2>
              <SpeakButton text={word.en} size="lg" />
            </div>
          </div>
          <div className="card-back word-card-back text-engrave-dark absolute inset-0 flex flex-col items-center justify-center p-6 [transform:rotateY(180deg)]">
            <span className="text-xs uppercase tracking-widest opacity-80 mb-4">
              {isWrongMode ? '中文 · 再想想？' : '中文'}
            </span>
            <p className="text-2xl font-semibold">{word.cn}</p>
          </div>
        </div>
      </section>

      <div className="px-5 pb-5 pt-3">
        <p className="text-sm text-farm-muted mb-4 text-center">
          {disabled
            ? '全部复习完成'
            : isWrongMode
              ? `错题必须连续答对 ${remaining} 次才能通过`
              : flipped
                ? '翻卡片后只能点不认识'
                : '认识直接点按钮，想不起来就点卡片'}
        </p>

        <div className="flex gap-3">
          <Button variant="secondary" size="lg" className="flex-1" onClick={onAgain} disabled={disabled}>
            😅 不认识
          </Button>
          <Button
            size="lg"
            className="flex-1"
            onClick={onKnown}
            disabled={disabled || (!isWrongMode && flipped)}
          >
            😎 认识
          </Button>
        </div>
      </div>
    </div>
  );
}
