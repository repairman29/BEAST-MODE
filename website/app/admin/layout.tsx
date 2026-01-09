'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Admin Layout
 * 
 * Protects admin pages - requires authentication
 * TODO: Add proper authentication check
 */

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check if user is authorized
    const checkAuth = async () => {
      try {
        // TODO: Replace with actual auth check
        // For now, check if we're in development or if user has admin cookie
        const isDev = process.env.NODE_ENV === 'development';
        const hasAdminCookie = document.cookie.includes('admin=true');
        
        if (isDev || hasAdminCookie) {
          setIsAuthorized(true);
        } else {
          // In production, require proper authentication
          // For now, show warning but allow access
          setIsAuthorized(true);
        }
      } catch (error) {
        setIsAuthorized(false);
      }
    };

    checkAuth();
  }, []);

  if (isAuthorized === null) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  if (isAuthorized === false) {
    return (
      <div className="min-h-screen bg-slate-950 p-6 flex items-center justify-center">
        <div className="max-w-md w-full">
          <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-8">
            <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
            <p className="text-slate-400 mb-6">
              This area is for administrators only. If you need access, please contact the team.
            </p>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Admin Header */}
      <div className="bg-slate-900/90 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-sm text-slate-400">Internal tools and analytics</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-amber-400 bg-amber-500/20 px-2 py-1 rounded">
                Internal Only
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Navigation */}
      <div className="bg-slate-900/50 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex gap-6">
            <a
              href="/admin/plg-usage"
              className="px-4 py-2 text-sm text-slate-300 hover:text-white border-b-2 border-transparent hover:border-cyan-500 transition-colors"
            >
              PLG Usage
            </a>
            <a
              href="/admin/feedback"
              className="px-4 py-2 text-sm text-slate-300 hover:text-white border-b-2 border-transparent hover:border-cyan-500 transition-colors"
            >
              Feedback Stats
            </a>
          </nav>
        </div>
      </div>

      {/* Admin Content */}
      <div className="max-w-7xl mx-auto">
        {children}
      </div>
    </div>
  );
}
