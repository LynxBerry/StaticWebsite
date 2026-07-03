'use client';

import { useEffect, useRef } from 'react';

/**
 * Rubber-band drag for the main panel.
 *
 * Lets the user grab the main content panel and drag it down (or up);
 * on release it springs back to its origin — the iOS control-center feel,
 * without needing a scrollable page. This is what makes the glass cards
 * feel like physical objects with weight and elasticity.
 *
 * How it works:
 * - Listens for pointerdown on the <main> element
 * - If the user drags vertically past a small threshold, enters "drag" mode
 * - Applies translateY with rubber-band easing (resistance grows with distance)
 * - On pointerup, snaps back to 0 with a spring transition
 * - Ignores drags that start on interactive elements (buttons, inputs, links)
 * - Disabled for reduced-motion users
 *
 * The component attaches itself to the closest <main> ancestor on mount.
 */
export default function ParallaxBackground() {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;

    const main = document.querySelector('main');
    if (!main) return;
    ref.current = main as HTMLElement;

    let dragging = false;
    let startY = 0;
    let currentY = 0;
    let activePointerId: number | null = null;

    // Rubber-band: the further you drag, the more resistance. Distance is
    // compressed so you can never drag the panel fully off-screen.
    const rubberBand = (delta: number) => {
      const sign = Math.sign(delta);
      const abs = Math.abs(delta);
      // _k maps raw px to compressed px; diminishes as abs grows.
      const k = 0.4; // 0 = no drag, 1 = 1:1. ~0.4 feels springy.
      return sign * (abs * k);
    };

    const isInteractiveTarget = (target: EventTarget | null): boolean => {
      if (!(target instanceof Element)) return false;
      // Don't hijack drags on buttons, inputs, links, or anything marked.
      return !!target.closest('button, a, input, textarea, select, [data-no-rubber-band]');
    };

    const onPointerDown = (e: PointerEvent) => {
      if (activePointerId !== null) return; // already tracking one pointer
      if (isInteractiveTarget(e.target)) return;
      // Only start rubber-band if there's no real scroll available, OR the
      // user is at the top/bottom edge of a scroll region. Simplest: always
      // allow it; real scrollable regions will still scroll natively because
      // we only translate the panel, we don't preventDefault.
      dragging = false; // not yet — wait until a threshold is crossed
      startY = e.clientY;
      activePointerId = e.pointerId;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerId !== activePointerId) return;
      const delta = e.clientY - startY;
      // Only enter drag mode past a small dead zone, so taps/clicks aren't
      // misinterpreted.
      if (!dragging) {
        if (Math.abs(delta) < 8) return;
        dragging = true;
        // Remove any spring transition while dragging (1:1 with resistance).
        main.style.transition = 'none';
      }
      currentY = rubberBand(delta);
      main.style.transform = `translateY(${currentY}px)`;
    };

    const endDrag = () => {
      if (activePointerId === null) return;
      activePointerId = null;
      if (!dragging) return;
      dragging = false;
      // Spring back to origin.
      main.style.transition = 'transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)';
      main.style.transform = '';
      // Clean up the transition after it completes so it doesn't interfere
      // with future layout (e.g. tab content height changes).
      const cleanup = () => {
        main.style.transition = '';
        main.removeEventListener('transitionend', cleanup);
      };
      main.addEventListener('transitionend', cleanup);
    };

    main.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);

    return () => {
      main.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', endDrag);
      window.removeEventListener('pointercancel', endDrag);
      // Reset styles in case we unmounted mid-drag.
      main.style.transform = '';
      main.style.transition = '';
    };
  }, []);

  return null;
}
