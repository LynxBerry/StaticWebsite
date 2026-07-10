import { describe, it, expect } from 'vitest';
import {
  INTERVALS,
  MASTERED_LEVEL,
  REQUIRED_CORRECT,
  computeLearnNewWord,
  computeMarkKnown,
  computeMarkAgain,
  addToWrongQueuePure,
  resetWrongRemainingPure,
  decrementWrongRemainingPure,
  getDueWords,
  countDueWords,
  getStatus,
  getMasteredCount,
  getNewWordsStats,
  countTodayLearned,
  isWordLearned,
  hasWord,
  findWordIndex,
  exportToFlat,
  importToState,
  formatLocalDateString
} from './algorithm';
import type { Word, WordState, ProgressState } from './types';

// Pin the clock to local midnight 2026-07-09 so date math is tz-robust.
const NOW = new Date(2026, 6, 9).getTime(); // months are 0-indexed (July = 6)
const TODAY = formatLocalDateString(new Date(NOW)); // '2026-07-09'
const DAY = 24 * 60 * 60 * 1000;

const w = (en: string, cn = 'x'): Word => ({ en, cn });
const ws = (level: number, nextReview: number, firstLearnedDate?: string): WordState => ({
  level,
  nextReview,
  firstLearnedDate
});

describe('computeMarkKnown', () => {
  it('advances one level and schedules the interval for the NEW level', () => {
    const next = computeMarkKnown(ws(1, NOW, TODAY), NOW);
    expect(next.level).toBe(2);
    expect(next.nextReview).toBe(NOW + INTERVALS[2] * DAY);
    expect(next.firstLearnedDate).toBe(TODAY);
  });

  it('progresses through every stage up to MASTERED_LEVEL', () => {
    let state: WordState | undefined = ws(1, NOW, TODAY);
    const levels = [2, 3, 4, 5, MASTERED_LEVEL];
    levels.forEach((expected) => {
      state = computeMarkKnown(state, NOW);
      expect(state.level).toBe(expected);
    });
  });

  it('caps at MASTERED_LEVEL and never exceeds it', () => {
    const mastered = computeMarkKnown(ws(MASTERED_LEVEL, NOW, TODAY), NOW);
    expect(mastered.level).toBe(MASTERED_LEVEL);
  });

  it('preserves firstLearnedDate across promotions', () => {
    const next = computeMarkKnown(ws(3, NOW, '2026-06-01'), NOW);
    expect(next.firstLearnedDate).toBe('2026-06-01');
  });

  it('defaults an unlearned word to level 1 then promotes to 2', () => {
    const next = computeMarkKnown(undefined, NOW);
    expect(next.level).toBe(2);
    expect(next.firstLearnedDate).toBeUndefined();
  });
});

describe('computeMarkAgain', () => {
  it('resets to level 1 and re-queues for tomorrow', () => {
    const next = computeMarkAgain(ws(4, NOW + 7 * DAY, '2026-06-01'), NOW);
    expect(next.level).toBe(1);
    expect(next.nextReview).toBe(NOW + INTERVALS[1] * DAY);
    expect(next.firstLearnedDate).toBe('2026-06-01');
  });
});

describe('computeLearnNewWord', () => {
  it('sows a word at level 1 with firstLearnedDate today', () => {
    const state = computeLearnNewWord({}, TODAY, 15, NOW);
    expect(state).not.toBeNull();
    expect(state!.level).toBe(1);
    expect(state!.firstLearnedDate).toBe(TODAY);
    expect(state!.nextReview).toBe(NOW + INTERVALS[1] * DAY);
  });

  it('refuses to sow once the daily cap is reached', () => {
    const states: Record<string, WordState> = {
      a: ws(1, NOW, TODAY),
      b: ws(1, NOW, TODAY)
    };
    expect(computeLearnNewWord(states, TODAY, 2, NOW)).toBeNull();
  });

  it('allows sowing when todayCount is below the cap', () => {
    const states: Record<string, WordState> = { a: ws(1, NOW, TODAY) };
    expect(computeLearnNewWord(states, TODAY, 2, NOW)).not.toBeNull();
  });
});

describe('wrong queue — consecutive-correct semantics (#3)', () => {
  it('adds a fresh entry with REQUIRED_CORRECT remaining', () => {
    const { queue, changed } = addToWrongQueuePure([], 'apple');
    expect(changed).toBe(true);
    expect(queue).toEqual([{ en: 'apple', remaining: REQUIRED_CORRECT }]);
  });

  it('is a no-op when the word is already queued (does NOT reset)', () => {
    const existing = [{ en: 'apple', remaining: 1 }];
    const { queue, changed } = addToWrongQueuePure(existing, 'apple');
    expect(changed).toBe(false);
    expect(queue).toBe(existing);
  });

  it('REVIEW #3: a wrong answer mid-streak resets remaining to REQUIRED_CORRECT', () => {
    // Start a streak: remaining 3 -> 2 -> 1 after three correct answers.
    let queue = addToWrongQueuePure([], 'apple').queue;
    queue = decrementWrongRemainingPure(queue, 'apple').queue; // -> 2
    queue = decrementWrongRemainingPure(queue, 'apple').queue; // -> 1
    expect(queue[0].remaining).toBe(1);

    // User answers WRONG in wrong-mode: remaining must reset to 3, NOT stay at 1.
    const reset = resetWrongRemainingPure(queue, 'apple');
    expect(reset.changed).toBe(true);
    expect(reset.queue[0].remaining).toBe(REQUIRED_CORRECT);
    queue = reset.queue;

    // Now "对-对-对" clears it; the earlier "对-对" before the wrong answer
    // must NOT count — i.e. three more correct are required, not one.
    let step = decrementWrongRemainingPure(queue, 'apple');
    expect(step.reachedZero).toBe(false);
    step = decrementWrongRemainingPure(step.queue, 'apple');
    expect(step.reachedZero).toBe(false);
    step = decrementWrongRemainingPure(step.queue, 'apple');
    expect(step.reachedZero).toBe(true);
    expect(step.queue).toHaveLength(0);
  });

  it('the broken pre-fix path is detectable: without reset, 对-错-对-对 wrongly clears', () => {
    // Demonstrates what the bug looked like: if we DON'T reset on wrong,
    // remaining keeps ticking down and 对-错-对-对 clears after only 3 total
    // correct answers (2 before the wrong, 1... wait 2 after). The point is
    // the streak is not "consecutive". resetWrongRemainingPure is the fix.
    let queue = addToWrongQueuePure([], 'apple').queue;
    queue = decrementWrongRemainingPure(queue, 'apple').queue; // 2
    queue = decrementWrongRemainingPure(queue, 'apple').queue; // 1
    // (bug: no reset here) another correct would clear at remaining 0 despite
    // a wrong answer in between — resetWrongRemainingPure prevents that.
    expect(queue[0].remaining).toBe(1);
  });

  it('decrement returns the old item for rollback', () => {
    const queue = [{ en: 'apple', remaining: 2 }];
    const res = decrementWrongRemainingPure(queue, 'apple');
    expect(res.reachedZero).toBe(false);
    expect(res.oldItem).toEqual({ en: 'apple', remaining: 2 });
    expect(res.item).toEqual({ en: 'apple', remaining: 1 });
  });

  it('decrement is a no-op for an unknown word', () => {
    const { queue, reachedZero } = decrementWrongRemainingPure([], 'apple');
    expect(reachedZero).toBe(false);
    expect(queue).toEqual([]);
  });

  it('resetWrongRemainingPure is a no-op for an unknown word', () => {
    const { queue, changed } = resetWrongRemainingPure([], 'apple');
    expect(changed).toBe(false);
    expect(queue).toEqual([]);
  });

  it('reset is a no-op when remaining is already REQUIRED_CORRECT', () => {
    const queue = [{ en: 'apple', remaining: REQUIRED_CORRECT }];
    expect(resetWrongRemainingPure(queue, 'apple').changed).toBe(false);
  });
});

describe('due words & status', () => {
  const words: Word[] = [w('unlearned'), w('due'), w('pending'), w('mastered')];
  const states: Record<string, WordState> = {
    due: ws(2, NOW, '2026-07-01'), // nextReview today => due
    pending: ws(2, NOW + 5 * DAY, '2026-07-01'), // future => pending
    mastered: ws(MASTERED_LEVEL, NOW, '2026-06-01')
  };

  it('getDueWords lists learned, non-mastered words with nextReview <= today', () => {
    expect(getDueWords(words, states, TODAY).map((x) => x.en)).toEqual(['due']);
  });

  it('countDueWords matches getDueWords.length', () => {
    expect(countDueWords(words, states, TODAY)).toBe(1);
  });

  it('getStatus classifies each kind', () => {
    expect(getStatus(states, 'unlearned', TODAY)).toBe('unlearned');
    expect(getStatus(states, 'due', TODAY)).toBe('due');
    expect(getStatus(states, 'pending', TODAY)).toBe('pending');
    expect(getStatus(states, 'mastered', TODAY)).toBe('mastered');
  });

  it('a word due exactly today (nextReview == today midnight) is due', () => {
    const s = { a: ws(1, NOW, TODAY) };
    expect(getStatus(s, 'a', TODAY)).toBe('due');
  });
});

describe('stats', () => {
  it('getMasteredCount counts only level >= MASTERED_LEVEL', () => {
    const states = { a: ws(MASTERED_LEVEL, NOW), b: ws(5, NOW), c: ws(MASTERED_LEVEL, NOW) };
    expect(getMasteredCount(states)).toBe(2);
  });

  it('countTodayLearned / getNewWordsStats count firstLearnedDate == today', () => {
    const states = {
      a: ws(1, NOW, TODAY),
      b: ws(1, NOW, TODAY),
      c: ws(2, NOW, '2026-07-01')
    };
    expect(countTodayLearned(states, TODAY)).toBe(2);
    expect(getNewWordsStats(states, TODAY, 15)).toEqual({ todayCount: 2, remaining: 13 });
    expect(getNewWordsStats(states, TODAY, 2)).toEqual({ todayCount: 2, remaining: 0 });
  });

  it('isWordLearned checks key presence', () => {
    expect(isWordLearned({ a: ws(1, NOW) }, 'a')).toBe(true);
    expect(isWordLearned({ a: ws(1, NOW) }, 'b')).toBe(false);
  });
});

describe('word dedup helpers', () => {
  const words = [w('apple', '苹果'), w('banana', '香蕉')];
  it('hasWord / findWordIndex', () => {
    expect(hasWord(words, 'apple')).toBe(true);
    expect(hasWord(words, 'cherry')).toBe(false);
    expect(findWordIndex(words, 'banana')).toBe(1);
    expect(findWordIndex(words, 'cherry')).toBe(-1);
  });
});

describe('export / import', () => {
  it('exportToFlat emits the flat shape, level 0 for unlearned', () => {
    const words = [w('apple', '苹果'), w('cat', '猫')];
    const states = { apple: ws(2, NOW + 2 * DAY, TODAY) };
    const flat = exportToFlat(words, states);
    expect(flat).toEqual([
      { wordInEnglish: 'apple', wordInChinese: '苹果', level: 2, 'next date': '2026-07-11' },
      { wordInEnglish: 'cat', wordInChinese: '猫', level: 0, 'next date': null }
    ]);
  });

  it('round-trips through importToState (non-merge replaces)', () => {
    const words = [w('apple', '苹果'), w('cat', '猫')];
    const states = { apple: ws(2, NOW + 2 * DAY, TODAY), cat: ws(1, NOW, TODAY) };
    const flat = exportToFlat(words, states);
    const res = importToState(flat, { words: [], wordStates: {}, wrongQueue: [] }, false, TODAY, NOW);
    expect(res).not.toBeNull();
    expect(res!.ok).toBe(true);
    expect(res!.words.map((x) => x.en)).toEqual(['apple', 'cat']);
    expect(res!.wordStates.apple.level).toBe(2);
    expect(res!.wordStates.cat.level).toBe(1);
    expect(res!.wrongQueue).toEqual([]);
  });

  it('merge keeps existing words not overwritten by the import', () => {
    const current = {
      words: [w('old', '旧')],
      wordStates: { old: ws(3, NOW, '2026-06-01') },
      wrongQueue: [{ en: 'old', remaining: 2 }]
    };
    const flat = exportToFlat([w('apple', '苹果')], { apple: ws(1, NOW, TODAY) });
    const res = importToState(flat, current, true, TODAY, NOW);
    expect(res!.words.map((x) => x.en)).toContain('old');
    expect(res!.words.map((x) => x.en)).toContain('apple');
    expect(res!.wordStates.old.level).toBe(3); // untouched
    expect(res!.wrongQueue).toEqual([{ en: 'old', remaining: 2 }]); // preserved
  });

  it('import clamps level to MASTERED_LEVEL', () => {
    const flat = [{ wordInEnglish: 'x', wordInChinese: 'x', level: 99, 'next date': TODAY }];
    const res = importToState(flat, { words: [], wordStates: {}, wrongQueue: [] }, false, TODAY, NOW);
    expect(res!.wordStates.x.level).toBe(MASTERED_LEVEL);
  });

  it('import returns null-ish ok for a non-object payload', () => {
    expect(importToState('nope', { words: [], wordStates: {}, wrongQueue: [] }, false, TODAY, NOW)).toBeNull();
    expect(importToState(null, { words: [], wordStates: {}, wrongQueue: [] }, false, TODAY, NOW)).toBeNull();
  });

  it('import accepts the legacy { words, progress } shape', () => {
    const legacy = {
      words: [w('apple', '苹果')],
      progress: { wordStates: { apple: ws(2, NOW, TODAY) }, wrongQueue: [] } as ProgressState
    };
    const res = importToState(legacy, { words: [], wordStates: {}, wrongQueue: [] }, false, TODAY, NOW);
    expect(res!.ok).toBe(true);
    expect(res!.words[0].en).toBe('apple');
    expect(res!.wordStates.apple.level).toBe(2);
  });
});
