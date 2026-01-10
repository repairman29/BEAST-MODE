# GitHub App Quick Start Guide

**Date:** 2026-01-09  
**Status:** Ready to use

---

## 🚀 Quick Setup (5 minutes)

### Step 1: Generate Manifest
```bash
cd BEAST-MODE-PRODUCT
beast-mode github-app manifest
```

Or use interactive setup:
```bash
beast-mode github-app setup
# Choose option 1
```

### Step 2: Create GitHub App

1. **Go to GitHub App creation page:**
   - https://github.com/settings/apps/new
   - Or the CLI will open it for you

2. **Scroll to "Manifest" section** (at the bottom)

3. **Paste the manifest JSON** from `.github-app-manifest.json`

4. **Click "Create GitHub App"**

### Step 3: Save Credentials

After creating the app, GitHub will show you:
- App ID
- Client ID  
- Client Secret
- Webhook Secret

**Download the private key** (one-time download!)

Then run:
```bash
beast-mode github-app save-credentials
```

Enter the credentials when prompted.

### Step 4: Verify Setup

```bash
beast-mode github-app check
```

Should show:
```
✅ GITHUB_APP_ID
✅ GITHUB_APP_PRIVATE_KEY
✅ GITHUB_APP_WEBHOOK_SECRET
```

---

## 📋 Manifest Contents

The generated manifest includes:

```json
{
  "name": "BEAST MODE",
  "url": "https://beast-mode.dev",
  "hook_attributes": {
    "url": "https://beast-mode.dev/api/github/webhook",
    "active": true
  },
  "redirect_url": "https://beast-mode.dev/api/github/app/callback",
  "public": false,
  "default_permissions": {
    "contents": "read",
    "metadata": "read",
    "pull_requests": "write",
    "checks": "write",
    "issues": "read"
  },
  "default_events": [
    "pull_request",
    "push",
    "installation",
    "installation_repositories"
  ]
}
```

---

## 🔧 What Gets Configured

### Permissions:
- **Contents:** Read (to scan repos)
- **Metadata:** Read (repo info)
- **Pull Requests:** Write (post comments)
- **Checks:** Write (status checks)
- **Issues:** Read (for context)

### Webhook Events:
- `pull_request` - When PRs are opened/updated
- `push` - When code is pushed
- `installation` - When app is installed
- `installation_repositories` - When repos are added/removed

---

## ✅ After Setup

Once configured, BEAST MODE will:
- ✅ Automatically scan PRs when opened
- ✅ Post quality comments on PRs
- ✅ Create status checks
- ✅ Block PRs if quality < threshold (configurable)

---

## 🧪 Test It

1. **Install app on a test repo:**
   - Go to your GitHub App settings
   - Click "Install App"
   - Select a test repository

2. **Create a test PR:**
   - Make a small change
   - Open a PR
   - BEAST MODE should automatically comment!

3. **Check webhook logs:**
   - Go to your GitHub App settings
   - Click "Advanced" → "Recent Deliveries"
   - You should see webhook events

---

## 🐛 Troubleshooting

### Webhook not receiving events?
- Check webhook URL is correct: `https://beast-mode.dev/api/github/webhook`
- Verify webhook secret matches
- Check webhook deliveries in GitHub App settings

### Status checks not appearing?
- Verify `checks: write` permission is enabled
- Check installation token is valid
- Review webhook logs for errors

### PR comments not posting?
- Verify `pull_requests: write` permission
- Check webhook is receiving `pull_request` events
- Review server logs

---

## 📚 Next Steps

After GitHub App is set up:
1. Implement PR comment service
2. Implement status check service
3. Test end-to-end
4. Deploy to production

See `docs/GITHUB_APP_IMPLEMENTATION_PLAN.md` for details.

---

**Ready to go! 🚀**
