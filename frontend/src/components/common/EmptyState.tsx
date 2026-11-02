import React from "react";
import { cn } from "../../utils/cn";
import { BoxIcon } from "lucide-react";
interface EmptyStateProps {
  icon: BoxIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  tone?: 'neutral' | 'danger';
  className?: string;
}
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  tone = 'neutral',
  className
}: EmptyStateProps) {
  return <div className={cn('flex flex-col items-center px-6 py-12 text-center', className)}>
      <div className={cn('flex h-12 w-12 items-center justify-center rounded-2xl', tone === 'danger' ? 'bg-danger-tint text-danger' : 'bg-accent-tint text-accent')}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <h2 className="mt-4 text-base font-semibold text-ink">{title}</h2>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted">{description}</p>
      {action && <div className="mt-5 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>;
}