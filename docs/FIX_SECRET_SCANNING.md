# Fix GitHub Secret Scanning Issue

## 🔍 Problem

GitHub is detecting secrets in commit `9c3e44ee`:
- **File:** `website/.env.local.bak`
- **Line:** 62
- **Issue:** Backup file with environment variables was committed to git

## ✅ Why This Happened

1. `.env.local.bak` was created (backup of `.env.local`)
2. File was accidentally committed to git
3. GitHub's secret scanning detected API keys/secrets in the file
4. Push is now blocked to prevent secret exposure

## 🔧 Solutions

### Option 1: Use GitHub URL to Unblock (Quick Fix)

**Use this URL to allow the secret:**
```
https://github.com/repairman29/BEAST-MODE/security/secret-scanning/unblock-secret/385q4NqZe6WJl3DF5
```

**Steps:**
1. Click the URL above
2. Review what secret was detected
3. Click "Allow" if it's a false positive or already rotated
4. Push will then succeed

**⚠️ Note:** This doesn't remove the secret from history, just allows the push.

---

### Option 2: Remove from Git History (Recommended)

**Method A: Interactive Rebase**

```bash
# Start interactive rebase
git rebase -i 58efcea7^

# In the editor, find the commit that adds .env.local.bak
# Change 'pick' to 'edit' for that commit
# Save and close

# Remove the file
git rm --cached website/.env.local.bak
git commit --amend --no-edit

# Continue rebase
git rebase --continue

# Force push (after unblocking on GitHub)
git push origin main --force
```

**Method B: New Commit to Remove**

```bash
# Remove from current commit
git rm --cached website/.env.local.bak
git commit --amend --no-edit

# Force push (after unblocking on GitHub)
git push origin main --force
```

**Method C: git-filter-repo (Most Thorough)**

```bash
# Install git-filter-repo
pip install git-filter-repo

# Remove file from all history
git filter-repo --path website/.env.local.bak --invert-paths --force

# Force push (after unblocking on GitHub)
git push origin main --force
```

---

### Option 3: Rotate Secrets (If Exposed)

If the secrets were exposed publicly:

1. **Rotate all secrets in `.env.local.bak`:**
   - GitHub tokens
   - API keys
   - Database passwords
   - Stripe keys

2. **Update in:**
   - `.env.local` (local)
   - Vercel environment variables (production)
   - GitHub App settings (if webhook secret)

3. **Then remove from history** (Option 2)

---

## 🛡️ Prevention

### 1. Update .gitignore

Ensure these patterns are in `.gitignore`:

```gitignore
# Environment files
.env
.env.*
.env.local
.env.local.*
*.env
*.env.*
.env.local.bak
.env*.bak
```

### 2. Pre-commit Hook

Add to `.git/hooks/pre-commit`:

```bash
#!/bin/bash
# Prevent committing .env files
if git diff --cached --name-only | grep -E '\.env|env\.local'; then
  echo "❌ Error: Attempting to commit .env file!"
  echo "Please remove .env files from staging:"
  echo "  git reset HEAD <file>"
  exit 1
fi
```

### 3. Use git-secrets

```bash
# Install
brew install git-secrets

# Configure
git secrets --install
git secrets --register-aws
git secrets --add 'sk-[A-Za-z0-9]{32,}'
git secrets --add 'ghp_[A-Za-z0-9]{36}'
```

---

## 📋 Current Status

- ✅ **Webhook Secret:** Correctly configured as `GITHUB_APP_WEBHOOK_SECRET`
- ✅ **Migration:** Applied via exec_sql
- ⚠️ **Deployment:** Blocked by secret scanning
- ⚠️ **File:** `website/.env.local.bak` in commit `9c3e44ee`

---

## 🚀 Quick Fix (Recommended)

**For immediate deployment:**

1. **Unblock on GitHub:**
   - Visit: https://github.com/repairman29/BEAST-MODE/security/secret-scanning/unblock-secret/385q4NqZe6WJl3DF5
   - Click "Allow" if secret is already rotated or false positive

2. **Then push:**
   ```bash
   git push origin main
   ```

3. **Clean up later:**
   - Remove `.env.local.bak` from history when convenient
   - Update `.gitignore` to prevent future issues

---

## ✅ Verification

After fixing, verify:

```bash
# Check .gitignore
grep -E "\.env|env\.local" .gitignore

# Check no .env files are tracked
git ls-files | grep -E "\.env|env\.local"

# Should return nothing (or only .env.example)
```

