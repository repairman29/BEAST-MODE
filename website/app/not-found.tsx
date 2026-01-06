import Link from 'next/link';
import { Button } from '../components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-8">
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-gradient-cyan mb-4">404</h1>
          <h2 className="text-3xl font-bold mb-4">Page Not Found</h2>
          <p className="text-xl text-slate-400 mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link href="/">
            <Button className="bg-cyan-600 hover:bg-cyan-700 text-white">
              Go Home
            </Button>
          </Link>
          <Link href="/docs">
            <Button variant="outline" className="border-slate-800 text-white hover:bg-slate-900">
              View Documentation
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" className="border-slate-800 text-white hover:bg-slate-900">
              Go to Dashboard
            </Button>
          </Link>
        </div>

        <div className="text-slate-500 text-sm">
          <p>Need help? <Link href="/support" className="text-cyan-400 hover:text-cyan-300">Contact Support</Link></p>
        </div>
      </div>
    </div>
  );
}

