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
    <section className="view" id="learn-view">
      <section className="progress">
        <span id="progress-text">今日新学 {todayCount} / {displayTotal}</span>
        <div className="progress-bar">
          <div id="progress-fill" style={{ width: `${displayTotal > 0 ? (todayCount / displayTotal) * 100 : 0}%` }}></div>
        </div>
      </section>

      {isDone ? (
        <>
          <section className="card done">
            <div className="card-inner">
              <div className="card-front">
                <h2>🌱 今日播种完成</h2>
                <p>
                  {actualRemaining === 0 && unlearnedWords.length > 0
                    ? `今天已经学了 ${todayCount} 个新单词，明天再来吧！`
                    : '所有单词都已经开始学习了，去施肥复习吧！'}
                </p>
              </div>
            </div>
          </section>
          <p className="hint">没有可学的新单词了</p>
          <div className="actions">
            <button className="btn btn-again" disabled>⏭️ 跳过</button>
            <button className="btn btn-know" disabled>🌱 播种</button>
          </div>
        </>
      ) : (
        <>
          <section
            className={`card ${flipped ? 'flipped' : ''}`}
            onClick={() => setFlipped(!flipped)}
          >
            <div className="card-inner">
              <div className="card-front">
                <span className="label">新单词 · 点击学习</span>
                <h2>{currentWord.en}</h2>
              </div>
              <div className="card-back">
                <span className="label">中文 · 明天开始复习</span>
                <p>{currentWord.cn}</p>
                <span className="label">{getPlantIcon(1)} 阶段 1 · 下次复习 {formatDate(Date.now() + 24 * 60 * 60 * 1000)}</span>
              </div>
            </div>
          </section>

          <p className="hint">点击卡片查看释义</p>

          <div className="actions">
            <button className="btn btn-again" onClick={handleSkip}>
              ⏭️ 跳过
            </button>
            <button className="btn btn-know" onClick={handleLearn}>
              🌱 播种
            </button>
          </div>
        </>
      )}
    </section>
  );
}
