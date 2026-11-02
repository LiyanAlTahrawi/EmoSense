import React from 'react';
import { AlertCircleIcon, CheckCircle2Icon, InfoIcon, PlugZapIcon, TriangleAlertIcon, XIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

type NoticeTone = 'info' | 'success' | 'warning' | 'danger' | 'integration';

interface NoticeProps {
  tone?: NoticeTone;
  title: string;
  children?: React.ReactNode;
  /** Backend contract this feature depends on, e.g. "PATCH /conversations/{id}". */
  contract?: string;
  action?: React.ReactNode;
  onDismiss?: () => void;
  className?: string;
}

const toneStyles: Record<NoticeTone, {box: string;icon: string;Icon: typeof InfoIcon;}> = {
  info: { box: 'bg-mist border-line', icon: 'text-ink', Icon: InfoIcon },
  success: { box: 'bg-accent-tint border-accent/25', icon: 'text-success', Icon: CheckCircle2Icon },
  warning: { box: 'bg-warning-tint border-warning/25', icon: 'text-warning', Icon: TriangleAlertIcon },
  danger: { box: 'bg-danger-tint border-danger/25', icon: 'text-danger', Icon: AlertCircleIcon },
  integration: { box: 'bg-lavender border-lavender-ink/15', icon: 'text-lavender-ink', Icon: PlugZapIcon }
};

export function Notice({ tone = 'info', title, children, contract, action, onDismiss, className }: NoticeProps) {
  const { box, icon, Icon } = toneStyles[tone];
  return (
    <div role={tone === 'danger' ? 'alert' : 'status'} className={cn('flex gap-3 rounded-xl border px-4 py-3.5', box, className)}>
      <Icon className={cn('mt-0.5 h-[18px] w-[18px] shrink-0', icon)} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-ink">{title}</p>
        {children && <div className="mt-1 text-sm leading-relaxed text-muted">{children}</div>}
        {contract &&
        <p className="mt-2 text-xs text-muted">
            Requires <code className="rounded bg-surface/70 px-1.5 py-0.5 font-mono text-[11px] text-ink">{contract}</code>
          </p>
        }
        {action && <div className="mt-3 flex flex-wrap gap-2">{action}</div>}
      </div>
      {onDismiss &&
      <button type="button" onClick={onDismiss} className="icon-btn -mr-2 -mt-1 h-8 w-8" aria-label="Dismiss">
          <XIcon className="h-4 w-4" />
        </button>
      }
    </div>);

}