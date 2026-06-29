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
  disabled: boolean;
}

export default function WordCard({ word, wordState, flipped, onFlip, onKnown, onAgain, disabled }: WordCardProps) {
  return (
    <>
      <section
        className={`card ${flipped ? 'flipped' : ''}`}
        onClick={() => !disabled && onFlip()}
      >
        <div className="card-inner">
          <div className="card-front">
            <span className="label">
              英文 · {getPlantIcon(wordState.level)} Box {wordState.level} · 下次复习 {formatDate(wordState.nextReview)}
            </span>
            <h2>{word.en}</h2>
          </div>
          <div className="card-back">
            <span className="label">中文</span>
            <p>{word.cn}</p>
          </div>
        </div>
      </section>

      <p className="hint">{disabled ? '所有到期单词都已复习完' : '点击卡片查看释义'}</p>

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
