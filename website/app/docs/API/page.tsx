import Link from 'next/link';
import { ArrowLeft, Code, Key, Globe, Database } from 'lucide-react';

export const metadata = {
  title: 'BEAST MODE - API Documentation',
  description: 'Complete API reference for BEAST MODE',
};

export default function APIDocsPage() {
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

        <h1 className="text-3xl font-bold text-white mb-4">API Documentation</h1>

        <p className="text-slate-300 mb-8">
          BEAST MODE provides a comprehensive REST API for programmatic access to all features.
        </p>

        <div className="space-y-8">
          {/* Authentication */}
          <section className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
            <div className="flex items-start gap-4 mb-4">
              <Key className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-cyan-400 mb-2">Authentication</h2>
                <p className="text-slate-300 mb-4">
                  BEAST MODE uses GitHub OAuth for authentication. All API requests require authentication.
                </p>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-slate-300 mt-4 mb-2">OAuth Flow</h3>
                  <ol className="list-decimal list-inside text-slate-300 space-y-1">
                    <li>Redirect user to <code className="bg-slate-900 px-2 py-1 rounded text-cyan-400">/api/github/oauth/authorize</code></li>
                    <li>User authorizes on GitHub</li>
                    <li>GitHub redirects to <code className="bg-slate-900 px-2 py-1 rounded text-cyan-400">/api/github/oauth/callback</code></li>
                    <li>Store token and use for API requests</li>
                  </ol>
                </div>
                <div className="mt-4">
                  <h3 className="text-xl font-semibold text-slate-300 mb-2">Using the Token</h3>
                  <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto my-4">
                    <code className="text-cyan-400">
{`Authorization: Bearer <your-token>
Content-Type: application/json`}
                    </code>
                  </pre>
                </div>
              </div>
            </div>
          </section>

          {/* GitHub API */}
          <section className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
            <div className="flex items-start gap-4 mb-4">
              <Globe className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-cyan-400 mb-2">GitHub Integration</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-300 mb-2">GET /api/github/repos</h3>
                    <p className="text-slate-300 mb-2">Get list of user's GitHub repositories</p>
                    <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto">
                      <code className="text-cyan-400">
{`GET /api/github/repos
Authorization: Bearer <token>

Response:
{
  "repos": [
    {
      "name": "my-repo",
      "full_name": "user/my-repo",
      "private": false,
      "description": "..."
    }
  ]
}`}
                      </code>
                    </pre>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-300 mb-2">POST /api/github/scan</h3>
                    <p className="text-slate-300 mb-2">Scan a GitHub repository for quality issues</p>
                    <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto">
                      <code className="text-cyan-400">
{`POST /api/github/scan
Authorization: Bearer <token>
Content-Type: application/json

{
  "repo": "owner/repo",
  "scanType": "quick" | "advanced"
}

Response:
{
  "score": 85,
  "issues": [...],
  "recommendations": [...]
}`}
                      </code>
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Analytics API */}
          <section className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
            <div className="flex items-start gap-4 mb-4">
              <Database className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-cyan-400 mb-2">Analytics API</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-300 mb-2">GET /api/beast-mode/analytics/unified</h3>
                    <p className="text-slate-300 mb-2">Get unified analytics data</p>
                    <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto">
                      <code className="text-cyan-400">
{`GET /api/beast-mode/analytics/unified
Authorization: Bearer <token>

Response:
{
  "sessions": [...],
  "events": [...],
  "stats": {
    "totalSessions": 42,
    "totalEvents": 156
  }
}`}
                      </code>
                    </pre>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-300 mb-2">POST /api/beast-mode/sessions/track</h3>
                    <p className="text-slate-300 mb-2">Track a session event</p>
                    <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto">
                      <code className="text-cyan-400">
{`POST /api/beast-mode/sessions/track
Authorization: Bearer <token>
Content-Type: application/json

{
  "event": "scan_completed",
  "source": "cli" | "api" | "web" | "ide",
  "metadata": {
    "repo": "owner/repo",
    "score": 85
  }
}`}
                      </code>
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Marketplace API */}
          <section className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">Marketplace API</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-300 mb-2">GET /api/beast-mode/marketplace/plugins</h3>
                <p className="text-slate-300 mb-2">Get list of available plugins</p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-300 mb-2">POST /api/beast-mode/marketplace/install</h3>
                <p className="text-slate-300 mb-2">Install a plugin</p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-300 mb-2">GET /api/beast-mode/marketplace/installed</h3>
                <p className="text-slate-300 mb-2">Get list of installed plugins</p>
              </div>
            </div>
          </section>

          {/* Intelligence API */}
          <section className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">Intelligence API</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-300 mb-2">POST /api/beast-mode/conversation</h3>
                <p className="text-slate-300 mb-2">Ask questions about your codebase</p>
                <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto">
                  <code className="text-cyan-400">
{`POST /api/beast-mode/conversation
Authorization: Bearer <token>
Content-Type: application/json

{
  "message": "What's the quality of my code?",
  "context": "repo:owner/repo"
}

Response:
{
  "response": "...",
  "recommendations": [...]
}`}
                  </code>
                </pre>
              </div>
            </div>
          </section>

          {/* Base URL */}
          <section className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">Base URL</h2>
            <p className="text-slate-300 mb-2">
              All API endpoints are available at:
            </p>
            <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto">
              <code className="text-cyan-400">
                https://beast-mode.dev/api
              </code>
            </pre>
          </section>

          {/* Rate Limits */}
          <section className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">Rate Limits</h2>
            <ul className="list-disc list-inside text-slate-300 space-y-2">
              <li>Free tier: 100 requests/hour</li>
              <li>Pro tier: 1,000 requests/hour</li>
              <li>Enterprise: Custom limits</li>
            </ul>
            <p className="text-slate-400 text-sm mt-4">
              Rate limit headers are included in all responses: <code className="bg-slate-900 px-2 py-1 rounded text-cyan-400">X-RateLimit-Remaining</code>
            </p>
          </section>

          {/* Error Handling */}
          <section className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">Error Handling</h2>
            <p className="text-slate-300 mb-4">All errors follow a consistent format:</p>
            <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto">
              <code className="text-cyan-400">
{`{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {...}
}`}
              </code>
            </pre>
            <div className="mt-4 space-y-2 text-slate-300">
              <p><strong>Common Status Codes:</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li><code className="bg-slate-900 px-2 py-1 rounded text-cyan-400">200</code> - Success</li>
                <li><code className="bg-slate-900 px-2 py-1 rounded text-cyan-400">400</code> - Bad Request</li>
                <li><code className="bg-slate-900 px-2 py-1 rounded text-cyan-400">401</code> - Unauthorized</li>
                <li><code className="bg-slate-900 px-2 py-1 rounded text-cyan-400">404</code> - Not Found</li>
                <li><code className="bg-slate-900 px-2 py-1 rounded text-cyan-400">429</code> - Rate Limited</li>
                <li><code className="bg-slate-900 px-2 py-1 rounded text-cyan-400">500</code> - Server Error</li>
              </ul>
            </div>
          </section>

          {/* More Info */}
          <section className="mt-8 p-6 bg-slate-900/50 border border-slate-800 rounded-lg">
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">Need More Help?</h2>
            <div className="space-y-2 text-slate-300">
              <p>• Check our <Link href="/docs/FAQS" className="text-cyan-400 hover:underline">FAQs</Link></p>
              <p>• Visit our <Link href="/docs/TROUBLESHOOTING" className="text-cyan-400 hover:underline">Troubleshooting Guide</Link></p>
              <p>• Review the <Link href="/docs/USER_GUIDE" className="text-cyan-400 hover:underline">User Guide</Link></p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

