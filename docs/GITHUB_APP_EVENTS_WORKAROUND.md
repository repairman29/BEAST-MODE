# GitHub App Events Workaround

**Date:** 2026-01-09  
**Issue:** Installation events don't appear in GitHub UI even after adding Administration permission

---

## 🔍 Problem

Even after adding **Administration: Read-only** permission and saving, the **Installation** and **Installation repositories** events don't appear in the "Subscribe to events" section.

**This is a known GitHub UI limitation** - sometimes events don't show in the UI even though they're available.

---

## ✅ Solution: Events Work Even If Not Visible

**Good News:** Events can be configured via the GitHub API even if they don't show in the UI. The webhook will still receive events if they're configured programmatically.

---

## 🔧 Method 1: GitHub API (Recommended)

### Step 1: Get Personal Access Token

1. Go to: https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Name: "BEAST MODE App Update"
4. Scopes: Check `admin:write` (or `write:packages` if admin:write not available)
5. Click "Generate token"
6. **Copy the token** (you won't see it again!)

### Step 2: Update Events via API

```bash
curl -X PATCH https://api.github.com/app \
  -H "Authorization: Bearer YOUR_PERSONAL_ACCESS_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  -d '{
    "events": [
      "pull_request",
      "push",
      "installation",
      "installation_repositories"
    ]
  }'
```

**Or use GitHub CLI:**

```bash
gh api -X PATCH /app \
  -f events[]=pull_request \
  -f events[]=push \
  -f events[]=installation \
  -f events[]=installation_repositories
```

---

## 🔧 Method 2: Manual UI Workaround

Sometimes events appear after these steps:

1. **Disable and re-enable Administration permission:**
   - Go to: https://github.com/settings/apps/beast-mode-dev
   - Scroll to "Repository permissions"
   - Set "Administration" to "No access"
   - Click "Save changes"
   - Wait 5 seconds
   - Set "Administration" back to "Read-only"
   - Click "Save changes"
   - Refresh the page
   - Check "Subscribe to events" section

2. **Try searching for events:**
   - Some GitHub UIs have a search box in the events section
   - Try typing "installation" to see if it appears

3. **Check different browser/incognito:**
   - Sometimes UI caching issues
   - Try incognito mode or different browser

---

## 🔧 Method 3: Accept That UI Doesn't Show Them

**Important:** Even if events don't show in the UI, you can still:

1. **Configure them via API** (Method 1 above)
2. **The webhook will receive events** if they're configured
3. **Test by installing the app** - you should see `installation` events in webhook deliveries

---

## ✅ Verify Events Are Working

### Test Installation Event

1. Go to: https://github.com/settings/apps/beast-mode-dev
2. Click "Install App"
3. Select a test repository
4. Click "Install"
5. Go to "Advanced" → "Recent Deliveries"
6. You should see an `installation` event delivery

If you see the event delivery, **events are working** even if they don't show in the UI!

---

## 📋 Quick Test Script

```bash
# Check if events are configured (requires app authentication)
gh api /app | jq '.events'

# Or check webhook deliveries
gh api /app/hook/deliveries | jq '.[0:5] | .[] | {event: .event, status: .status}'
```

---

## 🚀 Recommended Approach

1. **Use GitHub API** (Method 1) to configure events programmatically
2. **Test by installing** the app on a test repo
3. **Check webhook deliveries** to verify events are being received
4. **Don't worry about UI** - if webhooks work, events are configured correctly

---

## 📚 GitHub Documentation

- [GitHub Apps API](https://docs.github.com/en/rest/apps/apps)
- [Webhook Events](https://docs.github.com/en/developers/webhooks-and-events/webhooks/webhook-events-and-payloads)
- [App Permissions](https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/choosing-permissions-for-a-github-app)

---

**Bottom Line:** If webhook deliveries show `installation` events, everything is working correctly, even if the UI doesn't show them! 🎉
