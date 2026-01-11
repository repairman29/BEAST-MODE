# BEAST MODE Dogfooding & Self-Healing Guide

**Status:** ✅ Active  
**Last Updated:** January 11, 2025

---

## 🎯 Overview

BEAST MODE uses itself to continuously improve its own code quality. This self-healing system analyzes code, identifies issues, and tracks improvements until quality thresholds are met.

---

## 🛠️ Tools

### 1. Self-Healing Script
**Location:** `scripts/dogfood-self-heal.js`

**Usage:**
```bash
node scripts/dogfood-self-heal.js [--threshold=90]
```

**What it does:**
- Analyzes code quality using static analysis
- Checks for common issues (error handling, types, accessibility, etc.)
- Calculates quality scores (0-100)
- Tracks improvements in Supabase
- Provides actionable improvement recommendations

**Quality Checks:**
- ✅ Error handling (try-catch blocks)
- ✅ TypeScript type safety
- ✅ Accessibility (ARIA labels)
- ✅ Loading states
- ✅ Error boundaries
- ✅ Code complexity
- ✅ JSDoc documentation
- ✅ Console.log removal

### 2. Quality Tracking Database
**Table:** `quality_tracking` (Supabase)

**Tracks:**
- File path
- Quality score (0-100)
- Issues count and details
- Metrics (lines, complexity, type safety)
- Timestamp
- Threshold compliance
- Improvements applied

**Migration:**
```bash
node scripts/apply-quality-tracking-migration.js
```

---

## 📊 Current Status

### Interceptor Dashboard Files

| File | Quality Score | Status | Issues |
|------|--------------|--------|--------|
| `InterceptorDashboard.tsx` | 89/100 | ⚠️ Below threshold | 4 issues |
| `stats/route.ts` | 92/100 | ✅ Meets threshold | 4 issues |
| `route.ts` | 93/100 | ✅ Meets threshold | 3 issues |

**Average:** 91.3/100  
**Target:** 90+  
**Files Meeting Threshold:** 2/3

---

## 🔄 Self-Healing Process

### Step 1: Analyze
```bash
node scripts/dogfood-self-heal.js
```

### Step 2: Review Issues
The script identifies:
- **Critical/High:** Must fix (error handling, type safety)
- **Medium:** Should fix (accessibility, loading states)
- **Low:** Nice to have (JSDoc, console.log)

### Step 3: Apply Fixes
Use BEAST MODE's code generation APIs or manual fixes:
- Add error handling
- Improve type safety
- Add accessibility
- Optimize performance

### Step 4: Re-Analyze
Run the script again to verify improvements:
```bash
node scripts/dogfood-self-heal.js
```

### Step 5: Track Progress
Quality scores are automatically tracked in Supabase `quality_tracking` table.

---

## 🎯 Quality Thresholds

**Default:** 90/100

**Scoring:**
- Starts at 100
- Deducts points for issues:
  - Critical/High: -5 points each
  - Medium: -2 points each
  - Low: -1 point each

**Target Metrics:**
- Quality Score: 90+
- Type Safety: 80%+
- Error Handling: All async operations
- Accessibility: ARIA labels on interactive elements
- Loading States: All data fetching

---

## 📈 Tracking & Monitoring

### Supabase Dashboard
Query quality tracking data:
```sql
SELECT 
  file_path,
  quality_score,
  issues_count,
  meets_threshold,
  timestamp
FROM quality_tracking
ORDER BY timestamp DESC;
```

### Trends
Track quality improvements over time:
```sql
SELECT 
  file_path,
  AVG(quality_score) as avg_score,
  COUNT(*) as checks,
  MAX(quality_score) as best_score
FROM quality_tracking
GROUP BY file_path
ORDER BY avg_score DESC;
```

---

## 🚀 Continuous Improvement

### Automated Workflow
1. **Pre-commit:** Run quality check
2. **CI/CD:** Enforce quality threshold
3. **Weekly:** Review quality trends
4. **Monthly:** Update thresholds and checks

### Integration with Interceptor
The Brand/Reputation/Secret Interceptor can also check code quality:
- Blocks commits with quality < threshold
- Stores quality reports in Supabase
- Provides improvement suggestions

---

## 💡 Best Practices

1. **Run Before Commits:**
   ```bash
   node scripts/dogfood-self-heal.js
   ```

2. **Fix High Priority Issues First:**
   - Error handling
   - Type safety
   - Accessibility

3. **Track Progress:**
   - Review Supabase quality_tracking table
   - Monitor trends over time
   - Celebrate improvements!

4. **Iterate:**
   - Run analysis
   - Fix issues
   - Re-analyze
   - Repeat until threshold met

---

## 🔗 Related Documentation

- `docs/BRAND_REPUTATION_INTERCEPTOR_GUIDE.md` - Interceptor guide
- `docs/BEAST_MODE_DEV_IMPROVEMENTS_ROADMAP.md` - Improvements roadmap
- `scripts/dogfood-self-heal.js` - Self-healing script source

---

**Last Updated:** January 11, 2025  
**Next Review:** January 18, 2025
