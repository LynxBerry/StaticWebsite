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
                ? `错题复习 · ${getPlantIcon(wordState.level)} 阶段 ${wordState.level}`
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
            ? '这道题刚才没通过，必须认识才能继续'
            : '点击卡片查看释义'}
      </p>

      <div className="actions">
        <button className="btn btn-again" onClick={onAgain} disabled={disabled}>
          😅 不认识
        </button>
        <button className="btn btn-know" onClick={onKnown} disabled={disabled}>
          😎 认识
        </button>
      </div>
    </>
  );
}
