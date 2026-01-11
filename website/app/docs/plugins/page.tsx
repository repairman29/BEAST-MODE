import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Plugin Development - BEAST MODE',
  description: 'Learn how to develop plugins for BEAST MODE',
};

export default function PluginsPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold text-white mb-6">Plugin Development</h1>
      
      <div className="prose prose-invert max-w-none">
        <p className="text-slate-400 text-lg mb-8">
          Extend BEAST MODE with custom plugins to add new features, integrations, and capabilities.
        </p>

        <div className="grid gap-6 mb-12">
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-white mb-4">Getting Started</h2>
            <p className="text-slate-400 mb-4">
              Start building plugins for BEAST MODE with our comprehensive development guide.
            </p>
            <Link
              href="/docs/plugins/development"
              className="inline-flex items-center px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
            >
              View Development Guide →
            </Link>
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">What You Can Build</h2>
          <ul className="text-slate-400 space-y-2">
            <li>• Custom quality analysis rules</li>
            <li>• Integration with third-party tools</li>
            <li>• Custom AI model integrations</li>
            <li>• Automated workflow enhancements</li>
            <li>• Custom reporting and analytics</li>
          </ul>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-white mb-4">Resources</h2>
          <ul className="text-slate-400 space-y-2">
            <li>
              <Link href="/docs/plugins/development" className="text-cyan-400 hover:text-cyan-300">
                Plugin Development Guide
              </Link>
            </li>
            <li>
              <Link href="/docs/API" className="text-cyan-400 hover:text-cyan-300">
                API Documentation
              </Link>
            </li>
            <li>
              <Link href="/docs/CLI" className="text-cyan-400 hover:text-cyan-300">
                CLI Reference
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
