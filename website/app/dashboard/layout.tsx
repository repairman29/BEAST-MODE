'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';

/**
 * Dashboard Layout
 * 
 * Protects dashboard pages - requires authentication
 */

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        // Give a moment for localStorage to be available and user context to initialize
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const authenticated = await isAuthenticated();
        setIsAuthorized(authenticated);
        
        // If not authenticated, redirect to home with auth prompt
        if (!authenticated) {
          // Small delay to show loading state
          setTimeout(() => {
            router.push('/?auth=required');
          }, 500);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthorized(false);
        // On error, redirect to sign-in
        setTimeout(() => {
          router.push('/?auth=required');
        }, 500);
      }
    };

    checkAuth();
  }, [router]);

  if (isAuthorized === null) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-slate-400">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (isAuthorized === false) {
    return (
      <div className="min-h-screen bg-slate-950 p-6 flex items-center justify-center">
        <div className="max-w-md w-full">
          <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-8">
            <h1 className="text-2xl font-bold text-white mb-4">Authentication Required</h1>
            <p className="text-slate-400 mb-6">
              Please sign in to access the dashboard.
            </p>
            <button
              onClick={() => router.push('/?auth=required')}
              className="w-full px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
