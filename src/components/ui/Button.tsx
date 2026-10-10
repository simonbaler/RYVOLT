import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'quantum' | 'energy';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: 'text-xs px-3 py-1.5 gap-1.5 rounded-lg min-h-[34px]',
      md: 'text-sm px-4 py-2 gap-2 rounded-xl min-h-[40px]',
      lg: 'text-base px-5 py-2.5 gap-2.5 rounded-xl min-h-[46px]',
    };

    const variantClasses = {
      primary:
        'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 active:bg-slate-950 dark:active:bg-slate-200 shadow-sm border border-slate-900 dark:border-white focus-visible:ring-2 focus-visible:ring-violet-500',
      quantum:
        'bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white shadow-lg shadow-violet-600/20 border border-violet-400/30 focus-visible:ring-2 focus-visible:ring-cyan-400',
      energy:
        'bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-400 hover:to-orange-400 text-white shadow-lg shadow-rose-500/25 border border-rose-400/30 focus-visible:ring-2 focus-visible:ring-orange-400',
      secondary:
        'bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800 shadow-sm border border-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-600',
      outline:
        'bg-white/80 dark:bg-slate-900/80 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 shadow-sm focus-visible:ring-2 focus-visible:ring-violet-500',
      ghost:
        'bg-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-700 focus-visible:ring-2 focus-visible:ring-violet-500',
      danger:
        'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-sm border border-rose-600 focus-visible:ring-2 focus-visible:ring-rose-600',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`inline-flex items-center justify-center font-medium transition-colors select-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap shrink-0 ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
            <span>{children}</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="shrink-0">{leftIcon}</span>}
            <span>{children}</span>
            {rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
