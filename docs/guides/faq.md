# BEAST MODE - Frequently Asked Questions

**Last Updated:** January 2026

---

## 🚀 Getting Started

### What is BEAST MODE?

BEAST MODE is an AI-powered co-pilot for developers that helps you build better code, faster. It includes 9 integrated AI systems for code quality, analysis, recommendations, and Day 2 Operations (silent refactoring, architecture enforcement).

### How do I get started?

See our [Getting Started Guide](../getting-started/README.md) for a complete walkthrough. In 3 easy steps:
1. Install: `npm install -g @beast-mode/core`
2. Initialize: `beast-mode init`
3. Check: `beast-mode quality check`

### Is BEAST MODE free?

Yes! We offer a free forever tier with:
- 10,000 API calls/month
- Core library (MIT licensed)
- Basic quality checks
- Community support
- Self-hosted deployment

See [Pricing](../business/pricing.md) for details on paid tiers.

---

## 💰 Pricing & Licensing

### What are the pricing tiers?

- **Free**: $0/month - 10K calls/month
- **Developer**: $79/month - 100K calls/month
- **Team**: $299/month - 500K calls/month
- **Enterprise**: $799/month - 2M calls/month (unlimited with overage)

See [Pricing](../business/pricing.md) for complete details.

### What's the difference between free and paid tiers?

Free tier includes basic quality checks and community support. Paid tiers add:
- Day 2 Operations (AI Janitor)
- Priority support
- Advanced analytics
- Team collaboration (Team+)
- Enterprise features (Enterprise)

### Is the core library open source?

Yes! The core library is MIT licensed and works offline. Cloud API access requires a subscription for paid features.

See [Licensing](../business/licensing.md) for details.

---

## 🔧 Technical

### How does quality scoring work?

BEAST MODE analyzes your codebase using machine learning models trained on thousands of repositories. It provides a score from 0-100 based on code quality, maintainability, and best practices.

See [Quality Scoring](../features/quality-scoring.md) for details.

### What is Day 2 Operations?

Day 2 Operations (also called "AI Janitor") is our platform for maintaining AI-generated code:
- **Silent Refactoring**: Code cleanup runs overnight
- **Architecture Enforcement**: Pre-commit pattern blocking
- **Vibe Restoration**: Regression detection & restore
- **Repo-Level Memory**: Semantic graph of codebase

See [Day 2 Operations](../features/day2-operations.md) for complete details.

### Which programming languages are supported?

BEAST MODE supports 18+ languages including:
- JavaScript/TypeScript
- Python
- Java
- Go
- Rust
- Ruby
- PHP
- And more...

See [CLI Guide](./cli.md) for language-specific commands.

---

## 🐛 Troubleshooting

### My quality score is low. What should I do?

Low scores are normal at first! BEAST MODE exists to help you improve. Try:
1. Run `beast-mode quality check --fix` to auto-fix issues
2. Review the recommendations in the dashboard
3. Fix issues incrementally - don't try to fix everything at once

### The CLI command isn't working

1. Verify installation: `beast-mode --version`
2. Check if you're in a project directory (for `init` command)
3. Try logging in: `beast-mode login`
4. See [Troubleshooting Guide](./troubleshooting.md) for more help

### API calls are failing

1. Check your API key is valid: `beast-mode status`
2. Verify you haven't exceeded your tier limits
3. Check your subscription status in the dashboard
4. See [Troubleshooting Guide](./troubleshooting.md) for more help

---

## 📚 Documentation

### Where can I find more documentation?

- [Documentation Index](../README.md) - Complete documentation index
- [Getting Started](../getting-started/README.md) - Quick start guide
- [API Documentation](./api.md) - API reference
- [CLI Guide](./cli.md) - Command reference

### How do I report a bug or request a feature?

- **GitHub Issues**: [Report Issues](https://github.com/repairman29/BEAST-MODE/issues)
- **Support Email**: support@beastmode.dev
- **Community**: Join our community discussions

---

## 🏢 Enterprise

### What is SENTINEL?

SENTINEL is our enterprise governance layer (Enterprise tier) that includes:
- Plain English code reviews
- Compliance & audit logs
- White-label deployment
- SSO integration
- Custom integrations
- Dedicated account manager

See [Enterprise Features](../features/enterprise.md) for details.

### Do you offer on-premise deployment?

Yes! On-premise deployment is available for Enterprise tier customers. Contact sales@beastmode.dev for details.

---

## 💡 Tips & Best Practices

### How often should I run quality checks?

- **Daily**: Before committing code (`beast-mode quality check --fix`)
- **Weekly**: Comprehensive audit (`beast-mode quality audit`)
- **Continuous**: Enable Day 2 Operations for automatic maintenance

### Should I enable Day 2 Operations?

Yes! Day 2 Operations (AI Janitor) runs overnight and automatically:
- Refactors code
- Enforces architecture
- Detects regressions
- Maintains code quality

See [Day 2 Operations](../features/day2-operations.md) to get started.

---

## 🆘 Still Need Help?

- **Troubleshooting**: [Troubleshooting Guide](./troubleshooting.md)
- **Support Email**: support@beastmode.dev
- **GitHub Issues**: [Report Issues](https://github.com/repairman29/BEAST-MODE/issues)
- **Documentation**: [Complete Index](../README.md)

---

**Last Updated:** January 2026

