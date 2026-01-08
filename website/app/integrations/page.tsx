import { lazy, Suspense } from 'react';
import LoadingState from '@/components/ui/LoadingState';

const IntegrationsDashboard = lazy(() => import('@/components/integrations/IntegrationsDashboard'));

export default function IntegrationsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <Suspense fallback={<LoadingState message="Loading integrations..." />}>
        <IntegrationsDashboard />
      </Suspense>
    </div>
  );
}
