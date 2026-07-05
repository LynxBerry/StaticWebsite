'use client';

import { ReactNode } from 'react';

interface LiquidGlassNavProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export default function LiquidGlassNav({ children, className = '', style }: LiquidGlassNavProps) {
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        ...style,
        background: 'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.08) 100%)',
        backdropFilter: 'blur(16px) saturate(1.6)',
        WebkitBackdropFilter: 'blur(16px) saturate(1.6)',
        boxShadow: 'inset 0 1px 1px 0 rgba(255,255,255,0.35), 0 8px 32px rgba(0,0,0,0.18)'
      }}
    >
      {children}
    </div>
  );
}
