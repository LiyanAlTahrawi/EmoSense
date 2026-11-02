import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRightIcon, MicIcon, TypeIcon } from 'lucide-react';
import { formatDayHeading, formatMessageTime, isSameDay } from '../../utils/dates';
import type { ReflectionEntry } from '../../types/conversation';

export function ReflectionTimeline({ entries }: {entries: ReflectionEntry[];}) {
  return (
    <ol className="space-y-0" aria-label="Reflections timeline">
      {entries.map((entry, i) => {
        const showDay = i === 0 || !isSameDay(entries[i - 1].createdAt, entry.createdAt);
        return (
          <li key={entry.id}>
            {showDay && <h3 className="pb-3 pt-8 text-sm font-semibold text-ink first:pt-0">{formatDayHeading(entry.createdAt)}</h3>}
            <article className="border-t border-line py-5">
              <div className="flex items-center justify-between gap-3 text-xs text-muted">
                <span className="font-medium">Your words</span>
                <time dateTime={entry.createdAt}>{formatMessageTime(entry.createdAt)}</time>
              </div>
              <p className="mt-2 text-[15px] leading-relaxed text-ink">“{entry.content}”</p>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-lavender px-2.5 py-1 text-xs text-lavender-ink">
                  <span className="opacity-80">Model estimate</span>
                  <span className="font-semibold">{entry.emotion}</span>
                </span>
                <span className="flex items-center gap-1 text-xs text-muted">
                  {entry.inputType === 'audio' ? <MicIcon className="h-3.5 w-3.5" aria-hidden="true" /> : <TypeIcon className="h-3.5 w-3.5" aria-hidden="true" />}
                  {entry.inputType === 'audio' ? 'From voice' : 'From text'}
                </span>
                <Link to={`/app/c/${entry.conversationId}`} className="focus-ring ml-auto inline-flex items-center gap-1 rounded text-xs font-medium text-accent hover:underline">
                  <span className="max-w-[180px] truncate">{entry.conversationTitle}</span>
                  <ArrowUpRightIcon className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </div>
            </article>
          </li>);

      })}
    </ol>);

}