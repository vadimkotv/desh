import type { ButtonHTMLAttributes } from 'react';

export type ButtonVariant = 'primary' | 'agent' | 'ghost' | 'danger';
export type ButtonSize = 'xs' | 'sm';

const variants: Record<ButtonVariant, string> = {
  primary: 'border-accent/50 bg-accent/12 text-accent hover:bg-accent/20 hover:border-accent/80',
  agent: 'border-agent/50 bg-agent/12 text-agent hover:bg-agent/20 hover:border-agent/80',
  ghost: 'border-line-strong bg-raised text-fg hover:border-accent/50 hover:text-accent',
  danger: 'border-danger/50 bg-danger/10 text-danger hover:bg-danger/20',
};

const sizes: Record<ButtonSize, string> = {
  xs: 'px-2 py-[3px] text-[10.5px]',
  sm: 'px-3 py-1.5 text-xs',
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  busy?: boolean;
};

// The single button style: mono, hairline, tinted by intent.
export function Button({ variant = 'ghost', size = 'sm', busy = false, className = '', children, ...rest }: ButtonProps) {
  return (
    <button
      type="button"
      {...rest}
      disabled={rest.disabled || busy}
      className={`inline-flex items-center gap-1.5 rounded-md border font-mono font-medium tracking-wide transition-colors duration-150 disabled:cursor-wait disabled:opacity-55 ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {busy && <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-current" aria-hidden />}
      {children}
    </button>
  );
}
