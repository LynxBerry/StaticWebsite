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
  'rounded-xl font-semibold transition-all duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)] ' +
  'disabled:opacity-40 disabled:cursor-not-allowed ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#70B070]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F4F4F0]';

const primaryVariant =
  'text-white bg-[#70B070] ' +
  'shadow-[0_2px_8px_rgba(112,176,112,0.25)] ' +
  'enabled:hover:bg-[#65A465] ' +
  'enabled:hover:shadow-[0_4px_12px_rgba(112,176,112,0.35)] ' +
  'enabled:active:scale-[0.98]';

const secondaryVariant =
  'border border-farm-border bg-white text-farm-muted ' +
  'shadow-[0_1px_4px_rgba(0,0,0,0.04)] ' +
  'enabled:hover:bg-[#FAFAF7] enabled:hover:border-farm-borderLight ' +
  'enabled:hover:text-farm-text ' +
  'enabled:active:scale-[0.98]';

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
