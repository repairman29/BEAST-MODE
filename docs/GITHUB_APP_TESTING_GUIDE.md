# GitHub App Testing Guide

**Date:** 2026-01-09  
**Status:** App installed on all @repairman29 repositories ✅

---

## ✅ Installation Status

Your GitHub App is installed on all repositories under the `@repairman29` account. This means:

- ✅ App is active and ready to receive webhooks
- ✅ All repos can trigger BEAST MODE quality checks
- ✅ PR comments and status checks will work automatically

---

## 🧪 Testing the Integration

### Quick Test

```bash
beast-mode github-app test
```

This will verify:
- ✅ GitHub App configuration
- ✅ API access to repositories
- ✅ PR Comment Service formatting
- ✅ Status Check Service formatting

---

## 📋 Manual Testing Steps

### 1. Test Webhook Deliveries

1. Go to: https://github.com/settings/apps/beast-mode-dev
2. Click **"Advanced"** → **"Recent Deliveries"**
3. You should see recent webhook events:
   - `installation` - When app was installed
   - `installation_repositories` - When repos were added
   - `pull_request` - When PRs are opened/updated
   - `push` - When code is pushed

**Green checkmarks = successful deliveries** ✅

---

### 2. Test PR Comments

1. **Create a test PR** in any @repairman29 repo:
   ```bash
   # In any repo
   git checkout -b test-beast-mode
   # Make some changes
   git commit -m "test: BEAST MODE integration"
   git push origin test-beast-mode
   # Create PR on GitHub
   ```

2. **BEAST MODE will automatically:**
   - Analyze the PR code
   - Post a quality comment with:
     - Quality score (0-100)
     - Issues found
     - Recommendations
     - Quick action links

3. **Check the PR** - you should see a comment like:
   ```
   ## 🟢 BEAST MODE Quality Check
   
   **Quality Score:** 75/100
   
   ### 🔍 Issues Found: 5
   - 🔴 High Priority: 2
   - 🟡 Medium Priority: 2
   - 🟢 Low Priority: 1
   
   ### 💡 Top Recommendations:
   1. Add error handling
   2. Improve documentation
   ...
   ```

---

### 3. Test Status Checks

1. **In the same PR**, check the **"Checks"** tab
2. You should see: **"BEAST MODE Quality Check"**
3. Status will be:
   - ✅ **Success** (green) if quality ≥ 60
   - ❌ **Failure** (red) if quality < 60

4. **Click the check** to see:
   - Quality score
   - Issues breakdown
   - Recommendations
   - Link to full report

---

### 4. Test Push Events

1. **Push to main/master branch** in any repo
2. BEAST MODE will:
   - Analyze the code
   - Update quality badge (if enabled)
   - Create status check for the commit

---

## 🔍 Troubleshooting

### Webhook Deliveries Show Errors

**Problem:** Red X marks in webhook deliveries

**Solution:**
1. Check webhook URL: `https://beast-mode.dev/api/github/webhook`
2. Verify the endpoint is accessible
3. Check server logs for errors
4. Verify webhook secret matches

### PR Comments Not Appearing

**Problem:** PR opened but no comment from BEAST MODE

**Solution:**
1. Check webhook deliveries - is `pull_request` event received?
2. Check server logs for errors
3. Verify app has `Pull requests: Write` permission
4. Check if PR is from a fork (may need different handling)

### Status Checks Not Appearing

**Problem:** No status check in PR

**Solution:**
1. Verify app has `Checks: Write` permission
2. Check webhook deliveries for `pull_request` event
3. Verify status check service is working
4. Check server logs for errors

---

## 📊 Expected Behavior

### When PR is Opened:
1. ✅ Webhook receives `pull_request` event (action: `opened`)
2. ✅ BEAST MODE analyzes PR code
3. ✅ PR comment posted with quality analysis
4. ✅ Status check created with quality gate

### When PR is Updated:
1. ✅ Webhook receives `pull_request` event (action: `synchronize`)
2. ✅ BEAST MODE re-analyzes PR code
3. ✅ PR comment updated with new analysis
4. ✅ Status check updated with new quality score

### When Code is Pushed:
1. ✅ Webhook receives `push` event
2. ✅ BEAST MODE analyzes commit
3. ✅ Status check created for commit

---

## 🚀 Next Steps

1. **Create a test PR** to verify everything works
2. **Monitor webhook deliveries** for any errors
3. **Check server logs** if something doesn't work
4. **Adjust quality threshold** if needed (default: 60)

---

## 📚 Related Documentation

- `docs/GITHUB_APP_QUICK_START.md` - Initial setup
- `docs/GITHUB_APP_EVENTS_WORKAROUND.md` - Events configuration
- `docs/GITHUB_APP_PERMISSIONS_UPDATE.md` - Permissions guide

---

**Your GitHub App is installed and ready! Create a test PR to see it in action! 🎉**
