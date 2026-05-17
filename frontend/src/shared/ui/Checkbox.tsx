'use client';
import { useCallback } from 'react';

interface CheckboxProps {
  checked: boolean;
  onChange: () => void;
  indeterminate?: boolean;
  disabled?: boolean;
  label?: string;
  id?: string;
}

export function Checkbox({ checked, onChange, indeterminate, disabled, label, id }: CheckboxProps) {
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (!disabled) onChange();
    }
  }, [onChange, disabled]);

  const content = (
    <div
      role="checkbox"
      aria-checked={indeterminate ? 'mixed' : checked}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      onClick={(e) => { e.stopPropagation(); if (!disabled) onChange(); }}
      onKeyDown={handleKeyDown}
      className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-base-900 ${
        checked || indeterminate
          ? 'bg-primary-500 border-primary-500'
          : disabled
            ? 'border-base-700 opacity-50'
            : 'border-base-600 hover:border-base-500'
      } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {indeterminate ? (
        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 12h14" />
        </svg>
      ) : checked ? (
        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      ) : null}
    </div>
  );

  if (label) {
    return (
      <label htmlFor={id} className="flex items-center gap-3 cursor-pointer select-none">
        {content}
        <span className="text-sm text-base-200">{label}</span>
      </label>
    );
  }

  return content;
}
