'use client';

import { LandingNav } from '@/components/landing/nav';
import { Hero } from '@/components/landing/hero';
import { LogoCloud } from '@/components/landing/logo-cloud';
import { Features, Workflow, CodeShowcase } from '@/components/landing/features';
import { Pricing, CTA } from '@/components/landing/pricing';
import { Footer } from '@/components/landing/footer';

export function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <LandingNav />
      <main className="flex-1">
        <Hero />
        <LogoCloud />
        <Features />
        <Workflow />
        <CodeShowcase />
        <Pricing />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
