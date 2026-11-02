import React from 'react';
import { Link } from 'react-router-dom';
import { ConversationPreview } from './ConversationPreview';

export function LandingHero() {
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-14 px-5 pb-20 pt-14 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:pb-28 lg:pt-24">
      <div>
        <h1 className="text-[40px] font-semibold leading-[1.08] tracking-tight text-ink sm:text-5xl lg:text-[58px]">
          Understand your emotions. <span className="text-accent">Express yourself freely.</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
          EmoSense combines emotion-aware AI with thoughtful conversation to help you reflect, express yourself, and feel heard.
        </p>
        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <Link to="/signup" className="btn btn-primary btn-lg">Get Started</Link>
          <Link to="/login" className="btn btn-secondary btn-lg">Log In</Link>
        </div>
        <p className="mt-6 max-w-md text-sm leading-relaxed text-muted">
          Talk by voice or text. EmoSense is a supportive companion, not a therapist or a diagnosis.
        </p>
      </div>
      <ConversationPreview />
    </section>);

}