'use client';

import { useSpeech } from '../../hooks/useSpeech';

interface SpeakButtonProps {
  /** The text to pronounce (the English word). */
  text: string;
  /** Visual size variant. */
  size?: 'sm' | 'md' | 'lg';
  /** Optional extra className. */
  className?: string;
  /** Accessible label override; defaults to "朗读 {text}". */
  ariaLabel?: string;
}

/**
 * A round brand-green speaker button that pronounces `text` via the Web
 * Speech API. While speaking, two sound-wave rings ripple outward so kids
 * see the audio is playing. Uses crisp SVG icons (not emoji) and the
 * sprout brand color so it reads as a positive learning action (not a
 * destructive one like the dark delete button next to it).
 *
 * Renders nothing if speech is not supported by the browser.
 */

// Speaker SVG paths — a speaker cone with sound waves (on) / without (off).
function SpeakerIcon({ playing }: { playing: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-1/2 h-1/2"
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" stroke="none" />
      {playing ? (
        <>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </>
      ) : (
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      )}
    </svg>
  );
}

export default function SpeakButton({
  text,
  size = 'md',
  className = '',
  ariaLabel
}: SpeakButtonProps) {
  const { speak, speaking, supported } = useSpeech();

  if (!supported) return null;

  const sizeClass =
    size === 'lg' ? 'w-11 h-11' :
    size === 'sm' ? 'w-8 h-8' :
    'w-9 h-9';

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation(); // don't trigger card flip when tapping the speaker
        speak(text);
      }}
      aria-label={ariaLabel ?? `朗读 ${text}`}
      className={`relative shrink-0 flex items-center justify-center rounded-full text-farm-text border border-farm-border bg-white transition-all duration-200 ${sizeClass} ${className}`}
      style={{ boxShadow: 'none' }}
    >
      {/* Sound-wave ripple rings while speaking. */}
      {speaking && (
        <>
          <span className="speak-ring absolute inset-0 rounded-full border-2 border-sprout-400 pointer-events-none" />
          <span className="speak-ring-2 absolute inset-0 rounded-full border-2 border-sprout-400 pointer-events-none" />
        </>
      )}
      <SpeakerIcon playing={speaking} />
    </button>
  );
}
