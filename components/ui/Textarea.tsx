import { cn } from '@/lib/utils';
import React, { forwardRef } from 'react';
import {
  FieldError,
  FieldLabel,
  fieldClasses,
  hintClasses,
  useFieldIds,
} from './Input';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string | undefined;
  hint?: string | undefined;
  error?: string | undefined;
}

/** Zone de texte qui grandit avec son contenu (field-sizing, progressif). */
const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, hint, error, id, required, ...props }, ref) => {
    const { fieldId, hintId, errorId, ariaDescribedBy } = useFieldIds(
      id,
      hint,
      error,
      props['aria-describedby'],
    );

    const textarea = (
      <textarea
        ref={ref}
        id={fieldId}
        required={required}
        className={cn(fieldClasses, 'min-h-28 resize-y', className)}
        {...props}
        aria-describedby={ariaDescribedBy}
        aria-invalid={error ? true : props['aria-invalid']}
      />
    );

    if (!label && !hint && !error) return textarea;

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
        {textarea}
        {error && errorId && <FieldError id={errorId}>{error}</FieldError>}
      </div>
    );
  },
);
Textarea.displayName = 'Textarea';

export { Textarea };
