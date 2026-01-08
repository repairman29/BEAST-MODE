import { lazy, Suspense } from 'react';
import LoadingState from '@/components/ui/LoadingState';

const AIFeaturesDashboard = lazy(() => import('@/components/ai/AIFeaturesDashboard'));

export default function AIFeaturesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <Suspense fallback={<LoadingState message="Loading AI features..." />}>
        <AIFeaturesDashboard />
      </Suspense>
    </div>
  );
}
