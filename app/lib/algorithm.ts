// Pure spaced-repetition algorithm for Zeno's vocab farm.
//
// Everything here is a pure function: no React, no DOM, no localStorage, no
// Supabase. The hook (useVocabState) owns the reactive state, optimistic
// updates, DB sync and rollback; it calls into this module to compute the
// *next* state from a given action, and to derive read-only views (due words,
// stats, statuses). Keeping the algorithm pure lets us unit-test the
// spacing/level/wrong-queue logic without spinning up a browser.
//
// Date-dependent functions take `now` / `today` as parameters so tests can
// pin the clock. `today` is a local YYYY-MM-DD string (see
// formatLocalDateString); `now` is a ms epoch.

import type { Word, WordState, WrongItem, ProgressState } from './types';

// ============================================================
// Constants
// ============================================================

/** Leitner stage intervals in days. Level 5 → 14 days, then mastered. */
export const INTERVALS: Record<number, number> = {
  1: 1,
  2: 2,
  3: 4,
  4: 7,
  5: 14
};

/** Level 6 = mastered. Mastered words leave the review queue for good. */
export const MASTERED_LEVEL = 6;

/** Consecutive correct answers required to clear a wrong-queue item. */
export const REQUIRED_CORRECT = 3;

/** Default daily cap on newly-sown words. */
export const DEFAULT_DAILY_NEW_LIMIT = 15;

/** Review interval (days) applied once a word reaches MASTERED_LEVEL.
 *  Note: mastered words are filtered out of the due queue, so this value is
 *  effectively cosmetic — it only shows up if a mastered word is somehow
 *  re-queried. Kept for parity with the original markKnown behaviour. */
export const MASTERED_REVIEW_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

export interface FlatWordEntry {
  wordInEnglish: string;
  wordInChinese: string;
  level: number;
  'next date': string | null;
}

// ============================================================
// Date helpers (local timezone)
// ============================================================

export function formatLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTodayString(): string {
  return formatLocalDateString(new Date());
}

export function getDateStringFromTimestamp(timestamp: number): string {
  return formatLocalDateString(new Date(timestamp));
}

export function parseLocalDate(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00`);
}

// ============================================================
// Persistence-shape validation (used by the hook when reading localStorage)
// ============================================================

export function parseProgress(raw: string): ProgressState {
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

// ============================================================
// Read-only derivations
// ============================================================

export function isWordLearned(states: Record<string, WordState>, en: string): boolean {
  return en in states;
}

/** Returns the stored state, or a sensible default for an unlearned word. */
export function getWordState(states: Record<string, WordState>, en: string): WordState {
  if (!states[en]) {
    return { level: 1, nextReview: Date.now() };
  }
  return states[en];
}

export type WordStatus = 'mastered' | 'due' | 'pending' | 'unlearned';

export function getStatus(
  states: Record<string, WordState>,
  en: string,
  today: string
): WordStatus {
  if (!isWordLearned(states, en)) return 'unlearned';
  const ws = states[en];
  if (ws.level >= MASTERED_LEVEL) return 'mastered';
  if (getDateStringFromTimestamp(ws.nextReview) <= today) return 'due';
  return 'pending';
}

/** Words due for review today (learned, not mastered, nextReview <= today). */
export function getDueWords(
  words: Word[],
  states: Record<string, WordState>,
  today: string
): Word[] {
  return words.filter((word) => {
    if (!isWordLearned(states, word.en)) return false;
    const ws = states[word.en];
    return ws.level < MASTERED_LEVEL && getDateStringFromTimestamp(ws.nextReview) <= today;
  });
}

/** Count of words due today — the pure core used by both getDueWords and the
 *  review-progress snapshot. Exposed so the hook can compute it without
 *  building a whole filtered array. */
export function countDueWords(
  words: Word[],
  states: Record<string, WordState>,
  today: string
): number {
  let n = 0;
  for (const word of words) {
    if (!isWordLearned(states, word.en)) continue;
    const ws = states[word.en];
    if (ws.level < MASTERED_LEVEL && getDateStringFromTimestamp(ws.nextReview) <= today) {
      n++;
    }
  }
  return n;
}

export function getMasteredCount(states: Record<string, WordState>): number {
  return Object.values(states).filter((ws) => ws.level >= MASTERED_LEVEL).length;
}

export function countTodayLearned(states: Record<string, WordState>, today: string): number {
  return Object.values(states).filter((ws) => ws.firstLearnedDate === today).length;
}

export function getNewWordsStats(
  states: Record<string, WordState>,
  today: string,
  dailyNewLimit: number
): { todayCount: number; remaining: number } {
  const todayCount = countTodayLearned(states, today);
  const remaining = Math.max(0, dailyNewLimit - todayCount);
  return { todayCount, remaining };
}

// ============================================================
// State transitions
// ============================================================

/**
 * Sow a new word. Returns the new WordState, or null if the daily cap has
 * already been reached (caller should leave state untouched in that case).
 */
export function computeLearnNewWord(
  states: Record<string, WordState>,
  today: string,
  dailyNewLimit: number,
  now: number
): WordState | null {
  if (countTodayLearned(states, today) >= dailyNewLimit) return null;
  return {
    level: 1,
    nextReview: now + INTERVALS[1] * DAY_MS,
    firstLearnedDate: today
  };
}

/** Answered correctly: advance one stage (capped at MASTERED_LEVEL). */
export function computeMarkKnown(prev: WordState | undefined, now: number): WordState {
  const ws = prev ?? { level: 1, nextReview: now };
  const newLevel = Math.min(ws.level + 1, MASTERED_LEVEL);
  return {
    level: newLevel,
    nextReview:
      newLevel >= MASTERED_LEVEL
        ? now + MASTERED_REVIEW_DAYS * DAY_MS
        : now + INTERVALS[newLevel] * DAY_MS,
    firstLearnedDate: ws.firstLearnedDate
  };
}

/** Answered wrong (review mode): drop back to stage 1, re-queue for tomorrow. */
export function computeMarkAgain(prev: WordState | undefined, now: number): WordState {
  const ws = prev ?? { level: 1, nextReview: now };
  return {
    level: 1,
    nextReview: now + INTERVALS[1] * DAY_MS,
    firstLearnedDate: ws.firstLearnedDate
  };
}

// ============================================================
// Wrong queue (consecutive-correct semantics)
// ============================================================

/**
 * Add a fresh wrong-queue entry (remaining = REQUIRED_CORRECT). If the word
 * is already queued, the queue is returned unchanged (changed: false) — use
 * resetWrongRemaining to restart the streak for an existing entry.
 */
export function addToWrongQueuePure(
  queue: WrongItem[],
  en: string
): { queue: WrongItem[]; changed: boolean; item: WrongItem } {
  if (queue.some((i) => i.en === en)) {
    return { queue, changed: false, item: queue.find((i) => i.en === en)! };
  }
  const item: WrongItem = { en, remaining: REQUIRED_CORRECT };
  return { queue: [...queue, item], changed: true, item };
}

/**
 * Reset an existing entry's remaining back to REQUIRED_CORRECT (used when the
 * user answers wrong during wrong-mode, so the consecutive-correct streak
 * restarts). If the entry doesn't exist, the queue is returned unchanged.
 */
export function resetWrongRemainingPure(
  queue: WrongItem[],
  en: string
): { queue: WrongItem[]; changed: boolean; oldItem?: WrongItem; item?: WrongItem } {
  const index = queue.findIndex((i) => i.en === en);
  if (index === -1) return { queue, changed: false };
  const oldItem = queue[index];
  if (oldItem.remaining === REQUIRED_CORRECT) {
    return { queue, changed: false, oldItem, item: oldItem };
  }
  const item: WrongItem = { en, remaining: REQUIRED_CORRECT };
  const next = [...queue];
  next[index] = item;
  return { queue: next, changed: true, oldItem, item };
}

/**
 * One correct answer in wrong-mode: decrement remaining. When it hits zero the
 * item is removed (the caller then promotes the word via markKnown).
 * Returns the updated queue, whether the streak cleared, and the old item
 * (for rollback).
 */
export function decrementWrongRemainingPure(
  queue: WrongItem[],
  en: string
): { queue: WrongItem[]; reachedZero: boolean; oldItem?: WrongItem; item?: WrongItem } {
  const index = queue.findIndex((i) => i.en === en);
  if (index === -1) return { queue, reachedZero: false };
  const oldItem = queue[index];
  const newRemaining = oldItem.remaining - 1;
  if (newRemaining <= 0) {
    const next = [...queue];
    next.splice(index, 1);
    return { queue: next, reachedZero: true, oldItem };
  }
  const item: WrongItem = { en, remaining: newRemaining };
  const next = [...queue];
  next[index] = item;
  return { queue: next, reachedZero: false, oldItem, item };
}

// ============================================================
// Word list dedup helpers (case-sensitive — `en` is the DB primary key)
// ============================================================

export function findWordIndex(words: Word[], en: string): number {
  return words.findIndex((w) => w.en === en);
}

export function hasWord(words: Word[], en: string): boolean {
  return words.some((w) => w.en === en);
}

// ============================================================
// Export / import transforms (pure; DB sync stays in the hook)
// ============================================================

export function exportToFlat(
  words: Word[],
  states: Record<string, WordState>
): FlatWordEntry[] {
  return words.map((word) => {
    const ws = states[word.en];
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
}

export interface ImportResult {
  words: Word[];
  wordStates: Record<string, WordState>;
  wrongQueue: WrongItem[];
  /** Number of word rows that came from the import (for feedback). */
  importedCount: number;
  /** True if the import parsed at all (caller treats false as "bad format"). */
  ok: boolean;
}

/**
 * Pure import transform. Handles both the flat array format and the legacy
 * `{ words, progress }` shape. `merge` keeps existing words/states not
 * overwritten by the import; non-merge replaces everything (wrong queue is
 * cleared in non-merge mode). Date-dependent bits use `today`/`now` so the
 * transform is deterministic and testable.
 */
export function importToState(
  data: unknown,
  current: { words: Word[]; wordStates: Record<string, WordState>; wrongQueue: WrongItem[] },
  merge: boolean,
  today: string,
  now: number
): ImportResult | null {
  if (!data || typeof data !== 'object') return null;

  // ---- Flat array format ----
  if (Array.isArray(data)) {
    const words: Word[] = merge ? [...current.words] : [];
    const wordStates: Record<string, WordState> = merge ? { ...current.wordStates } : {};

    data.forEach((item) => {
      if (!item || typeof item !== 'object') return;
      const entry = item as Partial<FlatWordEntry>;
      const en = entry.wordInEnglish?.trim();
      const cn = entry.wordInChinese?.trim();
      const level = typeof entry.level === 'number' ? entry.level : 0;
      const nextDate = entry['next date'];
      if (!en || !cn) return;

      const existingIndex = findWordIndex(words, en);
      if (existingIndex >= 0) {
        words[existingIndex] = { en, cn };
      } else {
        words.push({ en, cn });
      }

      if (level >= 1) {
        let nextReview = now;
        let firstLearnedDate = today;
        if (nextDate && typeof nextDate === 'string') {
          const parsed = parseLocalDate(nextDate);
          if (!isNaN(parsed.getTime())) {
            nextReview = parsed.getTime();
            const learned = new Date(parsed.getTime());
            learned.setDate(learned.getDate() - 1);
            firstLearnedDate = formatLocalDateString(learned);
          }
        }
        wordStates[en] = {
          level: Math.min(level, MASTERED_LEVEL),
          nextReview,
          firstLearnedDate
        };
      }
    });

    if (words.length === 0) return { words: current.words, wordStates: current.wordStates, wrongQueue: current.wrongQueue, importedCount: 0, ok: false };

    return {
      words,
      wordStates,
      wrongQueue: merge ? current.wrongQueue : [],
      importedCount: words.length,
      ok: true
    };
  }

  // ---- Legacy { words, progress } format ----
  const imported = data as Partial<{ words: Word[]; progress: ProgressState }>;

  const words: Word[] = merge ? [...current.words] : [];
  const wordStates: Record<string, WordState> = merge ? { ...current.wordStates } : {};

  if (imported.words && Array.isArray(imported.words) && imported.words.length > 0) {
    if (merge) {
      const existingEns = new Set(current.words.map((w) => w.en));
      imported.words.forEach((w) => {
        if (!existingEns.has(w.en)) words.push(w);
      });
    } else {
      imported.words.forEach((w) => words.push(w));
    }
  }

  if (imported.progress && typeof imported.progress === 'object') {
    Object.entries(imported.progress.wordStates || {}).forEach(([key, value]) => {
      if (
        value &&
        typeof value === 'object' &&
        'level' in value &&
        'nextReview' in value &&
        typeof (value as WordState).level === 'number' &&
        typeof (value as WordState).nextReview === 'number' &&
        (merge ? !wordStates[key] : true)
      ) {
        wordStates[key] = value as WordState;
      }
    });
  }

  return {
    words,
    wordStates,
    wrongQueue: merge ? current.wrongQueue : [],
    importedCount: words.length,
    ok: true
  };
}
