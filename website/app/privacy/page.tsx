import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'BEAST MODE - Privacy Policy',
  description: 'Privacy Policy for BEAST MODE',
};

export default function PrivacyPage() {
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

        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        <div className="text-slate-300 space-y-6">
          <p className="text-sm text-slate-500">Last updated: January 2026</p>

          <section>
            <h2 className="text-2xl font-semibold text-cyan-400 mb-4">1. Information We Collect</h2>
            <p className="mb-4">
              We collect information that you provide directly to us, including:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Account information (email, name)</li>
              <li>Code repositories you connect</li>
              <li>Usage data and analytics</li>
              <li>API keys and authentication tokens (encrypted)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-cyan-400 mb-4">2. How We Use Your Information</h2>
            <p className="mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Provide and improve our services</li>
              <li>Analyze code quality and provide recommendations</li>
              <li>Send you updates and support communications</li>
              <li>Ensure security and prevent fraud</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-cyan-400 mb-4">3. Data Security</h2>
            <p>
              We implement industry-standard security measures to protect your data, including:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
              <li>Encryption of sensitive data (AES-256-GCM)</li>
              <li>Secure API key storage</li>
              <li>Regular security audits</li>
              <li>Access controls and authentication</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-cyan-400 mb-4">4. Data Sharing</h2>
            <p>
              We do not sell your personal information. We may share data with:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
              <li>Service providers (Supabase, Vercel) for hosting and infrastructure</li>
              <li>AI providers (OpenAI, Anthropic) for code analysis (code is not stored by AI providers)</li>
              <li>Legal authorities if required by law</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-cyan-400 mb-4">5. Your Rights</h2>
            <p className="mb-4">
              You have the right to:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Access your personal data</li>
              <li>Request deletion of your data</li>
              <li>Opt-out of marketing communications</li>
              <li>Export your data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-cyan-400 mb-4">6. Contact Us</h2>
            <p>
              For questions about this Privacy Policy, contact us at:{' '}
              <a href="mailto:privacy@beast-mode.dev" className="text-cyan-400 hover:text-cyan-300">
                privacy@beast-mode.dev
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

