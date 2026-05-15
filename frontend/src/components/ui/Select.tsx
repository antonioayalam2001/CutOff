'use client';
import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { createPortal } from 'react-dom';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  label?: string;
  compact?: boolean;
  className?: string;
  required?: boolean;
}

export const Select = memo(function Select({
  value, onChange, options, placeholder = 'Seleccionar',
  label, compact, className = '', required,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const selected = options.find((o) => o.value === value);

  const updatePosition = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: 'fixed',
        left: `${rect.left}px`,
        top: `${rect.bottom + 4}px`,
        minWidth: compact ? '140px' : `${Math.max(rect.width, 140)}px`,
      });
    }
  }, [compact]);

  useEffect(() => {
    if (open) {
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        if (dropdownRef.current && dropdownRef.current.contains(e.target as Node)) return;
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const btnStyles = compact
    ? 'px-2 py-1 text-xs rounded-lg'
    : 'px-3.5 py-2.5 text-sm rounded-xl';

  const optionStyles = compact
    ? 'px-2 py-1.5 text-xs'
    : 'px-3.5 py-2.5 text-sm';

  return (
    <div className={`${compact ? 'inline-block' : 'w-full'} ${className}`} ref={wrapperRef}>
      {label && !compact && (
        <label className="block text-sm font-medium text-base-300 mb-1.5">{label}</label>
      )}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex items-center justify-between gap-1 border bg-base-900 shadow-sm transition-all duration-200 ${
          open
            ? 'border-primary-500/50 ring-2 ring-primary-500/20'
            : 'border-base-700 hover:border-base-600'
        } ${selected ? 'text-base-100' : 'text-base-500'} ${btnStyles} ${required && !value ? 'ring-1 ring-accent-500/30' : ''}`}
      >
        <span className={compact ? 'truncate max-w-[100px]' : ''}>
          {selected ? selected.label : placeholder}
        </span>
        <svg
          className={`shrink-0 transition-transform duration-200 ${compact ? 'w-3 h-3' : 'w-4 h-4'} text-base-400 ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && typeof document !== 'undefined' && createPortal(
        <div
          ref={dropdownRef}
          style={dropdownStyle}
          className="z-[100] bg-base-900 border border-base-700 shadow-2xl py-1 animate-scale-in overflow-y-auto max-h-60 rounded-xl"
        >
          {options.length === 0 ? (
            <p className={`${optionStyles} text-base-500`}>Sin opciones</p>
          ) : (
            options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => { onChange(option.value); setOpen(false); }}
                className={`flex items-center justify-between w-full text-left transition-colors ${
                  option.value === value
                    ? 'text-primary-400 bg-primary-500/10'
                    : 'text-base-200 hover:bg-base-800'
                } ${optionStyles}`}
              >
                {option.label}
                {option.value === value && (
                  <svg className={`shrink-0 text-primary-400 ${compact ? 'w-3 h-3' : 'w-4 h-4'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))
          )}
        </div>,
        document.body,
      )}
    </div>
  );
});
