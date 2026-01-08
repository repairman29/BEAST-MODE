# VS Code Extension - Test & Package Guide
## Step-by-Step Instructions

**Date:** January 8, 2026  
**Status:** ✅ **Ready to Test & Package**

---

## 🧪 **STEP 1: Test Extension in VS Code**

### **Method 1: Extension Development Host (Recommended)**

1. **Open VS Code in the extension directory:**
   ```bash
   cd BEAST-MODE-PRODUCT/vscode-extension
   code .
   ```

2. **Launch Extension Development Host:**
   - Press `F5` (or `Cmd+F5` on Mac)
   - OR: Go to **Run > Start Debugging**
   - A new "Extension Development Host" window will open
   - Your extension is now loaded!

3. **Verify Extension Loaded:**
   - Open Output Panel: `View > Output` (or `Cmd+Shift+U`)
   - Select: **"Log (Extension Host)"**
   - Look for: `BEAST MODE extension is now active!` ✅

4. **Test Commands:**
   - Open any code file (`.ts`, `.js`, `.tsx`, etc.)
   - Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows)
   - Type: `BEAST MODE`
   - Try each command:
     - ✅ `BEAST MODE: Analyze Code Quality`
     - ✅ `BEAST MODE: Get AI Suggestions` (or `Cmd+Shift+B`)
     - ✅ `BEAST MODE: Open Codebase Chat` (or `Cmd+Shift+C`)
     - ✅ `BEAST MODE: Generate Tests`
     - ✅ `BEAST MODE: Refactor Code`
     - ✅ `BEAST MODE: Index Codebase`

### **Method 2: Package and Install Locally**

If you want to test as an installed extension:

```bash
# Install vsce globally
npm install -g @vscode/vsce

# Package extension
cd BEAST-MODE-PRODUCT/vscode-extension
npm run package

# Install locally
code --install-extension beast-mode-0.1.0.vsix
```

---

## 📦 **STEP 2: Package Extension**

### **Prerequisites:**
- Extension compiles successfully ✅
- All tests pass ✅
- README updated ✅

### **Package Command:**
```bash
cd BEAST-MODE-PRODUCT/vscode-extension
npm run package
```

This will:
- Run `npm run compile` (prepublish hook)
- Create `beast-mode-0.1.0.vsix` file
- Validate package.json
- Check for common issues

### **Verify Package:**
```bash
ls -lh *.vsix
# Should see: beast-mode-0.1.0.vsix
```

---

## 🚀 **STEP 3: Publish Extension**

### **Option A: VS Code Marketplace (Public)**

1. **Create Publisher Account:**
   - Go to: https://marketplace.visualstudio.com/manage
   - Sign in with Microsoft/GitHub account
   - Create publisher: `beastmode` (or your choice)

2. **Install vsce:**
   ```bash
   npm install -g @vscode/vsce
   ```

3. **Login to Marketplace:**
   ```bash
   vsce login beastmode
   ```

4. **Publish:**
   ```bash
   cd BEAST-MODE-PRODUCT/vscode-extension
   vsce publish
   ```

### **Option B: Private Distribution**

1. **Package extension:**
   ```bash
   npm run package
   ```

2. **Distribute .vsix file:**
   - Share `beast-mode-0.1.0.vsix` file
   - Users install with: `code --install-extension beast-mode-0.1.0.vsix`

### **Option C: GitHub Releases**

1. **Create GitHub Release:**
   - Go to repository releases
   - Create new release (tag: `v0.1.0`)
   - Upload `beast-mode-0.1.0.vsix` as asset

2. **Users install from GitHub:**
   ```bash
   code --install-extension https://github.com/your-repo/releases/download/v0.1.0/beast-mode-0.1.0.vsix
   ```

---

## ✅ **Pre-Publish Checklist**

- [ ] Extension compiles without errors
- [ ] All 6 commands work in Extension Development Host
- [ ] API endpoints tested and working
- [ ] README.md is complete
- [ ] package.json has correct metadata
- [ ] No console errors in Output panel
- [ ] Error handling works gracefully
- [ ] Configuration options work
- [ ] Keybindings work (`Cmd+Shift+B`, `Cmd+Shift+C`)

---

## 📝 **Package.json Requirements**

Make sure these are set:
- ✅ `name`: "beast-mode"
- ✅ `displayName`: "BEAST MODE"
- ✅ `version`: "0.1.0"
- ✅ `publisher`: "beastmode" (or your publisher ID)
- ✅ `description`: Clear description
- ✅ `engines.vscode`: "^1.80.0"
- ✅ `main`: "./out/extension.js"

---

## 🐛 **Troubleshooting**

### **Extension Not Loading:**
- Check Output panel for errors
- Verify `out/extension.js` exists
- Check `package.json` main path

### **Commands Not Appearing:**
- Verify commands are in `contributes.commands`
- Check activation events
- Reload window: `Cmd+Shift+P` → "Developer: Reload Window"

### **API Calls Failing:**
- Check `beastMode.apiUrl` setting (default: `https://beast-mode.dev`)
- Verify API is accessible
- Check network connectivity

---

## 🎯 **Next Steps After Publishing**

1. **Monitor Usage:**
   - Check VS Code Marketplace analytics
   - Monitor API usage
   - Collect user feedback

2. **Iterate:**
   - Fix reported bugs
   - Add requested features
   - Improve error handling

3. **Version Updates:**
   - Update version in package.json
   - Update CHANGELOG.md
   - Publish new version

---

**Status:** ✅ **Ready to Test & Package** | 🚀 **Production APIs Working**
