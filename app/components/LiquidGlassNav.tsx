'use client';

import { ReactNode, useRef } from 'react';
import { useLiquidGlass } from './LiquidGlass';

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
  const containerRef = useRef<HTMLDivElement>(null);
  const { filterId, imageRef } = useLiquidGlass(containerRef);

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
      <svg className="absolute w-0 h-0" aria-hidden="true" width="0" height="0">
        <defs>
          <filter id={filterId} colorInterpolationFilters="sRGB" x="-20%" y="-20%" width="140%" height="140%">
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
