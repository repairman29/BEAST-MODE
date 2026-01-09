# PLG Pages - Audience & Usage Guide

**Date:** January 8, 2026  
**Status:** 📋 **Usage Clarification**

## 🎯 Page Overview & Intended Audience

### 1. `/quality` - Quality Dashboard
**Audience:** ✅ **CUSTOMERS/USERS** (Primary) + Internal  
**Access:** Public or Authenticated (Freemium recommended)

**Purpose:**
- **Main product feature** - Core value proposition
- Customers analyze their repository quality
- Get actionable recommendations
- Compare multiple repos
- Track quality trends over time

**How Customers Use It:**
1. Visit `/quality`
2. Enter their repos (e.g., `my-org/my-repo`)
3. Get instant quality scores
4. See recommendations (prioritized, categorized)
5. View trends and comparative analysis
6. Provide feedback (improves model)

**Value to Customer:**
- Understand repo quality
- Get actionable improvement suggestions
- Track progress over time
- Compare with similar repos

**Value to Us:**
- Collect feedback (improves model)
- Track usage (see what's valuable)
- Understand customer needs

---

### 2. `/plg-demo` - PLG Demo Page
**Audience:** ✅ **DEVELOPERS** (Primary) - Internal or External  
**Access:** Public (recommended)

**Purpose:**
- **Developer documentation** - Integration guide
- Show developers how to use PLG components
- Demonstrate component capabilities
- Provide copy-paste code examples
- Teach API usage

**How Developers Use It:**
1. Visit `/plg-demo`
2. See all components in action
3. Copy code examples
4. Integrate into their apps
5. Components auto-track usage

**Value to Developer:**
- Learn how to integrate
- See working examples
- Copy-paste ready code
- Self-service onboarding

**Value to Us:**
- Reduces support burden
- Self-service integration
- Tracks which components developers use
- Guides what to build next

**Recommendation:** **Public**
- Helps with developer onboarding
- Self-service reduces support
- Viral (developers share with teams)

---

### 3. `/plg-usage` - Usage Dashboard
**Audience:** ✅ **INTERNAL ONLY** (You/Team)  
**Access:** **PROTECTED** (Admin/Internal only)

**Purpose:**
- **Internal analytics** - Data-driven decisions
- Track which components are used most
- Measure PLG adoption
- Guide product development
- Remove unused features

**How Internal Team Uses It:**
1. Visit `/plg-usage` (admin access required)
2. See component usage stats
3. Identify most popular components
4. Decide what to improve
5. Remove unused features
6. Build what customers actually use

**Value to Internal Team:**
- Data-driven product decisions
- See what's actually used
- Focus development efforts
- Measure PLG success

**Value to Customers:**
- Indirect - we build better features
- Focus on what they use
- Remove unused complexity

**Recommendation:** **Internal Only**
- Add authentication check
- Admin role required
- Don't expose internal metrics

---

## 📊 Access Control Recommendations

### `/quality` - Customer-Facing
```typescript
// Recommended: Freemium Model
const MAX_REPOS_FREE = 3;      // Public users
const MAX_REPOS_AUTH = 100;    // Authenticated users
const MAX_REPOS_PRO = 1000;    // Pro users

// Benefits:
// - Public: Get users in door (PLG)
// - Auth: Collect feedback, track usage
// - Pro: Revenue opportunity
```

**Current:** Public (no limits)  
**Recommended:** Freemium (public with limits, auth for more)

---

### `/plg-demo` - Developer Documentation
```typescript
// Recommended: Public
// - Helps developers integrate
// - Self-service onboarding
// - Reduces support burden
// - Viral (developers share)
```

**Current:** Public  
**Recommended:** Keep public

---

### `/plg-usage` - Internal Analytics
```typescript
// MUST BE: Protected
import { getServerSession } from 'next-auth';

export default async function PLGUsageDashboard() {
  const session = await getServerSession();
  
  if (!session || !isAdmin(session.user)) {
    return <AccessDenied />;
  }
  
  // ... rest of component
}
```

**Current:** Public (needs protection)  
**Recommended:** Add authentication + admin check

---

## 💡 Usage Scenarios

### Scenario 1: Customer Uses Quality Dashboard
**Who:** Customer/User  
**Page:** `/quality`

1. Customer visits `/quality`
2. Enters repo: `my-org/my-repo`
3. Gets quality score: 75%
4. Sees recommendations (prioritized)
5. Clicks recommendation → tracked
6. Provides feedback → improves model

**Result:** Customer gets value, we get feedback

---

### Scenario 2: Developer Integrates Components
**Who:** Developer (customer or external)  
**Page:** `/plg-demo`

1. Developer visits `/plg-demo`
2. Sees QualityWidget example
3. Copies code: `<QualityWidget repo="owner/repo" />`
4. Integrates into their app
5. Component auto-tracks usage

**Result:** Developer gets components, we get adoption data

---

### Scenario 3: Internal Team Reviews Usage
**Who:** Internal Team/Admin  
**Page:** `/plg-usage`

1. Team visits `/plg-usage` (admin access)
2. Sees QualityWidget used 500 times
3. Sees RecommendationCards used 300 times
4. Sees Badge used 50 times
5. Decides: Improve QualityWidget, promote Badge

**Result:** Data-driven product decisions

---

## 🔒 Security Recommendations

### Immediate Actions

1. **Protect `/plg-usage`** ⚠️
   - Add authentication check
   - Require admin role
   - Show "Access Denied" for non-admins

2. **Consider Freemium for `/quality`** 💡
   - Public: 3 repos max
   - Auth: Unlimited repos
   - Pro: Advanced features

3. **Keep `/plg-demo` Public** ✅
   - Helps developers
   - Self-service onboarding
   - Reduces support

---

## 📋 Summary Table

| Page | Audience | Access | Purpose | Value |
|------|----------|--------|---------|-------|
| `/quality` | **Customers** | Public/Auth | Main product | Quality analysis |
| `/plg-demo` | **Developers** | Public | Integration guide | Self-service onboarding |
| `/plg-usage` | **Internal** | **Protected** | Analytics | Data-driven decisions |

---

## 🎯 Current Status

### ✅ Working
- All pages functional
- Components integrated
- Usage tracking active
- APIs tested

### ⚠️ Needs Attention
- `/plg-usage` should be protected (currently public)
- Consider freemium limits for `/quality`
- Add authentication checks

---

**Status:** 📋 **Clarified**  
**Next:** Add authentication to `/plg-usage` if needed
