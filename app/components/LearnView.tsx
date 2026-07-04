'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Word } from '../data/words';
import { formatDate, getPlantIcon } from '../lib/utils';
import { MAX_NEW_WORDS_PER_DAY } from '../hooks/useVocabState';
import EmptyState from './EmptyState';
import { Button } from './ui/Button';
import ProgressBar from './ui/ProgressBar';

interface LearnViewProps {
  unlearnedWords: Word[];
  totalWords: number;
  todayCount: number;
  remaining: number;
  onLearn: (en: string) => void;
  onGoToSettings: () => void;
}

export default function LearnView({ unlearnedWords, totalWords, todayCount, remaining, onLearn, onGoToSettings }: LearnViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const actualRemaining = Math.min(remaining, unlearnedWords.length);
  const displayTotal = Math.min(MAX_NEW_WORDS_PER_DAY, unlearnedWords.length + todayCount);
  const availableWords = useMemo(() => unlearnedWords.slice(0, actualRemaining), [unlearnedWords, actualRemaining]);
  const isDone = availableWords.length === 0 || actualRemaining === 0;

  useEffect(() => {
    setCurrentIndex(0);
    setFlipped(false);
  }, [availableWords.length]);

  const currentWord = availableWords[currentIndex];

  const handleLearn = useCallback(() => {
    if (isDone || !currentWord) return;
    setFlipped(false);
    onLearn(currentWord.en);
  }, [isDone, currentWord, onLearn]);

  const handleSkip = useCallback(() => {
    if (isDone || availableWords.length <= 1) return;
    setFlipped(false);
    setCurrentIndex((i) => (i + 1) % availableWords.length);
  }, [isDone, availableWords.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isDone) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (e.key === 'ArrowRight' || e.key === 'k') {
        handleLearn();
      } else if (e.key === 'ArrowLeft' || e.key === 'a') {
        handleSkip();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDone, handleLearn, handleSkip]);

  // Empty library: no words at all
  if (totalWords === 0) {
    return (
      <section className="flex-1 flex flex-col min-h-[60vh]" id="learn-view">
        <EmptyState
          icon="📭"
          title="词库还是空的"
          message="先去设置里导入单词，播种才能开始哦。"
          actionLabel="去导入单词"
          onAction={onGoToSettings}
        />
      </section>
    );
  }

  return (
    <section className="flex-1 flex flex-col min-h-[60vh]" id="learn-view">
      <section className="mb-6">
        <span className="block text-sm text-white/80 mb-2">
          今日新学 {todayCount} / {displayTotal}
        </span>
        <ProgressBar value={todayCount} max={displayTotal} />
      </section>

      {isDone ? (
        <div className="glass-card mb-6 p-1.5">
          <section className="card aspect-[3/2] cursor-default" aria-label="今日播种完成">
            <div className="card-inner relative w-full h-full transition-transform duration-500 rounded-[16px]">
              <div className="card-front word-card-face text-engrave-light absolute inset-0 flex flex-col items-center justify-center p-6">
                <h2 className="text-4xl font-bold mb-2 font-display">🌱 今日播种完成</h2>
                <p className="text-base">
                  {actualRemaining === 0 && unlearnedWords.length > 0
                    ? `今天已经学了 ${todayCount} 个新单词，明天再来吧！`
                    : '所有单词都已经开始学习了，去施肥复习吧！'}
                </p>
              </div>
            </div>
          </section>
          <div className="px-5 pb-5 pt-3">
            <p className="text-sm text-white/70 mb-4 text-center">没有可学的新单词了</p>
            <div className="flex gap-3">
              <Button variant="secondary" size="lg" className="flex-1" disabled>跳过</Button>
              <Button size="lg" className="flex-1" disabled>播种</Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-card mb-6 p-1.5">
          <section
            className={`card aspect-[3/2] cursor-pointer ${flipped ? 'flipped' : ''}`}
            onClick={() => setFlipped(!flipped)}
          >
            <div className="card-inner relative w-full h-full transition-transform duration-500 rounded-[16px]">
              <div className="card-front word-card-face text-engrave-light absolute inset-0 flex flex-col items-center justify-center p-6">
                <span className="text-xs uppercase tracking-widest opacity-70 mb-4">新单词 · 点击学习</span>
                <h2 className="text-4xl font-bold">{currentWord.en}</h2>
              </div>
              <div className="card-back word-card-back text-engrave-dark absolute inset-0 flex flex-col items-center justify-center p-6 [transform:rotateY(180deg)]">
                <span className="text-xs uppercase tracking-widest opacity-80 mb-4">中文 · 明天开始复习</span>
                <p className="text-2xl font-semibold mb-4">{currentWord.cn}</p>
                <span className="text-xs uppercase tracking-widest opacity-80">
                  {getPlantIcon(1)} 阶段 1 · 下次复习 {formatDate(Date.now() + 24 * 60 * 60 * 1000)}
                </span>
              </div>
            </div>
          </section>

          <div className="px-5 pb-5 pt-3">
            <p className="text-sm text-white/70 mb-4 text-center">点击卡片查看释义</p>
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
