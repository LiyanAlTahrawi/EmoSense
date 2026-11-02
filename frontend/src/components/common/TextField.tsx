import React, { useId } from 'react';
import { cn } from '../../utils/cn';

export interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: React.ReactNode;
  optional?: boolean;
  trailing?: React.ReactNode;
}

export function TextField({ label, error, hint, optional, trailing, id, className, ...props }: TextFieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined;

  return (
    <div className={className}>
      <label htmlFor={inputId} className="label">
        {label}
        {optional && <span className="ml-1.5 font-normal text-muted">(optional)</span>}
      </label>
      <div className="relative">
        <input id={inputId} aria-invalid={Boolean(error)} aria-describedby={describedBy} className={cn('input', trailing && 'pr-11')} {...props} />
        {trailing && <div className="absolute inset-y-0 right-1 flex items-center">{trailing}</div>}
      </div>
      {error &&
      <p id={errorId} className="mt-1.5 text-[13px] text-danger">
          {error}
        </p>
      }
      {hint && !error &&
      <div id={hintId} className="mt-1.5 text-[13px] text-muted">
          {hint}
        </div>
      }
    </div>);

}