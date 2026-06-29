'use client';

import { useState, useEffect, useCallback } from 'react';
import { WORDS } from '../data/words';

const STORAGE_KEY = 'zeno-vocab-progress-v2';

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

export interface AppState {
  wordStates: Record<number, WordState>;
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
  return { wordStates };
}

function loadState(): AppState {
  if (typeof window === 'undefined') return { wordStates: {} };
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.mastered)) {
        return migrateFromV1(parsed);
      }
      return parsed;
    } catch (e) {
      console.error('Failed to parse progress', e);
    }
  }
  return { wordStates: {} };
}

function saveState(state: AppState) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function useVocabState() {
  const [state, setState] = useState<AppState>({ wordStates: {} });
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setState(loadState());
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated) saveState(state);
  }, [state, isHydrated]);

  const getWordState = useCallback((index: number): WordState => {
    if (!state.wordStates[index]) {
      return { level: 1, nextReview: Date.now() };
    }
    return state.wordStates[index];
  }, [state.wordStates]);

  const setWordState = useCallback((index: number, updater: (ws: WordState) => WordState) => {
    setState((prev) => ({
      wordStates: {
        ...prev.wordStates,
        [index]: updater(getWordState(index))
      }
    }));
  }, [getWordState]);

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
      setState({ wordStates: {} });
    }
  }, []);

  const getDueWords = useCallback(() => {
    const now = Date.now();
    return WORDS.map((word, index) => ({ word, index }))
      .filter(({ index }) => {
        const ws = getWordState(index);
        return ws.level < MASTERED_LEVEL && ws.nextReview <= now;
      });
  }, [getWordState]);

  const getMasteredCount = useCallback(() => {
    return Object.values(state.wordStates).filter((ws) => ws.level >= MASTERED_LEVEL).length;
  }, [state.wordStates]);

  const getStatus = useCallback((index: number): 'mastered' | 'due' | 'pending' => {
    const ws = getWordState(index);
    const now = Date.now();
    if (ws.level >= MASTERED_LEVEL) return 'mastered';
    if (ws.nextReview <= now) return 'due';
    return 'pending';
  }, [getWordState]);

  return {
    isHydrated,
    getWordState,
    markKnown,
    markAgain,
    reset,
    getDueWords,
    getMasteredCount,
    getStatus,
    WORDS
  };
}
