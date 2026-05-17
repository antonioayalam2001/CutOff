'use client';

interface ToggleProps {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
}

export function Toggle({ id, checked, onChange, label, disabled }: ToggleProps) {
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
        <div
          className={`w-11 h-6 rounded-full transition-colors duration-300 flex items-center shrink-0 ${checked ? 'bg-primary-500' : 'bg-base-700'}`}
          aria-hidden="true"
        >
          <div className={`w-4 h-4 rounded-full bg-white shadow-md transition-transform duration-300 ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
        </div>
      </div>
      <span className="text-sm text-base-300 group-hover:text-base-200 transition-colors">{label}</span>
    </label>
  );
}
