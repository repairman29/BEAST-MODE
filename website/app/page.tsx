'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import HeroSectionEnhanced from '../components/landing/HeroSectionEnhanced'
import Day2OperationsSection from '../components/landing/Day2OperationsSection'
import FeaturesSection from '../components/landing/FeaturesSection'
import StatsSection from '../components/landing/StatsSection'
import ValueSection from '../components/landing/ValueSection'
import TestimonialsSection from '../components/landing/TestimonialsSection'
import CallToAction from '../components/landing/CallToAction'
import { AuthSection } from '../components/beast-mode/AuthSection'

function HomeContent() {
  const searchParams = useSearchParams();
  const auth = searchParams.get('auth');
  const action = searchParams.get('action');
  
  // Show auth form if ?auth=required or ?action=signin/signup
  const showAuth = auth === 'required' || action === 'signin' || action === 'signup';

  if (showAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <AuthSection />
        </div>
      </div>
    );
  }

  return (
    <>
      <HeroSectionEnhanced />
      <Day2OperationsSection />
      <FeaturesSection />
      <StatsSection />
      <ValueSection />
      <TestimonialsSection />
      <CallToAction />
    </>
  )
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  )
}
