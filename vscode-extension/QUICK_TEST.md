# Quick Test Guide - VS Code Extension
## 5-Minute Test Setup

---

## 🚀 **STEP 1: Setup (1 minute)**

```bash
cd BEAST-MODE-PRODUCT/vscode-extension
npm install
npm run compile
```

---

## 🎯 **STEP 2: Launch Extension (30 seconds)**

1. Open VS Code in the `BEAST-MODE-PRODUCT` directory
2. Press **`F5`** (or Run > Start Debugging)
3. New "Extension Development Host" window opens
4. ✅ Extension is loaded!

---

## 🧪 **STEP 3: Test Commands (3 minutes)**

### **Test 1: Analyze Quality**
1. Open any code file in Extension Development Host
2. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows)
3. Type: `BEAST MODE: Analyze Quality`
4. ✅ Should show quality score

### **Test 2: Get Suggestions**
1. In same file, press `Cmd+Shift+B` (Mac) or `Ctrl+Shift+B` (Windows)
2. ✅ Should show code suggestions

### **Test 3: Open Chat**
1. Press `Cmd+Shift+C` (Mac) or `Ctrl+Shift+C` (Windows)
2. ✅ Chat panel should open

---

## ✅ **SUCCESS INDICATORS**

- [ ] Extension Development Host opens
- [ ] Commands appear in palette
- [ ] No errors in Output panel
- [ ] API calls work (check Network tab)

---

## 🐛 **IF IT DOESN'T WORK**

1. **Check Output Panel:**
   - View > Output
   - Select "BEAST MODE" from dropdown
   - Look for errors

2. **Check Debug Console:**
   - View > Debug Console
   - Look for TypeScript errors

3. **Rebuild:**
   ```bash
   npm run compile
   ```

4. **Check API URL:**
   - Settings > Search "beastMode.apiUrl"
   - Should be: `https://beast-mode.dev`

---

**That's it!** 🎉

For detailed testing, see `TESTING_GUIDE.md`

