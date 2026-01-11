# Publish Extension Now - Quick Guide

**Status:** ✅ Extension ready to publish  
**Package:** `beast-mode-extension-0.1.0.vsix` (615KB)

---

## ⚡ Quick Publish (5 minutes)

VS Code extensions publish to **VS Code Marketplace** (not npm).  
You need a **Microsoft/Azure account** (free to create, can use existing).

---

## Step 1: Create Publisher Account (2 minutes)

1. Go to: **https://marketplace.visualstudio.com/manage**
2. Sign in with Microsoft account (or create free account)
3. Click **"Create Publisher"**
4. Enter:
   - **Publisher ID:** `beast-mode`
   - **Publisher Name:** `BEAST MODE`
5. Accept terms and create

---

## Step 2: Get Personal Access Token (2 minutes)

1. Go to: **https://dev.azure.com**
2. Click your **profile** → **Security**
3. Click **"Personal access tokens"**
4. Click **"New Token"**
5. Fill in:
   - **Name:** `VS Code Marketplace`
   - **Organization:** All accessible organizations
   - **Scopes:** Select **"Marketplace (Manage)"**
6. Click **"Create"**
7. **Copy the token immediately** (you won't see it again!)

---

## Step 3: Login and Publish (1 minute)

```bash
cd beast-mode-extension
vsce login beast-mode
# Enter your Personal Access Token when prompted

vsce publish
```

That's it! Extension will be live in a few minutes.

---

## ✅ Verify Publication

1. Go to: **https://marketplace.visualstudio.com**
2. Search for **"BEAST MODE"**
3. Verify extension appears
4. Check extension page

---

## 💡 Notes

- **Microsoft account is free** - You can create one if you don't have one
- **Doesn't need to match npm account** - Separate systems
- **Token is one-time** - Copy it immediately
- **Extension will be public** - Anyone can install it

---

## 🚀 After Publishing

1. Share extension link
2. Launch marketing campaign
3. Monitor installs and reviews
4. Iterate based on feedback

---

**Ready to publish!** Follow the steps above.
