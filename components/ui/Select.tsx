import { cn } from '@/lib/utils';
import React, { forwardRef } from 'react';
import {
  FieldError,
  FieldLabel,
  fieldClasses,
  hintClasses,
  useFieldIds,
} from './Input';

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string | undefined;
  hint?: string | undefined;
  error?: string | undefined;
  /** Première option vide et non sélectionnable (« Choisir… »). */
  placeholder?: string | undefined;
}

/**
 * Liste déroulante native : clavier, lecteurs d'écran et sélecteur mobile du
 * système fonctionnent sans JavaScript. Les enfants sont des <option>/<optgroup>.
 */
const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    { className, children, label, hint, error, placeholder, id, required, ...props },
    ref,
  ) => {
    const { fieldId, hintId, errorId, ariaDescribedBy } = useFieldIds(
      id,
      hint,
      error,
      props['aria-describedby'],
    );

    const select = (
      <select
        ref={ref}
        id={fieldId}
        required={required}
        className={cn(
          fieldClasses,
          'appearance-none bg-[length:1.25rem] bg-[right_0.625rem_center] bg-no-repeat pe-10',
          "bg-[url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%236b7280'%3e%3cpath fill-rule='evenodd' d='M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z' clip-rule='evenodd'/%3e%3c/svg%3e\")]",
          className,
        )}
        {...props}
        aria-describedby={ariaDescribedBy}
        aria-invalid={error ? true : props['aria-invalid']}
      >
        {placeholder !== undefined && (
          <option value='' disabled={required}>
            {placeholder}
          </option>
        )}
        {children}
      </select>
    );

    if (!label && !hint && !error) return select;

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
        {select}
        {error && errorId && <FieldError id={errorId}>{error}</FieldError>}
      </div>
    );
  },
);
Select.displayName = 'Select';

export { Select };
