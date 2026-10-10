import React, { InputHTMLAttributes, forwardRef } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      error,
      leftIcon,
      rightIcon,
      id,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 text-slate-400 dark:text-slate-500 pointer-events-none shrink-0 flex items-center">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-desc` : undefined}
            className={`w-full text-sm bg-white dark:bg-slate-900/90 border rounded-xl py-2.5 transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 disabled:bg-slate-50 dark:disabled:bg-slate-800/50 disabled:text-slate-400 disabled:cursor-not-allowed ${
              leftIcon ? 'pl-9' : 'pl-3.5'
            } ${rightIcon ? 'pr-9' : 'pr-3.5'} ${
              error
                ? 'border-rose-400 dark:border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/20 text-rose-950 dark:text-rose-200'
                : 'border-slate-200 dark:border-slate-800 focus:border-violet-500 dark:focus:border-violet-400 focus:ring-violet-500/20 text-slate-900 dark:text-white'
            } ${className}`}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 text-slate-400 shrink-0 flex items-center">
              {rightIcon}
            </div>
          )}
        </div>
        {error ? (
          <p id={`${inputId}-error`} className="text-xs font-medium text-rose-600">
            {error}
          </p>
        ) : helperText ? (
          <p id={`${inputId}-desc`} className="text-xs text-slate-500">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
