import { lazy, Suspense } from 'react';
import LoadingState from '@/components/ui/LoadingState';

const MarketplaceDashboard = lazy(() => import('@/components/marketplace/MarketplaceDashboard'));

export default function MarketplacePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <Suspense fallback={<LoadingState message="Loading marketplace..." />}>
        <MarketplaceDashboard />
      </Suspense>
    </div>
  );
}
