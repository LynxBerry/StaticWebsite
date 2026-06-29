'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import WordCard from './WordCard';
import { Word } from '../data/words';

const REQUIRED_CORRECT = 3;

interface WrongItem {
  en: string;
  remaining: number;
}

interface StudyViewProps {
  dueWords: Word[];
  masteredCount: number;
  total: number;
  getWordState: (en: string) => { level: number; nextReview: number };
  onKnown: (en: string) => void;
  onAgain: (en: string) => void;
}

export default function StudyView({
  dueWords,
  masteredCount,
  total,
  getWordState,
  onKnown,
  onAgain
}: StudyViewProps) {
  const [flipped, setFlipped] = useState(false);
  const [wrongQueue, setWrongQueue] = useState<WrongItem[]>([]);

  // Reset wrong queue on mount
  useEffect(() => {
    setWrongQueue([]);
  }, []);

  const currentWord = useMemo(() => {
    if (dueWords.length > 0) return dueWords[0];
    if (wrongQueue.length > 0) {
      return { en: wrongQueue[0].en, cn: '' } as Word;
    }
    return null;
  }, [dueWords, wrongQueue]);

  const currentRemaining = useMemo(() => {
    if (dueWords.length > 0) return null;
    return wrongQueue[0]?.remaining ?? null;
  }, [dueWords, wrongQueue]);

  const isWrongMode = dueWords.length === 0 && wrongQueue.length > 0;
  const isDone = currentWord === null;

  const progress = total === 0 ? 0 : Math.round((masteredCount / total) * 100);

  const handleKnown = useCallback(() => {
    if (!currentWord) return;
    setFlipped(false);
    onKnown(currentWord.en);

    if (isWrongMode) {
      setWrongQueue((prev) => {
        const [first, ...rest] = prev;
        if (!first) return prev;
        const newRemaining = first.remaining - 1;
        if (newRemaining <= 0) {
          return rest;
        }
        return [...rest, { ...first, remaining: newRemaining }];
      });
    }
  }, [currentWord, isWrongMode, onKnown]);

  const handleAgain = useCallback(() => {
    if (!currentWord) return;
    setFlipped(false);
    onAgain(currentWord.en);

    if (!isWrongMode) {
      // First time wrong today: add to wrong queue with required correct count
      setWrongQueue((prev) => {
        if (prev.some((item) => item.en === currentWord.en)) return prev;
        return [...prev, { en: currentWord.en, remaining: REQUIRED_CORRECT }];
      });
    } else {
      // Wrong again during wrong-mode review: reset required count
      setWrongQueue((prev) => {
        const [first, ...rest] = prev;
        if (!first) return prev;
        return [...rest, { ...first, remaining: REQUIRED_CORRECT }];
      });
    }
  }, [currentWord, isWrongMode, onAgain]);

  const handleFlip = useCallback(() => {
    if (isDone || !currentWord) return;

    setFlipped((prev) => {
      const next = !prev;

      // Flipping from front to back in normal study mode = didn't know it
      if (!prev && !isWrongMode) {
        onAgain(currentWord.en);
        setWrongQueue((queue) => {
          if (queue.some((item) => item.en === currentWord.en)) return queue;
          return [...queue, { en: currentWord.en, remaining: REQUIRED_CORRECT }];
        });
      }

      return next;
    });
  }, [isDone, currentWord, isWrongMode, onAgain]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isDone) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleFlip();
      } else if (e.key === 'ArrowRight' || e.key === 'k') {
        handleKnown();
      } else if (e.key === 'ArrowLeft' || e.key === 'a') {
        handleAgain();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDone, handleFlip, handleKnown, handleAgain]);

  if (isDone) {
    return (
      <section className="view" id="study-view">
        <section className="progress">
          <span id="progress-text">{masteredCount} / {total} 已掌握</span>
          <div className="progress-bar">
            <div id="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
        </section>

        <section className="card done">
          <div className="card-inner">
            <div className="card-front">
              <h2>🎉 今日任务完成</h2>
              <p>所有错题都已通过，明天再来！</p>
            </div>
          </div>
        </section>
        <p className="hint">全部复习完成</p>
        <div className="actions">
          <button className="btn btn-again" disabled>😅 不认识</button>
          <button className="btn btn-know" disabled>😎 认识</button>
        </div>

        <section className="stats">
          <div>已掌握：<strong>{masteredCount}</strong></div>
          <div>今日到期：<strong>{dueWords.length}</strong></div>
        </section>
      </section>
    );
  }

  // For wrong mode, we need the actual word object to show Chinese meaning
  const displayWord = dueWords.find((w) => w.en === currentWord?.en) || currentWord;

  return (
    <section className="view" id="study-view">
      <section className="progress">
        <span id="progress-text">{masteredCount} / {total} 已掌握</span>
        <div className="progress-bar">
          <div id="progress-fill" style={{ width: `${progress}%` }}></div>
        </div>
      </section>

      {displayWord && (
        <WordCard
          word={displayWord}
          wordState={getWordState(displayWord.en)}
          flipped={flipped}
          onFlip={handleFlip}
          onKnown={handleKnown}
          onAgain={handleAgain}
          isWrongMode={isWrongMode}
          remaining={currentRemaining ?? undefined}
          disabled={false}
        />
      )}

      <section className="stats">
        <div>已掌握：<strong>{masteredCount}</strong></div>
        <div>今日到期：<strong>{dueWords.length}</strong></div>
        {wrongQueue.length > 0 && (
          <div>待通过错题：<strong>{wrongQueue.length}</strong></div>
        )}
      </section>
    </section>
  );
}
