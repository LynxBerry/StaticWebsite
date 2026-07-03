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
  'rounded-2xl transition-all duration-sprout-mid ease-sprout-in-out ' +
  'disabled:opacity-40 disabled:cursor-not-allowed ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#70B070]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F4F4F0]';

const primaryVariant =
  'text-white bg-[#5a9e5a] border border-[#5a9e5a] shadow-[0_2px_0_#d4ead4] ' +
  'enabled:hover:bg-[#4d8a4d] ' +
  'enabled:active:bg-[#407040] ' +
  'enabled:active:scale-[0.98]';

const secondaryVariant =
  'bg-white/30 backdrop-blur-xl text-[#534738] ' +
  'enabled:hover:bg-white/45 ' +
  'enabled:active:bg-white/55 ' +
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
