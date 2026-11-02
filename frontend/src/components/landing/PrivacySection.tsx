import React from 'react';
import { privacyPoints } from '../../data/landing';

export function PrivacySection() {
  return (
    <section id="privacy" className="scroll-mt-20">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20 lg:py-28">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <h2 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">Private by design, from sign-in to sign-out</h2>
          <p className="mt-4 text-lg leading-relaxed text-muted">
            What you share with EmoSense is personal. Your conversations belong to your account, and you can return to them whenever you're ready.
          </p>
        </div>
        <dl className="divide-y divide-line border-y border-line">
          {privacyPoints.map((point) =>
          <div key={point.term} className="grid gap-2 py-6 sm:grid-cols-[200px_1fr] sm:gap-8">
              <dt className="text-[15px] font-semibold text-ink">{point.term}</dt>
              <dd className="text-[15px] leading-relaxed text-muted">{point.description}</dd>
            </div>
          )}
        </dl>
      </div>
    </section>);

}