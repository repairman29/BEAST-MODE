import Link from 'next/link';
import { ArrowLeft, Terminal, Download, Key, Search } from 'lucide-react';

export const metadata = {
  title: 'BEAST MODE - CLI Documentation',
  description: 'Complete CLI guide for BEAST MODE command-line interface',
};

export default function CLIDocsPage() {
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

        <h1 className="text-3xl font-bold text-white mb-4">CLI Documentation</h1>

        <p className="text-slate-300 mb-8">
          BEAST MODE provides a powerful command-line interface for all operations.
        </p>

        <div className="space-y-8">
          {/* Installation */}
          <section className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
            <div className="flex items-start gap-4 mb-4">
              <Download className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-cyan-400 mb-2">Installation</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-300 mb-2">npm</h3>
                    <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto">
                      <code className="text-cyan-400">npm install -g beast-mode</code>
                    </pre>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-300 mb-2">yarn</h3>
                    <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto">
                      <code className="text-cyan-400">yarn global add beast-mode</code>
                    </pre>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-300 mb-2">Verify Installation</h3>
                    <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto">
                      <code className="text-cyan-400">beast-mode --version</code>
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Authentication */}
          <section className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
            <div className="flex items-start gap-4 mb-4">
              <Key className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-cyan-400 mb-2">Authentication</h2>
                <p className="text-slate-300 mb-4">
                  Login with your GitHub account to access all features.
                </p>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-300 mb-2">Login</h3>
                    <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto">
                      <code className="text-cyan-400">beast-mode login</code>
                    </pre>
                    <p className="text-slate-400 text-sm mt-2">
                      This will open your browser to authenticate with GitHub.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-300 mb-2">Check Status</h3>
                    <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto">
                      <code className="text-cyan-400">beast-mode status</code>
                    </pre>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-300 mb-2">Logout</h3>
                    <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto">
                      <code className="text-cyan-400">beast-mode logout</code>
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Scanning */}
          <section className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
            <div className="flex items-start gap-4 mb-4">
              <Search className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-cyan-400 mb-2">Scanning Repositories</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-300 mb-2">Quick Scan</h3>
                    <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto">
                      <code className="text-cyan-400">beast-mode scan owner/repo</code>
                    </pre>
                    <p className="text-slate-400 text-sm mt-2">
                      Performs a quick scan (10 seconds) of the repository.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-300 mb-2">Advanced Scan</h3>
                    <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto">
                      <code className="text-cyan-400">beast-mode scan owner/repo --advanced</code>
                    </pre>
                    <p className="text-slate-400 text-sm mt-2">
                      Performs a comprehensive analysis (30-60 seconds).
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-300 mb-2">Scan Options</h3>
                    <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto">
                      <code className="text-cyan-400">
{`beast-mode scan owner/repo [options]

Options:
  --advanced, -a    Perform advanced scan
  --format <type>   Output format (json, table, summary)
  --output <file>   Save results to file
  --quiet, -q       Quiet mode`}
                      </code>
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Plugins */}
          <section className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">Plugin Management</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-300 mb-2">List Plugins</h3>
                <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto">
                  <code className="text-cyan-400">beast-mode plugins list</code>
                </pre>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-300 mb-2">Install Plugin</h3>
                <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto">
                  <code className="text-cyan-400">beast-mode plugins install &lt;plugin-name&gt;</code>
                </pre>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-300 mb-2">Run Plugin</h3>
                <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto">
                  <code className="text-cyan-400">beast-mode plugins run &lt;plugin-name&gt;</code>
                </pre>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-300 mb-2">Uninstall Plugin</h3>
                <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto">
                  <code className="text-cyan-400">beast-mode plugins uninstall &lt;plugin-name&gt;</code>
                </pre>
              </div>
            </div>
          </section>

          {/* Common Commands */}
          <section className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">Common Commands</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-4">
                <Terminal className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-1" />
                <div>
                  <code className="text-cyan-400">beast-mode help</code>
                  <p className="text-slate-400 text-sm">Show help and available commands</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Terminal className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-1" />
                <div>
                  <code className="text-cyan-400">beast-mode version</code>
                  <p className="text-slate-400 text-sm">Show version information</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Terminal className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-1" />
                <div>
                  <code className="text-cyan-400">beast-mode config</code>
                  <p className="text-slate-400 text-sm">Manage configuration</p>
                </div>
              </div>
            </div>
          </section>

          {/* Configuration */}
          <section className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">Configuration</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-300 mb-2">Config File Location</h3>
                <p className="text-slate-300 mb-2">BEAST MODE stores configuration in:</p>
                <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto">
                  <code className="text-cyan-400">
{`~/.beast-mode/config.json

Example config:
{
  "github": {
    "username": "your-username",
    "token": "encrypted-token"
  },
  "defaults": {
    "scanType": "quick",
    "format": "table"
  }
}`}
                  </code>
                </pre>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-300 mb-2">Environment Variables</h3>
                <div className="space-y-2 text-slate-300">
                  <p><code className="bg-slate-900 px-2 py-1 rounded text-cyan-400">BEAST_MODE_API_URL</code> - API endpoint URL</p>
                  <p><code className="bg-slate-900 px-2 py-1 rounded text-cyan-400">BEAST_MODE_TOKEN</code> - Authentication token</p>
                  <p><code className="bg-slate-900 px-2 py-1 rounded text-cyan-400">BEAST_MODE_DEBUG</code> - Enable debug mode</p>
                </div>
              </div>
            </div>
          </section>

          {/* Options */}
          <section className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">Global Options</h2>
            <div className="space-y-2 text-slate-300">
              <p><code className="bg-slate-900 px-2 py-1 rounded text-cyan-400">--debug</code> - Enable debug mode</p>
              <p><code className="bg-slate-900 px-2 py-1 rounded text-cyan-400">--quiet, -q</code> - Quiet mode (minimal output)</p>
              <p><code className="bg-slate-900 px-2 py-1 rounded text-cyan-400">--no-color</code> - Disable colored output</p>
              <p><code className="bg-slate-900 px-2 py-1 rounded text-cyan-400">--version, -v</code> - Show version</p>
              <p><code className="bg-slate-900 px-2 py-1 rounded text-cyan-400">--help, -h</code> - Show help</p>
            </div>
          </section>

          {/* Session Tracking */}
          <section className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">Session Tracking</h2>
            <p className="text-slate-300 mb-4">
              BEAST MODE automatically tracks your CLI sessions and integrates them with the unified analytics system.
            </p>
            <p className="text-slate-400 text-sm">
              All commands are tracked and appear in your analytics dashboard. No additional configuration needed.
            </p>
          </section>

          {/* Examples */}
          <section className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">Examples</h2>
            <div className="space-y-4">
              <div>
                <p className="text-slate-300 mb-2">Scan a repository:</p>
                <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto">
                  <code className="text-cyan-400">beast-mode scan facebook/react</code>
                </pre>
                <p className="text-slate-400 text-sm mt-2">Output: Quality score, issues found, recommendations</p>
              </div>
              <div>
                <p className="text-slate-300 mb-2">Advanced scan with JSON output:</p>
                <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto">
                  <code className="text-cyan-400">beast-mode scan owner/repo --advanced --format json --output results.json</code>
                </pre>
                <p className="text-slate-400 text-sm mt-2">Saves comprehensive analysis to results.json</p>
              </div>
              <div>
                <p className="text-slate-300 mb-2">Install and run a plugin:</p>
                <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto">
                  <code className="text-cyan-400">
{`beast-mode plugins install eslint-pro
beast-mode plugins run eslint-pro --target ./src`}
                  </code>
                </pre>
                <p className="text-slate-400 text-sm mt-2">Installs plugin and runs it on ./src directory</p>
              </div>
              <div>
                <p className="text-slate-300 mb-2">Check login status:</p>
                <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto">
                  <code className="text-cyan-400">beast-mode status</code>
                </pre>
                <p className="text-slate-400 text-sm mt-2">Shows: Logged in as @username, API connected</p>
              </div>
              <div>
                <p className="text-slate-300 mb-2">Quick scan with quiet mode:</p>
                <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto">
                  <code className="text-cyan-400">beast-mode scan owner/repo --quiet</code>
                </pre>
                <p className="text-slate-400 text-sm mt-2">Minimal output, just the score</p>
              </div>
            </div>
          </section>

          {/* Exit Codes */}
          <section className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">Exit Codes</h2>
            <div className="space-y-2 text-slate-300">
              <p><code className="bg-slate-900 px-2 py-1 rounded text-cyan-400">0</code> - Success</p>
              <p><code className="bg-slate-900 px-2 py-1 rounded text-cyan-400">1</code> - General error</p>
              <p><code className="bg-slate-900 px-2 py-1 rounded text-cyan-400">2</code> - Authentication error</p>
              <p><code className="bg-slate-900 px-2 py-1 rounded text-cyan-400">3</code> - Network error</p>
              <p><code className="bg-slate-900 px-2 py-1 rounded text-cyan-400">4</code> - Invalid input</p>
            </div>
          </section>

          {/* More Info */}
          <section className="mt-8 p-6 bg-slate-900/50 border border-slate-800 rounded-lg">
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">Need More Help?</h2>
            <div className="space-y-2 text-slate-300">
              <p>• Run <code className="bg-slate-900 px-2 py-1 rounded text-cyan-400">beast-mode help</code> for command-specific help</p>
              <p>• Check our <Link href="/docs/FAQS" className="text-cyan-400 hover:underline">FAQs</Link></p>
              <p>• Visit our <Link href="/docs/TROUBLESHOOTING" className="text-cyan-400 hover:underline">Troubleshooting Guide</Link></p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

