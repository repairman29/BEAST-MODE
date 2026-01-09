# PLG Pages - Audience & Usage Guide

**Date:** January 8, 2026  
**Status:** 📋 **Usage Clarification**

## 🎯 Page Overview

### 1. `/quality` - Quality Dashboard
**Intended Audience:** 
- ✅ **Customers/Users** - Primary audience
- ✅ **Internal** - Also useful for us

**Purpose:**
- Customers analyze their repository quality
- Get actionable recommendations
- Compare multiple repos
- Track quality trends

**How It's Used:**
- **Customer-facing** - Main product feature
- Users enter their repos and get quality scores
- Shows recommendations, trends, comparative analysis
- Collects feedback to improve model

**Access:**
- Public/authenticated (depending on your auth setup)
- Core product feature

---

### 2. `/plg-demo` - PLG Demo Page
**Intended Audience:**
- ✅ **Developers** - Primary audience
- ✅ **Internal** - For showcasing components
- ⚠️ **Customers** - Optional (if you want to show them how to integrate)

**Purpose:**
- Show developers how to use PLG components
- Demonstrate component capabilities
- Provide code examples
- Teach API usage

**How It's Used:**
- **Developer documentation** - Shows how to integrate
- Copy-paste examples
- Component showcase
- Integration guide

**Access:**
- Public (for developers to learn)
- Or internal (if you prefer)

---

### 3. `/plg-usage` - Usage Dashboard
**Intended Audience:**
- ✅ **Internal** - Primary audience (you/team)
- ❌ **Customers** - Not for customers

**Purpose:**
- Track which components are used most
- Data-driven decisions on what to build
- Measure PLG adoption
- Guide product development

**How It's Used:**
- **Internal analytics** - See what's popular
- Make decisions on what to improve
- Remove unused features
- Build what customers actually use

**Access:**
- **Internal only** - Should be protected/authenticated
- Admin/internal dashboard

---

## 📊 Recommended Setup

### Public Pages (Customer-Facing)
1. **`/quality`** ✅
   - Main product feature
   - Public or authenticated
   - Core value proposition

2. **`/plg-demo`** ⚠️ (Optional)
   - Public if you want developers to integrate
   - Internal if just for your team
   - Developer documentation

### Internal Pages (Team Only)
1. **`/plg-usage`** ✅
   - Internal analytics dashboard
   - Should be protected
   - Admin/internal access only

---

## 🔒 Access Control Recommendations

### `/quality`
```typescript
// Option 1: Public (no auth required)
// Option 2: Authenticated (require login)
// Option 3: Freemium (public with limits, auth for more)
```

**Recommendation:** **Freemium**
- Public: Limited repos (e.g., 3 repos)
- Authenticated: Unlimited repos, history, trends

### `/plg-demo`
```typescript
// Option 1: Public (for developers)
// Option 2: Internal only
```

**Recommendation:** **Public**
- Helps developers integrate
- Self-service onboarding
- Reduces support burden

### `/plg-usage`
```typescript
// MUST BE: Internal/Admin only
// Add authentication check
```

**Recommendation:** **Internal Only**
- Add auth check
- Admin role required
- Don't expose internal metrics

---

## 💡 Usage Scenarios

### Scenario 1: Customer Uses Quality Dashboard
1. Customer visits `/quality`
2. Enters their repo: `my-org/my-repo`
3. Gets quality score, recommendations
4. Uses recommendations to improve
5. Feedback collected automatically

**Value:** Customer gets value, we get feedback

### Scenario 2: Developer Integrates Components
1. Developer visits `/plg-demo`
2. Sees component examples
3. Copies code
4. Integrates into their app
5. Usage tracked automatically

**Value:** Developer gets components, we get adoption data

### Scenario 3: Internal Team Reviews Usage
1. Team visits `/plg-usage`
2. Sees which components are used most
3. Decides to improve popular ones
4. Removes unused features
5. Builds what customers actually use

**Value:** Data-driven product decisions

---

## 🎯 Recommended Changes

### 1. Add Auth to `/plg-usage`
```typescript
// Add to plg-usage/page.tsx
import { getServerSession } from 'next-auth';

export default async function PLGUsageDashboard() {
  const session = await getServerSession();
  
  // Check if user is admin/internal
  if (!session || !isAdmin(session.user)) {
    return <div>Access Denied</div>;
  }
  
  // ... rest of component
}
```

### 2. Make `/quality` Freemium
```typescript
// Add limits for non-authenticated users
const MAX_REPOS_FREE = 3;
const MAX_REPOS_AUTH = 100;

if (!session && repos.length >= MAX_REPOS_FREE) {
  // Show upgrade prompt
}
```

### 3. Keep `/plg-demo` Public
- Helps with developer onboarding
- Self-service integration
- Reduces support

---

## 📋 Summary

| Page | Audience | Access | Purpose |
|------|----------|--------|---------|
| `/quality` | **Customers** | Public/Auth | Main product feature |
| `/plg-demo` | **Developers** | Public | Integration guide |
| `/plg-usage` | **Internal** | **Protected** | Analytics dashboard |

---

**Status:** 📋 **Needs Auth Setup**  
**Next:** Add authentication to `/plg-usage` page
