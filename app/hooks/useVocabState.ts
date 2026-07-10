'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { DEFAULT_WORDS } from '../data/words';
import type { Word, WordState, WrongItem, ProgressState } from '../lib/types';
import { createClient } from '@/lib/supabase/client';
import {
  fetchUserData,
  syncWords,
  upsertWord,
  deleteWord,
  upsertProgress,
  deleteProgress,
  upsertWrongItem,
  deleteWrongItem,
  clearWrongQueue,
  resetProgress as dbResetProgress,
  fetchUserTitle,
  updateUserTitle,
  resetUserTitle,
  fetchUserDailyLimit,
  updateUserDailyLimit
} from '../lib/supabase-db';
import {
  INTERVALS,
  MASTERED_LEVEL,
  REQUIRED_CORRECT,
  DEFAULT_DAILY_NEW_LIMIT,
  getTodayString,
  parseProgress,
  isWordLearned,
  getWordState as getWordStatePure,
  getDueWords as getDueWordsPure,
  getStatus as getStatusPure,
  getMasteredCount as getMasteredCountPure,
  getNewWordsStats as getNewWordsStatsPure,
  countDueWords,
  computeLearnNewWord,
  computeMarkKnown,
  computeMarkAgain,
  addToWrongQueuePure,
  resetWrongRemainingPure,
  decrementWrongRemainingPure,
  exportToFlat,
  importToState
} from '../lib/algorithm';
import type { FlatWordEntry } from '../lib/algorithm';

// Re-export types and constants so existing imports from this module keep
// working (PlantIcon imports MASTERED_LEVEL, SettingsView imports FlatWordEntry,
// WordCard imports WordState). The canonical home is now app/lib/algorithm.ts
// / app/lib/types.ts.
export type { Word, WordState, WrongItem, ProgressState };
export { INTERVALS, MASTERED_LEVEL, REQUIRED_CORRECT };
export type { FlatWordEntry } from '../lib/algorithm';

// Keys are scoped per-user so multiple accounts on the same browser don't
// share progress. No legacy migration — a fresh user gets an empty library.
const PROGRESS_KEY_BASE = 'zeno-vocab-progress-v3';
const WORDS_KEY_BASE = 'zeno-vocab-words-v1';

export const DEFAULT_SITE_TITLE = 'Sprout · 单词农场';

function progressKey(userId: string) {
  return `${PROGRESS_KEY_BASE}-${userId}`;
}
function wordsKey(userId: string) {
  return `${WORDS_KEY_BASE}-${userId}`;
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
  return DEFAULT_WORDS;
}

function saveWords(userId: string, words: Word[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(wordsKey(userId), JSON.stringify(words));
}

function loadProgress(userId: string): ProgressState {
  if (typeof window === 'undefined') {
    return { wordStates: {}, wrongQueue: [] };
  }
  const key = progressKey(userId);
  const raw = localStorage.getItem(key);
  if (raw) return parseProgress(raw);
  return { wordStates: {}, wrongQueue: [] };
}

function saveProgress(userId: string, progress: ProgressState) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(progressKey(userId), JSON.stringify(progress));
}

// Build a sensible default title from the user's email local part:
// "zeno@test.com" -> "zeno的单词农场". Falls back to the static default
// when the email is empty or malformed.
function deriveDefaultTitle(email: string): string {
  const localPart = email.split('@')[0]?.trim();
  if (!localPart) return DEFAULT_SITE_TITLE;
  return `${localPart}的单词农场`;
}

export function useVocabState(
  userId: string,
  email: string,
  options: { initialSiteTitle?: string | null; initialDailyNewLimit?: number | null } = {}
) {
  const [words, setWordsState] = useState<Word[]>(DEFAULT_WORDS);
  const [progress, setProgressState] = useState<ProgressState>({ wordStates: {}, wrongQueue: [] });
  const [isHydrated, setIsHydrated] = useState(false);
  const [dbSynced, setDbSynced] = useState(false);
  const [siteTitle, setSiteTitle] = useState(
    () => options.initialSiteTitle ?? deriveDefaultTitle(email)
  );
  const [dailyNewLimit, setDailyNewLimit] = useState(
    options.initialDailyNewLimit ?? DEFAULT_DAILY_NEW_LIMIT
  );

  // Ref mirrors of the two big state slices. The algorithm reads/writes
  // synchronously against these (not via setState updaters), so batch loops
  // (e.g. BankView batch-add) and same-tick dedup/rollback work without
  // depending on React's eager-updater evaluation. The effects below keep
  // them in sync whenever state changes from any source (DB pull, import…).
  const wordsRef = useRef<Word[]>(DEFAULT_WORDS);
  const progressRef = useRef<ProgressState>({ wordStates: {}, wrongQueue: [] });

  // Tracks whether the user mutated state before the initial DB pull landed.
  // If so, we merge (DB wins for untouched keys, local wins for touched keys)
  // instead of blindly overwriting with DB data.
  const localMutationsRef = useRef<Set<string>>(new Set());
  // Tracks today's initial due count so we can show review *progress*
  // (done = initial - current), not just the remaining count. Reset daily.
  // Updated in an effect (NOT during render) to avoid render-phase writes.
  const todayDueSnapshotRef = useRef<{ date: string; count: number } | null>(null);

  // Helpers that update both the ref and the state atomically.
  const setWords = useCallback((next: Word[]) => {
    wordsRef.current = next;
    setWordsState(next);
  }, []);
  const setProgress = useCallback((next: ProgressState) => {
    progressRef.current = next;
    setProgressState(next);
  }, []);

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

      // Title and daily limit are independent of words/progress; fetch alongside.
      const [dbTitle, dbDailyLimit] = await Promise.all([
        fetchUserTitle(supabase, userId),
        fetchUserDailyLimit(supabase, userId)
      ]);
      if (!cancelled) {
        if (dbTitle) setSiteTitle(dbTitle);
        if (dbDailyLimit) setDailyNewLimit(dbDailyLimit);
      }

      if (cancelled || error || !data) {
        if (error) console.error('DB fetch failed, using local cache:', error);
        setDbSynced(true);
        return;
      }

      if (!data.isEmpty) {
        // DB has data: DB is the source of truth — completely replace local.
        // The only exception is words the user JUST touched during the brief
        // window between the initial localStorage paint and the DB fetch
        // landing. Those are strictly newer than the DB snapshot, so we keep
        // the local value and re-push it to the DB. Everything else is
        // overwritten by DB.
        const touched = localMutationsRef.current;

        const finalWords = data.words.map((w) =>
          touched.has(w.en) ? (localWords.find((lw) => lw.en === w.en) ?? w) : w
        );

        const finalStates: Record<string, WordState> = { ...data.progress.wordStates };
        touched.forEach((en) => {
          const localWs = localProgress.wordStates[en];
          if (localWs) finalStates[en] = localWs;
        });

        const localWrongTouched = localProgress.wrongQueue.filter((i) => touched.has(i.en));
        const finalWrong = [...data.progress.wrongQueue];
        localWrongTouched.forEach((i) => {
          const idx = finalWrong.findIndex((w) => w.en === i.en);
          if (idx >= 0) finalWrong[idx] = i;
          else finalWrong.push(i);
        });

        const finalProgress = { wordStates: finalStates, wrongQueue: finalWrong };
        setWords(finalWords);
        setProgress(finalProgress);
        saveWords(userId, finalWords);
        saveProgress(userId, finalProgress);

        // Re-push only the touched items so the DB reflects the user's very
        // latest actions (not the stale snapshot).
        const supabaseMut = createClient();
        touched.forEach((en) => {
          const ws = finalStates[en];
          if (ws) {
            upsertProgress(supabaseMut, userId, en, ws).catch((e) =>
              console.error('DB re-sync failed (override):', en, e)
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
  }, [userId, setWords, setProgress]);

  useEffect(() => {
    if (isHydrated) saveWords(userId, words);
  }, [words, isHydrated, userId]);

  useEffect(() => {
    if (isHydrated) saveProgress(userId, progress);
  }, [progress, isHydrated, userId]);

  // Keep ref mirrors in sync if state ever changes from a path that bypasses
  // the setWords/setProgress helpers above (defensive — all mutations now go
  // through them, but this guards against future drift and the initial
  // setWordsState/setProgressState defaults).
  useEffect(() => { wordsRef.current = words; }, [words]);
  useEffect(() => { progressRef.current = progress; }, [progress]);

  // Review-progress snapshot: capture today's due count and bump the
  // baseline when new words become due mid-day. Done in an effect (after
  // render) so we never write a ref during render — the previous version
  // mutated todayInitialDueRef inside getReviewStats() called from render.
  useEffect(() => {
    const today = getTodayString();
    const currentDue = countDueWords(words, progress.wordStates, today);
    const stored = todayDueSnapshotRef.current;
    if (!stored || stored.date !== today) {
      todayDueSnapshotRef.current = { date: today, count: currentDue };
      return;
    }
    if (currentDue > stored.count) {
      todayDueSnapshotRef.current = { date: today, count: currentDue };
    }
  }, [words, progress]);

  // Prune wrong queue entries that no longer exist in the word list
  useEffect(() => {
    if (!isHydrated) return;
    const validEns = new Set(words.map((w) => w.en));
    const filtered = progress.wrongQueue.filter((item) => validEns.has(item.en));
    if (filtered.length !== progress.wrongQueue.length) {
      setProgress({ ...progress, wrongQueue: filtered });
    }
  }, [words, isHydrated, progress, setProgress]);

  const isWordLearnedCb = useCallback((en: string): boolean => {
    return isWordLearned(progress.wordStates, en);
  }, [progress.wordStates]);

  const getWordState = useCallback((en: string): WordState => {
    return getWordStatePure(progress.wordStates, en);
  }, [progress.wordStates]);

  const getNewWordsStats = useCallback(() => {
    return getNewWordsStatsPure(progress.wordStates, getTodayString(), dailyNewLimit);
  }, [progress.wordStates, dailyNewLimit]);

  const getUnlearnedWords = useCallback(() => {
    return words.filter((word) => !isWordLearned(progress.wordStates, word.en));
  }, [words, progress.wordStates]);

  const getDueWords = useCallback((): Word[] => {
    return getDueWordsPure(words, progress.wordStates, getTodayString());
  }, [words, progress.wordStates]);

  // Pure read of the snapshot — no ref writes here (see the snapshot effect).
  const getReviewStats = useCallback(() => {
    const today = getTodayString();
    const currentDue = countDueWords(words, progress.wordStates, today);
    const stored = todayDueSnapshotRef.current;
    const initialDue = stored && stored.date === today ? Math.max(stored.count, currentDue) : currentDue;
    const done = Math.max(0, initialDue - currentDue);
    return { initialDue, currentDue, done };
  }, [words, progress.wordStates]);

  const getMasteredCountCb = useCallback(() => {
    return getMasteredCountPure(progress.wordStates);
  }, [progress.wordStates]);

  const getStatus = useCallback((en: string): 'mastered' | 'due' | 'pending' | 'unlearned' => {
    return getStatusPure(progress.wordStates, en, getTodayString());
  }, [progress.wordStates]);

  // Helper: upsert progress to DB, rolling back the UI on failure so the
  // visible state never diverges from what's actually persisted.
  const syncProgressWithRollback = useCallback(
    (en: string, newState: WordState, oldState: WordState | undefined) => {
      upsertProgress(createClient(), userId, en, newState).catch((e) => {
        console.error('DB sync failed, rolling back UI:', en, e);
        const prev = progressRef.current;
        const nextStates = { ...prev.wordStates };
        if (oldState) nextStates[en] = oldState;
        else delete nextStates[en];
        setProgress({ ...prev, wordStates: nextStates });
      });
    },
    [userId, setProgress]
  );

  const learnNewWord = useCallback((en: string) => {
    const today = getTodayString();
    const now = Date.now();
    const prev = progressRef.current;
    const newState = computeLearnNewWord(prev.wordStates, today, dailyNewLimit, now);
    if (!newState) return; // daily cap reached
    const oldState = prev.wordStates[en];
    localMutationsRef.current.add(en);
    setProgress({ ...prev, wordStates: { ...prev.wordStates, [en]: newState } });
    syncProgressWithRollback(en, newState, oldState);
  }, [dailyNewLimit, setProgress, syncProgressWithRollback]);

  const markKnown = useCallback((en: string) => {
    const now = Date.now();
    const prev = progressRef.current;
    const oldState = prev.wordStates[en];
    const newState = computeMarkKnown(oldState, now);
    localMutationsRef.current.add(en);
    setProgress({ ...prev, wordStates: { ...prev.wordStates, [en]: newState } });
    syncProgressWithRollback(en, newState, oldState);
  }, [setProgress, syncProgressWithRollback]);

  const markAgain = useCallback((en: string) => {
    const now = Date.now();
    const prev = progressRef.current;
    const oldState = prev.wordStates[en];
    const newState = computeMarkAgain(oldState, now);
    localMutationsRef.current.add(en);
    setProgress({ ...prev, wordStates: { ...prev.wordStates, [en]: newState } });
    syncProgressWithRollback(en, newState, oldState);
  }, [setProgress, syncProgressWithRollback]);

  const wrongQueue = progress.wrongQueue;

  const getWrongRemaining = useCallback((en: string): number => {
    const item = progress.wrongQueue.find((i) => i.en === en);
    return item ? item.remaining : 0;
  }, [progress.wrongQueue]);

  const addToWrongQueue = useCallback((en: string) => {
    const prev = progressRef.current;
    const res = addToWrongQueuePure(prev.wrongQueue, en);
    if (!res.changed || !res.item) return;
    localMutationsRef.current.add(en);
    setProgress({ ...prev, wrongQueue: res.queue });
    upsertWrongItem(createClient(), userId, res.item).catch((e) => {
      console.error('DB sync failed, rolling back (addToWrongQueue):', en, e);
      // Revert to the previous queue.
      setProgress({ ...progressRef.current, wrongQueue: prev.wrongQueue });
    });
  }, [userId, setProgress]);

  // #3: answering wrong during wrong-mode restarts the consecutive-correct
  // streak (remaining → REQUIRED_CORRECT). Without this, "对-错-对-对" would
  // clear the item even though the streak was broken.
  const resetWrongRemaining = useCallback((en: string) => {
    const prev = progressRef.current;
    const res = resetWrongRemainingPure(prev.wrongQueue, en);
    if (!res.changed || !res.item) return;
    localMutationsRef.current.add(en);
    setProgress({ ...prev, wrongQueue: res.queue });
    upsertWrongItem(createClient(), userId, res.item).catch((e) => {
      console.error('DB sync failed, rolling back (resetWrongRemaining):', en, e);
      if (res.oldItem) {
        const cur = progressRef.current;
        const idx = cur.wrongQueue.findIndex((i) => i.en === en);
        if (idx >= 0) {
          const restored = [...cur.wrongQueue];
          restored[idx] = res.oldItem;
          setProgress({ ...cur, wrongQueue: restored });
        }
      }
    });
  }, [userId, setProgress]);

  const decrementWrongRemaining = useCallback((en: string): boolean => {
    const prev = progressRef.current;
    const res = decrementWrongRemainingPure(prev.wrongQueue, en);
    if (res.reachedZero) {
      localMutationsRef.current.add(en);
      setProgress({ ...prev, wrongQueue: res.queue });
      deleteWrongItem(createClient(), userId, en).catch((e) => {
        console.error('DB sync failed, rolling back (decrementWrongRemaining delete):', en, e);
        if (res.oldItem) {
          setProgress({
            ...progressRef.current,
            wrongQueue: [...progressRef.current.wrongQueue, res.oldItem]
          });
        }
      });
      return true;
    }
    if (res.item) {
      localMutationsRef.current.add(en);
      setProgress({ ...prev, wrongQueue: res.queue });
      upsertWrongItem(createClient(), userId, res.item).catch((e) => {
        console.error('DB sync failed, rolling back (decrementWrongRemaining):', en, e);
        if (res.oldItem) {
          const cur = progressRef.current;
          const idx = cur.wrongQueue.findIndex((i) => i.en === en);
          if (idx >= 0) {
            const restored = [...cur.wrongQueue];
            restored[idx] = res.oldItem;
            setProgress({ ...cur, wrongQueue: restored });
          }
        }
      });
    }
    return false;
  }, [userId, setProgress]);

  // ============================================================
  // Word CRUD (add / edit / delete). Dedup reads from wordsRef
  // synchronously so batch loops (BankView batch-add) detect duplicates
  // correctly instead of relying on React's eager-updater evaluation.
  // ============================================================

  /** Add a new word. Returns false if en is empty or already exists. */
  const addWord = useCallback((en: string, cn: string): boolean => {
    const trimmedEn = en.trim();
    const trimmedCn = cn.trim();
    if (!trimmedEn) return false;
    if (wordsRef.current.some((w) => w.en === trimmedEn)) return false;
    const newWord: Word = { en: trimmedEn, cn: trimmedCn };
    localMutationsRef.current.add(trimmedEn);
    const next = [...wordsRef.current, newWord];
    setWords(next);
    upsertWord(createClient(), userId, newWord).catch((e) => {
      console.error('DB sync failed, rolling back addWord:', trimmedEn, e);
      setWords(wordsRef.current.filter((w) => w.en !== trimmedEn));
    });
    return true;
  }, [userId, setWords]);

  /**
   * Edit an existing word. If only `cn` changes, a simple upsert updates it.
   * If `en` changes (rename), we delete the old row, insert the new one, and
   * migrate the progress + wrong-queue entries keyed by en so the user
   * doesn't lose their learning history.
   */
  const updateWord = useCallback((oldEn: string, newEn: string, newCn: string): boolean => {
    const trimmedNewEn = newEn.trim();
    const trimmedNewCn = newCn.trim();
    if (!trimmedNewEn) return false;

    const isRename = trimmedNewEn !== oldEn;
    if (isRename && wordsRef.current.some((w) => w.en === trimmedNewEn)) return false;

    localMutationsRef.current.add(oldEn);
    localMutationsRef.current.add(trimmedNewEn);

    const nextWords = wordsRef.current.map((w) =>
      w.en === oldEn ? { en: trimmedNewEn, cn: trimmedNewCn } : w
    );
    setWords(nextWords);

    if (isRename) {
      // Migrate progress + wrong-queue to the new key.
      const prev = progressRef.current;
      const oldState = prev.wordStates[oldEn];
      if (oldState) {
        const nextStates = { ...prev.wordStates };
        delete nextStates[oldEn];
        nextStates[trimmedNewEn] = oldState;
        const nextQueue = prev.wrongQueue.map((item) =>
          item.en === oldEn ? { ...item, en: trimmedNewEn } : item
        );
        setProgress({ wordStates: nextStates, wrongQueue: nextQueue });
      }

      // DB: delete the old word row, insert the new one. Progress row under
      // the old en is left behind (harmless orphan; the local state already
      // migrated optimistically, and a stale DB row doesn't affect UX since
      // reads key off the current words array).
      const client = createClient();
      (async () => {
        await deleteWord(client, userId, oldEn);
        await upsertWord(client, userId, { en: trimmedNewEn, cn: trimmedNewCn });
      })().catch((e) => {
        console.error('DB rename sync failed:', oldEn, '→', trimmedNewEn, e);
        // Rollback is complex for rename; on next DB pull the truth wins.
      });
    } else {
      upsertWord(createClient(), userId, { en: trimmedNewEn, cn: trimmedNewCn }).catch((e) => {
        console.error('DB sync failed, rolling back updateWord:', trimmedNewEn, e);
        // Rollback the cn change for this word.
        setWords(
          wordsRef.current.map((w) =>
            w.en === trimmedNewEn ? { ...w, cn: wordsRef.current.find((x) => x.en === oldEn)?.cn ?? w.cn } : w
          )
        );
      });
    }
    return true;
  }, [userId, setWords, setProgress]);

  /**
   * Soft-delete a word: remove from the words array immediately, but keep
   * its progress data so an undo can restore everything. The DB row is
   * deleted right away; on undo we re-add both the word and its progress.
   * Returns the deleted word + its progress so the caller can offer undo.
   */
  const removeWord = useCallback((en: string): { word: Word; state?: WordState } | null => {
    const word = wordsRef.current.find((w) => w.en === en);
    if (!word) return null;
    const state = progressRef.current.wordStates[en];
    localMutationsRef.current.add(en);
    setWords(wordsRef.current.filter((w) => w.en !== en));
    deleteWord(createClient(), userId, en).catch((e) => {
      console.error('DB sync failed, rolling back removeWord:', en, e);
      // Rollback: re-add the word if it's still gone.
      if (!wordsRef.current.some((w) => w.en === en)) {
        setWords([...wordsRef.current, word]);
      }
    });
    return { word, state };
  }, [userId, setWords]);

  /**
   * Undo a deletion: restore the word (and its progress if we have it).
   * Called from the Toast "撤销" action within the undo window.
   */
  const undoRemoveWord = useCallback((word: Word, state?: WordState): void => {
    if (!wordsRef.current.some((w) => w.en === word.en)) {
      localMutationsRef.current.add(word.en);
      setWords([...wordsRef.current, word]);
    }
    if (state) {
      const prev = progressRef.current;
      if (!prev.wordStates[word.en]) {
        setProgress({
          ...prev,
          wordStates: { ...prev.wordStates, [word.en]: state }
        });
      }
    }
    upsertWord(createClient(), userId, word).catch((e) => {
      console.error('DB sync failed during undoRemoveWord:', word.en, e);
    });
    if (state) {
      upsertProgress(createClient(), userId, word.en, state).catch((e) => {
        console.error('DB progress sync failed during undo:', word.en, e);
      });
    }
  }, [userId, setWords, setProgress]);

  const resetWrongQueue = useCallback(() => {
    const prev = progressRef.current;
    if (prev.wrongQueue.length === 0) return;
    const oldQueue = prev.wrongQueue;
    setProgress({ ...prev, wrongQueue: [] });
    clearWrongQueue(createClient(), userId).catch((e) => {
      console.error('DB sync failed, rolling back (resetWrongQueue):', e);
      setProgress({ ...progressRef.current, wrongQueue: oldQueue });
    });
  }, [userId, setProgress]);

  const reset = useCallback(() => {
    if (confirm('确定要重置所有学习进度吗？')) {
      const oldProgress = progressRef.current;
      setProgress({ wordStates: {}, wrongQueue: [] });
      dbResetProgress(createClient(), userId).catch((e) => {
        console.error('DB sync failed, rolling back (reset):', e);
        setProgress(oldProgress);
      });
    }
  }, [userId, setProgress]);

  const updateSiteTitle = useCallback((title: string) => {
    const trimmed = title.trim();
    if (!trimmed) {
      setSiteTitle(deriveDefaultTitle(email));
      resetUserTitle(createClient(), userId).catch((e) =>
        console.error('DB sync failed (reset title):', e)
      );
      return;
    }
    setSiteTitle(trimmed);
    updateUserTitle(createClient(), userId, trimmed).catch((e) =>
      console.error('DB sync failed (title):', e)
    );
  }, [userId, email]);

  const updateDailyNewLimit = useCallback((limit: number) => {
    const clamped = Math.max(1, Math.min(100, Math.round(limit)));
    setDailyNewLimit(clamped);
    updateUserDailyLimit(createClient(), userId, clamped).catch((e) =>
      console.error('DB sync failed (daily limit):', e)
    );
  }, [userId]);

  const exportState = useCallback((): FlatWordEntry[] => {
    return exportToFlat(words, progress.wordStates);
  }, [words, progress.wordStates]);

  // Async: applies the import locally (optimistic) and awaits the cloud sync
  // so the caller can report "本地已恢复但云端同步失败" instead of claiming
  // success while the DB write silently failed (CODE_REVIEW #6).
  const importState = useCallback(
    async (data: unknown, options?: { merge?: boolean }): Promise<{ ok: boolean; cloudSynced: boolean }> => {
      const merge = options?.merge ?? false;
      const res = importToState(
        data,
        { words: wordsRef.current, wordStates: progressRef.current.wordStates, wrongQueue: progressRef.current.wrongQueue },
        merge,
        getTodayString(),
        Date.now()
      );
      if (!res || !res.ok) return { ok: false, cloudSynced: false };

      setWords(res.words);
      setProgress({ wordStates: res.wordStates, wrongQueue: res.wrongQueue });

      const supabase = createClient();
      let cloudError = false;

      const wordsErr = await syncWords(supabase, userId, res.words);
      if (wordsErr) cloudError = true;

      const progErrs = await Promise.all(
        Object.entries(res.wordStates).map(([en, ws]) => upsertProgress(supabase, userId, en, ws))
      );
      if (progErrs.some(Boolean)) cloudError = true;

      if (!merge) {
        const clearErr = await clearWrongQueue(supabase, userId);
        if (clearErr) cloudError = true;
      }

      return { ok: true, cloudSynced: !cloudError };
    },
    [userId, setWords, setProgress]
  );

  return {
    isHydrated,
    words,
    isWordLearned: isWordLearnedCb,
    getWordState,
    learnNewWord,
    getUnlearnedWords,
    getNewWordsStats,
    markKnown,
    markAgain,
    reset,
    getDueWords,
    getReviewStats,
    getMasteredCount: getMasteredCountCb,
    getStatus,
    exportState,
    importState,
    addWord,
    updateWord,
    removeWord,
    undoRemoveWord,
    wrongQueue,
    getWrongRemaining,
    addToWrongQueue,
    resetWrongRemaining,
    decrementWrongRemaining,
    resetWrongQueue,
    siteTitle,
    updateSiteTitle,
    dailyNewLimit,
    updateDailyNewLimit
  };
}
