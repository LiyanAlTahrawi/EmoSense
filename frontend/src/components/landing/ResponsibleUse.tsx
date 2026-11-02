import React from 'react';
import { Link } from 'react-router-dom';
import { CheckIcon, LifeBuoyIcon, MinusIcon } from 'lucide-react';
import { whatEmoSenseIs, whatEmoSenseIsNot } from '../../data/landing';

export function ResponsibleUse() {
  return (
    <section id="responsible" className="scroll-mt-20 border-t border-line bg-surface/60">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 lg:py-28">
        <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-ink sm:text-4xl">What EmoSense is — and what it isn't</h2>
        <div className="mt-12 grid gap-10 md:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold text-accent">EmoSense is</h3>
            <ul className="mt-4 space-y-3">
              {whatEmoSenseIs.map((item) =>
              <li key={item} className="flex gap-3 text-[15px] leading-relaxed text-ink">
                  <CheckIcon className="mt-1 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                  {item}
                </li>
              )}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-muted">EmoSense is not</h3>
            <ul className="mt-4 space-y-3">
              {whatEmoSenseIsNot.map((item) =>
              <li key={item} className="flex gap-3 text-[15px] leading-relaxed text-ink">
                  <MinusIcon className="mt-1 h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
                  {item}
                </li>
              )}
            </ul>
          </div>
        </div>
        <div className="mt-12 flex gap-4 rounded-2xl bg-mist p-5 sm:p-6">
          <LifeBuoyIcon className="mt-0.5 h-5 w-5 shrink-0 text-ink" aria-hidden="true" />
          <p className="text-[15px] leading-relaxed text-ink">
            If you're thinking about harming yourself or you're in immediate danger, please contact your local emergency number or a crisis line in your country right away. You deserve real, immediate support.
          </p>
        </div>

        <div className="mt-24 flex flex-col items-start justify-between gap-6 border-t border-line pt-12 sm:flex-row sm:items-center">
          <div>
            <p className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Your emotions matter.</p>
            <p className="mt-1 text-lg text-muted">Your voice deserves to be heard.</p>
          </div>
          <Link to="/signup" className="btn btn-primary btn-lg">Get Started</Link>
        </div>
      </div>
    </section>);

}