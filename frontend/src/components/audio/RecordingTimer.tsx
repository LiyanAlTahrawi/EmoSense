import React from 'react';
import { formatDuration } from '../../utils/dates';

export function RecordingTimer({ elapsed, max }: {elapsed: number;max: number;}) {
  const nearLimit = max - elapsed < 30;
  return (
    <span role="timer" aria-label={`Recording time ${formatDuration(elapsed)}`} className="font-mono text-sm tabular-nums text-ink">
      {formatDuration(elapsed)}
      <span className={nearLimit ? 'text-warning' : 'text-muted'}> / {formatDuration(max)}</span>
    </span>);

}