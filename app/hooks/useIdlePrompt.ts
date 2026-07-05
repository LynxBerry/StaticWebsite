'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'touchstart', 'scroll'];

/**
 * Detects whether the page has been idle (no user activity) for longer than
 * `timeoutMs`. Returns `showPrompt` — flip it back to false (e.g. when the
 * user dismisses or refreshes) via `dismiss`.
 *
 * Typical use: show a "data may be stale, refresh" overlay after 1 hour idle.
 */
export function useIdlePrompt(timeoutMs: number) {
  const [showPrompt, setShowPrompt] = useState(false);
  const lastActivityRef = useRef<number>(Date.now());

  const recordActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    // Note: do NOT auto-dismiss the prompt on activity. Once the prompt is
    // showing, it should stay until the user explicitly picks "refresh" or
    // "later". Otherwise any stray click hides it and the user never sees
    // the refresh suggestion. Activity only resets the idle timer so that
    // after dismissal the prompt won't immediately reappear.
  }, []);

  useEffect(() => {
    // Seed the timer at mount.
    lastActivityRef.current = Date.now();

    ACTIVITY_EVENTS.forEach((evt) => {
      window.addEventListener(evt, recordActivity, { passive: true });
    });

    const interval = window.setInterval(() => {
      if (Date.now() - lastActivityRef.current >= timeoutMs) {
        setShowPrompt(true);
      }
    }, 10_000); // check every 10s — cheap and responsive enough

    return () => {
      ACTIVITY_EVENTS.forEach((evt) => {
        window.removeEventListener(evt, recordActivity);
      });
      window.clearInterval(interval);
    };
  }, [timeoutMs, recordActivity]);

  const dismiss = useCallback(() => setShowPrompt(false), []);

  return { showPrompt, dismiss };
}
