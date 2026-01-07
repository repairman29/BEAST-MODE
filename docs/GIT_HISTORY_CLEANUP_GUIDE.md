# Git History Cleanup Guide
## Removing Sensitive Files from Public Repository History

**Date:** January 8, 2026  
**Status:** 📋 **CLEANUP GUIDE**

---

## ⚠️ **WARNING**

**Rewriting git history is destructive!**
- ⚠️ All team members will need to re-clone
- ⚠️ All forks will be out of sync
- ⚠️ Force push required (coordinate with team)
- ⚠️ Backup first!

---

## 🔍 **STEP 1: Check What's in History**

### **Check for Sensitive Files**

```bash
cd BEAST-MODE-PRODUCT

# Check for pricing files
git log --all --full-history --oneline -- "docs/PRICING_*.md"

# Check for margin files
git log --all --full-history --oneline -- "docs/*MARGIN*.md"

# Check for cost files
git log --all --full-history --oneline -- "docs/*COST*.md"

# Or use the script
./scripts/check-sensitive-files.sh
```

### **If Files Are Found**

You have two options:
1. **Remove from history** (recommended for public repos)
2. **Leave in history** (if repo is private or files aren't sensitive)

---

## 🗑️ **STEP 2: Remove from History**

### **Option A: Using git filter-branch** (Built-in)

```bash
# Remove specific file
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch 'docs/PRICING_90_PERCENT_MARGIN_STRATEGY.md'" \
  --prune-empty --tag-name-filter cat -- --all

# Remove multiple files
for file in \
  "docs/PRICING_90_PERCENT_MARGIN_STRATEGY.md" \
  "docs/PRICING_MODEL_DESIGN.md" \
  "docs/INFRASTRUCTURE_COST_ANALYSIS.md"; do
  git filter-branch --force --index-filter \
    "git rm --cached --ignore-unmatch '$file'" \
    --prune-empty --tag-name-filter cat -- --all
done
```

### **Option B: Using BFG Repo-Cleaner** (Faster, Recommended)

```bash
# Install BFG
brew install bfg  # macOS
# or download from: https://rtyley.github.io/bfg-repo-cleaner/

# Clone a fresh copy (BFG needs a bare repo)
cd /tmp
git clone --mirror https://github.com/repairman29/BEAST-MODE.git

# Remove sensitive files
bfg --delete-files PRICING_90_PERCENT_MARGIN_STRATEGY.md BEAST-MODE.git
bfg --delete-files PRICING_MODEL_DESIGN.md BEAST-MODE.git
bfg --delete-files INFRASTRUCTURE_COST_ANALYSIS.md BEAST-MODE.git

# Clean up
cd BEAST-MODE.git
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Push
git push --force
```

### **Option C: Using Script**

```bash
./scripts/remove-sensitive-from-history.sh
```

---

## 🚀 **STEP 3: Force Push**

**⚠️ Coordinate with team first!**

```bash
# Force push all branches
git push origin --force --all

# Force push all tags
git push origin --force --tags
```

---

## 👥 **STEP 4: Team Coordination**

### **Notify Team**

1. **Announce** that history was rewritten
2. **Provide** re-clone instructions
3. **Update** all forks

### **Team Members Must:**

```bash
# Option 1: Re-clone (safest)
cd ..
rm -rf BEAST-MODE-PRODUCT
git clone https://github.com/repairman29/BEAST-MODE.git BEAST-MODE-PRODUCT

# Option 2: Reset local (if no uncommitted changes)
git fetch origin
git reset --hard origin/main
git clean -fd
```

---

## ✅ **STEP 5: Verify Cleanup**

```bash
# Check that files are gone from history
git log --all --full-history --oneline -- "docs/PRICING_*.md"
# Should return nothing

# Verify .gitignore is working
./scripts/check-sensitive-files.sh
# Should show ✅ No sensitive files found!
```

---

## 🛡️ **STEP 6: Prevent Future Issues**

### **Pre-commit Hook**

```bash
# Install husky (if not already)
npm install --save-dev husky
npx husky install

# The pre-commit hook is already in .husky/pre-commit
# It will block commits with sensitive files
```

### **Regular Audits**

```bash
# Run before each release
./scripts/check-sensitive-files.sh
```

---

## 📋 **SENSITIVE FILES TO REMOVE**

### **BEAST-MODE-PRODUCT**
- `docs/PRICING_90_PERCENT_MARGIN_STRATEGY.md`
- `docs/PRICING_MODEL_DESIGN.md`
- `docs/PRICING_STRATEGY_REVIEW.md`
- `docs/COMPETITIVE_PRICING_ANALYSIS.md`
- `docs/INFRASTRUCTURE_COST_ANALYSIS.md`
- `docs/business/`
- `docs/STRATEGIC_ROADMAP*.md`
- `docs/ACTIONABLE_IMPLEMENTATION_PLAN.md`
- `docs/EXECUTIVE_SUMMARY*.md`
- `docs/MODEL_BUSINESS_VALUE_STRATEGY.md`

### **echeo-landing**
- `docs/MARGIN_OPTIMIZATION_PLAN.md`
- `docs/PRICING_*.md`
- `docs/CUSTOMER_PRICING_TRANSPARENCY.md`
- `docs/*_STRATEGY.md` (business strategies)

---

## 🎯 **QUICK REFERENCE**

### **Check History**
```bash
git log --all --full-history --oneline -- "docs/PRICING_*.md"
```

### **Remove from History (git filter-branch)**
```bash
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch 'FILE'" \
  --prune-empty --tag-name-filter cat -- --all
```

### **Remove from History (BFG)**
```bash
bfg --delete-files FILE.git
```

### **Force Push**
```bash
git push origin --force --all --tags
```

---

## ⚠️ **IMPORTANT NOTES**

1. **Backup First:** Always backup before rewriting history
2. **Coordinate:** Tell team before force pushing
3. **Test Locally:** Test on a clone first
4. **Document:** Document what was removed and why
5. **Verify:** Always verify cleanup worked

---

## 📝 **ALTERNATIVE: Create New Repo**

If history cleanup is too risky:

1. Create new clean repo
2. Copy only safe files
3. Start fresh history
4. Archive old repo

---

**Last Updated:** January 8, 2026  
**Status:** Ready for use

