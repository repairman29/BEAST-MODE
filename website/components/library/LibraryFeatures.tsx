"use client";

import React from 'react';

const libraryFeatures = [
  {
    category: "Core Intelligence",
    features: [
      {
        title: "Oracle AI Integration",
        description: "Advanced architectural insights with 95% accuracy",
        code: `const oracle = beastMode.getComponent('oracle');\nconst insights = await oracle.analyzeArchitecture(codebase);`,
        icon: "🧠"
      },
      {
        title: "Code Roach Engine",
        description: "Automated bug detection and quantum fixing",
        code: `const codeRoach = beastMode.getComponent('codeRoach');\nconst fixes = await codeRoach.analyzeAndFix(file);`,
        icon: "🔬"
      },
      {
        title: "Daisy Chain Orchestrator",
        description: "Intelligent workflow coordination and task management",
        code: `const daisy = beastMode.getComponent('daisyChain');\nawait daisy.executeWorkflow(tasks);`,
        icon: "⚡"
      }
    ]
  },
  {
    category: "Advanced Features",
    features: [
      {
        title: "Conversational AI",
        description: "Natural language interface for development assistance",
        code: `const ai = beastMode.getComponent('conversationalAI');\nconst response = await ai.processQuery("optimize this code");`,
        icon: "💭"
      },
      {
        title: "Health Monitor",
        description: "Real-time system monitoring with self-healing",
        code: `const health = beastMode.getComponent('healthMonitor');\nconst status = await health.getSystemHealth();`,
        icon: "🔄"
      },
      {
        title: "Mission Guidance",
        description: "AI-powered project planning and success prediction",
        code: `const mission = beastMode.getComponent('missionGuidance');\nconst plan = await mission.createMission(context);`,
        icon: "🎯"
      }
    ]
  },
  {
    category: "Enterprise Tools",
    features: [
      {
        title: "Quality Intelligence",
        description: "Comprehensive code quality analysis and scoring",
        code: `const quality = await beastMode.analyzeQuality(codebase);\nconsole.log(\`Score: \${quality.score}/100\`);`,
        icon: "📊"
      },
      {
        title: "Marketplace Integration",
        description: "AI-powered plugin discovery and monetization",
        code: `const marketplace = beastMode.getComponent('marketplace');\nconst plugins = await marketplace.getRecommendations();`,
        icon: "🛒"
      },
      {
        title: "Deployment Orchestrator",
        description: "Multi-platform deployment automation",
        code: `await beastMode.deployApplication({\n  platform: 'vercel',\n  environment: 'production'\n});`,
        icon: "🚀"
      }
    ]
  }
];

function LibraryFeatures() {
  return (
    <section className="py-32 px-6 neural-bg">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-20">
          <h2 className="neural-display text-5xl md:text-7xl text-neural-primary mb-8">
            Library Features
          </h2>
          <p className="neural-body text-xl md:text-2xl text-neural-gray-300 max-w-4xl mx-auto leading-relaxed">
            Comprehensive AI-powered development toolkit with 9 integrated neural networks.
            Everything you need to build intelligent software systems.
          </p>
        </div>

        {/* Features by Category */}
        <div className="space-y-20">
          {libraryFeatures.map((category, categoryIndex) => (
            <div key={category.category} className="space-y-8">
              {/* Category Header */}
              <div className="text-center">
                <h3 className="neural-heading text-3xl md:text-4xl text-neural-primary mb-4">
                  {category.category}
                </h3>
                <div className="w-24 h-1 bg-gradient-to-r from-neural-primary to-neural-secondary mx-auto rounded-full"></div>
              </div>

              {/* Category Features */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {category.features.map((feature, featureIndex) => (
                  <div
                    key={feature.title}
                    className="glass-card group hover:scale-105 transition-all duration-500 cursor-pointer overflow-hidden"
                    style={{ animationDelay: `${(categoryIndex * 3 + featureIndex) * 0.1}s` }}
                  >
                    {/* Feature Header */}
                    <div className="p-6 pb-4">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-neural-primary to-neural-secondary rounded-xl flex items-center justify-center ai-glow">
                          <span className="text-2xl">{feature.icon}</span>
                        </div>
                        <div>
                          <h4 className="neural-heading text-lg text-neural-gray-100 group-hover:text-neural-primary transition-colors">
                            {feature.title}
                          </h4>
                        </div>
                      </div>

                      <p className="neural-body text-neural-gray-400 text-sm leading-relaxed">
                        {feature.description}
                      </p>
                    </div>

                    {/* Code Example */}
                    <div className="px-6 pb-6">
                      <div className="bg-neural-gray-900/50 p-4 rounded-lg border border-neural-gray-700/50">
                        <pre className="neural-mono text-xs text-neural-gray-300 overflow-x-auto">
                          <code>{feature.code}</code>
                        </pre>
                      </div>
                    </div>

                    {/* Neural Effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-neural-primary/5 to-neural-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-neural"></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Usage Stats */}
        <div className="mt-20 text-center">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="glass-card p-6">
              <div className="neural-display text-3xl text-neural-success mb-2">Zero</div>
              <div className="neural-body text-sm text-neural-gray-400">Dependencies</div>
            </div>

            <div className="glass-card p-6">
              <div className="neural-display text-3xl text-neural-primary mb-2">TypeScript</div>
              <div className="neural-body text-sm text-neural-gray-400">First-Class</div>
            </div>

            <div className="glass-card p-6">
              <div className="neural-display text-3xl text-neural-secondary mb-2">ESM</div>
              <div className="neural-body text-sm text-neural-gray-400">& CommonJS</div>
            </div>

            <div className="glass-card p-6">
              <div className="neural-display text-3xl text-neural-warning mb-2">Active</div>
              <div className="neural-body text-sm text-neural-gray-400">Development</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default LibraryFeatures;
