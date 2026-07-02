'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';

type Variant = 'primary' | 'secondary';
type Size = 'md' | 'sm';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

const base =
  'relative overflow-hidden rounded-xl font-semibold transition-all duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)] ' +
  'before:absolute before:inset-0 before:content-[""] before:bg-gradient-to-b before:from-white/20 before:to-transparent before:opacity-60 before:transition-opacity before:duration-250 ' +
  'enabled:hover:before:opacity-100 ' +
  'disabled:opacity-40 disabled:cursor-not-allowed disabled:grayscale-[0.5] ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a120b]';

const primaryVariant =
  'text-farm-text bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 ' +
  'shadow-[0_4px_16px_rgba(249,115,22,0.4),inset_0_1px_0_rgba(255,255,255,0.2)] ' +
  '[text-shadow:0_1px_2px_rgba(0,0,0,0.2)] ' +
  'enabled:hover:-translate-y-0.5 enabled:hover:scale-[1.02] ' +
  'enabled:hover:shadow-[0_8px_24px_rgba(249,115,22,0.55),inset_0_1px_0_rgba(255,255,255,0.25)] ' +
  'enabled:active:-translate-y-px enabled:active:scale-[0.98]';

const secondaryVariant =
  'border border-farm-muted/25 bg-[rgba(69,26,3,0.6)] text-farm-muted backdrop-blur-lg ' +
  'shadow-[0_4px_14px_rgba(0,0,0,0.2)] ' +
  'enabled:hover:bg-[rgba(69,26,3,0.8)] enabled:hover:border-farm-muted/45 ' +
  'enabled:hover:text-farm-text ' +
  'enabled:hover:shadow-[0_6px_20px_rgba(0,0,0,0.3)] ' +
  'enabled:active:-translate-y-px enabled:active:scale-[0.98]';

const sizeMd = 'px-4 py-3.5 text-base';
const sizeSm = 'px-3.5 py-2 text-sm';

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', fullWidth = false, className = '', children, ...props },
  ref
) {
  const variantClass = variant === 'primary' ? primaryVariant : secondaryVariant;
  const sizeClass = size === 'sm' ? sizeSm : sizeMd;
  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      ref={ref}
      className={`${base} ${variantClass} ${sizeClass} ${widthClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
});
