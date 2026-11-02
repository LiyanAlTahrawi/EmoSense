import React, { useMemo } from 'react';
import type { ReflectionEntry } from '../../types/conversation';

/** Plain counts of stored model labels — no scores, trends, or interpretation. */
export function ReflectionSummary({ entries }: {entries: ReflectionEntry[];}) {
  const counts = useMemo(() => {
    const map = new Map<string, number>();
    entries.forEach((e) => map.set(e.emotion, (map.get(e.emotion) ?? 0) + 1));
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [entries]);
  const max = counts[0]?.[1] ?? 1;

  return (
    <section aria-labelledby="summary-heading">
      <h3 id="summary-heading" className="text-sm font-semibold text-ink">In this period</h3>
      <p className="mt-1 text-xs leading-relaxed text-muted">
        How often each label was estimated across {entries.length} analyzed {entries.length === 1 ? 'message' : 'messages'}. A count, not a mood score.
      </p>
      {counts.length === 0 ?
      <p className="mt-4 text-sm text-muted">No estimates in this period.</p> :

      <ul className="mt-5 space-y-3">
          {counts.map(([label, count]) =>
        <li key={label}>
              <div className="flex items-baseline justify-between text-sm">
                <span className="text-ink">{label}</span>
                <span className="tabular-nums text-muted">{count}</span>
              </div>
              <div className="mt-1.5 h-1.5 rounded-full bg-raised" aria-hidden="true">
                <div className="h-full rounded-full bg-accent-soft" style={{ width: `${count / max * 100}%` }} />
              </div>
            </li>
        )}
        </ul>
      }
    </section>);

}