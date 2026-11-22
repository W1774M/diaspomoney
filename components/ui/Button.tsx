import { cn } from '@/lib/utils';
import React, { forwardRef } from 'react';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
  loadingText?: string;
}

/**
 * Classes des boutons, réutilisables sur un <Link> (navigation = lien, action = bouton).
 * Hauteurs minimales (pas fixes) : le libellé peut passer à la ligne ou grossir au zoom.
 */
export function buttonClasses({
  variant = 'primary',
  size = 'md',
  className,
}: Pick<ButtonProps, 'variant' | 'size' | 'className'> = {}) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-lg font-semibold text-center transition-[color,background-color,border-color,box-shadow] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60 aria-disabled:cursor-not-allowed aria-disabled:opacity-60 [&_svg]:shrink-0';

  const variants = {
    primary:
      'bg-primary text-primary-foreground shadow-sm hover:bg-brand-700 active:bg-brand-800',
    secondary:
      'bg-secondary text-secondary-foreground hover:bg-stone-200 active:bg-stone-300',
    outline:
      'border border-input bg-background text-foreground hover:border-primary hover:bg-accent hover:text-accent-foreground',
    ghost: 'text-foreground hover:bg-muted',
    danger:
      'bg-destructive text-destructive-foreground shadow-sm hover:bg-red-800 active:bg-red-900',
  } as const;

  const sizes = {
    sm: 'min-h-9 px-3 py-1.5 text-sm',
    md: 'min-h-11 px-4 py-2 text-base',
    lg: 'min-h-12 px-6 py-3 text-lg',
    icon: 'size-11 p-0',
  } as const;

  return cn(base, variants[variant], sizes[size], className);
}

const Spinner = () => (
  <svg
    aria-hidden='true'
    className='size-4 animate-spin'
    xmlns='http://www.w3.org/2000/svg'
    fill='none'
    viewBox='0 0 24 24'
  >
    <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
    <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Z' />
  </svg>
);

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      children,
      loading = false,
      loadingText,
      disabled,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        className={buttonClasses({ variant, size, className })}
        ref={ref}
        // désactivé après un envoi valide : évite le double envoi
        disabled={loading || disabled}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading && <Spinner />}
        {loading ? loadingText || children : children}
      </button>
    );
  },
);

Button.displayName = 'Button';

export { Button };
