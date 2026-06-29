'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import WordCard from './WordCard';
import { Word } from '../data/words';

const REQUIRED_CORRECT = 3;

interface WrongItem {
  index: number;
  remaining: number;
}

interface StudyViewProps {
  dueWords: { word: Word; index: number }[];
  masteredCount: number;
  total: number;
  getWordState: (index: number) => { level: number; nextReview: number };
  onKnown: (index: number) => void;
  onAgain: (index: number) => void;
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

  const currentIndex = useMemo(() => {
    if (dueWords.length > 0) return dueWords[0].index;
    if (wrongQueue.length > 0) return wrongQueue[0].index;
    return null;
  }, [dueWords, wrongQueue]);

  const currentRemaining = useMemo(() => {
    if (dueWords.length > 0) return null;
    return wrongQueue[0]?.remaining ?? null;
  }, [dueWords, wrongQueue]);

  const isWrongMode = dueWords.length === 0 && wrongQueue.length > 0;
  const isDone = currentIndex === null;

  const progress = total === 0 ? 0 : Math.round((masteredCount / total) * 100);

  const currentWord = useMemo(() => {
    if (currentIndex === null) return null;
    return dueWords.find((d) => d.index === currentIndex)?.word || { en: '', cn: '' };
  }, [currentIndex, dueWords]);

  const handleKnown = useCallback(() => {
    if (currentIndex === null) return;
    setFlipped(false);
    onKnown(currentIndex);

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
  }, [currentIndex, isWrongMode, onKnown]);

  const handleAgain = useCallback(() => {
    if (currentIndex === null) return;
    setFlipped(false);
    onAgain(currentIndex);

    if (!isWrongMode) {
      // First time wrong today: add to wrong queue with required correct count
      setWrongQueue((prev) => {
        if (prev.some((item) => item.index === currentIndex)) return prev;
        return [...prev, { index: currentIndex, remaining: REQUIRED_CORRECT }];
      });
    } else {
      // Wrong again during wrong-mode review: reset required count
      setWrongQueue((prev) => {
        const [first, ...rest] = prev;
        if (!first) return prev;
        return [...rest, { ...first, remaining: REQUIRED_CORRECT }];
      });
    }
  }, [currentIndex, isWrongMode, onAgain]);

  const handleFlip = useCallback(() => {
    if (!isDone) setFlipped((f) => !f);
  }, [isDone]);

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

  return (
    <section className="view" id="study-view">
      <section className="progress">
        <span id="progress-text">{masteredCount} / {total} 已掌握</span>
        <div className="progress-bar">
          <div id="progress-fill" style={{ width: `${progress}%` }}></div>
        </div>
      </section>

      {isDone ? (
        <>
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
        </>
      ) : currentWord ? (
        <WordCard
          word={currentWord}
          wordState={getWordState(currentIndex)}
          flipped={flipped}
          onFlip={handleFlip}
          onKnown={handleKnown}
          onAgain={handleAgain}
          isWrongMode={isWrongMode}
          remaining={currentRemaining ?? undefined}
          disabled={false}
        />
      ) : null}

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
