import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'BEAST MODE - Terms of Service',
  description: 'Terms of Service for BEAST MODE',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
        <div className="text-slate-300 space-y-6">
          <p className="text-sm text-slate-500">Last updated: January 2026</p>

          <section>
            <h2 className="text-2xl font-semibold text-cyan-400 mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing or using BEAST MODE, you agree to be bound by these Terms of Service. 
              If you disagree with any part of these terms, you may not access the service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-cyan-400 mb-4">2. Description of Service</h2>
            <p>
              BEAST MODE is an AI-powered code quality and maintenance platform that provides:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
              <li>Code quality analysis and scoring</li>
              <li>Automated code fixes and refactoring</li>
              <li>AI-powered code recommendations</li>
              <li>Day 2 Operations (silent refactoring, architecture enforcement)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-cyan-400 mb-4">3. License and Usage</h2>
            <p className="mb-4">
              BEAST MODE operates under a dual-licensing model:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Free Tier:</strong> MIT License for core library, 10K API calls/month</li>
              <li><strong>Paid Tiers:</strong> Commercial license with usage limits based on subscription tier</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-cyan-400 mb-4">4. User Responsibilities</h2>
            <p className="mb-4">You agree to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Use the service only for lawful purposes</li>
              <li>Not attempt to reverse engineer or compromise the service</li>
              <li>Maintain the security of your API keys</li>
              <li>Not use the service to violate any laws or regulations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-cyan-400 mb-4">5. Payment and Billing</h2>
            <p className="mb-4">
              For paid subscriptions:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Subscriptions are billed monthly or annually</li>
              <li>You can cancel anytime</li>
              <li>30-day money-back guarantee on paid plans</li>
              <li>Overage charges apply for API calls beyond your tier limit</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-cyan-400 mb-4">6. Limitation of Liability</h2>
            <p>
              BEAST MODE is provided "as is" without warranties. We are not liable for any damages 
              resulting from use of the service, including but not limited to code quality issues, 
              data loss, or service interruptions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-cyan-400 mb-4">7. Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. Changes will be effective 
              immediately upon posting. Continued use of the service constitutes acceptance of 
              modified terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-cyan-400 mb-4">8. Contact</h2>
            <p>
              For questions about these Terms, contact us at:{' '}
              <a href="mailto:legal@beast-mode.dev" className="text-cyan-400 hover:text-cyan-300">
                legal@beast-mode.dev
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

