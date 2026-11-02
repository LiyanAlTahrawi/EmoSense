import React from 'react';

/** Visualizes live microphone input level only — it represents no emotion data. */
export function Waveform({ levels }: {levels: number[];}) {
  return (
    <div className="flex h-8 min-w-0 flex-1 items-center justify-center gap-[3px] overflow-hidden" aria-hidden="true">
      {levels.map((level, i) =>
      <span
        key={i}
        className="w-[3px] shrink-0 rounded-full bg-accent transition-[height] duration-100 ease-out"
        style={{ height: `${Math.max(3, Math.round(level * 30))}px`, opacity: 0.35 + level * 0.65 }} />

      )}
    </div>);

}