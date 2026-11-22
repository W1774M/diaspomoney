import { cn } from '@/lib/utils';
import { InputHTMLAttributes, forwardRef, useId } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Message d'erreur : relié au champ (aria-describedby) et annoncé. */
  error?: string | undefined;
  /** Libellé visible, associé au champ par for/id. */
  label?: string | undefined;
  /** Aide persistante affichée au-dessus du champ (format attendu, etc.). */
  hint?: string | undefined;
}

/** Classes partagées par Input, Select et Textarea. */
export const fieldClasses =
  'block w-full min-h-11 rounded-lg border border-input bg-background px-3 py-2 text-base text-foreground shadow-sm transition-colors placeholder:text-muted-foreground hover:border-foreground/60 focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-70 file:me-3 file:border-0 file:bg-transparent file:font-medium';

export const labelClasses = 'block text-sm font-medium text-foreground';
export const hintClasses = 'text-sm text-muted-foreground';
export const errorClasses = 'flex items-start gap-1.5 text-sm font-medium text-destructive';

/** Message d'erreur de champ : icône + texte (jamais la couleur seule). */
export function FieldError({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <p id={id} className={errorClasses}>
      <svg aria-hidden='true' viewBox='0 0 20 20' fill='currentColor' className='mt-0.5 size-4 shrink-0'>
        <path
          fillRule='evenodd'
          d='M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z'
          clipRule='evenodd'
        />
      </svg>
      <span>{children}</span>
    </p>
  );
}

/** Calcule id, aria-describedby et aria-invalid d'un champ. */
export function useFieldIds(
  id: string | undefined,
  hint: string | undefined,
  error: string | undefined,
  describedBy: string | undefined,
) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  const ariaDescribedBy =
    [describedBy, hintId, errorId].filter(Boolean).join(' ') || undefined;
  return { fieldId, hintId, errorId, ariaDescribedBy };
}

/** Libellé de champ ; l'astérisque est visuel, `required` porte l'information. */
export function FieldLabel({
  htmlFor,
  required,
  children,
}: {
  htmlFor: string;
  required?: boolean | undefined;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className={labelClasses}>
      {children}
      {required && (
        <span aria-hidden='true' className='ms-0.5 text-destructive'>
          *
        </span>
      )}
    </label>
  );
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, label, hint, id, required, ...props }, ref) => {
    const { fieldId, hintId, errorId, ariaDescribedBy } = useFieldIds(
      id,
      hint,
      error,
      props['aria-describedby'],
    );

    const input = (
      <input
        ref={ref}
        id={fieldId}
        required={required}
        className={cn(fieldClasses, className)}
        {...props}
        aria-describedby={ariaDescribedBy}
        aria-invalid={error ? true : props['aria-invalid']}
      />
    );

    // Sans libellé ni aide : champ seul (le parent fournit son libellé)
    if (!label && !hint && !error) return input;

    return (
      <div className='flex w-full flex-col gap-1.5'>
        {label && (
          <FieldLabel htmlFor={fieldId} required={required}>
            {label}
          </FieldLabel>
        )}
        {hint && (
          <p id={hintId} className={hintClasses}>
            {hint}
          </p>
        )}
        {input}
        {error && errorId && <FieldError id={errorId}>{error}</FieldError>}
      </div>
    );
  },
);

Input.displayName = 'Input';

export { Input };
