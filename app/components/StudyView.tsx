'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import WordCard from './WordCard';
import EmptyState from './EmptyState';
import Confetti from './Confetti';
import { QuestionMarkIcon } from './icons/QuestionMarkIcon';
import { ThumbsUpIcon } from './icons/ThumbsUpIcon';
import { PartyPopperIcon } from './icons/PartyPopperIcon';
import { Button } from './ui/Button';
import ProgressBar from './ui/ProgressBar';
import { Word } from '../data/words';
import { getAudioContext, playSuccessSound, playWrongSound } from '../lib/sound';

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
  /** Wrong-mode: restart the consecutive-correct streak on a wrong answer. */
  onResetWrongRemaining: (en: string) => void;
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
  onResetWrongRemaining,
  onDecrementWrongRemaining,
  onResetWrongQueue,
  onGoToBank,
  onGoToSettings
}: StudyViewProps) {
  const [flipped, setFlipped] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [combo, setCombo] = useState(0);
  const [reviewedCount, setReviewedCount] = useState(0);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // #4 debounce: lock answers while feedback is showing so a rapid double-tap
  // (or double keypress) can't promote the same word two levels at once. The
  // ref is the source of truth inside async callbacks; `answering` mirrors it
  // to drive button disabled state.
  const answeringRef = useRef(false);
  const [answering, setAnswering] = useState(false);
  const feedbackTimerRef = useRef<number | null>(null);

  const triggerFeedback = useCallback((type: 'correct' | 'wrong') => {
    // Replace any in-flight feedback timer so a fast follow-up answer doesn't
    // get its feedback cleared early by the previous answer's timeout.
    if (feedbackTimerRef.current !== null) {
      window.clearTimeout(feedbackTimerRef.current);
    }
    setFeedback(type);
    feedbackTimerRef.current = window.setTimeout(() => {
      setFeedback(null);
      answeringRef.current = false;
      setAnswering(false);
      feedbackTimerRef.current = null;
    }, 450);
  }, []);

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current !== null) window.clearTimeout(feedbackTimerRef.current);
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
      }
    };
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

  const totalReviewTarget = dueWords.length + wrongQueue.length + reviewedCount;

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
    if (!currentWord || answeringRef.current) return;
    answeringRef.current = true;
    setAnswering(true);
    setFlipped(false);
    playSound('success');
    triggerFeedback('correct');
    setCombo((c) => c + 1);
    setReviewedCount((c) => c + 1);

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
    if (!currentWord || answeringRef.current) return;
    answeringRef.current = true;
    setAnswering(true);
    setFlipped(false);
    playSound('wrong');
    triggerFeedback('wrong');
    setCombo(0);
    setReviewedCount((c) => c + 1);
    onAgain(currentWord.en);

    if (isWrongMode) {
      // #3: a wrong answer during wrong-mode restarts the consecutive-correct
      // streak (remaining → REQUIRED_CORRECT). Previously the existing entry
      // was left untouched, so "对-错-对-对" could clear it non-consecutively.
      onResetWrongRemaining(currentWord.en);
    } else {
      onAddToWrongQueue(currentWord.en);
    }
  }, [currentWord, isWrongMode, onAgain, onAddToWrongQueue, onResetWrongRemaining, playSound, triggerFeedback]);

  const handleFlip = useCallback(() => {
    if (!isDone) setFlipped((f) => !f);
  }, [isDone]);

  // #10 keyboard: don't hijack Space/Enter when the user is focused on a
  // button/input (let it activate normally), and only allow the "认识/不认识"
  // shortcuts AFTER the card is flipped — otherwise kids can score without
  // ever looking at the answer.
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
        if (isInteractiveTarget(e.target)) return; // let the focused control handle it
        e.preventDefault();
        handleFlip();
      } else if (e.key === 'ArrowRight' || e.key === 'k') {
        if (isInteractiveTarget(e.target)) return;
        if (flipped) handleKnown();
      } else if (e.key === 'ArrowLeft' || e.key === 'a') {
        if (isInteractiveTarget(e.target)) return;
        if (flipped) handleAgain();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDone, flipped, handleFlip, handleKnown, handleAgain]);

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
          <span className="block text-sm text-farm-muted mb-2">{reviewedCount} / {totalReviewTarget} 已复习</span>
          <ProgressBar value={reviewedCount} max={totalReviewTarget} />
        </section>

        <div className="flat-card mb-6 p-1.5">
          <section className="card aspect-[3/2] cursor-default animate-spring-in relative" aria-label="今日任务完成">
            <Confetti />
            <div className="card-inner relative w-full h-full transition-transform duration-500 rounded-[16px]">
              <div className="card-front word-card-face text-engrave-light absolute inset-0 flex flex-col items-center justify-center p-6">
                <h2 className="text-4xl font-bold mb-2 font-display flex items-center gap-3">
                  <PartyPopperIcon className="w-10 h-10" /> 今日任务完成
                </h2>
                <p className="text-base">所有错题都已通过，明天再来！</p>
              </div>
            </div>
          </section>

          <div className="px-5 pb-5 pt-3">
            <p className="text-sm text-farm-muted mb-4 text-center">全部复习完成</p>
            <div className="flex gap-3">
              <Button variant="secondary" size="lg" className="flex-1 gap-2" disabled>
                <QuestionMarkIcon className="w-5 h-5" /> 不认识
              </Button>
              <Button size="lg" className="flex-1 gap-2" disabled>
                <ThumbsUpIcon className="w-5 h-5" /> 认识
              </Button>
            </div>
          </div>
        </div>

        <section className="flex justify-center gap-8 mb-4 text-sm text-farm-muted">
          <div>已复习：<strong className="block text-xl text-farm-text">{reviewedCount}</strong></div>
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
          <span className="block text-sm text-farm-muted mb-2">{reviewedCount} / {totalReviewTarget} 已复习</span>
          <ProgressBar value={reviewedCount} max={totalReviewTarget} />
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
          disabled={answering || isDone}
          combo={combo}
        />
      )}

      <section className="flex justify-center gap-8 mb-4 text-sm text-farm-muted">
        <div>已复习：<strong className="block text-xl text-farm-text">{reviewedCount}</strong></div>
        <div>今日到期：<strong className="block text-xl text-farm-text">{dueWords.length}</strong></div>
        {wrongQueue.length > 0 && (
          <div>待通过错题：<strong className="block text-xl text-farm-text">{wrongQueue.length}</strong></div>
        )}
      </section>
    </section>
  );
}
