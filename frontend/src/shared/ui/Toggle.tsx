'use client';
import { motion, useReducedMotion } from 'framer-motion';

interface ToggleProps {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
}

export function Toggle({ id, checked, onChange, label, disabled }: ToggleProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <label htmlFor={id} className={`flex items-center gap-3 cursor-pointer group select-none ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}>
      <div className="relative">
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={(e) => { if (!disabled) onChange(e.target.checked); }}
          className="sr-only"
          disabled={disabled}
        />
        <motion.div
          aria-hidden="true"
          whileTap={!shouldReduceMotion && !disabled ? { scale: 0.98 } : undefined}
          transition={{ duration: 0.14, ease: [0.23, 1, 0.32, 1] }}
          className={`w-11 h-6 rounded-full transition-colors duration-200 flex items-center shrink-0 ${checked ? 'bg-primary-500 shadow-[0_0_16px_rgba(6,182,212,0.35)]' : 'bg-base-700'}`}
        >
          <motion.div
            animate={{ x: checked ? 20 : 4 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="w-4 h-4 rounded-full bg-white shadow-md"
          />
        </motion.div>
      </div>
      <span className="text-sm text-base-300 group-hover:text-base-200 transition-colors duration-200">{label}</span>
    </label>
  );
}
