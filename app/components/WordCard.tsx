'use client';

import { Word } from '../data/words';
import { WordState } from '../hooks/useVocabState';
import { formatDate, getPlantIcon } from '../lib/utils';

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
        className={`card ${flipped ? 'flipped' : ''} ${isWrongMode ? 'wrong' : ''}`}
        onClick={() => !disabled && onFlip()}
      >
        <div className="card-inner">
          <div className="card-front">
            <span className="label">
              {isWrongMode
                ? `错题复习 · ${getPlantIcon(wordState.level)} 阶段 ${wordState.level} · 还需答对 ${remaining} 次`
                : `英文 · ${getPlantIcon(wordState.level)} 阶段 ${wordState.level} · 下次复习 ${formatDate(wordState.nextReview)}`}
            </span>
            <h2>{word.en}</h2>
          </div>
          <div className="card-back">
            <span className="label">{isWrongMode ? '中文 · 再想想？' : '中文'}</span>
            <p>{word.cn}</p>
          </div>
        </div>
      </section>

      <p className="hint">
        {disabled
          ? '全部复习完成'
          : isWrongMode
            ? `错题必须连续答对 ${remaining} 次才能通过`
            : flipped
              ? '翻卡片后只能点不认识'
              : '认识直接点按钮，想不起来就点卡片'}
      </p>

      <div className="actions">
        <button className="btn btn-again" onClick={onAgain} disabled={disabled}>
          😅 不认识
        </button>
        <button
          className="btn btn-know"
          onClick={onKnown}
          disabled={disabled || (!isWrongMode && flipped)}
        >
          😎 认识
        </button>
      </div>
    </>
  );
}
