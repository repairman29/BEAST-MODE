"use client";

import React, { useState } from 'react';

const installationSteps = [
  {
    title: "Install BEAST MODE",
    description: "Add BEAST MODE to your project",
    commands: [
      { label: "npm", command: "npm install @beast-mode/core" },
      { label: "yarn", command: "yarn add @beast-mode/core" },
      { label: "pnpm", command: "pnpm add @beast-mode/core" }
    ]
  },
  {
    title: "Initialize BEAST MODE",
    description: "Create and configure your BEAST MODE instance",
    code: `import { BeastMode } from '@beast-mode/core';

const beastMode = new BeastMode({
  oracle: { enabled: true },
  codeRoach: { enabled: true },
  daisyChain: { enabled: true },
  conversationalAI: { enabled: true },
  healthMonitor: { enabled: true },
  missionGuidance: { enabled: true },
  marketplace: { enabled: true },
  deploymentOrchestrator: { enabled: true }
});

await beastMode.initialize();`
  },
  {
    title: "Start Using AI Features",
    description: "Access any of the 9 integrated AI systems",
    code: `// Get quality analysis
const quality = await beastMode.analyzeQuality('./src');

// Deploy your application
await beastMode.deployApplication({
  name: 'my-app',
  platform: 'vercel',
  source: './dist'
});

// Chat with AI assistant
const ai = beastMode.getComponent('conversationalAI');
const response = await ai.processQuery("optimize this function");`
  }
];

const quickExamples = [
  {
    title: "Code Quality Analysis",
    code: `import { BeastMode } from '@beast-mode/core';

const beastMode = new BeastMode();
await beastMode.initialize();

const quality = await beastMode.analyzeQuality('./src');
console.log(\`Quality Score: \${quality.score}/100\`);
// Output: Quality Score: 87/100`
  },
  {
    title: "Automated Deployment",
    code: `const deployment = await beastMode.deployApplication({
  name: 'my-app',
  platform: 'vercel',
  strategy: 'blue-green',
  environment: 'production'
});

console.log(\`Deployment started: \${deployment.deploymentId}\`);
// Monitors deployment progress automatically`
  },
  {
    title: "AI Code Assistant",
    code: `const ai = beastMode.getComponent('conversationalAI');

const response = await ai.processQuery(
  "How can I optimize this React component?"
);

console.log(response.answer);
// Gets intelligent suggestions and code improvements`
  }
];

function InstallationGuide() {
  const [activeTab, setActiveTab] = useState<'npm' | 'yarn' | 'pnpm'>('npm');

  return (
    <section id="installation" className="py-32 px-6 neural-bg">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-20">
          <h2 className="neural-display text-5xl md:text-7xl text-neural-primary mb-8">
            Get Started
          </h2>
          <p className="neural-body text-xl md:text-2xl text-neural-gray-300 max-w-4xl mx-auto leading-relaxed">
            Install BEAST MODE and unlock the power of 9 integrated AI systems in minutes.
          </p>
        </div>

        {/* Installation Steps */}
        <div className="space-y-12 mb-20">
          {installationSteps.map((step, index) => (
            <div key={step.title} className="glass-card p-8">
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-neural-primary to-neural-secondary rounded-xl flex items-center justify-center ai-glow">
                    <span className="neural-display text-xl text-white">{index + 1}</span>
                  </div>
                </div>

                <div className="flex-1">
                  <h3 className="neural-heading text-2xl text-neural-primary mb-2">
                    {step.title}
                  </h3>
                  <p className="neural-body text-neural-gray-400 mb-6">
                    {step.description}
                  </p>

                  {step.commands ? (
                    <div className="space-y-4">
                      {/* Package Manager Tabs */}
                      <div className="flex gap-2 mb-4">
                        {step.commands.map((cmd) => (
                          <button
                            key={cmd.label}
                            onClick={() => setActiveTab(cmd.label as any)}
                            className={`px-4 py-2 rounded-lg neural-mono text-sm transition-all ${
                              activeTab === cmd.label
                                ? 'bg-neural-primary text-neural-black'
                                : 'bg-neural-gray-800/50 text-neural-gray-400 hover:bg-neural-gray-700/50'
                            }`}
                          >
                            {cmd.label}
                          </button>
                        ))}
                      </div>

                      {/* Installation Command */}
                      <div className="bg-neural-gray-900/50 p-4 rounded-lg border border-neural-gray-700/50">
                        <code className="neural-mono text-neural-primary text-sm">
                          {step.commands.find(cmd => cmd.label === activeTab)?.command}
                        </code>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-neural-gray-900/50 p-4 rounded-lg border border-neural-gray-700/50">
                      <pre className="neural-mono text-xs text-neural-gray-300 overflow-x-auto">
                        <code>{step.code}</code>
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Examples */}
        <div className="mb-20">
          <h3 className="neural-heading text-3xl text-center text-neural-primary mb-12">
            Quick Examples
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {quickExamples.map((example, index) => (
              <div key={example.title} className="glass-card overflow-hidden">
                <div className="p-6 pb-4">
                  <h4 className="neural-heading text-lg text-neural-gray-100 mb-4">
                    {example.title}
                  </h4>
                </div>

                <div className="px-6 pb-6">
                  <div className="bg-neural-gray-900/50 p-4 rounded-lg border border-neural-gray-700/50">
                    <pre className="neural-mono text-xs text-neural-gray-300 overflow-x-auto max-h-32">
                      <code>{example.code}</code>
                    </pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Requirements & Compatibility */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="glass-card p-8">
            <h3 className="neural-heading text-2xl text-neural-primary mb-6">
              System Requirements
            </h3>
            <ul className="space-y-3 neural-body text-neural-gray-300">
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 bg-neural-success rounded-full"></div>
                <span>Node.js 18.0 or higher</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 bg-neural-success rounded-full"></div>
                <span>npm, yarn, or pnpm</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 bg-neural-success rounded-full"></div>
                <span>TypeScript 4.5+ (optional)</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 bg-neural-success rounded-full"></div>
                <span>2GB RAM minimum</span>
              </li>
            </ul>
          </div>

          <div className="glass-card p-8">
            <h3 className="neural-heading text-2xl text-neural-secondary mb-6">
              Platform Support
            </h3>
            <ul className="space-y-3 neural-body text-neural-gray-300">
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 bg-neural-primary rounded-full"></div>
                <span>Linux, macOS, Windows</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 bg-neural-primary rounded-full"></div>
                <span>Docker containers</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 bg-neural-primary rounded-full"></div>
                <span>AWS, Vercel, Railway</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 bg-neural-primary rounded-full"></div>
                <span>Kubernetes clusters</span>
              </li>
            </ul>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <div className="future-button px-12 py-6 text-xl font-semibold text-neural-primary mb-6">
            🚀 Start Building with AI
          </div>
          <p className="neural-body text-neural-gray-400">
            Join thousands of developers using BEAST MODE to build intelligent software
          </p>
        </div>
      </div>
    </section>
  );
}

export default InstallationGuide;
