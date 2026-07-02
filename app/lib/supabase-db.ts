// Database operations for user-scoped vocab data.
// All functions receive a browser-side Supabase client (which carries the
// user's JWT, so RLS policies enforce per-user isolation).

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Word, WordState, WrongItem, ProgressState } from './types';

// ============================================================
// Read: fetch the user's entire dataset (used on initial load)
// ============================================================

interface RawWordRow { en: string; cn: string }
interface RawProgressRow {
  en: string;
  level: number;
  next_review: number;
  first_learned_date: string | null;
}
interface RawWrongRow { en: string; remaining: number }

export interface UserDataset {
  words: Word[];
  progress: ProgressState;
  isEmpty: boolean;
}

export async function fetchUserData(
  supabase: SupabaseClient,
  userId: string
): Promise<{ data: UserDataset | null; error: string | null }> {
  const [wordsRes, progressRes, wrongRes] = await Promise.all([
    supabase.from('user_words').select('en, cn').eq('user_id', userId),
    supabase
      .from('user_word_progress')
      .select('en, level, next_review, first_learned_date')
      .eq('user_id', userId),
    supabase.from('user_wrong_queue').select('en, remaining').eq('user_id', userId)
  ]);

  if (wordsRes.error) return { data: null, error: wordsRes.error.message };
  if (progressRes.error) return { data: null, error: progressRes.error.message };
  if (wrongRes.error) return { data: null, error: wrongRes.error.message };

  const words: Word[] = (wordsRes.data as RawWordRow[]).map((r) => ({ en: r.en, cn: r.cn }));

  const wordStates: Record<string, WordState> = {};
  (progressRes.data as RawProgressRow[]).forEach((r) => {
    wordStates[r.en] = {
      level: r.level,
      nextReview: r.next_review,
      firstLearnedDate: r.first_learned_date ?? undefined
    };
  });

  const wrongQueue: WrongItem[] = (wrongRes.data as RawWrongRow[]).map((r) => ({
    en: r.en,
    remaining: r.remaining
  }));

  const isEmpty = words.length === 0 && Object.keys(wordStates).length === 0;

  return {
    data: { words, progress: { wordStates, wrongQueue }, isEmpty },
    error: null
  };
}

// ============================================================
// Words table
// ============================================================

export async function syncWords(
  supabase: SupabaseClient,
  userId: string,
  words: Word[]
): Promise<string | null> {
  if (words.length === 0) return null;
  const rows = words.map((w) => ({ user_id: userId, en: w.en, cn: w.cn }));
  const { error } = await supabase.from('user_words').upsert(rows, { onConflict: 'user_id,en' });
  return error?.message ?? null;
}

export async function upsertWord(
  supabase: SupabaseClient,
  userId: string,
  word: Word
): Promise<string | null> {
  const { error } = await supabase.from('user_words').upsert(
    { user_id: userId, en: word.en, cn: word.cn },
    { onConflict: 'user_id,en' }
  );
  return error?.message ?? null;
}

export async function deleteWord(
  supabase: SupabaseClient,
  userId: string,
  en: string
): Promise<string | null> {
  const { error } = await supabase
    .from('user_words')
    .delete()
    .eq('user_id', userId)
    .eq('en', en);
  return error?.message ?? null;
}

// ============================================================
// Progress table (high-frequency: written on every answer)
// ============================================================

export async function upsertProgress(
  supabase: SupabaseClient,
  userId: string,
  en: string,
  ws: WordState
): Promise<string | null> {
  const { error } = await supabase.from('user_word_progress').upsert(
    {
      user_id: userId,
      en,
      level: ws.level,
      next_review: ws.nextReview,
      first_learned_date: ws.firstLearnedDate ?? null
    },
    { onConflict: 'user_id,en' }
  );
  return error?.message ?? null;
}

export async function deleteProgress(
  supabase: SupabaseClient,
  userId: string,
  en: string
): Promise<string | null> {
  const { error } = await supabase
    .from('user_word_progress')
    .delete()
    .eq('user_id', userId)
    .eq('en', en);
  return error?.message ?? null;
}

// ============================================================
// Wrong queue table
// ============================================================

export async function upsertWrongItem(
  supabase: SupabaseClient,
  userId: string,
  item: WrongItem
): Promise<string | null> {
  const { error } = await supabase.from('user_wrong_queue').upsert(
    { user_id: userId, en: item.en, remaining: item.remaining },
    { onConflict: 'user_id,en' }
  );
  return error?.message ?? null;
}

export async function deleteWrongItem(
  supabase: SupabaseClient,
  userId: string,
  en: string
): Promise<string | null> {
  const { error } = await supabase
    .from('user_wrong_queue')
    .delete()
    .eq('user_id', userId)
    .eq('en', en);
  return error?.message ?? null;
}

export async function clearWrongQueue(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  const { error } = await supabase.from('user_wrong_queue').delete().eq('user_id', userId);
  return error?.message ?? null;
}

// ============================================================
// Reset: clear all user data (progress + wrong queue, keep words)
// ============================================================

export async function resetProgress(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  const [pErr, wErr] = await Promise.all([
    supabase.from('user_word_progress').delete().eq('user_id', userId),
    supabase.from('user_wrong_queue').delete().eq('user_id', userId)
  ]);
  return pErr.error?.message ?? wErr.error?.message ?? null;
}

// ============================================================
// Settings table (per-user single row: custom site title, etc.)
// ============================================================

export async function fetchUserTitle(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('user_settings')
    .select('site_title')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) return null;
  return (data as { site_title?: string } | null)?.site_title ?? null;
}

export async function updateUserTitle(
  supabase: SupabaseClient,
  userId: string,
  title: string
): Promise<string | null> {
  const { error } = await supabase.from('user_settings').upsert(
    {
      user_id: userId,
      site_title: title,
      updated_at: new Date().toISOString()
    },
    { onConflict: 'user_id' }
  );
  return error?.message ?? null;
}

// Clear the user's custom title (set to NULL) so the email-derived default
// takes over again. Keeps the row so other future columns aren't lost.
export async function resetUserTitle(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  const { error } = await supabase
    .from('user_settings')
    .update({ site_title: null, updated_at: new Date().toISOString() })
    .eq('user_id', userId);
  return error?.message ?? null;
}
