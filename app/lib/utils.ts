export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const today = new Date();
  // Most review dates are near-term (within 14 days), so 月/日 is enough.
  // Only append the year when the date falls in a different calendar year
  // (e.g. a word learned in late Dec showing "下次复习 1/3" — ambiguous
  // without the year).
  const sameYear = date.getFullYear() === today.getFullYear();
  return sameYear
    ? `${date.getMonth() + 1}/${date.getDate()}`
    : `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
}

/** Local-timezone YYYY-MM-DD (unlike toISOString which is UTC, off by one
 *  day in the evening for non-UTC users). Used for export filenames etc. */
export function localISODate(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
