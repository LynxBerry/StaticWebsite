'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { DEFAULT_WORDS } from '../data/words';
import type { Word, WordState, WrongItem, ProgressState } from '../lib/types';
import { createClient } from '@/lib/supabase/client';
import {
  fetchUserData,
  syncWords,
  upsertProgress,
  deleteProgress,
  upsertWrongItem,
  deleteWrongItem,
  clearWrongQueue,
  resetProgress as dbResetProgress
} from '../lib/supabase-db';

// Re-export types so existing imports from this module keep working.
export type { Word, WordState, WrongItem, ProgressState };

// Keys are scoped per-user so multiple accounts on the same browser don't
// share progress. Legacy single-user keys are migrated on first login.
const PROGRESS_KEY_BASE = 'zeno-vocab-progress-v3';
const WORDS_KEY_BASE = 'zeno-vocab-words-v1';

function progressKey(userId: string) {
  return `${PROGRESS_KEY_BASE}-${userId}`;
}
function wordsKey(userId: string) {
  return `${WORDS_KEY_BASE}-${userId}`;
}

export const MAX_NEW_WORDS_PER_DAY = 15;

export const INTERVALS: Record<number, number> = {
  1: 1,
  2: 2,
  3: 4,
  4: 7,
  5: 14
};

export const MASTERED_LEVEL = 6;

export interface FlatWordEntry {
  wordInEnglish: string;
  wordInChinese: string;
  level: number;
  'next date': string | null;
}

function formatLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getTodayString(): string {
  return formatLocalDateString(new Date());
}

function getDateStringFromTimestamp(timestamp: number): string {
  return formatLocalDateString(new Date(timestamp));
}

function parseLocalDate(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00`);
}

function loadWords(userId: string): Word[] {
  if (typeof window === 'undefined') return DEFAULT_WORDS;
  const key = wordsKey(userId);
  const raw = localStorage.getItem(key);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {
      console.error('Failed to parse words', e);
    }
  }
  // One-time migration from the legacy single-user key
  if (key !== WORDS_KEY_BASE) {
    const legacy = localStorage.getItem(WORDS_KEY_BASE);
    if (legacy) {
      try {
        const parsed = JSON.parse(legacy);
        if (Array.isArray(parsed) && parsed.length > 0) {
          localStorage.setItem(key, legacy);
          return parsed;
        }
      } catch {
        // ignore malformed legacy data
      }
    }
  }
  return DEFAULT_WORDS;
}

function saveWords(userId: string, words: Word[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(wordsKey(userId), JSON.stringify(words));
}

function migrateV2Progress(userId: string): ProgressState | null {
  if (typeof window === 'undefined') return null;
  // The v2 key is a legacy single-user store; migrate it to this user.
  const raw = localStorage.getItem('zeno-vocab-progress-v2');
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    const words = loadWords(userId);
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

function parseProgress(raw: string): ProgressState {
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
    return { wordStates: {}, wrongQueue: [] };
  }
}

function loadProgress(userId: string): ProgressState {
  if (typeof window === 'undefined') {
    return { wordStates: {}, wrongQueue: [] };
  }

  const key = progressKey(userId);
  const migrated = migrateV2Progress(userId);
  if (migrated) {
    localStorage.setItem(key, JSON.stringify(migrated));
    return migrated;
  }

  const raw = localStorage.getItem(key);

  // One-time migration from the legacy single-user key
  if (!raw && key !== PROGRESS_KEY_BASE) {
    const legacy = localStorage.getItem(PROGRESS_KEY_BASE);
    if (legacy) {
      localStorage.setItem(key, legacy);
      return parseProgress(legacy);
    }
  }

  if (raw) return parseProgress(raw);

  return { wordStates: {}, wrongQueue: [] };
}

function saveProgress(userId: string, progress: ProgressState) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(progressKey(userId), JSON.stringify(progress));
}

export function useVocabState(userId: string) {
  const [words, setWords] = useState<Word[]>(DEFAULT_WORDS);
  const [progress, setProgress] = useState<ProgressState>({ wordStates: {}, wrongQueue: [] });
  const [isHydrated, setIsHydrated] = useState(false);
  const [dbSynced, setDbSynced] = useState(false);
  // Tracks whether the user mutated state before the initial DB pull landed.
  // If so, we merge (DB wins for untouched keys, local wins for touched keys)
  // instead of blindly overwriting with DB data.
  const localMutationsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    // Reset mutation tracking on user switch
    localMutationsRef.current = new Set();

    // 1. Immediately show cached localStorage data (fast first paint)
    const localWords = loadWords(userId);
    const localProgress = loadProgress(userId);
    setWords(localWords);
    setProgress(localProgress);
    setIsHydrated(true);

    // 2. Async: pull authoritative data from DB
    (async () => {
      const supabase = createClient();
      const { data, error } = await fetchUserData(supabase, userId);
      if (cancelled || error || !data) {
        if (error) console.error('DB fetch failed, using local cache:', error);
        setDbSynced(true);
        return;
      }

      if (!data.isEmpty) {
        // DB has data: merge with local. DB is authoritative, but any word the
        // user already touched during this brief window keeps the local value
        // (it's newer) and is re-synced to DB below.
        const touched = localMutationsRef.current;
        const mergedWords = data.words.map((w) =>
          touched.has(w.en) ? (localWords.find((lw) => lw.en === w.en) ?? w) : w
        );
        // Include local-only words (user added during the window) that aren't in DB yet
        localWords.forEach((lw) => {
          if (!mergedWords.some((w) => w.en === lw.en)) mergedWords.push(lw);
        });

        const mergedStates: Record<string, WordState> = { ...data.progress.wordStates };
        touched.forEach((en) => {
          const localWs = localProgress.wordStates[en];
          if (localWs) mergedStates[en] = localWs;
        });

        const localWrongTouched = localProgress.wrongQueue.filter((i) => touched.has(i.en));
        const mergedWrong = [...data.progress.wrongQueue];
        localWrongTouched.forEach((i) => {
          const idx = mergedWrong.findIndex((w) => w.en === i.en);
          if (idx >= 0) mergedWrong[idx] = i;
          else mergedWrong.push(i);
        });

        const mergedProgress = { wordStates: mergedStates, wrongQueue: mergedWrong };
        setWords(mergedWords);
        setProgress(mergedProgress);
        saveWords(userId, mergedWords);
        saveProgress(userId, mergedProgress);

        // Push any locally-mutated data back to DB so cloud matches
        const supabaseMut = createClient();
        touched.forEach((en) => {
          const ws = mergedStates[en];
          if (ws) {
            upsertProgress(supabaseMut, userId, en, ws).catch((e) =>
              console.error('DB re-sync failed (merge):', en, e)
            );
          }
        });
      } else if (localWords.length > 0 || Object.keys(localProgress.wordStates).length > 0) {
        // DB empty but localStorage has data: one-time migration to cloud
        await syncWords(supabase, userId, localWords);
        const entries = Object.entries(localProgress.wordStates);
        await Promise.all(
          entries.map(([en, ws]) => upsertProgress(supabase, userId, en, ws))
        );
        await Promise.all(
          localProgress.wrongQueue.map((item) => upsertWrongItem(supabase, userId, item))
        );
      }
      setDbSynced(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (isHydrated) saveWords(userId, words);
  }, [words, isHydrated, userId]);

  useEffect(() => {
    if (isHydrated) saveProgress(userId, progress);
  }, [progress, isHydrated, userId]);

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
    const today = getTodayString();
    return words.filter((word) => {
      if (!isWordLearned(word.en)) return false;
      const ws = getWordState(word.en);
      return ws.level < MASTERED_LEVEL && getDateStringFromTimestamp(ws.nextReview) <= today;
    });
  }, [words, getWordState, isWordLearned]);

  const getMasteredCount = useCallback(() => {
    return Object.values(progress.wordStates).filter((ws) => ws.level >= MASTERED_LEVEL).length;
  }, [progress.wordStates]);

  const getStatus = useCallback((en: string): 'mastered' | 'due' | 'pending' | 'unlearned' => {
    if (!isWordLearned(en)) return 'unlearned';
    const ws = getWordState(en);
    const today = getTodayString();
    if (ws.level >= MASTERED_LEVEL) return 'mastered';
    if (getDateStringFromTimestamp(ws.nextReview) <= today) return 'due';
    return 'pending';
  }, [getWordState, isWordLearned]);

  // Helper: upsert progress to DB, rolling back the UI on failure so the
  // visible state never diverges from what's actually persisted.
  const syncProgressWithRollback = useCallback(
    (en: string, newState: WordState, oldState: WordState | undefined) => {
      upsertProgress(createClient(), userId, en, newState).catch((e) => {
        console.error('DB sync failed, rolling back UI:', en, e);
        setProgress((prev) => {
          const next = { ...prev.wordStates };
          if (oldState) next[en] = oldState;
          else delete next[en];
          return { ...prev, wordStates: next };
        });
      });
    },
    [userId]
  );

  const learnNewWord = useCallback((en: string) => {
    const today = getTodayString();
    setProgress((prev) => {
      const currentCount = Object.values(prev.wordStates).filter(
        (ws) => ws.firstLearnedDate === today
      ).length;
      if (currentCount >= MAX_NEW_WORDS_PER_DAY) return prev;

      const oldState = prev.wordStates[en];
      const newState: WordState = {
        level: 1,
        nextReview: Date.now() + INTERVALS[1] * 24 * 60 * 60 * 1000,
        firstLearnedDate: today
      };
      localMutationsRef.current.add(en);
      syncProgressWithRollback(en, newState, oldState);
      return {
        ...prev,
        wordStates: { ...prev.wordStates, [en]: newState }
      };
    });
  }, [userId, syncProgressWithRollback]);

  const markKnown = useCallback((en: string) => {
    setProgress((prev) => {
      const oldState = prev.wordStates[en];
      const ws = oldState ?? { level: 1, nextReview: Date.now() };
      const newLevel = Math.min(ws.level + 1, MASTERED_LEVEL);
      const newState: WordState = {
        level: newLevel,
        nextReview: newLevel >= MASTERED_LEVEL
          ? Date.now() + 30 * 24 * 60 * 60 * 1000
          : Date.now() + INTERVALS[newLevel] * 24 * 60 * 60 * 1000,
        firstLearnedDate: ws.firstLearnedDate
      };
      localMutationsRef.current.add(en);
      syncProgressWithRollback(en, newState, oldState);
      return {
        ...prev,
        wordStates: { ...prev.wordStates, [en]: newState }
      };
    });
  }, [userId, syncProgressWithRollback]);

  const markAgain = useCallback((en: string) => {
    setProgress((prev) => {
      const oldState = prev.wordStates[en];
      const ws = oldState ?? { level: 1, nextReview: Date.now() };
      const newState: WordState = {
        level: 1,
        nextReview: Date.now() + INTERVALS[1] * 24 * 60 * 60 * 1000,
        firstLearnedDate: ws.firstLearnedDate
      };
      localMutationsRef.current.add(en);
      syncProgressWithRollback(en, newState, oldState);
      return {
        ...prev,
        wordStates: { ...prev.wordStates, [en]: newState }
      };
    });
  }, [userId, syncProgressWithRollback]);

  const wrongQueue = progress.wrongQueue;

  const getWrongRemaining = useCallback((en: string): number => {
    const item = progress.wrongQueue.find((i) => i.en === en);
    return item ? item.remaining : 0;
  }, [progress.wrongQueue]);

  const addToWrongQueue = useCallback((en: string) => {
    setProgress((prev) => {
      if (prev.wrongQueue.some((i) => i.en === en)) return prev;
      const newItem: WrongItem = { en, remaining: 3 };
      localMutationsRef.current.add(en);
      upsertWrongItem(createClient(), userId, newItem).catch((e) => {
        console.error('DB sync failed, rolling back (addToWrongQueue):', en, e);
        setProgress((p) => ({
          ...p,
          wrongQueue: p.wrongQueue.filter((i) => i.en !== en)
        }));
      });
      return { ...prev, wrongQueue: [...prev.wrongQueue, newItem] };
    });
  }, [userId]);

  const decrementWrongRemaining = useCallback((en: string): boolean => {
    let reachedZero = false;
    setProgress((prev) => {
      const index = prev.wrongQueue.findIndex((i) => i.en === en);
      if (index === -1) return prev;
      const oldItem = prev.wrongQueue[index];
      const newRemaining = oldItem.remaining - 1;
      reachedZero = newRemaining <= 0;
      const newQueue = [...prev.wrongQueue];
      localMutationsRef.current.add(en);

      if (reachedZero) {
        newQueue.splice(index, 1);
        deleteWrongItem(createClient(), userId, en).catch((e) => {
          console.error('DB sync failed, rolling back (decrementWrongRemaining delete):', en, e);
          setProgress((p) => ({
            ...p,
            wrongQueue: p.wrongQueue.some((i) => i.en === en)
              ? p.wrongQueue
              : [...p.wrongQueue, oldItem]
          }));
        });
      } else {
        const updatedItem = { ...oldItem, remaining: newRemaining };
        newQueue[index] = updatedItem;
        upsertWrongItem(createClient(), userId, updatedItem).catch((e) => {
          console.error('DB sync failed, rolling back (decrementWrongRemaining):', en, e);
          setProgress((p) => ({
            ...p,
            wrongQueue: p.wrongQueue.map((i) => (i.en === en ? oldItem : i))
          }));
        });
      }
      return { ...prev, wrongQueue: newQueue };
    });
    return reachedZero;
  }, [userId]);

  const resetWrongQueue = useCallback(() => {
    setProgress((prev) => {
      const oldQueue = prev.wrongQueue;
      if (oldQueue.length === 0) return prev;
      clearWrongQueue(createClient(), userId).catch((e) => {
        console.error('DB sync failed, rolling back (resetWrongQueue):', e);
        setProgress((p) => ({ ...p, wrongQueue: oldQueue }));
      });
      return { ...prev, wrongQueue: [] };
    });
  }, [userId]);

  const reset = useCallback(() => {
    if (confirm('确定要重置所有学习进度吗？')) {
      setProgress((prev) => {
        const oldProgress = prev;
        dbResetProgress(createClient(), userId).catch((e) => {
          console.error('DB sync failed, rolling back (reset):', e);
          setProgress(oldProgress);
        });
        return { wordStates: {}, wrongQueue: [] };
      });
    }
  }, [userId]);

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
        'next date': getDateStringFromTimestamp(ws.nextReview)
      };
    });
  }, [words, progress.wordStates]);

  const importState = useCallback((data: unknown, options?: { merge?: boolean }): boolean => {
    const merge = options?.merge ?? false;

    try {
      if (!data || typeof data !== 'object') return false;

      // New flat format: array of { wordInEnglish, wordInChinese, level, next date }
      if (Array.isArray(data)) {
        const mergedWords: Word[] = merge ? [...words] : [];
        const mergedWordStates: Record<string, WordState> = merge ? { ...progress.wordStates } : {};

        data.forEach((item) => {
          if (!item || typeof item !== 'object') return;
          const entry = item as Partial<FlatWordEntry>;
          const en = entry.wordInEnglish?.trim();
          const cn = entry.wordInChinese?.trim();
          const level = typeof entry.level === 'number' ? entry.level : 0;
          const nextDate = entry['next date'];

          if (!en || !cn) return;

          const existingIndex = mergedWords.findIndex((w) => w.en === en);
          if (existingIndex >= 0) {
            // Update Chinese meaning; keep the word in place
            mergedWords[existingIndex] = { en, cn };
          } else {
            mergedWords.push({ en, cn });
          }

          if (level >= 1) {
            // In merge mode, overwrite existing word state with the imported level/next date

            let nextReview = Date.now();
            let firstLearnedDate = getTodayString();
            if (nextDate && typeof nextDate === 'string') {
              const parsed = parseLocalDate(nextDate);
              if (!isNaN(parsed.getTime())) {
                nextReview = parsed.getTime();
                // Assume learned one day before next review for level 1
                const learned = new Date(parsed.getTime());
                learned.setDate(learned.getDate() - 1);
                firstLearnedDate = formatLocalDateString(learned);
              }
            }
            mergedWordStates[en] = {
              level: Math.min(level, MASTERED_LEVEL),
              nextReview,
              firstLearnedDate
            };
          }
        });

        if (mergedWords.length === 0) return false;

        setWords(mergedWords);
        setProgress({ wordStates: mergedWordStates, wrongQueue: merge ? progress.wrongQueue : [] });

        // Sync the merged dataset to DB
        const supabase = createClient();
        syncWords(supabase, userId, mergedWords).catch((e) =>
          console.error('DB sync failed (importState words):', e)
        );
        Object.entries(mergedWordStates).forEach(([en, ws]) => {
          upsertProgress(supabase, userId, en, ws).catch((e) =>
            console.error('DB sync failed (importState progress):', en, e)
          );
        });
        if (!merge) {
          clearWrongQueue(supabase, userId).catch((e) =>
            console.error('DB sync failed (importState clear wrong queue):', e)
          );
        }
        return true;
      }

      // Legacy internal format: { words, progress }
      const imported = data as Partial<{ words: Word[]; progress: ProgressState }>;

      const finalWords: Word[] = merge ? words : [];
      const finalStates: Record<string, WordState> = merge ? { ...progress.wordStates } : {};

      if (imported.words && Array.isArray(imported.words) && imported.words.length > 0) {
        if (merge) {
          const existingEns = new Set(words.map((w) => w.en));
          const newWords = imported.words.filter((w) => !existingEns.has(w.en));
          finalWords.push(...newWords);
          setWords([...words, ...newWords]);
        } else {
          finalWords.push(...imported.words);
          setWords(imported.words);
        }
      }

      if (imported.progress && typeof imported.progress === 'object') {
        if (merge) {
          Object.entries(imported.progress.wordStates || {}).forEach(([key, value]) => {
            if (
              value &&
              typeof value === 'object' &&
              'level' in value &&
              'nextReview' in value &&
              typeof (value as WordState).level === 'number' &&
              typeof (value as WordState).nextReview === 'number' &&
              !finalStates[key]
            ) {
              finalStates[key] = value as WordState;
            }
          });
          setProgress((prev) => ({ ...prev, wordStates: finalStates }));
        } else {
          Object.entries(imported.progress.wordStates || {}).forEach(([key, value]) => {
            if (
              value &&
              typeof value === 'object' &&
              'level' in value &&
              'nextReview' in value &&
              typeof (value as WordState).level === 'number' &&
              typeof (value as WordState).nextReview === 'number'
            ) {
              finalStates[key] = value as WordState;
            }
          });
          setProgress({ wordStates: finalStates, wrongQueue: [] });
        }
      }

      // Sync legacy import to DB
      const supabase = createClient();
      if (finalWords.length > 0) {
        syncWords(supabase, userId, finalWords).catch((e) =>
          console.error('DB sync failed (legacy import words):', e)
        );
      }
      Object.entries(finalStates).forEach(([en, ws]) => {
        upsertProgress(supabase, userId, en, ws).catch((e) =>
          console.error('DB sync failed (legacy import progress):', en, e)
        );
      });
      if (!merge) {
        clearWrongQueue(supabase, userId).catch((e) =>
          console.error('DB sync failed (legacy import clear queue):', e)
        );
      }
      return true;
    } catch (e) {
      console.error('Failed to import state', e);
      return false;
    }
  }, [words, progress.wordStates, progress.wrongQueue, userId]);

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
