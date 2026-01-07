# Install & Test VS Code Extension
## Ready-to-Use Instructions

**Status:** ✅ **Extension Compiled & Ready**

---

## 🚀 **OPTION 1: Test in Development Mode** (Recommended)

### **Step 1: Open in VS Code**
```bash
cd /Users/jeffadkins/Smugglers/BEAST-MODE-PRODUCT
code .
```

### **Step 2: Launch Extension**
1. Open `vscode-extension` folder in VS Code
2. Press **`F5`** (or Run > Start Debugging)
3. New "Extension Development Host" window opens
4. ✅ Extension is loaded!

### **Step 3: Test Commands**
In the Extension Development Host window:
1. Open any code file
2. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows)
3. Type: `BEAST MODE`
4. Try commands:
   - `BEAST MODE: Analyze Code Quality`
   - `BEAST MODE: Get AI Suggestions` (or `Cmd+Shift+B`)
   - `BEAST MODE: Open Codebase Chat` (or `Cmd+Shift+C`)

---

## 📦 **OPTION 2: Install as Extension**

### **If VSIX Package Exists:**
```bash
cd /Users/jeffadkins/Smugglers/BEAST-MODE-PRODUCT/vscode-extension
code --install-extension beast-mode-*.vsix
```

### **If No VSIX (Install from Source):**
```bash
cd /Users/jeffadkins/Smugglers/BEAST-MODE-PRODUCT/vscode-extension

# Install dependencies
npm install

# Compile
npm run compile

# Package (requires vsce)
npm install -g @vscode/vsce
vsce package

# Install
code --install-extension beast-mode-*.vsix
```

---

## ✅ **VERIFICATION**

### **Check Extension is Installed:**
1. Open VS Code
2. Go to Extensions (`Cmd+Shift+X` / `Ctrl+Shift+X`)
3. Search for "BEAST MODE"
4. Should see extension installed

### **Check Commands Work:**
1. Press `Cmd+Shift+P` / `Ctrl+Shift+P`
2. Type: `BEAST MODE`
3. Should see all commands listed

### **Check Configuration:**
1. Open Settings (`Cmd+,` / `Ctrl+,`)
2. Search: `beastMode`
3. Verify:
   - `beastMode.apiUrl` = `https://beast-mode.dev`
   - `beastMode.enableSuggestions` = `true`
   - `beastMode.enableQualityHints` = `true`

---

## 🧪 **QUICK TEST**

### **Test 1: Quality Analysis**
1. Open any `.ts` or `.js` file
2. Run: `BEAST MODE: Analyze Code Quality`
3. ✅ Should show quality score notification

### **Test 2: Suggestions**
1. In same file, press `Cmd+Shift+B` / `Ctrl+Shift+B`
2. ✅ Should show suggestions picker

### **Test 3: Chat**
1. Press `Cmd+Shift+C` / `Ctrl+Shift+C`
2. ✅ Chat panel should open

---

## 🐛 **TROUBLESHOOTING**

### **Extension Not Loading:**
- Check Output panel → Select "BEAST MODE"
- Look for errors
- Verify `out/extension.js` exists

### **Commands Not Appearing:**
- Reload VS Code window: `Cmd+Shift+P` → "Developer: Reload Window"
- Check extension is enabled in Extensions panel

### **API Calls Failing:**
- Verify `beastMode.apiUrl` in settings
- Check network connectivity
- Verify API endpoint is accessible

---

## 📝 **NEXT STEPS**

After testing:
1. Report any issues
2. Test all commands
3. Verify API integration works
4. Check error handling

---

**Last Updated:** January 8, 2026  
**Status:** Ready for testing

