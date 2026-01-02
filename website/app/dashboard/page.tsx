"use client";

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import BeastModeDashboard from '../../components/beast-mode/BeastModeDashboard'
import FeedbackPrompt from '../../components/feedback/FeedbackPrompt'

function DashboardContent() {
  const searchParams = useSearchParams();

  return (
    <div className="fixed inset-0 overflow-hidden pt-0" style={{ pointerEvents: 'auto' }}>
      <BeastModeDashboard initialView={searchParams.get('view') || null} />
      {/* Global feedback prompt - appears in bottom-right */}
      <FeedbackPrompt />
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 flex items-center justify-center bg-slate-950">
        <div className="text-cyan-400 text-xl">Loading...</div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}
