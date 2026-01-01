import Link from 'next/link';
import { ArrowLeft, Users, Shield, Palette, GitBranch } from 'lucide-react';

export const metadata = {
  title: 'BEAST MODE - Enterprise Features Documentation',
  description: 'Learn about BEAST MODE enterprise features including SSO, Teams, and White Label',
};

export default function EnterpriseDocsPage() {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/docs"
          className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Documentation
        </Link>

        <h1 className="text-3xl font-bold text-white mb-4">Enterprise Features</h1>

        <p className="text-slate-300 mb-8">
          BEAST MODE Enterprise features provide advanced capabilities for teams and organizations.
        </p>

        <div className="space-y-8">
          {/* SSO */}
          <section className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
            <div className="flex items-start gap-4 mb-4">
              <Shield className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-cyan-400 mb-2">Single Sign-On (SSO)</h2>
                <p className="text-slate-300 mb-4">
                  Enable secure single sign-on for your organization with support for SAML, OAuth, LDAP, Okta, and Azure AD.
                </p>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-slate-300 mt-4 mb-2">Supported Providers</h3>
                  <ul className="list-disc list-inside text-slate-300 space-y-1">
                    <li>SAML 2.0</li>
                    <li>OAuth 2.0</li>
                    <li>LDAP / Active Directory</li>
                    <li>Okta</li>
                    <li>Azure AD</li>
                  </ul>
                </div>
                <div className="mt-4 p-4 bg-slate-800/50 rounded-lg">
                  <p className="text-sm text-slate-400">
                    <strong className="text-slate-300">Status:</strong> Coming soon. Enterprise SSO configuration will be available in a future update.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Teams */}
          <section className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
            <div className="flex items-start gap-4 mb-4">
              <Users className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-cyan-400 mb-2">Team Management</h2>
                <p className="text-slate-300 mb-4">
                  Manage teams, users, and repositories with role-based access control (RBAC).
                </p>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-slate-300 mt-4 mb-2">Features</h3>
                  <ul className="list-disc list-inside text-slate-300 space-y-1">
                    <li>Create and manage teams</li>
                    <li>Add/remove team members</li>
                    <li>Assign roles and permissions</li>
                    <li>Manage team repositories</li>
                    <li>Track team activity and analytics</li>
                  </ul>
                </div>
                <div className="mt-4">
                  <h3 className="text-xl font-semibold text-slate-300 mb-2">Access</h3>
                  <p className="text-slate-300">
                    Go to <strong>Dashboard → Settings → Teams</strong> to manage your teams.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* White Label */}
          <section className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
            <div className="flex items-start gap-4 mb-4">
              <Palette className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-cyan-400 mb-2">White Label</h2>
                <p className="text-slate-300 mb-4">
                  Customize BEAST MODE with your organization's branding, colors, and logo.
                </p>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-slate-300 mt-4 mb-2">Customization Options</h3>
                  <ul className="list-disc list-inside text-slate-300 space-y-1">
                    <li>Custom logo and branding</li>
                    <li>Color scheme customization</li>
                    <li>Custom domain support</li>
                    <li>Branded email templates</li>
                    <li>Custom documentation</li>
                  </ul>
                </div>
                <div className="mt-4 p-4 bg-slate-800/50 rounded-lg">
                  <p className="text-sm text-slate-400">
                    <strong className="text-slate-300">Status:</strong> White label customization is available for enterprise customers. Contact us for more information.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Custom Integrations */}
          <section className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
            <div className="flex items-start gap-4 mb-4">
              <GitBranch className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-cyan-400 mb-2">Custom Integrations</h2>
                <p className="text-slate-300 mb-4">
                  Build custom integrations and webhooks to connect BEAST MODE with your existing tools and workflows.
                </p>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-slate-300 mt-4 mb-2">Features</h3>
                  <ul className="list-disc list-inside text-slate-300 space-y-1">
                    <li>Webhook system for real-time events</li>
                    <li>Custom integration APIs</li>
                    <li>Event-driven architecture</li>
                    <li>Integration marketplace</li>
                    <li>Webhook security and validation</li>
                  </ul>
                </div>
                <div className="mt-4">
                  <h3 className="text-xl font-semibold text-slate-300 mb-2">Available Events</h3>
                  <ul className="list-disc list-inside text-slate-300 space-y-1">
                    <li><code className="bg-slate-900 px-2 py-1 rounded text-cyan-400">scan.completed</code> - When a repository scan finishes</li>
                    <li><code className="bg-slate-900 px-2 py-1 rounded text-cyan-400">quality.score.updated</code> - When quality score changes</li>
                    <li><code className="bg-slate-900 px-2 py-1 rounded text-cyan-400">plugin.installed</code> - When a plugin is installed</li>
                    <li><code className="bg-slate-900 px-2 py-1 rounded text-cyan-400">mission.completed</code> - When a mission is completed</li>
                  </ul>
                </div>
                <div className="mt-4 p-4 bg-slate-800/50 rounded-lg">
                  <p className="text-sm text-slate-400">
                    <strong className="text-slate-300">Status:</strong> Custom integrations and webhooks are available for enterprise customers. Contact us for more information.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Repository Management */}
          <section className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
            <div className="flex items-start gap-4 mb-4">
              <GitBranch className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-cyan-400 mb-2">Repository Management</h2>
                <p className="text-slate-300 mb-4">
                  Manage repositories at scale with enterprise-grade features.
                </p>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-slate-300 mt-4 mb-2">Features</h3>
                  <ul className="list-disc list-inside text-slate-300 space-y-1">
                    <li>Bulk repository management</li>
                    <li>Repository access control</li>
                    <li>Automated scanning schedules</li>
                    <li>Repository health monitoring</li>
                    <li>Team repository sharing</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Getting Started */}
          <section className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">Getting Started with Enterprise Features</h2>
            <ol className="list-decimal list-inside text-slate-300 space-y-2">
              <li>Go to <strong>Dashboard → Settings</strong></li>
              <li>Navigate to the <strong>Enterprise</strong> tab</li>
              <li>Configure your enterprise features</li>
              <li>Invite team members</li>
              <li>Set up repositories and permissions</li>
            </ol>
          </section>

          {/* Support */}
          <section className="mt-8 p-6 bg-slate-900/50 border border-slate-800 rounded-lg">
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">Enterprise Support</h2>
            <p className="text-slate-300 mb-4">
              Need help setting up enterprise features? We're here to help.
            </p>
            <div className="space-y-2 text-slate-300">
              <p>• Check our <Link href="/docs/FAQS" className="text-cyan-400 hover:underline">FAQs</Link></p>
              <p>• Visit our <Link href="/docs/TROUBLESHOOTING" className="text-cyan-400 hover:underline">Troubleshooting Guide</Link></p>
              <p>• Contact enterprise support for dedicated assistance</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

