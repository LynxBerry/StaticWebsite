'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * useSpeech — text-to-speech via the browser-native Web Speech API.
 *
 * Free, zero-dependency, works offline. Quality depends on the device's
 * system voices (Siri on iOS/macOS, Google voice on Chrome/Android, etc.),
 * which are all adequate for a kids' vocab app.
 *
 * Usage:
 *   const { speak, speaking } = useSpeech();
 *   <button onClick={() => speak('apple')}>🔊</button>
 *
 * Voices load asynchronously, so we capture the first en-US/en voice once
 * ready and cache it. Falls back gracefully if speechSynthesis is missing
 * (e.g. very old browsers) — speak() becomes a no-op.
 */

let cachedVoice: SpeechSynthesisVoice | null = null;

export function useSpeech() {
  const [speaking, setSpeaking] = useState(false);
  const [supported] = useState(
    () => typeof window !== 'undefined' && 'speechSynthesis' in window
  );

  // Pick the best English voice once voices are loaded.
  useEffect(() => {
    if (!supported) return;
    if (cachedVoice) return;

    const pickVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) return;
      // Prefer a high-quality English voice. Order of preference:
      // Google US English (Chrome), then any en-US, then any en-*.
      cachedVoice =
        voices.find((v) => v.name === 'Google US English') ||
        voices.find((v) => v.lang === 'en-US') ||
        voices.find((v) => v.lang.startsWith('en')) ||
        null;
    };

    pickVoice();
    // Voices often load after this effect runs, so listen for the event.
    window.speechSynthesis.addEventListener('voiceschanged', pickVoice);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', pickVoice);
  }, [supported]);

  const speak = useCallback(
    (text: string) => {
      if (!supported || !text) return;
      // Cancel any in-flight speech so rapid taps don't queue up.
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      if (cachedVoice) utterance.voice = cachedVoice;
      // Slightly slower for kids learning pronunciation.
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      window.speechSynthesis.speak(utterance);
    },
    [supported]
  );

  return { speak, speaking, supported };
}
