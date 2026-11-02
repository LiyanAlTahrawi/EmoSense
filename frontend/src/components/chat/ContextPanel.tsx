import React from 'react';
import { Link } from 'react-router-dom';
import { MicIcon, TypeIcon, XIcon } from 'lucide-react';
import { formatEmotionLabel } from '../../utils/emotion';
import { formatLongDate } from '../../utils/dates';
import type { Conversation, DisplayMessage, MessageAnalysis } from '../../types/conversation';

interface ContextPanelProps {
  conversation?: Conversation;
  messages: DisplayMessage[];
  analyses: Record<string, MessageAnalysis>;
  onClose: () => void;
}

export function ContextPanel({ conversation, messages, analyses, onClose }: ContextPanelProps) {
  const userMessages = messages.filter((m) => m.role === 'user' && !m.localStatus);
  const voiceCount = userMessages.filter((m) => m.hasAudio).length;
  const estimates = userMessages.
  filter((m) => analyses[m.id]?.predictedEmotion).
  slice(-5).
  reverse();

  return (
    <aside className="hidden w-[320px] shrink-0 flex-col border-l border-line bg-surface/60 xl:flex" aria-label="Conversation context">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-line px-4">
        <h2 className="text-sm font-semibold text-ink">Conversation context</h2>
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Close conversation context">
          <XIcon className="h-4 w-4" />
        </button>
      </div>
      <div className="flex-1 space-y-8 overflow-y-auto p-5">
        <dl className="grid grid-cols-2 gap-y-3 text-sm">
          {conversation &&
          <>
              <dt className="text-muted">Started</dt>
              <dd className="text-right text-ink">{formatLongDate(conversation.createdAt)}</dd>
            </>
          }
          <dt className="text-muted">Your messages</dt>
          <dd className="text-right text-ink">{userMessages.length}</dd>
          <dt className="text-muted">Voice messages</dt>
          <dd className="text-right text-ink">{voiceCount}</dd>
        </dl>

        <section>
          <h3 className="text-sm font-semibold text-ink">Model estimates</h3>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            Emotion labels estimated by EmoSense's trained text and voice models. They're signals for reflection — not diagnoses.
          </p>
          {estimates.length === 0 ?
          <p className="mt-4 rounded-xl bg-raised/70 px-3 py-3 text-xs leading-relaxed text-muted">
              Estimates appear here after your messages have been analyzed on the server.
            </p> :

          <ul className="mt-4 space-y-3">
              {estimates.map((m) =>
            <li key={m.id} className="rounded-xl border border-line bg-surface p-3">
                  <p className="line-clamp-2 text-[13px] leading-relaxed text-ink">“{m.content}”</p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="rounded-full bg-lavender px-2 py-0.5 text-[11px] font-medium text-lavender-ink">
                      {formatEmotionLabel(analyses[m.id]?.predictedEmotion)}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-muted">
                      {m.hasAudio ? <MicIcon className="h-3 w-3" aria-hidden="true" /> : <TypeIcon className="h-3 w-3" aria-hidden="true" />}
                      {m.hasAudio ? 'Voice model' : 'Text model'}
                    </span>
                  </div>
                </li>
            )}
            </ul>
          }
        </section>

        <Link to="/app/reflections" className="focus-ring inline-flex rounded text-sm font-medium text-accent hover:underline">
          See all in My Reflections
        </Link>
      </div>
    </aside>);

}