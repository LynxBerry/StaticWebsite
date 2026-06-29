'use client';

import { useState, useEffect, useCallback } from 'react';
import WordCard from './WordCard';
import { Word } from '../data/words';

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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    setCurrentIndex(0);
    setFlipped(false);
  }, [dueWords.length]);

  const progress = total === 0 ? 0 : Math.round((masteredCount / total) * 100);
  const isDone = dueWords.length === 0;

  const handleKnown = useCallback(() => {
    if (isDone) return;
    setFlipped(false);
    onKnown(dueWords[currentIndex].index);
  }, [isDone, currentIndex, dueWords, onKnown]);

  const handleAgain = useCallback(() => {
    if (isDone) return;
    setFlipped(false);
    onAgain(dueWords[currentIndex].index);
  }, [isDone, currentIndex, dueWords, onAgain]);

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
                <p>明天再来复习吧，好好过暑假！</p>
              </div>
            </div>
          </section>
          <p className="hint">所有到期单词都已复习完</p>
          <div className="actions">
            <button className="btn btn-again" disabled>😅 不认识</button>
            <button className="btn btn-know" disabled>😎 认识</button>
          </div>
        </>
      ) : (
        <WordCard
          word={dueWords[currentIndex].word}
          wordState={getWordState(dueWords[currentIndex].index)}
          flipped={flipped}
          onFlip={handleFlip}
          onKnown={handleKnown}
          onAgain={handleAgain}
          disabled={false}
        />
      )}

      <section className="stats">
        <div>已掌握：<strong>{masteredCount}</strong></div>
        <div>今日到期：<strong>{dueWords.length}</strong></div>
      </section>
    </section>
  );
}
