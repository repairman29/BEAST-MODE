# Publishing Clarification: VS Code Marketplace vs npm

**Important:** VS Code extensions are **NOT** published to npm.

---

## 📦 Where Extensions Are Published

### VS Code Marketplace
- **Platform:** https://marketplace.visualstudio.com
- **Authentication:** Microsoft/Azure account
- **Tool:** `vsce` (VS Code Extension manager)
- **This is where BEAST MODE extension goes**

### npm (Not Used for Extensions)
- **Platform:** https://www.npmjs.com
- **Authentication:** npm account
- **Tool:** `npm publish`
- **Used for:** Node.js packages, not VS Code extensions

---

## 🔑 What You Need

### For VS Code Extension Publishing:
1. **Microsoft/Azure account** (free to create)
   - Can use existing Microsoft account
   - Or create new one at https://account.microsoft.com
   - Does NOT need to match your npm account

2. **Publisher account** on VS Code Marketplace
   - Create at: https://marketplace.visualstudio.com/manage
   - Publisher ID: `beast-mode`
   - One-time setup

3. **Personal Access Token** from Azure DevOps
   - Get at: https://dev.azure.com
   - Scope: "Marketplace (Manage)"
   - Used for authentication

---

## 🚀 Quick Publish Steps

```bash
# 1. Create publisher account (one-time)
# Go to: https://marketplace.visualstudio.com/manage

# 2. Get Personal Access Token (one-time)
# Go to: https://dev.azure.com → Personal Access Tokens

# 3. Login
cd beast-mode-extension
vsce login beast-mode
# Enter token when prompted

# 4. Publish
vsce publish
```

---

## 💡 Why Not npm?

- **VS Code extensions** are special packages
- They need to be in **VS Code Marketplace** for users to find them
- VS Code automatically searches the marketplace
- npm is for Node.js packages, not IDE extensions

---

## ✅ Your npm Account

Your npm account is still useful for:
- Publishing Node.js packages
- Publishing CLI tools
- But NOT for VS Code extensions

---

**Bottom Line:** Use Microsoft account for VS Code Marketplace, npm account for npm packages.
