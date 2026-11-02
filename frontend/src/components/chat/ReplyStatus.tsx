import React from 'react';
import { motion } from 'framer-motion';
import { PlugZapIcon } from 'lucide-react';
import { LogoMark } from '../common/Logo';
import type { ReplyState } from '../../types/conversation';

interface ReplyStatusProps {
  state: ReplyState;
  onDismiss: () => void;
}

/**
 * Honest status after a send. "awaiting" only while the request is in flight.
 * "unavailable" when the server saved the message but returned no assistant reply.
 */
export function ReplyStatus({ state, onDismiss }: ReplyStatusProps) {
  if (state === 'idle') return null;

  if (state === 'awaiting') {
    return (
      <div className="flex items-center gap-3" role="status">
        <LogoMark className="h-7 w-7" />
        <span className="flex items-center gap-2.5 text-sm text-muted">
          <span className="flex gap-1" aria-hidden="true">
            {[0, 1, 2].map((i) =>
            <span key={i} className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" style={{ animationDelay: `${i * 160}ms` }} />
            )}
          </span>
          Saving and analyzing your message…
        </span>
      </div>);

  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
      className="flex gap-3"
      role="status">
      
      <LogoMark className="mt-0.5 h-7 w-7 opacity-60" />
      <div className="max-w-[88%] rounded-2xl border border-dashed border-line bg-surface/70 px-4 py-3 sm:max-w-[80%]">
        <p className="text-sm font-medium text-ink">Your message is saved</p>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          EmoSense's replies will appear here once response generation is connected on the server. No reply was generated for this message.
        </p>
        <div className="mt-2.5 flex items-center gap-3">
          <span className="inline-flex items-center gap-1 rounded-full bg-lavender px-2 py-0.5 text-[11px] font-medium text-lavender-ink">
            <PlugZapIcon className="h-3 w-3" aria-hidden="true" /> Integration pending
          </span>
          <button type="button" onClick={onDismiss} className="focus-ring rounded text-xs text-muted hover:text-ink">
            Dismiss
          </button>
        </div>
      </div>
    </motion.div>);

}