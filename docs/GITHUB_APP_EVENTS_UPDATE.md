# GitHub App Events Update

**Date:** 2026-01-09  
**Issue:** Missing events in GitHub App configuration

---

## ⚠️ Missing Events

Your GitHub App needs these events to be subscribed to:

- ✅ **Pull request** (already subscribed)
- ✅ **Push** (already subscribed)
- ❌ **Installation** (MISSING - needed for app installation tracking)
- ❌ **Installation repositories** (MISSING - needed for repo add/remove tracking)

---

## 🔧 How to Add Missing Events

### Step 1: Go to GitHub App Settings
1. Go to: https://github.com/settings/apps
2. Find your "BEAST MODE" app
3. Click on it

### Step 2: Update Events
1. Scroll down to **"Subscribe to events"** section
2. Check these additional boxes:
   - ✅ **Installation** - When app is installed/uninstalled
   - ✅ **Installation repositories** - When repos are added/removed

### Step 3: Save Changes
1. Scroll to bottom
2. Click **"Save changes"**

---

## 📋 Why These Events Are Needed

### Installation Event
- **When:** App is installed or uninstalled on a repo/org
- **What we do:** Track which repos have the app installed
- **Use case:** Know which repos to scan automatically

### Installation Repositories Event
- **When:** Repositories are added or removed from an installation
- **What we do:** Update our list of monitored repos
- **Use case:** Automatically start/stop monitoring repos

---

## ✅ After Adding Events

Once you've added the events:

1. **Test webhook delivery:**
   - Go to your GitHub App settings
   - Click "Advanced" → "Recent Deliveries"
   - You should see events when you install/uninstall the app

2. **Install app on test repo:**
   - Go to your GitHub App settings
   - Click "Install App"
   - Select a test repository
   - You should see an `installation` event in webhook deliveries

3. **Verify in BEAST MODE:**
   - Check webhook logs
   - Should see `installation` and `installation_repositories` events

---

## 🚀 Quick Fix

**Go to:** https://github.com/settings/apps/2628268  
**Section:** "Subscribe to events"  
**Add:** ✅ Installation, ✅ Installation repositories  
**Save:** Click "Save changes"

---

**That's it! Your GitHub App will now receive all necessary events. 🎉**
