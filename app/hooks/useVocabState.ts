'use client';

import { useState, useEffect, useCallback } from 'react';
import { WORDS } from '../data/words';

const STORAGE_KEY = 'zeno-vocab-progress-v2';
export const MAX_NEW_WORDS_PER_DAY = 15;

export const INTERVALS: Record<number, number> = {
  1: 1,
  2: 2,
  3: 4,
  4: 7,
  5: 14
};

export const MASTERED_LEVEL = 6;

export interface WordState {
  level: number;
  nextReview: number;
}

export interface DailyNewWords {
  date: string;
  count: number;
}

export interface AppState {
  wordStates: Record<number, WordState>;
  dailyNewWords: DailyNewWords;
}

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

function migrateFromV1(old: { mastered: number[] }): AppState {
  const wordStates: Record<number, WordState> = {};
  WORDS.forEach((_, index) => {
    const isMastered = old.mastered.includes(index);
    wordStates[index] = {
      level: isMastered ? MASTERED_LEVEL : 1,
      nextReview: isMastered ? Date.now() + 365 * 24 * 60 * 60 * 1000 : Date.now()
    };
  });
  return {
    wordStates,
    dailyNewWords: { date: getTodayString(), count: 0 }
  };
}

function loadState(): AppState {
  if (typeof window === 'undefined') {
    return { wordStates: {}, dailyNewWords: { date: getTodayString(), count: 0 } };
  }
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.mastered)) {
        return migrateFromV1(parsed);
      }
      return {
        wordStates: parsed.wordStates || {},
        dailyNewWords: parsed.dailyNewWords || { date: getTodayString(), count: 0 }
      };
    } catch (e) {
      console.error('Failed to parse progress', e);
    }
  }
  return { wordStates: {}, dailyNewWords: { date: getTodayString(), count: 0 } };
}

function saveState(state: AppState) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function useVocabState() {
  const [state, setState] = useState<AppState>({
    wordStates: {},
    dailyNewWords: { date: getTodayString(), count: 0 }
  });
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setState(loadState());
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated) saveState(state);
  }, [state, isHydrated]);

  const isWordLearned = useCallback((index: number): boolean => {
    return index in state.wordStates;
  }, [state.wordStates]);

  const getWordState = useCallback((index: number): WordState => {
    if (!state.wordStates[index]) {
      return { level: 1, nextReview: Date.now() };
    }
    return state.wordStates[index];
  }, [state.wordStates]);

  const setWordState = useCallback((index: number, updater: (ws: WordState) => WordState) => {
    setState((prev) => ({
      ...prev,
      wordStates: {
        ...prev.wordStates,
        [index]: updater(getWordState(index))
      }
    }));
  }, [getWordState]);

  const getNewWordsStats = useCallback(() => {
    const today = getTodayString();
    const todayCount = state.dailyNewWords.date === today ? state.dailyNewWords.count : 0;
    const remaining = Math.max(0, MAX_NEW_WORDS_PER_DAY - todayCount);
    return { todayCount, remaining };
  }, [state.dailyNewWords]);

  const getUnlearnedWords = useCallback(() => {
    return WORDS.map((word, index) => ({ word, index }))
      .filter(({ index }) => !isWordLearned(index));
  }, [isWordLearned]);

  const learnNewWord = useCallback((index: number) => {
    const today = getTodayString();
    setState((prev) => {
      const currentCount = prev.dailyNewWords.date === today ? prev.dailyNewWords.count : 0;
      if (currentCount >= MAX_NEW_WORDS_PER_DAY) return prev;

      return {
        wordStates: {
          ...prev.wordStates,
          [index]: {
            level: 1,
            nextReview: Date.now() + INTERVALS[1] * 24 * 60 * 60 * 1000
          }
        },
        dailyNewWords: {
          date: today,
          count: currentCount + 1
        }
      };
    });
  }, []);

  const markKnown = useCallback((index: number) => {
    setWordState(index, (ws) => {
      const newLevel = Math.min(ws.level + 1, MASTERED_LEVEL);
      return {
        level: newLevel,
        nextReview: newLevel >= MASTERED_LEVEL
          ? Date.now() + 30 * 24 * 60 * 60 * 1000
          : Date.now() + INTERVALS[newLevel] * 24 * 60 * 60 * 1000
      };
    });
  }, [setWordState]);

  const markAgain = useCallback((index: number) => {
    setWordState(index, () => ({
      level: 1,
      nextReview: Date.now() + INTERVALS[1] * 24 * 60 * 60 * 1000
    }));
  }, [setWordState]);

  const reset = useCallback(() => {
    if (confirm('确定要重置所有学习进度吗？')) {
      setState({ wordStates: {}, dailyNewWords: { date: getTodayString(), count: 0 } });
    }
  }, []);

  const getDueWords = useCallback(() => {
    const now = Date.now();
    return WORDS.map((word, index) => ({ word, index }))
      .filter(({ index }) => {
        if (!isWordLearned(index)) return false;
        const ws = getWordState(index);
        return ws.level < MASTERED_LEVEL && ws.nextReview <= now;
      });
  }, [getWordState, isWordLearned]);

  const getMasteredCount = useCallback(() => {
    return Object.values(state.wordStates).filter((ws) => ws.level >= MASTERED_LEVEL).length;
  }, [state.wordStates]);

  const getStatus = useCallback((index: number): 'mastered' | 'due' | 'pending' | 'unlearned' => {
    if (!isWordLearned(index)) return 'unlearned';
    const ws = getWordState(index);
    const now = Date.now();
    if (ws.level >= MASTERED_LEVEL) return 'mastered';
    if (ws.nextReview <= now) return 'due';
    return 'pending';
  }, [getWordState, isWordLearned]);

  return {
    isHydrated,
    isWordLearned,
    getWordState,
    learnNewWord,
    getUnlearnedWords,
    getNewWordsStats,
    markKnown,
    markAgain,
    reset,
    getDueWords,
    getMasteredCount,
    getStatus,
    WORDS
  };
}
