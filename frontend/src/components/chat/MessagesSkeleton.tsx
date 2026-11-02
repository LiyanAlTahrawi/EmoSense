import React from 'react';

export function MessagesSkeleton() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 px-4 py-8 sm:px-6" role="status" aria-label="Loading messages">
      <div className="flex justify-end">
        <div className="h-16 w-2/3 animate-pulse rounded-2xl rounded-br-md bg-raised" />
      </div>
      <div className="flex gap-3">
        <div className="h-7 w-7 animate-pulse rounded-full bg-raised" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 w-11/12 animate-pulse rounded bg-raised" />
          <div className="h-3.5 w-4/5 animate-pulse rounded bg-raised" />
          <div className="h-3.5 w-3/5 animate-pulse rounded bg-raised" />
        </div>
      </div>
      <div className="flex justify-end">
        <div className="h-10 w-1/2 animate-pulse rounded-2xl rounded-br-md bg-raised" />
      </div>
      <span className="sr-only">Loading your conversation…</span>
    </div>);

}