import Link from 'next/link';
import { ArrowLeft, Mail, MessageCircle, BookOpen, HelpCircle } from 'lucide-react';

export const metadata = {
  title: 'BEAST MODE - Support',
  description: 'Get help and support for BEAST MODE',
};

export default function SupportPage() {
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

        <h1 className="text-4xl font-bold mb-8">Support & Help</h1>

        <div className="space-y-8">
          {/* Support Channels */}
          <section>
            <h2 className="text-2xl font-semibold text-cyan-400 mb-6">Get Help</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <a
                href="/docs/FAQS"
                className="p-6 bg-slate-900/50 border border-slate-800 rounded-lg hover:border-cyan-500/50 transition-colors"
              >
                <HelpCircle className="w-8 h-8 text-cyan-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2">FAQs</h3>
                <p className="text-slate-400">
                  Find answers to frequently asked questions
                </p>
              </a>

              <a
                href="/docs/TROUBLESHOOTING"
                className="p-6 bg-slate-900/50 border border-slate-800 rounded-lg hover:border-cyan-500/50 transition-colors"
              >
                <BookOpen className="w-8 h-8 text-cyan-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Troubleshooting</h3>
                <p className="text-slate-400">
                  Common issues and solutions
                </p>
              </a>

              <a
                href="mailto:support@beast-mode.dev"
                className="p-6 bg-slate-900/50 border border-slate-800 rounded-lg hover:border-cyan-500/50 transition-colors"
              >
                <Mail className="w-8 h-8 text-cyan-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Email Support</h3>
                <p className="text-slate-400">
                  support@beast-mode.dev
                </p>
                <p className="text-sm text-slate-500 mt-2">
                  Response time: 24-48 hours
                </p>
              </a>

              <a
                href="/docs"
                className="p-6 bg-slate-900/50 border border-slate-800 rounded-lg hover:border-cyan-500/50 transition-colors"
              >
                <MessageCircle className="w-8 h-8 text-cyan-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Documentation</h3>
                <p className="text-slate-400">
                  Complete guides and API reference
                </p>
              </a>
            </div>
          </section>

          {/* Support Tiers */}
          <section>
            <h2 className="text-2xl font-semibold text-cyan-400 mb-6">Support by Tier</h2>
            <div className="space-y-4">
              <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Free Tier</h3>
                <p className="text-slate-400 mb-2">Community support via:</p>
                <ul className="list-disc list-inside text-slate-400 ml-4">
                  <li>GitHub Issues</li>
                  <li>Community forum</li>
                  <li>Documentation</li>
                </ul>
              </div>

              <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Developer Tier ($79/month)</h3>
                <p className="text-slate-400 mb-2">Priority email support:</p>
                <ul className="list-disc list-inside text-slate-400 ml-4">
                  <li>Email response within 24 hours</li>
                  <li>Priority bug fixes</li>
                  <li>Feature requests</li>
                </ul>
              </div>

              <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Team Tier ($299/month)</h3>
                <p className="text-slate-400 mb-2">Enhanced support:</p>
                <ul className="list-disc list-inside text-slate-400 ml-4">
                  <li>Phone/video support</li>
                  <li>Email response within 4 hours</li>
                  <li>99.9% SLA guarantee</li>
                  <li>Dedicated support channel</li>
                </ul>
              </div>

              <div className="p-6 bg-slate-900/50 border border-cyan-500/50 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Enterprise Tier ($799/month)</h3>
                <p className="text-slate-400 mb-2">Premium support:</p>
                <ul className="list-disc list-inside text-slate-400 ml-4">
                  <li>24/7 phone support</li>
                  <li>Dedicated account manager</li>
                  <li>99.99% SLA guarantee</li>
                  <li>Custom integrations support</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Quick Links */}
          <section>
            <h2 className="text-2xl font-semibold text-cyan-400 mb-6">Quick Links</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <a href="/docs/QUICK_START" className="text-cyan-400 hover:text-cyan-300">
                → Quick Start Guide
              </a>
              <a href="/docs/USER_GUIDE" className="text-cyan-400 hover:text-cyan-300">
                → User Guide
              </a>
              <a href="/docs/API" className="text-cyan-400 hover:text-cyan-300">
                → API Documentation
              </a>
              <a href="/dashboard" className="text-cyan-400 hover:text-cyan-300">
                → Dashboard
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

