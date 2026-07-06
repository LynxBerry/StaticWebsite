'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';

type Variant = 'primary' | 'secondary';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

const base =
  'inline-flex items-center justify-center box-border cursor-pointer whitespace-nowrap select-none ' +
  'font-semibold leading-none no-underline ' +
  'rounded-full transition-all duration-sprout-mid ease-sprout-in-out ' +
  'disabled:opacity-40 disabled:cursor-not-allowed ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-farm-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-farm-bg';

const primaryVariant =
  'text-white bg-sprout-500 ' +
  'enabled:hover:bg-sprout-400 ' +
  'enabled:active:bg-sprout-600 ' +
  'enabled:active:scale-[0.98]';

const secondaryVariant =
  'bg-white text-farm-text border border-farm-border ' +
  'enabled:hover:bg-farm-bg ' +
  'enabled:active:bg-farm-fillQuaternary ' +
  'enabled:active:scale-[0.98]';

// Larger tap targets for kids (Apple HIG / WCAG recommend ≥44px for the
// primary interaction sizes). sm is reserved for non-critical actions.
const sizeSm = 'h-8 px-4 text-xs';
const sizeMd = 'h-10 px-5 text-sm';
const sizeLg = 'h-12 px-7 text-base';

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', fullWidth = false, className = '', children, ...props },
  ref
) {
  const variantClass = variant === 'primary' ? primaryVariant : secondaryVariant;
  const sizeClass = size === 'sm' ? sizeSm : size === 'lg' ? sizeLg : sizeMd;
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
