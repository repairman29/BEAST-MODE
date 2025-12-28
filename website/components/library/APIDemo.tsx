"use client";

import React, { useState } from 'react';

const demoCategories = [
  {
    title: "Quality Analysis",
    description: "Analyze code quality and get improvement suggestions",
    demos: [
      {
        title: "Basic Quality Check",
        code: `const quality = await beastMode.analyzeQuality('./src');
console.log(\`Score: \${quality.score}/100\`);
console.log(\`Issues: \${quality.issues.length}\`);`,
        output: `Score: 87/100
Issues: 12`
      },
      {
        title: "Detailed Report",
        code: `const report = await beastMode.getQualityReport('./src');
console.log('Quality Report:', report);`,
        output: `{
  score: 87,
  issues: [...],
  improvements: [...],
  metrics: { complexity: 2.3, coverage: 85 }
}`
      }
    ]
  },
  {
    title: "AI Code Assistant",
    description: "Get intelligent code suggestions and improvements",
    demos: [
      {
        title: "Code Optimization",
        code: `const ai = beastMode.getComponent('conversationalAI');
const response = await ai.processQuery(
  "Optimize this React component for performance"
);`,
        output: `AI Response: "Here's how to optimize your React component:
1. Use React.memo() for expensive renders
2. Implement useMemo for computed values
3. Use useCallback for event handlers
4. Consider virtualization for large lists"`
      },
      {
        title: "Bug Detection",
        code: `const codeRoach = beastMode.getComponent('codeRoach');
const analysis = await codeRoach.analyzeFile('buggy-code.js');
console.log('Detected issues:', analysis.issues);`,
        output: `Detected issues: [
  "Memory leak in useEffect cleanup",
  "Potential null reference error",
  "Missing error boundaries"
]`
      }
    ]
  },
  {
    title: "Deployment Automation",
    description: "Deploy applications across multiple platforms",
    demos: [
      {
        title: "Vercel Deployment",
        code: `const deployment = await beastMode.deployApplication({
  name: 'my-app',
  platform: 'vercel',
  strategy: 'instant',
  environment: 'production',
  source: './dist'
});`,
        output: `Deployment started: deploy_1703123456789_abc123def
Status: Deploying...
Platform: Vercel
Strategy: Instant
ETA: 3 minutes`
      },
      {
        title: "Multi-Platform Deploy",
        code: `const deployments = await Promise.all([
  beastMode.deployApplication({ platform: 'vercel', ...config }),
  beastMode.deployApplication({ platform: 'railway', ...config }),
  beastMode.deployApplication({ platform: 'aws', ...config })
]);`,
        output: `All deployments initiated:
✅ Vercel: deploy_1703123456789_vercel
✅ Railway: deploy_1703123456789_railway
⏳ AWS: deploy_1703123456789_aws`
      }
    ]
  }
];

function APIDemo() {
  const [activeCategory, setActiveCategory] = useState(0);
  const [activeDemo, setActiveDemo] = useState(0);

  const currentCategory = demoCategories[activeCategory];
  const currentDemo = currentCategory.demos[activeDemo];

  return (
    <section id="demo" className="py-32 px-6 neural-bg">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-20">
          <h2 className="neural-display text-5xl md:text-7xl text-neural-primary mb-8">
            Interactive Demo
          </h2>
          <p className="neural-body text-xl md:text-2xl text-neural-gray-300 max-w-4xl mx-auto leading-relaxed">
            Experience the power of BEAST MODE's AI systems.
            See real API calls and responses in action.
          </p>
        </div>

        {/* Demo Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Category Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-4">
              {demoCategories.map((category, index) => (
                <div
                  key={category.title}
                  onClick={() => {
                    setActiveCategory(index);
                    setActiveDemo(0);
                  }}
                  className={`glass-card p-6 cursor-pointer transition-all duration-300 ${
                    activeCategory === index
                      ? 'border-neural-primary bg-neural-primary/5'
                      : 'hover:bg-neural-gray-800/30'
                  }`}
                >
                  <h3 className={`neural-heading text-lg mb-2 ${
                    activeCategory === index ? 'text-neural-primary' : 'text-neural-gray-300'
                  }`}>
                    {category.title}
                  </h3>
                  <p className="neural-body text-sm text-neural-gray-400">
                    {category.description}
                  </p>
                  <div className={`mt-3 h-0.5 bg-gradient-to-r from-neural-primary to-neural-secondary rounded-full transition-all duration-300 ${
                    activeCategory === index ? 'w-full opacity-100' : 'w-0 opacity-0'
                  }`}></div>
                </div>
              ))}
            </div>
          </div>

          {/* Demo Content */}
          <div className="lg:col-span-2">
            <div className="glass-card p-8 mb-8">
              <div className="flex gap-4 mb-6 overflow-x-auto">
                {currentCategory.demos.map((demo, index) => (
                  <button
                    key={demo.title}
                    onClick={() => setActiveDemo(index)}
                    className={`px-4 py-2 rounded-lg neural-mono text-sm whitespace-nowrap transition-all ${
                      activeDemo === index
                        ? 'bg-neural-primary text-neural-black'
                        : 'bg-neural-gray-800/50 text-neural-gray-400 hover:bg-neural-gray-700/50'
                    }`}
                  >
                    {demo.title}
                  </button>
                ))}
              </div>

              <h3 className="neural-heading text-2xl text-neural-primary mb-6">
                {currentDemo.title}
              </h3>

              {/* Code Input */}
              <div className="mb-6">
                <div className="neural-mono text-sm text-neural-gray-400 mb-2">Input:</div>
                <div className="bg-neural-gray-900/50 p-4 rounded-lg border border-neural-gray-700/50">
                  <pre className="neural-mono text-sm text-neural-gray-300 overflow-x-auto">
                    <code>{currentDemo.code}</code>
                  </pre>
                </div>
              </div>

              {/* Output */}
              <div>
                <div className="neural-mono text-sm text-neural-gray-400 mb-2">Output:</div>
                <div className="bg-neural-gray-900/50 p-4 rounded-lg border border-neural-gray-700/50">
                  <pre className="neural-mono text-sm text-neural-success overflow-x-auto">
                    <code>{currentDemo.output}</code>
                  </pre>
                </div>
              </div>
            </div>

            {/* Run Demo Button */}
            <div className="text-center">
              <div className="future-button px-8 py-4 text-lg font-semibold text-neural-primary inline-block">
                ▶️ Run This Demo
              </div>
              <p className="neural-body text-sm text-neural-gray-400 mt-3">
                Click to execute this API call with BEAST MODE
              </p>
            </div>
          </div>
        </div>

        {/* API Documentation Link */}
        <div className="text-center mt-16">
          <div className="glass-card max-w-2xl mx-auto p-8">
            <h3 className="neural-heading text-2xl text-neural-secondary mb-4">
              📚 Complete API Documentation
            </h3>
            <p className="neural-body text-neural-gray-300 mb-6">
              Explore all 9 AI systems, configuration options, and integration guides.
            </p>
            <div className="flex gap-4 justify-center">
              <div className="future-button px-6 py-3 text-sm font-semibold text-neural-secondary">
                📖 Read Docs
              </div>
              <div className="future-button px-6 py-3 text-sm font-semibold text-neural-primary">
                🔗 GitHub Repository
              </div>
            </div>
          </div>
        </div>

        {/* Performance Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 max-w-4xl mx-auto">
          <div className="glass-card text-center p-6">
            <div className="neural-display text-2xl text-neural-success mb-2">&lt;100ms</div>
            <div className="neural-body text-sm text-neural-gray-400">API Response Time</div>
          </div>

          <div className="glass-card text-center p-6">
            <div className="neural-display text-2xl text-neural-primary mb-2">99.9%</div>
            <div className="neural-body text-sm text-neural-gray-400">Uptime SLA</div>
          </div>

          <div className="glass-card text-center p-6">
            <div className="neural-display text-2xl text-neural-secondary mb-2">24/7</div>
            <div className="neural-body text-sm text-neural-gray-400">AI Monitoring</div>
          </div>

          <div className="glass-card text-center p-6">
            <div className="neural-display text-2xl text-neural-warning mb-2">∞</div>
            <div className="neural-body text-sm text-neural-gray-400">Scalability</div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default APIDemo;
