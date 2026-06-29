'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import WordCard from './WordCard';
import { Word } from '../data/words';
import { getAudioContext, playSuccessSound, playWrongSound } from '../lib/sound';

const REQUIRED_CORRECT = 3;

interface WrongItem {
  en: string;
  remaining: number;
}

interface StudyViewProps {
  words: Word[];
  dueWords: Word[];
  masteredCount: number;
  total: number;
  wrongQueue: WrongItem[];
  getWordState: (en: string) => { level: number; nextReview: number };
  onKnown: (en: string) => void;
  onAgain: (en: string) => void;
  onAddToWrongQueue: (en: string) => void;
  onDecrementWrongRemaining: (en: string) => boolean;
  onResetWrongQueue: () => void;
}

export default function StudyView({
  words,
  dueWords,
  masteredCount,
  total,
  wrongQueue,
  getWordState,
  onKnown,
  onAgain,
  onAddToWrongQueue,
  onDecrementWrongRemaining,
  onResetWrongQueue
}: StudyViewProps) {
  const [flipped, setFlipped] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const currentWord = useMemo(() => {
    if (dueWords.length > 0) return dueWords[0];
    if (wrongQueue.length > 0) {
      return words.find((w) => w.en === wrongQueue[0].en) || null;
    }
    return null;
  }, [dueWords, wrongQueue, words]);

  const currentRemaining = useMemo(() => {
    if (dueWords.length > 0) return null;
    return wrongQueue[0]?.remaining ?? null;
  }, [dueWords, wrongQueue]);

  const isWrongMode = dueWords.length === 0 && wrongQueue.length > 0;
  const isDone = currentWord === null;

  const progress = total === 0 ? 0 : Math.round((masteredCount / total) * 100);

  const playSound = useCallback(async (type: 'success' | 'wrong') => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = getAudioContext();
    }
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    if (type === 'success') {
      await playSuccessSound(ctx);
    } else {
      await playWrongSound(ctx);
    }
  }, []);

  const handleKnown = useCallback(() => {
    if (!currentWord) return;
    setFlipped(false);
    playSound('success');

    if (isWrongMode) {
      const reachedZero = onDecrementWrongRemaining(currentWord.en);
      if (reachedZero) {
        onKnown(currentWord.en);
      }
    } else {
      onKnown(currentWord.en);
    }
  }, [currentWord, isWrongMode, onKnown, onDecrementWrongRemaining, playSound]);

  const handleAgain = useCallback(() => {
    if (!currentWord) return;
    setFlipped(false);
    playSound('wrong');
    onAgain(currentWord.en);

    if (!isWrongMode) {
      onAddToWrongQueue(currentWord.en);
    }
  }, [currentWord, isWrongMode, onAgain, onAddToWrongQueue, playSound]);

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

  useEffect(() => {
    return () => {
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

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
          {wrongQueue.length > 0 && (
            <div>待通过错题：<strong>{wrongQueue.length}</strong></div>
          )}
        </section>
      </section>
    );
  }

  const displayWord = currentWord;

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
