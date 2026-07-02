'use client';

import { useMemo } from 'react';

const COLORS = ['#fb923c', '#fbbf24', '#22c55e', '#ef4444', '#a78bfa', '#fff7ed'];

interface ConfettiProps {
  /** number of pieces, default 24 */
  count?: number;
}

/**
 * Pure-CSS confetti burst. Renders absolutely-positioned colored squares
 * that fall with random horizontal offset and rotation. Intended to sit
 * inside a relatively-positioned, overflow-visible container.
 */
export default function Confetti({ count = 24 }: ConfettiProps) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.3,
        duration: 1.2 + Math.random() * 0.8,
        color: COLORS[i % COLORS.length],
        rotate: Math.random() * 360
      })),
    [count]
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-visible" aria-hidden="true">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            transform: `rotate(${p.rotate}deg)`
          }}
        />
      ))}
    </div>
  );
}
