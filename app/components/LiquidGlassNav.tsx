'use client';

import { ReactNode, useEffect, useId, useRef, useCallback } from 'react';

interface LiquidGlassNavProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Liquid-glass navigation bar.
 *
 * Ports Open Design's header implementation 1:1:
 *  - The glass filter is applied directly to the bar container via
 *    `backdrop-filter: url(#liquid-glass) blur(7px) saturate(1.4)` so it
 *    samples the real page background behind the bar.
 *  - The displacement-map SVG is rebuilt at the bar's live pixel size so the
 *    rounded-pill refraction tracks the container as it changes width.
 *  - Chromatic displacement splits the RGB channels by slightly different
 *    scales, producing the liquid-glass edge refraction.
 */
export default function LiquidGlassNav({ children, className = '', style }: LiquidGlassNavProps) {
  const id = useId().replace(/:/g, '');
  const filterId = `liquid-glass-${id}`;

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<SVGFEImageElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Build the displacement-map source exactly like Open Design's
  // header-enhancer. Opaque black stops keep the 0.5 neutral point centered.
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
    const container = containerRef.current;
    const image = imageRef.current;
    if (!container || !image) return;

    const rect = container.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width));
    const h = Math.max(1, Math.round(rect.height));
    const uri = buildGlassMap(w, h);

    image.setAttribute('href', uri);
    image.setAttributeNS('http://www.w3.org/1999/xlink', 'href', uri);
  }, [buildGlassMap]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Build the map immediately so the first paint has the right dimensions.
    syncGlassMap();

    // Rebuild when the bar size settles (avoid rebuilding every animation frame).
    const scheduleGlassMap = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(syncGlassMap, 140);
    };

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(scheduleGlassMap);
      ro.observe(container);
    }
    window.addEventListener('resize', scheduleGlassMap, { passive: true });

    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener('resize', scheduleGlassMap);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [syncGlassMap]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={{
        ...style,
        // Open Design's condensed nav surface values.
        background: 'rgba(255, 255, 255, 0.42)',
        border: '1px solid rgba(21, 20, 15, 0.08)',
        backdropFilter: `url(#${filterId}) blur(7px) saturate(1.4)`,
        WebkitBackdropFilter: `url(#${filterId}) blur(7px) saturate(1.4)`,
        boxShadow:
          'inset 0 0 2px 1px rgba(255,255,255,0.55), ' +
          'inset 0 0 10px 4px rgba(255,255,255,0.22), ' +
          '0 6px 24px rgba(17,17,26,0.06), ' +
          '0 12px 40px rgba(17,17,26,0.05)'
      }}
    >
      <svg
        className="absolute w-0 h-0"
        aria-hidden="true"
        width="0"
        height="0"
      >
        <defs>
          <filter id={filterId} colorInterpolationFilters="sRGB">
            <feImage
              ref={imageRef}
              x="0"
              y="0"
              width="100%"
              height="100%"
              preserveAspectRatio="none"
              result="map"
            />
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
