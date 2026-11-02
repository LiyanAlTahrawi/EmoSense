import React from 'react';
import { Loader2Icon } from 'lucide-react';
import { cn } from '../../utils/cn';

export function Spinner({ className }: {className?: string;}) {
  return <Loader2Icon aria-hidden="true" className={cn('h-4 w-4 animate-spin', className)} />;
}