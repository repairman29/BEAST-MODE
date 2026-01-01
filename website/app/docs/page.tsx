import Link from 'next/link';
import { BookOpen, Rocket, HelpCircle, Wrench, Code, Zap, Brain, Package, TrendingUp, Users, Settings } from 'lucide-react';

export const metadata = {
  title: 'BEAST MODE Documentation',
  description: 'Complete documentation for BEAST MODE - AI-powered development tools',
};

export default function DocsPage() {
  const docs = [
    {
      title: 'Quick Start',
      description: 'Get started in 5 minutes',
      icon: Rocket,
      href: '/docs/QUICK_START',
      category: 'Getting Started',
    },
    {
      title: '3 Easy Steps',
      description: 'Start here for new users',
      icon: Zap,
      href: '/docs/3_EASY_STEPS',
      category: 'Getting Started',
    },
    {
      title: 'User Guide',
      description: 'Complete feature guide',
      icon: BookOpen,
      href: '/docs/USER_GUIDE',
      category: 'Guides',
    },
    {
      title: 'FAQs',
      description: 'Frequently asked questions',
      icon: HelpCircle,
      href: '/docs/FAQS',
      category: 'Reference',
    },
    {
      title: 'Troubleshooting',
      description: 'Common issues and solutions',
      icon: Wrench,
      href: '/docs/TROUBLESHOOTING',
      category: 'Reference',
    },
    {
      title: 'Plugin System',
      description: 'Plugin development guide',
      icon: Package,
      href: '/docs/plugins/development',
      category: 'Development',
    },
    {
      title: 'API Documentation',
      description: 'Complete API reference',
      icon: Code,
      href: '/docs/API',
      category: 'Development',
    },
    {
      title: 'CLI Guide',
      description: 'Command-line interface',
      icon: Code,
      href: '/docs/CLI',
      category: 'Development',
    },
    {
      title: 'Analytics',
      description: 'Unified analytics system',
      icon: TrendingUp,
      href: '/docs/ANALYTICS',
      category: 'Features',
    },
    {
      title: 'Enterprise Features',
      description: 'SSO, Teams, White Label',
      icon: Users,
      href: '/docs/ENTERPRISE',
      category: 'Features',
    },
  ];

  const categories = ['Getting Started', 'Guides', 'Features', 'Development', 'Reference'];

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            BEAST MODE Documentation
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Everything you need to know about BEAST MODE - from quick start to advanced features
          </p>
        </div>

        {/* Documentation Grid by Category */}
        {categories.map((category) => {
          const categoryDocs = docs.filter((doc) => doc.category === category);
          if (categoryDocs.length === 0) return null;

          return (
            <div key={category} className="mb-12">
              <h2 className="text-2xl font-bold text-cyan-400 mb-6">{category}</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoryDocs.map((doc) => {
                  const Icon = doc.icon;
                  return (
                    <Link
                      key={doc.href}
                      href={doc.href}
                      className="group bg-slate-900/50 border border-slate-800 rounded-lg p-6 hover:border-cyan-500/50 hover:bg-slate-900 transition-all"
                    >
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-cyan-500/10 rounded-lg group-hover:bg-cyan-500/20 transition-colors">
                          <Icon className="w-6 h-6 text-cyan-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                            {doc.title}
                          </h3>
                          <p className="text-sm text-slate-400">{doc.description}</p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Quick Links */}
        <div className="mt-16 p-8 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 rounded-lg">
          <h2 className="text-2xl font-bold text-white mb-4">Quick Links</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Link
              href="/docs/QUICK_START"
              className="flex items-center gap-3 p-4 bg-slate-900/50 rounded-lg hover:bg-slate-900 transition-colors"
            >
              <Rocket className="w-5 h-5 text-cyan-400" />
              <div>
                <div className="font-semibold text-white">New to BEAST MODE?</div>
                <div className="text-sm text-slate-400">Start with our 5-minute quick start guide</div>
              </div>
            </Link>
            <Link
              href="/docs/FAQS"
              className="flex items-center gap-3 p-4 bg-slate-900/50 rounded-lg hover:bg-slate-900 transition-colors"
            >
              <HelpCircle className="w-5 h-5 text-cyan-400" />
              <div>
                <div className="font-semibold text-white">Have Questions?</div>
                <div className="text-sm text-slate-400">Check our FAQs for quick answers</div>
              </div>
            </Link>
            <Link
              href="/docs/TROUBLESHOOTING"
              className="flex items-center gap-3 p-4 bg-slate-900/50 rounded-lg hover:bg-slate-900 transition-colors"
            >
              <Wrench className="w-5 h-5 text-cyan-400" />
              <div>
                <div className="font-semibold text-white">Running into Issues?</div>
                <div className="text-sm text-slate-400">Visit our troubleshooting guide</div>
              </div>
            </Link>
            <Link
              href="/dashboard"
              className="flex items-center gap-3 p-4 bg-slate-900/50 rounded-lg hover:bg-slate-900 transition-colors"
            >
              <Zap className="w-5 h-5 text-cyan-400" />
              <div>
                <div className="font-semibold text-white">Ready to Start?</div>
                <div className="text-sm text-slate-400">Go to the dashboard and try it out</div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

