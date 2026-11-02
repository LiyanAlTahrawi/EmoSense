import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { differenceInCalendarDays } from 'date-fns';
import { BookOpenIcon, CloudOffIcon, FilterXIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { REFLECTION_CONVERSATION_LIMIT, useReflections } from '../hooks/useReflections';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { TopBar } from '../components/layout/TopBar';
import { EmptyState } from '../components/common/EmptyState';
import { Notice } from '../components/common/Notice';
import { ReflectionExtras } from '../components/reflections/ReflectionExtras';
import { ReflectionSummary } from '../components/reflections/ReflectionSummary';
import { ReflectionTimeline } from '../components/reflections/ReflectionTimeline';
import { cn } from '../utils/cn';

type Range = '7' | '30' | 'all';
const ranges: {value: Range;label: string;}[] = [
{ value: '7', label: '7 days' },
{ value: '30', label: '30 days' },
{ value: 'all', label: 'All time' }];


export function ReflectionsPage() {
  useDocumentTitle('My Reflections');
  const { mode } = useAuth();
  const { entries, status, error, failedCount, reload, totalConversations } = useReflections();
  const [range, setRange] = useState<Range>('30');
  const [conversationFilter, setConversationFilter] = useState('all');

  const conversationOptions = useMemo(() => {
    const seen = new Map<string, string>();
    entries.forEach((e) => seen.set(e.conversationId, e.conversationTitle));
    return [...seen.entries()];
  }, [entries]);

  const filtered = useMemo(
    () =>
    entries.filter((e) => {
      if (range !== 'all' && differenceInCalendarDays(new Date(), new Date(e.createdAt)) > Number(range)) return false;
      return conversationFilter === 'all' || e.conversationId === conversationFilter;
    }),
    [entries, range, conversationFilter]
  );

  return (
    <>
      <TopBar title="My Reflections" />
      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Look back on what you've shared</h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Your own words, alongside the emotion labels EmoSense's trained models estimated for them. They're prompts for reflection — never assessments or diagnoses.
              </p>
            </div>
            {mode === 'demo' && <span className="rounded-full bg-lavender px-3 py-1 text-xs font-medium text-lavender-ink">Sample data</span>}
          </div>

          {status === 'loading' &&
          <div className="mt-10 space-y-6" role="status" aria-label="Loading reflections">
              {[0, 1, 2].map((i) =>
            <div key={i} className="space-y-2 border-t border-line pt-5">
                  <div className="h-3 w-20 animate-pulse rounded bg-raised" />
                  <div className="h-4 w-11/12 animate-pulse rounded bg-raised" />
                  <div className="h-4 w-2/3 animate-pulse rounded bg-raised" />
                </div>
            )}
            </div>
          }

          {status === 'error' &&
          <EmptyState
            className="mt-6"
            icon={CloudOffIcon}
            tone="danger"
            title="We couldn't load your reflections"
            description={error ?? 'Please try again.'}
            action={<button type="button" className="btn btn-primary" onClick={() => void reload()}>Try again</button>} />

          }

          {status === 'ready' && entries.length === 0 &&
          <EmptyState
            className="mt-6"
            icon={BookOpenIcon}
            title="Nothing to reflect on yet"
            description="Once you share messages and they're analyzed, you'll be able to look back on them here."
            action={<Link to="/app" className="btn btn-primary">Start a conversation</Link>} />

          }

          {status === 'ready' && entries.length > 0 &&
          <>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <div role="radiogroup" aria-label="Date range" className="inline-flex rounded-xl border border-line bg-surface p-1">
                  {ranges.map((r) =>
                <button
                  key={r.value}
                  type="button"
                  role="radio"
                  aria-checked={range === r.value}
                  onClick={() => setRange(r.value)}
                  className={cn(
                    'focus-ring rounded-lg px-3.5 py-1.5 text-sm transition-colors duration-150 ease-out',
                    range === r.value ? 'bg-accent text-on-accent' : 'text-muted hover:text-ink'
                  )}>
                  
                      {r.label}
                    </button>
                )}
                </div>
                <label htmlFor="conversation-filter" className="sr-only">Filter by conversation</label>
                <select
                id="conversation-filter"
                value={conversationFilter}
                onChange={(e) => setConversationFilter(e.target.value)}
                className="input h-10 w-full text-sm sm:w-64">
                
                  <option value="all">All conversations</option>
                  {conversationOptions.map(([id, title]) =>
                <option key={id} value={id}>{title}</option>
                )}
                </select>
              </div>

              {(failedCount > 0 || totalConversations > REFLECTION_CONVERSATION_LIMIT) &&
            <Notice tone="info" title="Showing recent conversations" className="mt-6">
                  {totalConversations > REFLECTION_CONVERSATION_LIMIT && `Reflections cover your ${REFLECTION_CONVERSATION_LIMIT} most recent conversations. `}
                  {failedCount > 0 && `${failedCount} conversation${failedCount > 1 ? 's' : ''} couldn't be loaded.`}
                </Notice>
            }

              <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_300px]">
                <div>
                  {filtered.length === 0 ?
                <EmptyState
                  icon={FilterXIcon}
                  title="No reflections in this view"
                  description="Try a longer date range or a different conversation."
                  action={<button type="button" className="btn btn-secondary" onClick={() => {setRange('all');setConversationFilter('all');}}>Clear filters</button>} /> :


                <ReflectionTimeline entries={filtered} />
                }
                </div>
                <aside className="space-y-10 lg:border-l lg:border-line lg:pl-10">
                  <ReflectionSummary entries={filtered} />
                  <ReflectionExtras />
                </aside>
              </div>
            </>
          }
        </div>
      </main>
    </>);

}