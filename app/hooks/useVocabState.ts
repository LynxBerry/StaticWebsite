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
  firstLearnedDate?: string;
}

export interface WrongItem {
  en: string;
  remaining: number;
}

export interface ProgressState {
  wordStates: Record<string, WordState>;
  wrongQueue: WrongItem[];
}

export interface FlatWordEntry {
  wordInEnglish: string;
  wordInChinese: string;
  level: number;
  'next date': string | null;
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
          nextReview: isMastered ? Date.now() + 365 * 24 * 60 * 60 * 1000 : Date.now(),
          firstLearnedDate: getTodayString()
        };
      });
    } else if (parsed.wordStates) {
      // v2 format: { wordStates: Record<number, WordState> }
      Object.entries(parsed.wordStates as Record<number, WordState>).forEach(([key, value]) => {
        const index = parseInt(key, 10);
        if (!isNaN(index) && words[index]) {
          wordStates[words[index].en] = {
            ...value,
            firstLearnedDate: value.firstLearnedDate || getTodayString()
          };
        }
      });
    }

    return { wordStates, wrongQueue: [] };
  } catch (e) {
    console.error('Failed to migrate v2 progress', e);
    return null;
  }
}

function loadProgress(): ProgressState {
  if (typeof window === 'undefined') {
    return { wordStates: {}, wrongQueue: [] };
  }

  const migrated = migrateV2Progress();
  if (migrated) return migrated;

  const raw = localStorage.getItem(PROGRESS_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      const wordStates: Record<string, WordState> = {};
      Object.entries(parsed.wordStates || {}).forEach(([key, value]) => {
        if (
          value &&
          typeof value === 'object' &&
          'level' in value &&
          'nextReview' in value
        ) {
          wordStates[key] = value as WordState;
        }
      });

      const wrongQueue: WrongItem[] = Array.isArray(parsed.wrongQueue)
        ? parsed.wrongQueue.filter((item: unknown) => {
            return (
              item &&
              typeof item === 'object' &&
              'en' in (item as WrongItem) &&
              'remaining' in (item as WrongItem) &&
              typeof (item as WrongItem).en === 'string' &&
              typeof (item as WrongItem).remaining === 'number'
            );
          })
        : [];

      return { wordStates, wrongQueue };
    } catch (e) {
      console.error('Failed to parse progress', e);
    }
  }
  return { wordStates: {}, wrongQueue: [] };
}

function saveProgress(progress: ProgressState) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

export function useVocabState() {
  const [words, setWords] = useState<Word[]>(DEFAULT_WORDS);
  const [progress, setProgress] = useState<ProgressState>({ wordStates: {}, wrongQueue: [] });
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

  // Prune wrong queue entries that no longer exist in the word list
  useEffect(() => {
    if (!isHydrated) return;
    const validEns = new Set(words.map((w) => w.en));
    setProgress((prev) => {
      const filtered = prev.wrongQueue.filter((item) => validEns.has(item.en));
      if (filtered.length === prev.wrongQueue.length) return prev;
      return { ...prev, wrongQueue: filtered };
    });
  }, [words, isHydrated]);

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
    const todayCount = Object.values(progress.wordStates).filter(
      (ws) => ws.firstLearnedDate === today
    ).length;
    const remaining = Math.max(0, MAX_NEW_WORDS_PER_DAY - todayCount);
    return { todayCount, remaining };
  }, [progress.wordStates]);

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
      const currentCount = Object.values(prev.wordStates).filter(
        (ws) => ws.firstLearnedDate === today
      ).length;
      if (currentCount >= MAX_NEW_WORDS_PER_DAY) return prev;

      return {
        ...prev,
        wordStates: {
          ...prev.wordStates,
          [en]: {
            level: 1,
            nextReview: Date.now() + INTERVALS[1] * 24 * 60 * 60 * 1000,
            firstLearnedDate: today
          }
        }
      };
    });
  }, []);

  const markKnown = useCallback((en: string) => {
    setWordState(en, (ws) => {
      const newLevel = Math.min(ws.level + 1, MASTERED_LEVEL);
      return {
        ...ws,
        level: newLevel,
        nextReview: newLevel >= MASTERED_LEVEL
          ? Date.now() + 30 * 24 * 60 * 60 * 1000
          : Date.now() + INTERVALS[newLevel] * 24 * 60 * 60 * 1000
      };
    });
  }, [setWordState]);

  const markAgain = useCallback((en: string) => {
    setWordState(en, (ws) => ({
      ...ws,
      level: 1,
      nextReview: Date.now() + INTERVALS[1] * 24 * 60 * 60 * 1000
    }));
  }, [setWordState]);

  const wrongQueue = progress.wrongQueue;

  const getWrongRemaining = useCallback((en: string): number => {
    const item = progress.wrongQueue.find((i) => i.en === en);
    return item ? item.remaining : 0;
  }, [progress.wrongQueue]);

  const addToWrongQueue = useCallback((en: string) => {
    setProgress((prev) => {
      if (prev.wrongQueue.some((i) => i.en === en)) return prev;
      return {
        ...prev,
        wrongQueue: [...prev.wrongQueue, { en, remaining: 3 }]
      };
    });
  }, []);

  const decrementWrongRemaining = useCallback((en: string): boolean => {
    let reachedZero = false;
    setProgress((prev) => {
      const index = prev.wrongQueue.findIndex((i) => i.en === en);
      if (index === -1) return prev;
      const item = prev.wrongQueue[index];
      const newRemaining = item.remaining - 1;
      reachedZero = newRemaining <= 0;
      const newQueue = [...prev.wrongQueue];
      if (reachedZero) {
        newQueue.splice(index, 1);
      } else {
        newQueue[index] = { ...item, remaining: newRemaining };
      }
      return { ...prev, wrongQueue: newQueue };
    });
    return reachedZero;
  }, []);

  const resetWrongQueue = useCallback(() => {
    setProgress((prev) => ({ ...prev, wrongQueue: [] }));
  }, []);

  const reset = useCallback(() => {
    if (confirm('确定要重置所有学习进度吗？')) {
      setProgress({ wordStates: {}, wrongQueue: [] });
    }
  }, []);

  const exportState = useCallback((): FlatWordEntry[] => {
    return words.map((word) => {
      const ws = progress.wordStates[word.en];
      if (!ws) {
        return {
          wordInEnglish: word.en,
          wordInChinese: word.cn,
          level: 0,
          'next date': null
        };
      }
      return {
        wordInEnglish: word.en,
        wordInChinese: word.cn,
        level: ws.level,
        'next date': new Date(ws.nextReview).toISOString().split('T')[0]
      };
    });
  }, [words, progress.wordStates]);

  const importState = useCallback((data: unknown): boolean => {
    try {
      if (!data || typeof data !== 'object') return false;

      // New flat format: array of { wordInEnglish, wordInChinese, level, next date }
      if (Array.isArray(data)) {
        const importedWords: Word[] = [];
        const wordStates: Record<string, WordState> = {};

        data.forEach((item) => {
          if (!item || typeof item !== 'object') return;
          const entry = item as Partial<FlatWordEntry>;
          const en = entry.wordInEnglish?.trim();
          const cn = entry.wordInChinese?.trim();
          const level = typeof entry.level === 'number' ? entry.level : 0;
          const nextDate = entry['next date'];

          if (!en || !cn) return;

          importedWords.push({ en, cn });

          if (level >= 1) {
            let nextReview = Date.now();
            let firstLearnedDate = getTodayString();
            if (nextDate && typeof nextDate === 'string') {
              const parsed = new Date(nextDate);
              if (!isNaN(parsed.getTime())) {
                nextReview = parsed.getTime();
                // Assume learned one day before next review for level 1
                const learned = new Date(parsed.getTime() - 24 * 60 * 60 * 1000);
                firstLearnedDate = learned.toISOString().split('T')[0];
              }
            }
            wordStates[en] = {
              level: Math.min(level, MASTERED_LEVEL),
              nextReview,
              firstLearnedDate
            };
          }
        });

        if (importedWords.length === 0) return false;

        setWords(importedWords);
        setProgress({ wordStates, wrongQueue: [] });
        return true;
      }

      // Legacy internal format: { words, progress }
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

        setProgress({ wordStates, wrongQueue: [] });
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
    exportState,
    importState,
    wrongQueue,
    getWrongRemaining,
    addToWrongQueue,
    decrementWrongRemaining,
    resetWrongQueue
  };
}
