'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Word } from '../data/words';
import { formatDate, getPlantIcon } from '../lib/utils';
import { MAX_NEW_WORDS_PER_DAY } from '../hooks/useVocabState';

interface LearnViewProps {
  unlearnedWords: Word[];
  todayCount: number;
  remaining: number;
  onLearn: (en: string) => void;
}

const primaryBtn =
  `relative flex-1 overflow-hidden rounded-xl px-4 py-3.5 text-base font-semibold text-farm-text transition-all duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)] bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 shadow-[0_4px_16px_rgba(249,115,22,0.4),inset_0_1px_0_rgba(255,255,255,0.2)] [text-shadow:0_1px_2px_rgba(0,0,0,0.2)] before:absolute before:inset-0 before:content-[''] before:bg-gradient-to-b before:from-white/20 before:to-transparent before:opacity-60 before:transition-opacity before:duration-250 enabled:hover:-translate-y-0.5 enabled:hover:scale-[1.02] enabled:hover:shadow-[0_8px_24px_rgba(249,115,22,0.55),inset_0_1px_0_rgba(255,255,255,0.25)] enabled:hover:before:opacity-100 enabled:active:-translate-y-px enabled:active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:grayscale-[0.5]`;

const secondaryBtn =
  `relative flex-1 overflow-hidden rounded-xl border border-farm-muted/25 bg-[rgba(69,26,3,0.6)] px-4 py-3.5 text-base font-semibold text-farm-muted backdrop-blur-lg shadow-[0_4px_14px_rgba(0,0,0,0.2)] transition-all duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)] before:absolute before:inset-0 before:content-[''] before:bg-gradient-to-b before:from-white/20 before:to-transparent before:opacity-60 before:transition-opacity before:duration-250 enabled:hover:bg-[rgba(69,26,3,0.8)] enabled:hover:border-farm-muted/45 enabled:hover:shadow-[0_6px_20px_rgba(0,0,0,0.3)] enabled:hover:before:opacity-100 enabled:active:-translate-y-px enabled:active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:grayscale-[0.5]`;

export default function LearnView({ unlearnedWords, todayCount, remaining, onLearn }: LearnViewProps) {
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

  return (
    <section className="flex-1 flex flex-col min-h-[60vh]" id="learn-view">
      <section className="mb-6">
        <span className="block text-sm text-farm-muted mb-2">
          今日新学 {todayCount} / {displayTotal}
        </span>
        <div className="h-2 bg-[#451a03] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-300"
            style={{ width: `${displayTotal > 0 ? (todayCount / displayTotal) * 100 : 0}%` }}
          ></div>
        </div>
      </section>

      {isDone ? (
        <>
          <section className="card aspect-[3/2] cursor-default mb-3" aria-label="今日播种完成">
            <div className="card-inner relative w-full h-full transition-transform duration-500 rounded-2xl">
              <div className="card-front absolute inset-0 flex flex-col items-center justify-center p-6 rounded-2xl bg-gradient-to-br from-[rgba(255,247,237,0.92)] to-[rgba(255,237,213,0.88)] backdrop-blur-glass text-[#431407] shadow-[0_10px_30px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] border border-white/15">
                <h2 className="text-4xl font-bold mb-2">🌱 今日播种完成</h2>
                <p className="text-base">
                  {actualRemaining === 0 && unlearnedWords.length > 0
                    ? `今天已经学了 ${todayCount} 个新单词，明天再来吧！`
                    : '所有单词都已经开始学习了，去施肥复习吧！'}
                </p>
              </div>
            </div>
          </section>
          <p className="text-sm text-farm-muted mb-6">没有可学的新单词了</p>
          <div className="flex gap-3 mb-6">
            <button className={secondaryBtn} disabled>⏭️ 跳过</button>
            <button className={primaryBtn} disabled>🌱 播种</button>
          </div>
        </>
      ) : (
        <>
          <section
            className={`card aspect-[3/2] cursor-pointer mb-3 ${flipped ? 'flipped' : ''}`}
            onClick={() => setFlipped(!flipped)}
          >
            <div className="card-inner relative w-full h-full transition-transform duration-500 rounded-2xl">
              <div className="card-front absolute inset-0 flex flex-col items-center justify-center p-6 rounded-2xl bg-gradient-to-br from-[rgba(255,247,237,0.92)] to-[rgba(255,237,213,0.88)] backdrop-blur-glass text-[#431407] shadow-[0_10px_30px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] border border-white/15">
                <span className="text-xs uppercase tracking-widest opacity-70 mb-3">新单词 · 点击学习</span>
                <h2 className="text-4xl font-bold">{currentWord.en}</h2>
              </div>
              <div className="card-back absolute inset-0 flex flex-col items-center justify-center p-6 rounded-2xl bg-gradient-to-br from-orange-500/85 to-orange-600/80 backdrop-blur-glass text-farm-text [transform:rotateY(180deg)] shadow-[0_10px_30px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] border border-white/15">
                <span className="text-xs uppercase tracking-widest opacity-70 mb-3">中文 · 明天开始复习</span>
                <p className="text-2xl font-semibold mb-3">{currentWord.cn}</p>
                <span className="text-xs uppercase tracking-widest opacity-70">
                  {getPlantIcon(1)} 阶段 1 · 下次复习 {formatDate(Date.now() + 24 * 60 * 60 * 1000)}
                </span>
              </div>
            </div>
          </section>

          <p className="text-sm text-farm-muted mb-6">点击卡片查看释义</p>

          <div className="flex gap-3 mb-6">
            <button className={secondaryBtn} onClick={handleSkip}>
              ⏭️ 跳过
            </button>
            <button className={primaryBtn} onClick={handleLearn}>
              🌱 播种
            </button>
          </div>
        </>
      )}
    </section>
  );
}
