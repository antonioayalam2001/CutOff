'use client';
import { useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

interface CheckboxProps {
  checked: boolean;
  onChange: () => void;
  indeterminate?: boolean;
  disabled?: boolean;
  label?: string;
  id?: string;
}

export function Checkbox({ checked, onChange, indeterminate, disabled, label, id }: CheckboxProps) {
  const shouldReduceMotion = useReducedMotion();
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (!disabled) onChange();
    }
  }, [onChange, disabled]);

  const content = (
    <motion.div
      role="checkbox"
      aria-checked={indeterminate ? 'mixed' : checked}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      onClick={(e) => { e.stopPropagation(); if (!disabled) onChange(); }}
      onKeyDown={handleKeyDown}
      whileTap={!shouldReduceMotion && !disabled ? { scale: 0.94 } : undefined}
      transition={{ duration: 0.12, ease: [0.23, 1, 0.32, 1] }}
      className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-base-900 ${
        checked || indeterminate
          ? 'bg-primary-500 border-primary-500 shadow-[0_0_16px_rgba(6,182,212,0.35)]'
          : disabled
            ? 'border-base-700 opacity-50'
            : 'border-base-600 hover:border-base-500'
      } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {indeterminate ? (
          <motion.svg key="indeterminate" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.14 }} className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 12h14" />
          </motion.svg>
        ) : checked ? (
          <motion.svg key="checked" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.14 }} className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </motion.svg>
        ) : null}
      </AnimatePresence>
    </motion.div>
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
