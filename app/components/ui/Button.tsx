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
  'rounded-2xl border transition-all duration-sprout-mid ease-sprout-in-out ' +
  'disabled:opacity-40 disabled:cursor-not-allowed ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#70B070]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F4F4F0]';

const primaryVariant =
  'text-white bg-[#70b070] border-[#70b070] shadow-[0_2px_0_#e4f0e1] ' +
  'enabled:hover:bg-[#5ca85c] ' +
  'enabled:active:bg-[#518a53] ' +
  'enabled:active:scale-[0.98]';

const secondaryVariant =
  'bg-farm-bg border-[#d9d6d1] text-[#534738] ' +
  'enabled:hover:bg-[#e9e8e3] ' +
  'enabled:active:bg-[#edece8] ' +
  'enabled:active:scale-[0.98]';

const sizeSm = 'h-6 px-2 text-xs';
const sizeMd = 'h-8 px-4 text-sm';
const sizeLg = 'h-10 px-6 text-lg';

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
