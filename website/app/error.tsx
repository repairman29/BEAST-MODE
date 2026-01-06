'use client';

import { Button } from '../components/ui/button';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-8">
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-red-500 mb-4">500</h1>
          <h2 className="text-3xl font-bold mb-4">Something Went Wrong</h2>
          <p className="text-xl text-slate-400 mb-4">
            We encountered an unexpected error. Our team has been notified.
          </p>
          {error.message && (
            <p className="text-sm text-slate-500 mb-8 font-mono bg-slate-900 p-4 rounded">
              {error.message}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Button 
            onClick={reset}
            className="bg-cyan-600 hover:bg-cyan-700 text-white"
          >
            Try Again
          </Button>
          <Link href="/">
            <Button variant="outline" className="border-slate-800 text-white hover:bg-slate-900">
              Go Home
            </Button>
          </Link>
          <Link href="/support">
            <Button variant="outline" className="border-slate-800 text-white hover:bg-slate-900">
              Contact Support
            </Button>
          </Link>
        </div>

        <div className="text-slate-500 text-sm">
          <p>
            If this problem persists, please{' '}
            <Link href="/support" className="text-cyan-400 hover:text-cyan-300">
              contact our support team
            </Link>
            {' '}or{' '}
            <Link href="/docs/TROUBLESHOOTING" className="text-cyan-400 hover:text-cyan-300">
              check our troubleshooting guide
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

