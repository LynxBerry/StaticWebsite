'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Word } from '../data/words';
import { formatDate } from '../lib/utils';
import EmptyState from './EmptyState';
import { PlantIcon } from './PlantIcon';
import { SproutIcon } from './icons/SproutIcon';
import { Button } from './ui/Button';
import SpeakButton from './ui/SpeakButton';
import ProgressBar from './ui/ProgressBar';

interface LearnViewProps {
  unlearnedWords: Word[];
  totalWords: number;
  todayCount: number;
  remaining: number;
  dailyNewLimit: number;
  onLearn: (en: string) => void;
  onGoToBank: () => void;
  onGoToSettings: () => void;
}

export default function LearnView({ unlearnedWords, totalWords, todayCount, remaining, dailyNewLimit, onLearn, onGoToBank, onGoToSettings }: LearnViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const actualRemaining = Math.min(remaining, unlearnedWords.length);
  const displayTotal = Math.min(dailyNewLimit, unlearnedWords.length + todayCount);
  const availableWords = useMemo(() => unlearnedWords.slice(0, actualRemaining), [unlearnedWords, actualRemaining]);

  useEffect(() => {
    setCurrentIndex(0);
    setFlipped(false);
  }, [availableWords.length, availableWords[0]?.en]);

  // Clamp the index against the current array length so a render that lands
  // between a state shrink (learn/skip shrinks availableWords) and the reset
  // effect above can never dereference an out-of-bounds element. Without this,
  // skipping to the last word then learning it makes currentWord undefined for
  // one render → TypeError on {currentWord.en}.
  const safeIndex = Math.min(currentIndex, Math.max(0, availableWords.length - 1));
  const currentWord = availableWords.length > 0 ? availableWords[safeIndex] : undefined;
  const isDone = availableWords.length === 0 || actualRemaining === 0;

  // #4 debounce: lock sow/skip while a transition is in flight so a double
  // tap can't double-sow the same slot (and race the index clamp above).
  const busyRef = useRef(false);

  const handleLearn = useCallback(() => {
    if (isDone || !currentWord || busyRef.current) return;
    busyRef.current = true;
    // Release on the next tick — by then availableWords has shrunk and the
    // index-clamp effect has reset currentIndex, so a re-tap targets the new
    // word (or hits the isDone guard).
    window.setTimeout(() => { busyRef.current = false; }, 0);
    setFlipped(false);
    onLearn(currentWord.en);
  }, [isDone, currentWord, onLearn]);

  const handleSkip = useCallback(() => {
    if (isDone || availableWords.length <= 1 || busyRef.current) return;
    busyRef.current = true;
    window.setTimeout(() => { busyRef.current = false; }, 0);
    setFlipped(false);
    setCurrentIndex((i) => (i + 1) % availableWords.length);
  }, [isDone, availableWords.length]);

  useEffect(() => {
    const isInteractiveTarget = (target: EventTarget | null) => {
      const el = target as HTMLElement | null;
      if (!el) return false;
      const tag = el.tagName;
      return tag === 'BUTTON' || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'A' || el.isContentEditable;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isDone) return;
      if (e.key === ' ' || e.key === 'Enter') {
        // #10: don't steal Space/Enter from a focused button/input.
        if (isInteractiveTarget(e.target)) return;
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (e.key === 'ArrowRight' || e.key === 'k') {
        if (isInteractiveTarget(e.target)) return;
        // Require seeing the meaning before sowing (don't score blind).
        if (flipped) handleLearn();
      } else if (e.key === 'ArrowLeft' || e.key === 'a') {
        if (isInteractiveTarget(e.target)) return;
        handleSkip();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDone, flipped, handleLearn, handleSkip]);

  // Empty library: no words at all
  if (totalWords === 0) {
    return (
      <section className="flex-1 flex flex-col min-h-[60vh]" id="learn-view">
        <EmptyState
          icon="📭"
          title="词库还是空的"
          message="先去词库添加单词，播种才能开始哦。"
          actionLabel="去添加单词"
          onAction={onGoToBank}
        />
      </section>
    );
  }

  return (
    <section className="flex-1 flex flex-col min-h-[60vh]" id="learn-view">
      <section className="mb-6">
        <span className="block text-sm text-farm-muted mb-2">
          今日新学 {todayCount} / {displayTotal}
        </span>
        <ProgressBar value={todayCount} max={displayTotal} />
      </section>

      {isDone || !currentWord ? (
        <div className="flat-card mb-6 p-1.5">
          <section className="card aspect-[3/2] cursor-default" aria-label="今日播种完成">
            <div className="card-inner relative w-full h-full transition-transform duration-500 rounded-[16px]">
              <div className="card-front word-card-face text-engrave-light absolute inset-0 flex flex-col items-center justify-center p-6">
                <h2 className="text-4xl font-bold mb-2 font-display flex items-center gap-3">
                  <SproutIcon colored className="w-10 h-10 text-sprout-600" /> 今日播种完成
                </h2>
                <p className="text-base">
                  {actualRemaining === 0 && unlearnedWords.length > 0
                    ? `今天已经学了 ${todayCount} 个新单词，明天再来吧！`
                    : '所有单词都已经开始学习了，去施肥复习吧！'}
                </p>
              </div>
            </div>
          </section>
          <div className="px-5 pb-5 pt-3">
            <p className="text-sm text-farm-muted mb-4 text-center">没有可学的新单词了</p>
            <div className="flex gap-3">
              <Button variant="secondary" size="lg" className="flex-1" disabled>跳过</Button>
              <Button size="lg" className="flex-1" disabled>播种</Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flat-card mb-6 p-1.5">
          <section
            className={`card aspect-[3/2] cursor-pointer ${flipped ? 'flipped' : ''}`}
            onClick={() => setFlipped(!flipped)}
          >
            <div className="card-inner relative w-full h-full transition-transform duration-500 rounded-[16px]">
              <div className="card-front word-card-face text-engrave-light absolute inset-0 flex flex-col items-center justify-center p-6">
                <span className="text-xs uppercase tracking-widest opacity-70 mb-4">新单词 · 点击学习</span>
                <div className="flex items-center gap-3">
                  <h2 className="text-4xl font-bold">{currentWord.en}</h2>
                  <SpeakButton text={currentWord.en} size="lg" />
                </div>
              </div>
              <div className="card-back word-card-back text-engrave-dark absolute inset-0 flex flex-col items-center justify-center p-6 [transform:rotateY(180deg)]">
                <span className="text-xs uppercase tracking-widest opacity-80 mb-4">中文 · 明天开始复习</span>
                <p className="text-2xl font-semibold mb-4">{currentWord.cn}</p>
                <span className="text-xs uppercase tracking-widest opacity-80">
                  <PlantIcon level={1} className="inline-block w-4 h-4 align-middle" /> 阶段 1 · 下次复习 {formatDate(Date.now() + 24 * 60 * 60 * 1000)}
                </span>
              </div>
            </div>
          </section>

          <div className="px-5 pb-5 pt-3">
            <p className="text-sm text-farm-muted mb-4 text-center">点击卡片查看释义</p>
            <div className="flex gap-3">
              <Button variant="secondary" size="lg" className="flex-1" onClick={handleSkip}>
                跳过
              </Button>
              <Button size="lg" className="flex-1" onClick={handleLearn}>
                播种
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
