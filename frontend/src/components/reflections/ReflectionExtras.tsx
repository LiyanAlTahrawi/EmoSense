import React from 'react';
import { Link } from 'react-router-dom';
import { Notice } from '../common/Notice';

export function ReflectionExtras() {
  return (
    <div className="space-y-8">
      <section aria-labelledby="notes-heading">
        <h3 id="notes-heading" className="text-sm font-semibold text-ink">Personal notes</h3>
        <p className="mt-1 text-xs leading-relaxed text-muted">Write your own description of how you've been feeling — kept separate from model estimates.</p>
        <label htmlFor="reflection-note" className="sr-only">Personal note</label>
        <textarea
          id="reflection-note"
          disabled
          rows={3}
          placeholder="Notes will be saved to your account once supported."
          className="mt-3 w-full resize-none rounded-xl border border-line bg-raised/60 px-3 py-2.5 text-sm text-ink placeholder:text-muted disabled:cursor-not-allowed" />
        
        <Notice tone="integration" title="Notes aren't stored yet" contract="Personal notes API + storage" className="mt-3" />
      </section>

      <section aria-labelledby="summaries-heading">
        <h3 id="summaries-heading" className="text-sm font-semibold text-ink">Assistant summaries</h3>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          Gentle summaries written by EmoSense will appear here, always labeled as assistant-generated and distinct from your own words.
        </p>
        <Notice tone="integration" title="Summaries are coming later" contract="GET /reflections (summaries)" className="mt-3" />
      </section>

      <section aria-labelledby="control-heading">
        <h3 id="control-heading" className="text-sm font-semibold text-ink">Your control</h3>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          Reflections come from your saved conversations. Manage or delete that history in{' '}
          <Link to="/app/settings/privacy" className="font-medium text-accent hover:underline">Privacy & data</Link>.
        </p>
      </section>
    </div>);

}