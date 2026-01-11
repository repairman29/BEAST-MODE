# Azure Personal Access Token - Step-by-Step Guide

**Purpose:** Get Personal Access Token to publish VS Code extension  
**Time:** 2-3 minutes

---

## 🎯 Step-by-Step Instructions

### Step 1: Go to Azure DevOps
1. Open browser
2. Go to: **https://dev.azure.com**
3. Sign in with your Microsoft account
   - If you don't have one, create it (free): https://account.microsoft.com

### Step 2: Access Security Settings
1. Click your **profile picture** (top right)
2. Click **"Security"** from the dropdown menu
   - If you don't see "Security", try clicking your name/email first

### Step 3: Find Personal Access Tokens
1. In the Security page, look for **"Personal access tokens"** section
2. Click **"Personal access tokens"** link
   - Alternative: Look for "Tokens" or "PAT" in the menu

### Step 4: Create New Token
1. Click **"New Token"** button (usually top right)
2. Fill in the form:
   - **Name:** `VS Code Marketplace`
   - **Organization:** Select "All accessible organizations"
   - **Expiration:** Choose duration (30 days, 90 days, or custom)
   - **Scopes:** 
     - Find **"Marketplace"** section
     - Check **"Manage"** checkbox
     - (You can also check "Read" if "Manage" isn't available)

### Step 5: Create and Copy Token
1. Click **"Create"** button
2. **IMPORTANT:** Copy the token immediately
   - It will look like: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - You won't be able to see it again!
   - Save it somewhere safe

### Step 6: Use Token
```bash
cd beast-mode-extension
vsce login beast-mode
# Paste your token when prompted
```

---

## 🐛 Common Issues & Solutions

### Issue 1: Can't Find Security Page
**Solution:**
- Try: https://dev.azure.com/_usersSettings/tokens
- Or: Click your profile → "User settings" → "Security"

### Issue 2: No "Personal Access Tokens" Option
**Solution:**
- You might need to create an Azure DevOps organization first
- Go to: https://dev.azure.com
- Click "Create organization" (free)
- Then try again

### Issue 3: Can't Find "Marketplace" Scope
**Solution:**
- Look for "Marketplace" in the scopes list
- If not available, try "Full access" (temporary)
- Or use "Custom defined" and add marketplace permissions

### Issue 4: Token Doesn't Work
**Solution:**
- Make sure you copied the entire token (no spaces)
- Check expiration date
- Try creating a new token
- Make sure "Manage" scope is selected

---

## 💡 Alternative: Use Existing Token

If you already have an Azure DevOps token:
1. Check if it has "Marketplace" scope
2. If yes, use it: `vsce login beast-mode`
3. If no, create a new one with Marketplace scope

---

## 🔗 Direct Links

- **Azure DevOps:** https://dev.azure.com
- **Create Token:** https://dev.azure.com/_usersSettings/tokens
- **User Settings:** https://dev.azure.com/_usersSettings/
- **Create Organization:** https://dev.azure.com

---

## ✅ Quick Checklist

- [ ] Signed in to Azure DevOps
- [ ] Found Security/Personal Access Tokens page
- [ ] Created new token
- [ ] Named it "VS Code Marketplace"
- [ ] Selected "Marketplace (Manage)" scope
- [ ] Copied token immediately
- [ ] Ready to use: `vsce login beast-mode`

---

**Need Help?** The token is just for authentication - it's safe and can be revoked anytime.
