export type { Word } from '../lib/types';
import type { Word } from '../lib/types';

// Empty by default: new users start with no words and import their own.
// This is the initial in-memory state before DB data loads.
export const DEFAULT_WORDS: Word[] = [];
