import React from 'react';
import { howItWorksSteps } from '../../data/landing';

export function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-20 border-t border-line bg-surface/60">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 lg:py-28">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">How a conversation with EmoSense works</h2>
          <p className="mt-4 text-lg leading-relaxed text-muted">
            Each message moves through the same careful path — from your words to a response that takes your feelings into account.
          </p>
        </div>
        <ol className="mt-14 grid gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {howItWorksSteps.map((step, i) =>
          <li key={step.title} className="relative flex flex-col border-t border-line pt-6">
              <span className="absolute -top-px left-0 h-px w-12 bg-accent" aria-hidden="true" />
              <span className="text-sm font-medium text-accent">Step {i + 1}</span>
              <h3 className="mt-3 text-lg font-semibold leading-snug text-ink">{step.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">{step.body}</p>
              <p className="mt-auto pt-5 text-xs font-medium text-ink/70">{step.detail}</p>
            </li>
          )}
        </ol>
      </div>
    </section>);

}