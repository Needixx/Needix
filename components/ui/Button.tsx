// components/ui/Button.tsx
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import clsx from 'clsx';

export function Button({
  children,
  asChild,
  variant = 'primary',
  size = 'md',
  className,
  disabled,
  ...props
}: {
  children: ReactNode;
  asChild?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
} & ComponentPropsWithoutRef<'button'>) {
  const base = 'inline-flex items-center justify-center rounded-2xl font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900';
  
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base',
  };

  const variants = {
    primary: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:from-purple-700 hover:to-pink-700 transform hover:scale-105',
    secondary: 'bg-white/10 text-white border border-white/20 hover:bg-white/20 hover:border-white/30 backdrop-blur-sm',
    ghost: 'bg-transparent text-white border border-gray-600 hover:border-purple-400 hover:bg-purple-500/10',
    outline: 'bg-transparent text-white border border-white/20 hover:bg-white/10 hover:border-white/30',
  };

  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';

  if (asChild) {
    return (
      <span className={clsx(base, sizes[size], variants[variant], disabledClasses, className)} {...props}>
        {children}
      </span>
    );
  }
  
  return (
    <button 
      className={clsx(base, sizes[size], variants[variant], disabledClasses, className)} 
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}