// Shared domain types, kept separate from hooks to avoid circular imports.

export interface Word {
  en: string;
  cn: string;
}

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
