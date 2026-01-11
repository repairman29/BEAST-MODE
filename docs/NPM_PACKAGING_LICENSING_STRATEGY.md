# NPM Packaging & Licensing Strategy
## Aligning npm Package with Pricing Model & Business Goals

**Date:** January 2026  
**Status:** 📋 **Strategy Design**  
**Goal:** Proper licensing enforcement while maintaining open source benefits

---

## 🎯 **CURRENT STATE ANALYSIS**

### **Current npm Package Configuration**

**Package:** `@beast-mode/core`  
**Version:** 1.0.0  
**License:** `"MIT"` (in package.json)  
**Access:** `"public"`  
**Repository:** https://github.com/repairman29/BEAST-MODE

### **Issues Identified**

1. ⚠️ **License Mismatch**
   - `package.json` says: `"license": "MIT"`
   - `LICENSE.md` describes: Dual licensing (MIT + Commercial)
   - **Problem:** npm package appears fully MIT, but we want paid tiers

2. ⚠️ **No License Enforcement**
   - Package is freely installable via npm
   - No subscription check in package
   - No way to enforce paid tiers

3. ⚠️ **Outdated Pricing in LICENSE.md**
   - Shows: $29, $99, $299
   - Should be: $79, $299, $799 (new pricing)

4. ⚠️ **No License Validation**
   - Package doesn't check subscription status
   - Free tier users can access paid features
   - No API key validation

---

## 💡 **LICENSING STRATEGY OPTIONS**

### **Option A: Dual License Model (RECOMMENDED)** ⭐

**Philosophy:** Open source core, paid for cloud services

**Structure:**
- **Core Library:** MIT licensed (free, open source)
- **Cloud Services:** Require subscription (paid)
- **CLI Tool:** MIT licensed (free)
- **API Access:** Subscription-based

**Implementation:**
```json
{
  "license": "MIT",
  "licenseText": "MIT License - See LICENSE.md for full terms. Cloud services require subscription."
}
```

**Benefits:**
- ✅ Open source benefits (community, trust, transparency)
- ✅ Can enforce paid tiers for cloud services
- ✅ Free tier works without subscription
- ✅ Paid tiers require API key/subscription

**How It Works:**
1. Package is MIT licensed (freely installable)
2. Core library works offline (limited features)
3. Cloud API access requires subscription
4. API key validates subscription tier
5. Features gated by subscription level

---

### **Option B: Source-Available License**

**Philosophy:** Source visible, but commercial use requires license

**Structure:**
- **Source Code:** Available on GitHub
- **Commercial Use:** Requires subscription
- **Personal Use:** Free (MIT-like)

**Implementation:**
```json
{
  "license": "SEE LICENSE IN LICENSE.md",
  "licenseText": "Source Available - Commercial use requires subscription"
}
```

**Benefits:**
- ✅ Source transparency
- ✅ Can enforce commercial licensing
- ⚠️ More complex legally
- ⚠️ May reduce adoption

---

### **Option C: Fully Open Source (MIT)**

**Philosophy:** Everything open source, monetize via services

**Structure:**
- **Everything:** MIT licensed
- **Monetization:** Cloud services, support, enterprise features

**Benefits:**
- ✅ Maximum adoption
- ✅ Community contributions
- ⚠️ Harder to enforce paid tiers
- ⚠️ Competitors can fork

**Recommendation:** **Option A** - Best balance of open source benefits and business needs

---

## 📦 **RECOMMENDED NPM PACKAGE STRUCTURE**

### **Package Configuration**

```json
{
  "name": "@beast-mode/core",
  "version": "1.0.0",
  "description": "BEAST MODE - AI-powered development tools. Core library is MIT licensed. Cloud services require subscription.",
  "license": "MIT",
  "licenseText": "MIT License - See LICENSE.md for full terms. Cloud API access requires subscription.",
  "publishConfig": {
    "access": "public"
  },
  "files": [
    "lib/",
    "bin/",
    "assets/",
    "README.md",
    "LICENSE.md",
    "CHANGELOG.md"
  ]
}
```

### **License File Structure**

**LICENSE.md should contain:**
1. **MIT License** (for core library)
2. **Commercial License Terms** (for cloud services)
3. **Subscription Requirements** (for paid features)
4. **Updated Pricing** ($79, $299, $799)

---

## 🔐 **LICENSE ENFORCEMENT STRATEGY**

### **How to Enforce Paid Tiers**

**1. API Key Validation**
```javascript
// In package code
const beastMode = new BeastMode({
  apiKey: process.env.BEAST_MODE_API_KEY
});

// Package validates API key against subscription
await beastMode.initialize(); // Checks subscription tier
```

**2. Feature Gating**
```javascript
// Free tier: Limited features
if (subscriptionTier === 'free') {
  // Basic quality checks only
  // 10K API calls/month limit
}

// Paid tiers: Full features
if (subscriptionTier === 'developer' || 'team' || 'enterprise') {
  // All features unlocked
  // Higher API call limits
}
```

**3. Subscription Check**
- Package makes API call to validate subscription
- Caches subscription status locally
- Falls back to free tier if invalid

---

## 📝 **UPDATED LICENSE.MD STRUCTURE**

### **Recommended Structure**

```markdown
# BEAST MODE License

## Overview

BEAST MODE uses a **dual-license model**:
- **Core Library:** MIT License (free, open source)
- **Cloud Services:** Subscription required (paid)

## 📦 Core Library (MIT License)

The core library (`@beast-mode/core`) is licensed under the MIT License:

[Full MIT License Text]

**What's Included:**
- ✅ Core library code
- ✅ CLI tool
- ✅ Local development features
- ✅ Self-hosted deployment

**What Requires Subscription:**
- ❌ Cloud API access
- ❌ Advanced AI features
- ❌ Team collaboration
- ❌ Enterprise features

## 💰 Cloud Services Subscription

**For cloud API access and advanced features:**

### Free Tier
- **Price:** $0/month
- **API Calls:** 10,000/month
- **License:** MIT (no subscription required)
- **Features:** Basic quality checks, community support

### Developer Tier
- **Price:** $79/month ($790/year)
- **API Calls:** 100,000/month
- **License:** Commercial subscription required
- **Features:** All Day 2 Operations, priority support

### Team Tier
- **Price:** $299/month ($2,990/year)
- **API Calls:** 500,000/month
- **License:** Commercial subscription required
- **Features:** Team collaboration, enterprise guardrail

### Enterprise Tier
- **Price:** $799/month ($7,990/year)
- **API Calls:** 2,000,000/month included
- **License:** Commercial subscription required
- **Features:** White-label, SSO, custom integrations

## 🔐 License Enforcement

**How It Works:**
1. Install package: `npm install @beast-mode/core` (free, MIT)
2. Use locally: Works offline with limited features
3. Use cloud API: Requires API key and subscription
4. API key validates subscription tier
5. Features gated by subscription level

**No API Key:**
- ✅ Core library works (MIT licensed)
- ✅ Local features work
- ❌ Cloud API access blocked
- ❌ Advanced features unavailable

**With API Key:**
- ✅ All features based on subscription tier
- ✅ Cloud API access enabled
- ✅ Advanced features unlocked

## 📊 Usage Rights

### MIT License (Core Library)
- ✅ Use, modify, distribute
- ✅ Commercial use allowed
- ✅ Private use allowed
- ✅ Patent use allowed

### Commercial License (Cloud Services)
- ✅ Internal business use
- ❌ Redistribution of cloud services
- ❌ Resale of cloud services
- ❌ Competing services

## 🔄 License Changes

BEAST MODE reserves the right to modify licensing terms with 30 days notice. Existing subscribers will be grandfathered under their current terms.

## 📞 Support & Contact

- **License Questions:** legal@beast-mode.dev
- **Subscription Questions:** support@beast-mode.dev
- **Enterprise Licensing:** enterprise@beast-mode.dev
```

---

## 🚀 **IMPLEMENTATION PLAN**

### **Phase 1: Update Package Configuration (Week 1)**

**Tasks:**
- [ ] Update `package.json` license field
- [ ] Add license text to package
- [ ] Update `LICENSE.md` with new structure
- [ ] Update pricing in `LICENSE.md` ($79, $299, $799)
- [ ] Add license enforcement code

**Files to Update:**
1. `package.json` - License field
2. `LICENSE.md` - Full license text
3. `lib/index.js` - License validation
4. `bin/beast-mode.js` - Subscription check

---

### **Phase 2: License Enforcement (Week 2)**

**Tasks:**
- [ ] Implement API key validation
- [ ] Add subscription tier checking
- [ ] Implement feature gating
- [ ] Add license check on initialization
- [ ] Create license validation service

**Code Structure:**
```javascript
// lib/licensing/index.js
class LicenseValidator {
  async validate(apiKey) {
    // Check subscription status
    // Return tier: 'free' | 'developer' | 'team' | 'enterprise'
  }
  
  async checkFeature(feature, tier) {
    // Check if feature is available for tier
  }
}
```

---

### **Phase 3: Documentation Updates (Week 2)**

**Tasks:**
- [ ] Update README.md with licensing info
- [ ] Update installation guide
- [ ] Create license FAQ
- [ ] Update website with licensing info
- [ ] Add license enforcement docs

---

## 📊 **LICENSING COMPARISON**

### **How Competitors Handle This**

| Competitor | License Model | Enforcement |
|------------|---------------|-------------|
| **GitHub Copilot** | Proprietary | Subscription required |
| **Cursor** | Proprietary | Subscription required |
| **CodeRabbit** | Proprietary | Subscription required |
| **SonarQube** | LGPL (Community) / Commercial | Dual license |
| **BEAST MODE** | **MIT (Core) / Commercial (Cloud)** | **API key validation** |

**BEAST MODE Advantage:**
- ✅ Open source core (trust, transparency)
- ✅ Free tier works without subscription
- ✅ Paid tiers enforced via API key
- ✅ Best of both worlds

---

## ✅ **RECOMMENDED ACTIONS**

### **Immediate (This Week)**
1. [ ] Update `package.json` license field
2. [ ] Rewrite `LICENSE.md` with dual-license structure
3. [ ] Update pricing in `LICENSE.md` ($79, $299, $799)
4. [ ] Add license enforcement code structure

### **Short-term (Next Week)**
5. [ ] Implement API key validation
6. [ ] Add subscription tier checking
7. [ ] Implement feature gating
8. [ ] Update documentation

### **Long-term (This Month)**
9. [ ] Add license validation service
10. [ ] Create license FAQ
11. [ ] Update website with licensing info
12. [ ] Monitor license compliance

---

## 🎯 **SUCCESS CRITERIA**

**When Complete:**
- ✅ Package is MIT licensed (freely installable)
- ✅ Core library works offline (limited features)
- ✅ Cloud API requires subscription
- ✅ Features gated by subscription tier
- ✅ Pricing updated in all docs
- ✅ License enforcement working

---

## 📝 **NEXT STEPS**

1. **Review this strategy** with team
2. **Finalize license model** (Option A recommended)
3. **Update package.json** (Week 1)
4. **Rewrite LICENSE.md** (Week 1)
5. **Implement license enforcement** (Week 2)

---

**Status:** ✅ **Strategy Complete - Ready for Implementation**

**Recommendation:** **Option A - Dual License Model** (MIT core + Commercial cloud services)

