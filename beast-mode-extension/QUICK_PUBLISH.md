# Quick Publish - Simplest Path

**Stuck on Azure PAT? Here's the simplest way:**

---

## ⚡ Super Quick Method (2 minutes)

### Option 1: Direct Link to Create Token
1. **Open this link:** https://dev.azure.com/_usersSettings/tokens
2. **Sign in** if prompted
3. **Click "New Token"**
4. **Fill in:**
   - Name: `VS Code Marketplace`
   - Organization: `All accessible organizations`
   - Scopes: Find **"Marketplace"** → Check **"Manage"**
5. **Click "Create"**
6. **Copy the token** (long string of characters)

### Option 2: If Direct Link Doesn't Work
1. Go to: https://dev.azure.com
2. Click your **profile picture** (top right)
3. Click **"User settings"** or **"Security"**
4. Click **"Personal access tokens"**
5. Follow steps 3-6 above

---

## 🚀 Use the Token

```bash
cd beast-mode-extension
vsce login beast-mode
# Paste your token when prompted (press Enter)
vsce publish
```

---

## 🐛 Still Stuck?

### Can't Access Azure DevOps?
- Create free account: https://account.microsoft.com
- Then go to: https://dev.azure.com

### Need to Create Organization?
- Go to: https://dev.azure.com
- Click "Create organization" (free)
- Then create token

### Can't Find Marketplace Scope?
- Look for "Marketplace" in the scopes list
- If not visible, try "Full access" (temporary)
- Or scroll down to find it

---

## 💡 Alternative: Use GitHub Actions

If Azure PAT is too complicated, we can set up GitHub Actions to publish automatically. Let me know if you want to go that route instead.

---

**The token is just for authentication - it's safe and can be revoked anytime.**
