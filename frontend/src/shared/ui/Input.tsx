'use client';
import { InputHTMLAttributes, forwardRef, memo } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = memo(
  forwardRef<HTMLInputElement, InputProps>(({ label, error, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const errorId = error ? `${inputId}-error` : undefined;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-base-300 mb-1.5 tracking-wide">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={errorId}
          className={`block w-full rounded-xl border bg-base-900 px-4 py-2.5 text-sm text-base-100 placeholder-base-500 shadow-sm motion-press ${
            error
              ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20'
              : 'border-base-700 focus:border-primary-500/40 focus:ring-[3px] focus:ring-primary-500/10 hover:border-base-600 focus:motion-glow'
          } ${error ? '' : 'focus:shadow-[0_0_20px_rgba(6,182,212,0.05)]'} ${className}`}
          {...props}
        />
        {error && <p id={errorId} className="mt-1.5 text-sm text-red-400">{error}</p>}
      </div>
    );
  }),
);
Input.displayName = 'Input';
