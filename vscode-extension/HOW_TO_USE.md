# How to Use BEAST MODE Extension
## Quick Guide

---

## ⚙️ **SETTINGS (What You're Seeing)**

### **1. Beast Mode: Api Url**
- **Current:** `https://beast-mode.dev`
- **What it does:** Points to your BEAST MODE API
- **Change if:** You're using a different server/port

### **2. Beast Mode: Enable Quality Hints** ✅ (Checked)
- **What it does:** Shows inline quality hints as you code
- **Keep checked:** For real-time quality feedback

### **3. Beast Mode: Enable Suggestions** ✅ (Checked)
- **What it does:** Provides real-time code suggestions
- **Keep checked:** For AI-powered code completion

### **4. Beast Mode: Use LLM** ⬜ (Unchecked)
- **What it does:** Uses LLM for advanced suggestions (requires API key)
- **Leave unchecked:** Unless you have API keys configured

---

## 🚀 **HOW TO USE**

### **Method 1: Command Palette** (Easiest)

1. **Open any code file** (`.ts`, `.js`, `.tsx`, `.jsx`)
2. **Press:** `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows)
3. **Type:** `BEAST MODE` or `@beast`
4. **Select a command:**
   - `BEAST MODE: Analyze Code Quality` ← Try this first!
   - `BEAST MODE: Get AI Suggestions`
   - `BEAST MODE: Open Codebase Chat`
   - `BEAST MODE: Generate Tests`
   - `BEAST MODE: Refactor Code`
   - `BEAST MODE: Index Codebase`

### **Method 2: Keyboard Shortcuts**

- **Suggestions:** `Cmd+Shift+B` (Mac) or `Ctrl+Shift+B` (Windows)
- **Chat:** `Cmd+Shift+C` (Mac) or `Ctrl+Shift+C` (Windows)

---

## 🧪 **QUICK TEST**

### **Test 1: Analyze Quality** (30 seconds)
1. Open: `website/app/api/repos/quality/route.ts`
2. `Cmd+Shift+P` → `BEAST MODE: Analyze Code Quality`
3. ✅ Should show quality score notification

### **Test 2: Get Suggestions** (30 seconds)
1. In same file, press `Cmd+Shift+B`
2. ✅ Should show suggestions picker

### **Test 3: Open Chat** (30 seconds)
1. Press `Cmd+Shift+C`
2. ✅ Chat panel should open

---

## ✅ **WHAT TO EXPECT**

### **Quality Analysis:**
- Notification with quality score (0-100%)
- Webview panel with detailed breakdown
- Factors and recommendations

### **Suggestions:**
- Quick pick menu with code suggestions
- Select one to insert into your code

### **Chat:**
- Chat panel opens
- Ask questions about your codebase
- Get codebase-aware responses

---

## 🐛 **TROUBLESHOOTING**

### **Commands Not Working?**
1. Check Output panel: View > Output
2. Select "Log (Extension Host)"
3. Look for: `BEAST MODE extension is now active!`
4. Check for error messages

### **API Calls Failing?**
- Verify API URL in settings: `https://beast-mode.dev`
- Check if API is accessible
- Check network connectivity

### **No Suggestions?**
- Make sure "Enable Suggestions" is checked
- Try opening a code file first
- Check Output panel for errors

---

## 📋 **NEXT STEPS**

1. ✅ **Test Quality Analysis** - See your code quality scores
2. ✅ **Try Suggestions** - Get AI-powered code help
3. ✅ **Use Chat** - Ask questions about your codebase
4. ✅ **Generate Tests** - Automatically create tests
5. ✅ **Refactor Code** - Get refactoring suggestions

---

**Start with "Analyze Code Quality" - it's the easiest to test!** 🚀


