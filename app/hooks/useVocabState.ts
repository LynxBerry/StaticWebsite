'use client';

import { useState, useEffect, useCallback } from 'react';
import { DEFAULT_WORDS, Word } from '../data/words';

const PROGRESS_KEY = 'zeno-vocab-progress-v3';
const WORDS_KEY = 'zeno-vocab-words-v1';

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

export interface ProgressState {
  wordStates: Record<string, WordState>;
  dailyNewWords: DailyNewWords;
}

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

function loadWords(): Word[] {
  if (typeof window === 'undefined') return DEFAULT_WORDS;
  const raw = localStorage.getItem(WORDS_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {
      console.error('Failed to parse words', e);
    }
  }
  return DEFAULT_WORDS;
}

function saveWords(words: Word[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(WORDS_KEY, JSON.stringify(words));
}

function migrateV2Progress(): ProgressState | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('zeno-vocab-progress-v2');
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    const words = loadWords();
    const wordStates: Record<string, WordState> = {};

    if (Array.isArray(parsed.mastered)) {
      // v1 format: { mastered: number[] }
      words.forEach((word, index) => {
        const isMastered = parsed.mastered.includes(index);
        wordStates[word.en] = {
          level: isMastered ? MASTERED_LEVEL : 1,
          nextReview: isMastered ? Date.now() + 365 * 24 * 60 * 60 * 1000 : Date.now()
        };
      });
    } else if (parsed.wordStates) {
      // v2 format: { wordStates: Record<number, WordState> }
      Object.entries(parsed.wordStates as Record<number, WordState>).forEach(([key, value]) => {
        const index = parseInt(key, 10);
        if (!isNaN(index) && words[index]) {
          wordStates[words[index].en] = value;
        }
      });
    }

    return {
      wordStates,
      dailyNewWords: parsed.dailyNewWords || { date: getTodayString(), count: 0 }
    };
  } catch (e) {
    console.error('Failed to migrate v2 progress', e);
    return null;
  }
}

function loadProgress(): ProgressState {
  if (typeof window === 'undefined') {
    return { wordStates: {}, dailyNewWords: { date: getTodayString(), count: 0 } };
  }

  const migrated = migrateV2Progress();
  if (migrated) return migrated;

  const raw = localStorage.getItem(PROGRESS_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
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

function saveProgress(progress: ProgressState) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

export function useVocabState() {
  const [words, setWords] = useState<Word[]>(DEFAULT_WORDS);
  const [progress, setProgress] = useState<ProgressState>({
    wordStates: {},
    dailyNewWords: { date: getTodayString(), count: 0 }
  });
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const loadedWords = loadWords();
    const loadedProgress = loadProgress();
    setWords(loadedWords);
    setProgress(loadedProgress);
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated) saveWords(words);
  }, [words, isHydrated]);

  useEffect(() => {
    if (isHydrated) saveProgress(progress);
  }, [progress, isHydrated]);

  const isWordLearned = useCallback((en: string): boolean => {
    return en in progress.wordStates;
  }, [progress.wordStates]);

  const getWordState = useCallback((en: string): WordState => {
    if (!progress.wordStates[en]) {
      return { level: 1, nextReview: Date.now() };
    }
    return progress.wordStates[en];
  }, [progress.wordStates]);

  const setWordState = useCallback((en: string, updater: (ws: WordState) => WordState) => {
    setProgress((prev) => ({
      ...prev,
      wordStates: {
        ...prev.wordStates,
        [en]: updater(getWordState(en))
      }
    }));
  }, [getWordState]);

  const getNewWordsStats = useCallback(() => {
    const today = getTodayString();
    const todayCount = progress.dailyNewWords.date === today ? progress.dailyNewWords.count : 0;
    const remaining = Math.max(0, MAX_NEW_WORDS_PER_DAY - todayCount);
    return { todayCount, remaining };
  }, [progress.dailyNewWords]);

  const getUnlearnedWords = useCallback(() => {
    return words.filter((word) => !isWordLearned(word.en));
  }, [words, isWordLearned]);

  const getDueWords = useCallback(() => {
    const now = Date.now();
    return words.filter((word) => {
      if (!isWordLearned(word.en)) return false;
      const ws = getWordState(word.en);
      return ws.level < MASTERED_LEVEL && ws.nextReview <= now;
    });
  }, [words, getWordState, isWordLearned]);

  const getMasteredCount = useCallback(() => {
    return Object.values(progress.wordStates).filter((ws) => ws.level >= MASTERED_LEVEL).length;
  }, [progress.wordStates]);

  const getStatus = useCallback((en: string): 'mastered' | 'due' | 'pending' | 'unlearned' => {
    if (!isWordLearned(en)) return 'unlearned';
    const ws = getWordState(en);
    const now = Date.now();
    if (ws.level >= MASTERED_LEVEL) return 'mastered';
    if (ws.nextReview <= now) return 'due';
    return 'pending';
  }, [getWordState, isWordLearned]);

  const learnNewWord = useCallback((en: string) => {
    const today = getTodayString();
    setProgress((prev) => {
      const currentCount = prev.dailyNewWords.date === today ? prev.dailyNewWords.count : 0;
      if (currentCount >= MAX_NEW_WORDS_PER_DAY) return prev;

      return {
        wordStates: {
          ...prev.wordStates,
          [en]: {
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

  const markKnown = useCallback((en: string) => {
    setWordState(en, (ws) => {
      const newLevel = Math.min(ws.level + 1, MASTERED_LEVEL);
      return {
        level: newLevel,
        nextReview: newLevel >= MASTERED_LEVEL
          ? Date.now() + 30 * 24 * 60 * 60 * 1000
          : Date.now() + INTERVALS[newLevel] * 24 * 60 * 60 * 1000
      };
    });
  }, [setWordState]);

  const markAgain = useCallback((en: string) => {
    setWordState(en, () => ({
      level: 1,
      nextReview: Date.now() + INTERVALS[1] * 24 * 60 * 60 * 1000
    }));
  }, [setWordState]);

  const reset = useCallback(() => {
    if (confirm('确定要重置所有学习进度吗？')) {
      setProgress({ wordStates: {}, dailyNewWords: { date: getTodayString(), count: 0 } });
    }
  }, []);

  // Word management
  const addWord = useCallback((word: Word) => {
    setWords((prev) => {
      if (prev.some((w) => w.en === word.en)) return prev;
      return [...prev, word];
    });
  }, []);

  const updateWord = useCallback((oldEn: string, newWord: Word) => {
    setWords((prev) => {
      const index = prev.findIndex((w) => w.en === oldEn);
      if (index === -1) return prev;
      const updated = [...prev];
      updated[index] = newWord;
      return updated;
    });

    // Update progress key if English word changed
    if (oldEn !== newWord.en && progress.wordStates[oldEn]) {
      setProgress((prev) => {
        const { [oldEn]: state, ...rest } = prev.wordStates;
        return {
          ...prev,
          wordStates: {
            ...rest,
            [newWord.en]: state
          }
        };
      });
    }
  }, [progress.wordStates]);

  const deleteWord = useCallback((en: string) => {
    if (!confirm(`确定要删除单词 "${en}" 吗？相关学习进度也会一起删除。`)) return;
    setWords((prev) => prev.filter((w) => w.en !== en));
    setProgress((prev) => {
      const { [en]: _, ...rest } = prev.wordStates;
      return { ...prev, wordStates: rest };
    });
  }, []);

  const exportState = useCallback(() => {
    return { words, progress };
  }, [words, progress]);

  const importState = useCallback((data: unknown): boolean => {
    try {
      if (!data || typeof data !== 'object') return false;
      const imported = data as Partial<{ words: Word[]; progress: ProgressState }>;

      if (imported.words && Array.isArray(imported.words) && imported.words.length > 0) {
        setWords(imported.words);
      }

      if (imported.progress && typeof imported.progress === 'object') {
        const wordStates: Record<string, WordState> = {};
        Object.entries(imported.progress.wordStates || {}).forEach(([key, value]) => {
          if (
            value &&
            typeof value === 'object' &&
            'level' in value &&
            'nextReview' in value &&
            typeof (value as WordState).level === 'number' &&
            typeof (value as WordState).nextReview === 'number'
          ) {
            wordStates[key] = value as WordState;
          }
        });

        setProgress({
          wordStates,
          dailyNewWords: imported.progress.dailyNewWords || { date: getTodayString(), count: 0 }
        });
      }
      return true;
    } catch (e) {
      console.error('Failed to import state', e);
      return false;
    }
  }, []);

  return {
    isHydrated,
    words,
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
    addWord,
    updateWord,
    deleteWord,
    exportState,
    importState
  };
}
