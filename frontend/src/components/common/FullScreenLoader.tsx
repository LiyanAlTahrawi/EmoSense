import React from 'react';
import { LogoMark } from './Logo';
import { Spinner } from './Spinner';

export function FullScreenLoader({ label }: {label: string;}) {
  return (
    <div className="flex min-h-[100dvh] w-full flex-col items-center justify-center gap-5 bg-canvas" role="status" aria-live="polite">
      <LogoMark className="h-12 w-12" />
      <p className="flex items-center gap-2 text-sm text-muted">
        <Spinner />
        {label}
      </p>
    </div>);

}