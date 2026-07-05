'use client';

import { useEffect, useRef, useCallback } from 'react';

const FILTER_ID = 'liquid-glass-card';

/**
 * Hook that keeps the shared liquid-glass displacement map sized to a target
 * element. Used by components that apply `backdrop-filter: url(#filter)`.
 *
 * Mirrors the Open Design implementation: the SVG feImage source is rebuilt
 * at the element's live pixel size so the rounded-pill refraction tracks the
 * container as it resizes.
 */
export function useLiquidGlass(targetRef: React.RefObject<HTMLElement | null>) {
  const imageRef = useRef<SVGFEImageElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const buildGlassMap = useCallback((w: number, h: number) => {
    const radius = Math.round(Math.min(w, h) / 2);
    const borderRatio = 0.07;
    const lightness = 50;
    const alpha = 0.93;
    const blur = 11;
    const blend = 'difference';
    const inset = Math.min(w, h) * (borderRatio * 0.5);

    const svg =
      '<svg viewBox="0 0 ' + w + ' ' + h + '" xmlns="http://www.w3.org/2000/svg">' +
        '<defs>' +
          '<linearGradient id="red" x1="100%" y1="0%" x2="0%" y2="0%"><stop offset="0%" stop-color="#000"/><stop offset="100%" stop-color="red"/></linearGradient>' +
          '<linearGradient id="blue" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#000"/><stop offset="100%" stop-color="blue"/></linearGradient>' +
        '</defs>' +
        '<rect x="0" y="0" width="' + w + '" height="' + h + '" fill="black"/>' +
        '<rect x="0" y="0" width="' + w + '" height="' + h + '" rx="' + radius + '" fill="url(#red)"/>' +
        '<rect x="0" y="0" width="' + w + '" height="' + h + '" rx="' + radius + '" fill="url(#blue)" style="mix-blend-mode:' + blend + '"/>' +
        '<rect x="' + inset + '" y="' + inset + '" width="' + (w - inset * 2) + '" height="' + (h - inset * 2) + '" rx="' + radius + '" fill="hsl(0 0% ' + lightness + '% / ' + alpha + ')" style="filter:blur(' + blur + 'px)"/>' +
      '</svg>';

    return 'data:image/svg+xml,' + encodeURIComponent(svg);
  }, []);

  const syncGlassMap = useCallback(() => {
    const target = targetRef.current;
    if (!target || !imageRef.current) return;

    const rect = target.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width));
    const h = Math.max(1, Math.round(rect.height));
    const uri = buildGlassMap(w, h);

    imageRef.current.setAttribute('href', uri);
    imageRef.current.setAttributeNS('http://www.w3.org/1999/xlink', 'href', uri);
  }, [buildGlassMap, targetRef]);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    syncGlassMap();

    const scheduleGlassMap = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(syncGlassMap, 140);
    };

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(scheduleGlassMap);
      ro.observe(target);
    }
    window.addEventListener('resize', scheduleGlassMap, { passive: true });

    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener('resize', scheduleGlassMap);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [syncGlassMap, targetRef]);

  return { filterId: FILTER_ID, imageRef };
}

/**
 * Hidden SVG filter definition for liquid-glass cards.
 * Render once near the app root; card components reference `url(#liquid-glass-card)`.
 */
export function LiquidGlassFilter() {
  return (
    <svg className="absolute w-0 h-0" aria-hidden="true" width="0" height="0">
      <defs>
        <filter id={FILTER_ID} colorInterpolationFilters="sRGB" x="-20%" y="-20%" width="140%" height="140%">
          <feImage x="0" y="0" width="100%" height="100%" preserveAspectRatio="none" result="map">
            {/* href is injected by useLiquidGlass for the active container. */}
          </feImage>
          <feDisplacementMap in="SourceGraphic" in2="map" xChannelSelector="R" yChannelSelector="B" scale="-50" result="dispRed" />
          <feColorMatrix in="dispRed" type="matrix" values="1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0" result="red" />

          <feDisplacementMap in="SourceGraphic" in2="map" xChannelSelector="R" yChannelSelector="B" scale="-47" result="dispGreen" />
          <feColorMatrix in="dispGreen" type="matrix" values="0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0" result="green" />

          <feDisplacementMap in="SourceGraphic" in2="map" xChannelSelector="R" yChannelSelector="B" scale="-44" result="dispBlue" />
          <feColorMatrix in="dispBlue" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0" result="blue" />

          <feBlend in="red" in2="green" mode="screen" result="rg" />
          <feBlend in="rg" in2="blue" mode="screen" result="output" />

          <feGaussianBlur in="output" stdDeviation="0.7" />
        </filter>
      </defs>
    </svg>
  );
}

interface LiquidGlassWrapperProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * A generic liquid-glass container.
 * Applies the shared liquid-glass filter to itself and sizes the displacement
 * map to its own bounds. Use this to wrap any card-like surface.
 */
export function LiquidGlassWrapper({ children, className = '', style }: LiquidGlassWrapperProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { imageRef } = useLiquidGlass(ref);

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden ${className}`}
      style={{
        ...style,
        backdropFilter: `url(#${FILTER_ID}) blur(7px) saturate(1.4)`,
        WebkitBackdropFilter: `url(#${FILTER_ID}) blur(7px) saturate(1.4)`
      }}
    >
      <svg className="absolute w-0 h-0" aria-hidden="true" width="0" height="0">
        <defs>
          <filter id={FILTER_ID} colorInterpolationFilters="sRGB" x="-20%" y="-20%" width="140%" height="140%">
            <feImage ref={imageRef} x="0" y="0" width="100%" height="100%" preserveAspectRatio="none" result="map" />
            <feDisplacementMap in="SourceGraphic" in2="map" xChannelSelector="R" yChannelSelector="B" scale="-50" result="dispRed" />
            <feColorMatrix in="dispRed" type="matrix" values="1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0" result="red" />

            <feDisplacementMap in="SourceGraphic" in2="map" xChannelSelector="R" yChannelSelector="B" scale="-47" result="dispGreen" />
            <feColorMatrix in="dispGreen" type="matrix" values="0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0" result="green" />

            <feDisplacementMap in="SourceGraphic" in2="map" xChannelSelector="R" yChannelSelector="B" scale="-44" result="dispBlue" />
            <feColorMatrix in="dispBlue" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0" result="blue" />

            <feBlend in="red" in2="green" mode="screen" result="rg" />
            <feBlend in="rg" in2="blue" mode="screen" result="output" />

            <feGaussianBlur in="output" stdDeviation="0.7" />
          </filter>
        </defs>
      </svg>

      {children}
    </div>
  );
}
