# Repository Review and Fix System

**Status:** ✅ **ACTIVE** | 🚀 **PRODUCTION READY**

## Overview

The BEAST MODE QA system can now review all your repositories (~57+) and automatically fix issues. This system:

1. **Discovers** all repositories (local + GitHub)
2. **Analyzes** each repo using BEAST MODE quality scoring
3. **Generates** improvement plans with specific fixes
4. **Applies** fixes automatically to local repositories

---

## Quick Start

### 1. Review All Repositories

```bash
cd BEAST-MODE-PRODUCT
npm run review:all-repos:fix
```

This will:
- Discover all repos (local directories + GitHub)
- Run quality checks on each
- Generate improvement plans (dry-run mode)
- Create comprehensive reports

### 2. Apply Fixes to Local Repos

```bash
npm run apply:fixes
```

This will:
- Load the latest review report
- Apply all generated fixes to local repositories
- Create missing files (README, tests, CI/CD configs, etc.)

### 3. Review Specific Repository

```bash
npm run apply:fixes -- --repo=repairman29/smugglers
```

---

## What Gets Fixed

The system automatically addresses common quality issues:

### High Priority (Quick Wins)
- ✅ **Missing README.md** - Creates comprehensive documentation
- ✅ **Missing Tests** - Sets up test infrastructure
- ✅ **Missing CI/CD** - Creates GitHub Actions workflows
- ✅ **Missing License** - Adds appropriate license file

### Medium Priority
- ✅ **Code Quality Issues** - Fixes linting, formatting
- ✅ **Security Issues** - Addresses vulnerabilities
- ✅ **Performance Issues** - Optimizes code patterns

---

## Reports

All reports are saved to:
```
BEAST-MODE-PRODUCT/reports/repo-reviews/
```

### Report Files

1. **JSON Report** (`repo-review-*.json`)
   - Complete detailed results
   - Quality scores, recommendations, improvement plans
   - Generated files with code

2. **Markdown Summary** (`repo-review-summary-*.md`)
   - Human-readable summary
   - Score distribution
   - Top issues
   - Repos needing attention

---

## Repository Discovery

The system discovers repos from multiple sources:

1. **Local Directories**
   - Scans workspace for `package.json` files
   - Checks for git remotes
   - Finds all Node.js projects

2. **GitHub CLI**
   - Uses `gh repo list` to get all GitHub repos
   - Includes both public and private repos

3. **BEAST MODE API**
   - Fetches repos from connected GitHub account
   - Includes enterprise repos

---

## Quality Scoring

BEAST MODE uses ML models to score repositories (0-100):

- **90-100:** Excellent - Production-ready
- **80-89:** Good - Minor improvements needed
- **70-79:** Fair - Some issues to address
- **60-69:** Needs Work - Significant improvements needed
- **0-59:** Poor - Major refactoring required

### Scoring Factors

- Code Structure (25%)
- Maintainability (20%)
- Performance (15%)
- Security (15%)
- Testing (10%)
- Standards Compliance (10%)
- Dependencies (5%)

---

## Improvement Plans

For each repo scoring below 80, the system generates:

1. **Recommendations** - Specific actions to improve quality
2. **Generated Files** - Ready-to-use code/files
3. **Estimated Impact** - Expected quality score improvement
4. **Priority** - High/Medium/Low based on ROI

### Example Improvement Plan

```json
{
  "repo": "repairman29/smugglers",
  "currentQuality": 0.75,
  "targetQuality": 0.80,
  "generatedFiles": [
    {
      "fileName": "README.md",
      "code": "# Smugglers\n\n...",
      "actionType": "create",
      "estimatedImpact": 0.10
    },
    {
      "fileName": ".github/workflows/ci.yml",
      "code": "name: CI\n...",
      "actionType": "create",
      "estimatedImpact": 0.115
    }
  ]
}
```

---

## Workflow

### Complete Review & Fix Workflow

```bash
# Step 1: Review all repos and generate improvement plans
npm run review:all-repos:fix

# Step 2: Review the generated report
cat reports/repo-reviews/repo-review-summary-*.md

# Step 3: Apply fixes to local repos
npm run apply:fixes

# Step 4: Review changes
git status
git diff

# Step 5: Commit fixes
git add .
git commit -m "Apply BEAST MODE quality improvements"
```

---

## Advanced Usage

### Custom Workspace Root

```bash
WORKSPACE_ROOT=/path/to/repos npm run review:all-repos:fix
```

### Apply Fixes to Specific Repo

```bash
npm run apply:fixes -- --repo=repairman29/smugglers
```

### Apply Fixes Immediately (No Dry Run)

```bash
npm run review:all-repos:apply
```

⚠️ **Warning:** This applies fixes directly without review!

---

## Troubleshooting

### No Repositories Found

1. **Check GitHub CLI:**
   ```bash
   gh auth status
   gh repo list
   ```

2. **Connect GitHub to BEAST MODE:**
   ```bash
   beast-mode repos connect
   ```

3. **Add Repos Manually:**
   ```bash
   beast-mode repos add https://github.com/user/repo
   ```

### API Not Available

If `http://localhost:3000` is not available:

1. Start BEAST MODE website:
   ```bash
   cd BEAST-MODE-PRODUCT/website
   npm run dev
   ```

2. Or set custom API URL:
   ```bash
   BEAST_MODE_API_URL=https://your-api-url.com npm run review:all-repos:fix
   ```

### Fixes Not Applied

1. Check if improvement plan exists in report
2. Verify local path is correct
3. Check file permissions
4. Review error messages in summary

---

## Examples

### Review All Repos

```bash
$ npm run review:all-repos:fix

🚀 BEAST MODE Repository Review & Fix System
============================================================
🌐 API URL: http://localhost:3000
🔧 Auto-fix: ENABLED
🧪 Dry run: YES
============================================================

📡 Discovering repositories from local directories...
  ✅ Found 36 local repositories/projects
📡 Fetching repositories from GitHub CLI...
  ✅ Found 57 GitHub repositories

✅ Found 88 repositories to review

📊 Processing 88 repositories in batches of 10...

📦 Batch 1/9 (10 repos)
  🔍 Analyzing repairman29/smugglers...
    ⚠️ repairman29/smugglers: 75.0/100 (F)
  🔧 Attempting to fix issues...
    ✅ Generated improvement plan (3 files)

...

📊 FINAL SUMMARY
============================================================
Total Repos: 88
Successful: 85
Failed: 3
Average Score: 72.5/100
Repos with Fixes: 42
============================================================
```

### Apply Fixes

```bash
$ npm run apply:fixes

🔧 BEAST MODE Fix Application System
============================================================
📁 Workspace: /Users/jeffadkins/Smugglers
============================================================

📊 Loading latest review report...
  ✅ Found: repo-review-2026-01-09T06-01-05-506Z.json

✅ Found 42 repositories with fixes to apply

📦 Processing repairman29/smugglers...
  📝 Applying fixes...
    ✅ Created README.md
    ✅ Created .github/workflows/ci.yml
    ✅ Created tests/index.test.js
  ✅ Applied 3 fixes

...

📊 SUMMARY
============================================================
Total Repos: 42
✅ Applied Fixes: 40
❌ Failed: 2
============================================================
```

---

## Next Steps

1. **Review Reports** - Check what issues were found
2. **Apply Fixes** - Run the apply script to fix local repos
3. **Commit Changes** - Review and commit the improvements
4. **Re-run Review** - Verify quality improvements

---

## Related Documentation

- [Quality Scoring System](../docs/features/quality-scoring.md)
- [Quality Validation System](../docs/QUALITY_VALIDATION_SYSTEM.md)
- [Automated Quality Improvement](../docs/QUALITY_TO_CODE_IMPROVEMENT_GAP.md)

---

**Last Updated:** 2026-01-09
**Status:** ✅ Active and Ready
