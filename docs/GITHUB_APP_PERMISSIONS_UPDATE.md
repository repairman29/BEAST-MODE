# GitHub App Permissions Update

**Date:** 2026-01-09  
**Issue:** Installation and Installation repositories events not showing

---

## 🔍 Problem

GitHub App settings shows "Based on the permissions you've selected, what events would you like to subscribe to?" but `Installation` and `Installation repositories` events are not visible.

**Root Cause:** These events require specific permissions or the app needs to be configured as installable.

---

## ✅ Solution: Update Permissions

### Current Permissions (Basic)
- Contents: Read-only
- Metadata: Read-only
- Pull requests: Read & write
- Checks: Read & write
- Issues: Read-only

### Required Permissions for Installation Events

The `installation` and `installation_repositories` events should be available by default, but sometimes GitHub requires:

1. **Repository administration** (optional, but helps):
   - **Administration:** `Read-only` (to track installations)

2. **Or ensure app is installable:**
   - Make sure "Where can this GitHub App be installed?" is set correctly
   - If set to "Only on this account", events should still work

---

## 📋 Step-by-Step Fix

### Option 1: Add Administration Permission (Recommended)

1. Go to: https://github.com/settings/apps/2628268
2. Scroll to **"Repository permissions"** section
3. Find **"Administration"** permission
4. Set to: **"Read-only"**
5. Scroll down and click **"Save changes"**
6. Now check **"Subscribe to events"** section
7. You should now see:
   - ✅ Installation
   - ✅ Installation repositories

### Option 2: Check Installation Settings

1. Go to: https://github.com/settings/apps/2628268
2. Scroll to **"Where can this GitHub App be installed?"**
3. Make sure it's set to **"Only on this account"** or **"Any account"**
4. If you change it, click **"Save changes"**
5. Refresh the page
6. Check **"Subscribe to events"** section again

---

## 🔧 Updated Permissions List

### Repository Permissions
- **Contents:** `Read-only` ✅
- **Metadata:** `Read-only` ✅
- **Pull requests:** `Read & write` ✅
- **Checks:** `Read & write` ✅
- **Issues:** `Read-only` ✅
- **Administration:** `Read-only` ⬅️ **ADD THIS**

### Organization Permissions
- Leave all as "No access" (unless you need org features)

### Account Permissions
- Leave all as "No access" (unless you need user account features)

---

## 📋 Events to Subscribe To

After adding the Administration permission, you should see these events:

- ✅ **Pull request** (already subscribed)
- ✅ **Push** (already subscribed)
- ✅ **Installation** (should appear after adding Administration permission)
- ✅ **Installation repositories** (should appear after adding Administration permission)

---

## 🚀 Quick Fix

**Go to:** https://github.com/settings/apps/2628268  
**Section:** "Repository permissions"  
**Add:** Administration → Read-only  
**Save:** Click "Save changes"  
**Then:** Check "Subscribe to events" section

---

## 📚 GitHub Documentation

According to GitHub docs:
- `installation` event is available when the app is installable
- `installation_repositories` event is available when the app is installable
- These events don't require special permissions, but sometimes GitHub's UI only shows events based on selected permissions

**Adding Administration permission often makes these events visible in the UI.**

---

**After adding the permission, the events should appear! 🎉**
