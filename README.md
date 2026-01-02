# BEAST MODE 🎸

**Built for Vibe Coders Who Ship with Style**

*Code Better. Ship Faster. Have Fun.*

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://badge.fury.io/js/%40beast-mode%2Fcore.svg)](https://badge.fury.io/js/%40beast-mode%2Fcore)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![Pricing](https://img.shields.io/badge/Pricing-Freemium-brightgreen.svg)](https://beastmode.dev/pricing)

## ⚡ What is BEAST MODE?

**BEAST MODE is your AI-powered co-pilot for building better code.** 

We're not just another dev tool. We're built for **vibe coders** - developers who code with passion, build with purpose, and ship with style. With 9 integrated AI systems, BEAST MODE helps you write better code, learn faster, and have more fun while doing it.

**🎯 NEW: Day 2 Operations Platform** - The AI Janitor that works while you sleep. Silent refactoring, architecture enforcement, and invisible CI/CD for AI-generated code.

**That's the BEAST MODE VIBE. 🚀**

### 🤖 9 Integrated AI Systems

| AI System | Purpose | Key Features |
|-----------|---------|--------------|
| **Oracle AI** | Architectural Intelligence | Code analysis, performance insights, security scanning |
| **Code Roach** | Bug Detection & Fixing | Automated bug detection, code optimization, vulnerability scanning |
| **Daisy Chain** | Workflow Orchestration | Task coordination, process automation, intelligent sequencing |
| **Conversational AI** | Natural Language Interface | Code suggestions, documentation, guided development |
| **Health Monitor** | System Monitoring | Real-time diagnostics, self-healing, performance tracking |
| **Mission Guidance** | Project Planning | Success prediction, risk assessment, timeline optimization |
| **Marketplace AI** | Plugin Intelligence | Smart recommendations, usage analytics, monetization |
| **Quality Engine** | Code Quality Analysis | Comprehensive scoring, improvement suggestions |
| **Deployment Orchestrator** | Multi-Platform Deployment | Automated deployments, rollback capabilities, scaling |

## 💰 Pricing & Business Model

**Freemium SaaS - Built by a solo developer for developers worldwide**

### Free Forever (MIT License)
- ✅ **10,000 API calls/month**
- ✅ **All 9 AI systems**
- ✅ **Community support**
- ✅ **Self-hosted deployment**

### Paid Tiers
- **Developer**: $29/month - 100K calls, priority support
- **Team**: $99/month - 500K calls, collaboration features
- **SENTINEL**: $299/month - Enterprise governance layer, unlimited usage, white-label, SSO

**[View Full Pricing](https://beastmode.dev/pricing)** • **[30-Day Money-Back Guarantee](https://beastmode.dev/terms)**

---

## 🚀 Quick Start

### For New Developers

**New to BEAST MODE? Start here:**
- 📖 [Quick Start Guide](./docs/QUICK_START.md) - Get running in 5 minutes
- 🎯 [100-Point FTUE Guide](./docs/FTUE.md) - Complete walkthrough
- 💼 [New Developer Workflow](./docs/NEW_DEVELOPER_WORKFLOW.md) - Day-in-the-life guide

### Installation

```bash
npm install -g @beast-mode/core
# or
npm install @beast-mode/core
```

### CLI Quick Start

```bash
# Initialize in your project (with epic animations!)
beast-mode init

# Login to BEAST MODE (shows awesome creature animation)
beast-mode login

# Run your first quality check
beast-mode quality check

# Get your quality score
beast-mode quality score

# Enable Day 2 Operations (The AI Janitor)
beast-mode janitor enable --overnight

# Check janitor status
beast-mode janitor status

# Launch dashboard
beast-mode dashboard --open

# See artwork gallery
beast-mode artwork gallery

# Summon epic creatures
beast-mode artwork animate --kraken
beast-mode artwork animate --narwhal
```

### Programmatic Usage

```javascript
import { BeastMode } from '@beast-mode/core';

const beastMode = new BeastMode({
  oracle: { enabled: true },
  codeRoach: { enabled: true },
  daisyChain: { enabled: true },
  janitor: {
    enabled: true,
    silentRefactoring: true,
    architectureEnforcement: true,
    overnightMode: true
  }
});

await beastMode.initialize();

// Analyze code quality
const quality = await beastMode.getQualityScore();
console.log(`Quality Score: ${quality.overall}/100`);

// Day 2 Operations - The AI Janitor
const janitorStatus = await beastMode.janitor.getStatus();
console.log(`Issues Fixed: ${janitorStatus.issuesFixed}`);
console.log(`PRs Created: ${janitorStatus.prsCreated}`);

// Deploy your application
await beastMode.deployApplication({
  platform: 'vercel',
  environment: 'production'
});
```

## 🤖 ML Training System

**Complete ML training data pipeline with feedback collection**

### Quick Start

```bash
# Monitor feedback collection
npm run monitor:feedback

# Extract training data
npm run test:training-extractor

# Build training dataset
npm run test:training-pipeline

# Test feedback collector
npm run test:feedback-collector
```

### Components

- **Training Data Extractor** - Extracts from production + GitHub
- **Feedback Collector** - Records outcomes for predictions
- **Training Pipeline** - Combines, validates, and exports datasets
- **Feedback Monitor** - Tracks feedback rates and alerts

### Documentation

- `docs/COMPLETE_ML_TRAINING_SYSTEM.md` - Complete system overview
- `docs/TRAINING_DATA_IMPLEMENTATION_GUIDE.md` - Implementation guide
- `docs/FEEDBACK_COLLECTION_INTEGRATION.md` - Service integration

**Current Status:** 728 predictions, 2 with actual values (0.27% feedback rate)

---

## 📚 Documentation

### Core API

#### BeastMode Class

```typescript
interface BeastModeOptions {
  oracle?: OracleOptions;
  codeRoach?: CodeRoachOptions;
  daisyChain?: DaisyChainOptions;
  conversationalAI?: ConversationalAIOptions;
  healthMonitor?: HealthMonitorOptions;
  missionGuidance?: MissionGuidanceOptions;
  marketplace?: MarketplaceOptions;
  quality?: QualityOptions;
  deploymentOrchestrator?: DeploymentOptions;
}

class BeastMode {
  constructor(options: BeastModeOptions = {});
  async initialize(): Promise<void>;

  // Core methods
  async analyzeQuality(path: string): Promise<QualityReport>;
  async deployApplication(config: DeploymentConfig): Promise<DeploymentResult>;

  // Component access
  getComponent(name: string): any;
}
```

### Quality Analysis

```javascript
const quality = await beastMode.analyzeQuality('./src');

console.log(quality);
// {
//   score: 87,
//   issues: 12,
//   improvements: 8,
//   metrics: {
//     complexity: 2.3,
//     coverage: 85,
//     maintainability: 78
//   }
// }
```

### AI Code Assistant

```javascript
const ai = beastMode.getComponent('conversationalAI');

const response = await ai.processQuery(
  "How can I optimize this React component?"
);

console.log(response.answer);
// Intelligent suggestions and code improvements
```

### Automated Deployment

```javascript
const deployment = await beastMode.deployApplication({
  name: 'my-app',
  platform: 'vercel',
  strategy: 'blue-green',
  environment: 'production',
  source: './dist'
});

console.log(`Deployment: ${deployment.deploymentId}`);
// Monitors deployment progress automatically
```

## 🔧 Configuration

### Environment Variables

```bash
# AI Service Endpoints
ORACLE_API_URL=http://localhost:3006
CODE_ROACH_API_URL=http://localhost:3007
DAISY_CHAIN_API_URL=http://localhost:3008

# Deployment Platforms
VERCEL_API_KEY=your_vercel_api_key
RAILWAY_API_KEY=your_railway_api_key
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret

# Database (optional)
DATABASE_URL=postgresql://...
```

### Advanced Configuration

```javascript
const beastMode = new BeastMode({
  oracle: {
    enabled: true,
    confidence: 0.95,
    maxTokens: 4096
  },
  codeRoach: {
    enabled: true,
    aggressive: false,
    autoFix: true
  },
  deploymentOrchestrator: {
    enabled: true,
    platforms: ['vercel', 'railway', 'aws'],
    rollbackOnFailure: true
  }
});
```

## 🎯 Use Cases

### Enterprise Development
- **Quality Assurance**: Automated code review and quality scoring
- **Deployment Automation**: Zero-downtime deployments across multiple platforms
- **Team Coordination**: AI-powered workflow orchestration
- **Security Monitoring**: Real-time vulnerability detection

### Startup Development
- **Rapid Prototyping**: AI-assisted code generation and optimization
- **Scalable Deployments**: Multi-platform deployment from day one
- **Performance Monitoring**: Real-time application health tracking
- **Cost Optimization**: Intelligent resource management

### Open Source Projects
- **Code Quality**: Maintain high standards with automated analysis
- **Documentation**: AI-generated documentation and examples
- **Community Management**: Automated issue triage and PR reviews
- **Release Management**: Intelligent versioning and deployment

## 🏆 Performance & Reliability

- **⚡ Fast API Response Times** - Quality scores in seconds
- **🏥 Production Monitoring** - Real-time system health tracking
- **🔄 Automated Systems** - Day 2 Operations for code maintenance
- **📊 Quality Tracking** - Historical data and trends
- **🚀 Scalable Architecture** - Built for growth

## 🚀 Getting Started

### For Users (Installing BEAST MODE)

```bash
npm install @beast-mode/core
```

### For Developers (Contributing to BEAST MODE)

```bash
# Clone the repository
git clone https://github.com/repairman29/BEAST-MODE.git
cd BEAST-MODE

# Set up environment variables
cp ENVIRONMENT_SETUP.md .env.local
# Edit .env.local with your API keys

# Install dependencies
npm install

# Start development
npm run dev
```

### Running AI Services Locally

```bash
# Start individual AI services
npm run oracle:start      # Port 3006
npm run code-roach:start  # Port 3007
npm run daisy-chain:start # Port 3008

# Or start all services
npm run services:start
```

## 🛡️ Open Source Business Model

**BEAST MODE is proudly open source while protecting our business interests.**

### Why Open Source?
- **Trust & Transparency**: Developers can audit our code
- **Community Building**: Contributors improve the platform
- **Standards Compliance**: Industry best practices
- **SEO & Discovery**: Public code helps marketing

### What's Protected?
- **API Keys & Secrets**: Never in code (see [Environment Setup](ENVIRONMENT_SETUP.md))
- **Business Logic**: Proprietary algorithms and optimizations
- **Future Features**: Advanced capabilities remain private
- **Pricing Strategy**: Competitive advantages protected
- **Brand Assets**: Trademarks and visual identity

### Commercial Licensing
While the core is MIT-licensed, commercial features and enterprise support are available. See [Licensing](LICENSE.md) and [Pricing](PRICING.md) for details.

## 📄 License

MIT License - see [LICENSE](LICENSE.md) for details.

## 🌟 Roadmap

- [ ] **Quantum AI Integration** - Advanced quantum computing algorithms
- [ ] **Multi-Language Support** - Python, Go, Rust integrations
- [ ] **Enterprise SSO** - Single sign-on and team management
- [ ] **AI Marketplace** - Third-party plugin ecosystem
- [ ] **Mobile SDK** - React Native and Flutter support

# 🚀 Launch & Deployment

## Automated Launch Script

BEAST MODE includes a comprehensive launch script that handles:

- ✅ NPM package publishing
- ✅ Vercel project configuration
- ✅ Domain setup (beast-mode.dev)
- ✅ DNS record updates
- ✅ Launch announcements

### Quick Launch

```bash
# Step 1: Login to NPM
npm login

# Step 2: Publish to NPM
npm publish --access public

# Step 3: Complete post-launch setup
npm run launch:post-npm
```

This will guide you through the entire launch process!

### Manual Launch Steps

If you prefer to do things manually:

#### 1. Publish to NPM

```bash
# Login to NPM (if not already)
npm login

# Publish the package
npm publish --access public
```

#### 2. Update Vercel Project

```bash
# Update Vercel project settings
npm run vercel:update
```

Or manually in Vercel dashboard:
- Go to your `beast-mode` project
- Settings → Git → Change repository to `repairman29/BEAST-MODE`
- Settings → Build & Development → Root Directory: `website`

#### 3. Configure Domain

In Vercel project settings:
- Settings → Domains → Add `beast-mode.dev`
- Copy the DNS records provided

#### 4. Update DNS Records

```bash
# Update Porkbun DNS automatically
npm run dns:update
```

Or manually in Porkbun:
Add CNAME records:
- Host: `@`, Answer: `cname.vercel-dns.com`
- Host: `www`, Answer: `cname.vercel-dns.com`

### Environment Setup

Copy `env.example` to `.env` and fill in your API keys:

```bash
cp env.example .env
# Edit .env with your credentials
```

Required for launch:
- `VERCEL_TOKEN` - Get from https://vercel.com/account/tokens
- `PORKBUN_API_KEY` & `PORKBUN_SECRET_KEY` - From Porkbun account

### API Scripts

BEAST MODE includes CLI tools for API management:

```bash
# Vercel project management
npm run vercel:update

# DNS record management
npm run dns:update

# Check DNS records
node scripts/porkbun-api.js records beast-mode.dev
```

## 📞 Support

- **Documentation**: [docs.beastmode.dev](https://docs.beastmode.dev)
- **Issues**: [GitHub Issues](https://github.com/repairman29/BEAST-MODE/issues)
- **Discussions**: [GitHub Discussions](https://github.com/repairman29/BEAST-MODE/discussions)
- **Email**: support@beastmode.dev

## 🙏 Acknowledgments

Built with ❤️ using cutting-edge AI and machine learning technologies.

---

**BEAST MODE**: Where AI meets Development. Transform your workflow with intelligent automation. 🧠⚡🚀