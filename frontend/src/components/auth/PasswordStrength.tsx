import React from 'react';
import { CheckIcon, CircleIcon } from 'lucide-react';
import { passwordChecks, passwordStrength } from '../../utils/validation';
import { cn } from '../../utils/cn';

export function PasswordStrength({ password }: {password: string;}) {
  if (!password) return null;
  const { score, label } = passwordStrength(password);
  const barColor = score <= 1 ? 'bg-danger' : score === 2 ? 'bg-warning' : 'bg-success';
  return (
    <div className="mt-3" aria-live="polite">
      <div className="flex items-center gap-3">
        <div className="grid flex-1 grid-cols-4 gap-1.5" aria-hidden="true">
          {[1, 2, 3, 4].map((i) =>
          <span key={i} className={cn('h-1 rounded-full transition-colors duration-200 ease-out', i <= score ? barColor : 'bg-line')} />
          )}
        </div>
        <span className="w-16 text-right text-xs font-medium text-muted">{label}</span>
      </div>
      <ul className="mt-2.5 grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2">
        {passwordChecks(password).map((check) =>
        <li key={check.id} className={cn('flex items-center gap-1.5 text-xs', check.met ? 'text-ink' : 'text-muted')}>
            {check.met ? <CheckIcon className="h-3.5 w-3.5 text-success" aria-hidden="true" /> : <CircleIcon className="h-3 w-3" aria-hidden="true" />}
            <span>
              {check.label}
              <span className="sr-only">{check.met ? ' — met' : ' — not yet met'}</span>
            </span>
          </li>
        )}
      </ul>
    </div>);

}