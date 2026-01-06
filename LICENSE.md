# BEAST MODE License

## Overview

BEAST MODE uses a **dual-license model**:
- **Core Library:** MIT License (free, open source)
- **Cloud Services:** Subscription required (paid)

---

## 📦 Core Library (MIT License)

The core library (`@beast-mode/core`) is licensed under the MIT License:

```
MIT License

Copyright (c) 2025 BEAST MODE

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### What's Included (MIT License)

- ✅ Core library code
- ✅ CLI tool (`beast-mode` command)
- ✅ Local development features
- ✅ Self-hosted deployment
- ✅ Offline functionality (limited features)

### What Requires Subscription

- ❌ Cloud API access
- ❌ Advanced AI features (Day 2 Operations)
- ❌ Team collaboration
- ❌ Enterprise features
- ❌ Priority support

---

## 💰 Cloud Services Subscription

**For cloud API access and advanced features, a subscription is required.**

### Free Tier

**Price:** $0/month  
**API Calls:** 10,000/month  
**License:** MIT (no subscription required for core library)  
**Features:**
- ✅ Core library (MIT licensed)
- ✅ Basic quality checks
- ✅ Community support
- ✅ Self-hosted deployment
- ✅ Limited cloud API access (10K calls/month)

**Perfect for:** Individual developers, open source projects, small teams

---

### Developer Tier

**Price:** $79/month ($790/year - save $158)  
**API Calls:** 100,000/month included  
**License:** Commercial subscription required  
**Features:**
- ✅ Everything in Free tier
- ✅ All Day 2 Operations features
- ✅ Priority email support
- ✅ Advanced analytics
- ✅ Quality improvement tracking
- ✅ Overnight janitor
- ✅ Silent refactoring

**Value:** Save 16-30 hours per week • Improve code quality by 25+ points  
**Perfect for:** Individual developers, freelancers

**Overage:** $0.001 per API call (after 100K)

---

### Team Tier

**Price:** $299/month ($2,990/year - save $598)  
**API Calls:** 500,000/month included  
**License:** Commercial subscription required  
**Features:**
- ✅ Everything in Developer tier
- ✅ Team collaboration (up to 10 users)
- ✅ Enterprise guardrail
- ✅ Plain English diffs
- ✅ Team analytics
- ✅ Phone/video support
- ✅ SLA (99.9% uptime)

**Value:** Save $65K-$325K per year • 50% faster onboarding  
**Perfect for:** Teams of 2-10 developers

**Overage:** $0.0008 per API call (after 500K)

---

### Enterprise Tier

**Price:** $799/month ($7,990/year - save $1,598)  
**API Calls:** 2,000,000/month included  
**License:** Commercial subscription required  
**Features:**
- ✅ Everything in Team tier
- ✅ Unlimited API calls (with fair use)
- ✅ White-label options
- ✅ SSO (SAML, OAuth, Active Directory)
- ✅ Custom integrations
- ✅ Dedicated account manager
- ✅ 24/7 phone support
- ✅ SLA (99.9% uptime)
- ✅ On-premise deployment option
- ✅ Custom AI model training

**Value:** Save $100K-$500K per year • Enterprise governance  
**Perfect for:** Organizations with 50+ developers

**Overage:** $0.0005 per API call (after 2M)

---

### Custom Enterprise

**Price:** Contact for pricing  
**License:** Custom commercial license  
**Features:**
- ✅ Everything in Enterprise tier
- ✅ Tailored solutions
- ✅ Custom AI models
- ✅ Full platform customization
- ✅ Dedicated infrastructure
- ✅ Custom SLAs
- ✅ Volume discounts

**Contact:** enterprise@beastmode.dev

---

## 🔐 License Enforcement

### How It Works

1. **Install Package:** `npm install @beast-mode/core` (free, MIT licensed)
2. **Use Locally:** Core library works offline with limited features
3. **Use Cloud API:** Requires API key and subscription
4. **API Key Validation:** Package validates subscription tier
5. **Feature Gating:** Features unlocked based on subscription level

### No API Key

- ✅ Core library works (MIT licensed)
- ✅ Local features work
- ✅ CLI tool works (limited features)
- ❌ Cloud API access blocked
- ❌ Advanced features unavailable

### With API Key

- ✅ All features based on subscription tier
- ✅ Cloud API access enabled
- ✅ Advanced features unlocked
- ✅ Subscription validated on initialization

### API Key Setup

```bash
# Set API key as environment variable
export BEAST_MODE_API_KEY=your_api_key_here

# Or use in code
const beastMode = new BeastMode({
  apiKey: process.env.BEAST_MODE_API_KEY
});

await beastMode.initialize(); // Validates subscription
```

---

## 📊 Usage Rights

### MIT License (Core Library)

**You may:**
- ✅ Use, modify, distribute
- ✅ Commercial use allowed
- ✅ Private use allowed
- ✅ Patent use allowed
- ✅ Sublicense

**You must:**
- ✅ Include copyright notice
- ✅ Include license text

**You may not:**
- ❌ Hold authors liable
- ❌ Use trademark without permission

### Commercial License (Cloud Services)

**You may:**
- ✅ Internal business use
- ✅ Use cloud API within subscription limits
- ✅ Access features based on subscription tier

**You may not:**
- ❌ Redistribute cloud services
- ❌ Resell cloud services
- ❌ Create competing services using our cloud API
- ❌ Reverse engineer cloud services
- ❌ Exceed subscription limits without overage payment

---

## 🚀 Freemium Model

BEAST MODE operates on a **freemium model**:

- **Free forever** for individual developers and small projects
- **Paid upgrades** for teams and enterprises with advanced needs
- **Fair pricing** based on usage and features
- **Transparent billing** with no hidden fees

---

## 📊 Usage Limits & Billing

### Free Tier Limits

- 10,000 API calls per month
- 100 concurrent connections
- Community support only
- Standard response times
- Basic features only

### Paid Tier Billing

- Monthly subscription (cancel anytime)
- Annual subscription (2 months free - 17% discount)
- Pay-as-you-go overage (see tier details above)
- All major credit cards accepted
- Automatic billing

### Overage Pricing

- **Developer:** $0.001 per call (after 100K)
- **Team:** $0.0008 per call (after 500K)
- **Enterprise:** $0.0005 per call (after 2M)

---

## 🤝 Enterprise Agreements

For large organizations requiring:
- Custom terms and conditions
- Volume discounts
- Special licensing arrangements
- On-premise deployment
- Custom SLAs

**Contact:** enterprise@beastmode.dev

---

## 📞 Support & Contact

- **License Questions:** legal@beastmode.dev
- **Subscription Questions:** support@beastmode.dev
- **Enterprise Licensing:** enterprise@beastmode.dev
- **Technical Support:** 
  - Free Tier: Community forum and GitHub issues
  - Developer Tier: Email support within 24 hours
  - Team Tier: Phone support + email priority
  - Enterprise Tier: Dedicated account manager + 24/7 support

---

## 🔄 License Changes

BEAST MODE reserves the right to modify licensing terms with 30 days notice. Existing subscribers will be grandfathered under their current terms.

---

## 📜 Legal

This license is governed by the laws of the United States. All disputes shall be resolved through binding arbitration.

---

**BEAST MODE** - Neural Intelligence for the Future of Development

*Built by independent developers, for developers worldwide* 🧠⚡

**Last Updated:** January 2026
