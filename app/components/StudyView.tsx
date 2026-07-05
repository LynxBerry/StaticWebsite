'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import WordCard from './WordCard';
import EmptyState from './EmptyState';
import ComboBadge from './ComboBadge';
import Confetti from './Confetti';
import { Button } from './ui/Button';
import ProgressBar from './ui/ProgressBar';
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
  onGoToBank: () => void;
  onGoToSettings: () => void;
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
  onResetWrongQueue,
  onGoToBank,
  onGoToSettings
}: StudyViewProps) {
  const [flipped, setFlipped] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [combo, setCombo] = useState(0);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const triggerFeedback = useCallback((type: 'correct' | 'wrong') => {
    setFeedback(type);
    window.setTimeout(() => setFeedback(null), 450);
  }, []);

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
    triggerFeedback('correct');
    setCombo((c) => c + 1);

    if (isWrongMode) {
      const reachedZero = onDecrementWrongRemaining(currentWord.en);
      if (reachedZero) {
        onKnown(currentWord.en);
      }
    } else {
      onKnown(currentWord.en);
    }
  }, [currentWord, isWrongMode, onKnown, onDecrementWrongRemaining, playSound, triggerFeedback]);

  const handleAgain = useCallback(() => {
    if (!currentWord) return;
    setFlipped(false);
    playSound('wrong');
    triggerFeedback('wrong');
    setCombo(0);
    onAgain(currentWord.en);

    if (!isWrongMode) {
      onAddToWrongQueue(currentWord.en);
    }
  }, [currentWord, isWrongMode, onAgain, onAddToWrongQueue, playSound, triggerFeedback]);

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

  // Empty library: no words to review
  if (total === 0) {
    return (
      <section className="flex-1 flex flex-col min-h-[60vh]" id="study-view">
        <EmptyState
          icon="📭"
          title="词库还是空的"
          message="先去词库添加单词，复习才能开始哦。"
          actionLabel="去添加单词"
          onAction={onGoToBank}
        />
      </section>
    );
  }

  if (isDone) {
    return (
      <section className="flex-1 flex flex-col min-h-[60vh]" id="study-view">
        <section className="mb-6">
          <span className="block text-sm text-black/80 mb-2">{masteredCount} / {total} 已掌握</span>
          <ProgressBar value={masteredCount} max={total} />
        </section>

        <div className="glass-card mb-6 p-1.5">
          <section className="card aspect-[3/2] cursor-default animate-spring-in relative" aria-label="今日任务完成">
            <Confetti />
            <div className="card-inner relative w-full h-full transition-transform duration-500 rounded-[16px]">
              <div className="card-front word-card-face text-engrave-light absolute inset-0 flex flex-col items-center justify-center p-6">
                <h2 className="text-4xl font-bold mb-2 font-display">🎉 今日任务完成</h2>
                <p className="text-base">所有错题都已通过，明天再来！</p>
              </div>
            </div>
          </section>

          <div className="px-5 pb-5 pt-3">
            <p className="text-sm text-black/70 mb-4 text-center">全部复习完成</p>
            <div className="flex gap-3">
              <Button variant="secondary" size="lg" className="flex-1" disabled>
                😅 不认识
              </Button>
              <Button size="lg" className="flex-1" disabled>
                😎 认识
              </Button>
            </div>
          </div>
        </div>

        <section className="flex justify-center gap-8 mb-4 text-sm text-black/70">
          <div>已掌握：<strong className="block text-xl text-black">{masteredCount}</strong></div>
          <div>今日到期：<strong className="block text-xl text-black">{dueWords.length}</strong></div>
          {wrongQueue.length > 0 && (
            <div>待通过错题：<strong className="block text-xl text-black">{wrongQueue.length}</strong></div>
          )}
        </section>
      </section>
    );
  }

  const displayWord = currentWord;

  return (
    <section className="flex-1 flex flex-col min-h-[60vh]" id="study-view">
      <ComboBadge count={combo} />
      <section className="mb-6">
        <span className="block text-sm text-black/80 mb-2">{masteredCount} / {total} 已掌握</span>
        <ProgressBar value={masteredCount} max={total} />
      </section>

      {displayWord && (
        <WordCard
          word={displayWord}
          wordState={getWordState(displayWord.en)}
          flipped={flipped}
          feedback={feedback}
          onFlip={handleFlip}
          onKnown={handleKnown}
          onAgain={handleAgain}
          isWrongMode={isWrongMode}
          remaining={currentRemaining ?? undefined}
          disabled={false}
        />
      )}

      <section className="flex justify-center gap-8 mb-4 text-sm text-black/70">
        <div>已掌握：<strong className="block text-xl text-black">{masteredCount}</strong></div>
        <div>今日到期：<strong className="block text-xl text-black">{dueWords.length}</strong></div>
        {wrongQueue.length > 0 && (
          <div>待通过错题：<strong className="block text-xl text-black">{wrongQueue.length}</strong></div>
        )}
      </section>
    </section>
  );
}
