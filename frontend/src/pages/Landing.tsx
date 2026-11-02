import React from 'react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { HowItWorks } from '../components/landing/HowItWorks';
import { LandingFooter } from '../components/landing/LandingFooter';
import { LandingHeader } from '../components/landing/LandingHeader';
import { LandingHero } from '../components/landing/LandingHero';
import { PrivacySection } from '../components/landing/PrivacySection';
import { ResponsibleUse } from '../components/landing/ResponsibleUse';

export function LandingPage() {
  useDocumentTitle();
  return (
    <div className="min-h-[100dvh] w-full bg-canvas">
      <LandingHeader />
      <main>
        <LandingHero />
        <HowItWorks />
        <PrivacySection />
        <ResponsibleUse />
      </main>
      <LandingFooter />
    </div>);

}