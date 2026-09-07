import type { ReactNode } from 'react';

const inputClass =
  'w-full rounded-md border border-line bg-ink px-2.5 py-1.5 font-mono text-xs text-fg outline-none transition-colors placeholder:text-dim focus:border-agent/60 focus:ring-1 focus:ring-agent/30';

type FieldProps = { label: string; hint?: string; children: ReactNode; className?: string };

export function Field({ label, hint, children, className = '' }: FieldProps) {
  return (
    <label className={`flex flex-col gap-1 ${className}`}>
      <span className="eyebrow">
        {label}
        {hint && <span className="ml-1 normal-case tracking-normal text-dim">· {hint}</span>}
      </span>
      {children}
    </label>
  );
}

type InputProps = {
  name: string;
  placeholder?: string;
  type?: 'text' | 'number';
  defaultValue?: string | number;
  step?: string;
  required?: boolean;
};

export function Input({ name, placeholder, type = 'text', defaultValue, step, required }: InputProps) {
  return (
    <input name={name} type={type} placeholder={placeholder} defaultValue={defaultValue} step={step} required={required} className={inputClass} />
  );
}

type SelectProps = { name: string; options: readonly string[]; defaultValue?: string };

export function Select({ name, options, defaultValue }: SelectProps) {
  return (
    <select name={name} defaultValue={defaultValue} className={inputClass}>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

export function TextArea({ name, placeholder, rows = 3 }: { name: string; placeholder?: string; rows?: number }) {
  return <textarea name={name} placeholder={placeholder} rows={rows} className={inputClass} />;
}
