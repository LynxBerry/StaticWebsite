'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import WordCard from './WordCard';
import EmptyState from './EmptyState';
import { Button } from './ui/Button';
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
  onGoToSettings
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

  // Empty library: no words to review
  if (total === 0) {
    return (
      <section className="flex-1 flex flex-col min-h-[60vh]" id="study-view">
        <EmptyState
          icon="📭"
          title="词库还是空的"
          message="先去设置里导入单词，复习才能开始哦。"
          actionLabel="去导入单词"
          onAction={onGoToSettings}
        />
      </section>
    );
  }

  if (isDone) {
    return (
      <section className="flex-1 flex flex-col min-h-[60vh]" id="study-view">
        <section className="mb-6">
          <span className="block text-sm text-farm-muted mb-2">{masteredCount} / {total} 已掌握</span>
          <div className="h-2 bg-[#451a03] rounded-full overflow-hidden">
            <div className="progress-shimmer h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-300" style={{ width: `${progress}%` }}></div>
          </div>
        </section>

        <section className="card aspect-[3/2] cursor-default mb-4" aria-label="今日任务完成">
          <div className="card-inner relative w-full h-full transition-transform duration-500 rounded-2xl">
            <div className="card-front absolute inset-0 flex flex-col items-center justify-center p-6 rounded-2xl bg-gradient-to-br from-[rgba(255,247,237,0.92)] to-[rgba(255,237,213,0.88)] backdrop-blur-glass text-[#431407] shadow-[0_10px_30px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] border border-white/15">
              <h2 className="text-4xl font-bold mb-2">🎉 今日任务完成</h2>
              <p className="text-base">所有错题都已通过，明天再来！</p>
            </div>
          </div>
        </section>
        <p className="text-sm text-farm-muted mb-6">全部复习完成</p>

        <section className="flex gap-3 mb-6">
          <Button variant="secondary" className="flex-1" disabled>
            😅 不认识
          </Button>
          <Button className="flex-1" disabled>
            😎 认识
          </Button>
        </section>

        <section className="flex justify-center gap-8 mb-4 text-sm text-farm-muted">
          <div>已掌握：<strong className="block text-xl text-farm-text">{masteredCount}</strong></div>
          <div>今日到期：<strong className="block text-xl text-farm-text">{dueWords.length}</strong></div>
          {wrongQueue.length > 0 && (
            <div>待通过错题：<strong className="block text-xl text-farm-text">{wrongQueue.length}</strong></div>
          )}
        </section>
      </section>
    );
  }

  const displayWord = currentWord;

  return (
    <section className="flex-1 flex flex-col min-h-[60vh]" id="study-view">
      <section className="mb-6">
        <span className="block text-sm text-farm-muted mb-2">{masteredCount} / {total} 已掌握</span>
        <div className="h-2 bg-[#451a03] rounded-full overflow-hidden">
          <div className="progress-shimmer h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-300" style={{ width: `${progress}%` }}></div>
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

      <section className="flex justify-center gap-8 mb-4 text-sm text-farm-muted">
        <div>已掌握：<strong className="block text-xl text-farm-text">{masteredCount}</strong></div>
        <div>今日到期：<strong className="block text-xl text-farm-text">{dueWords.length}</strong></div>
        {wrongQueue.length > 0 && (
          <div>待通过错题：<strong className="block text-xl text-farm-text">{wrongQueue.length}</strong></div>
        )}
      </section>
    </section>
  );
}
