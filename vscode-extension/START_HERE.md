# START HERE - Test the Extension
## Quick 3-Step Guide

---

## 🎯 **STEP 1: Press F5**

In VS Code (the window you're looking at):
- Press **`F5`** on your keyboard
- OR go to: **Run > Start Debugging**

**What happens:** A new VS Code window opens (Extension Development Host)

---

## 🎯 **STEP 2: New Window Opens**

A new VS Code window will appear. This is where your extension is loaded.

**In the NEW window:**
- Open any code file (e.g., `website/app/api/repos/quality/route.ts`)
- Press **`Cmd+Shift+P`** (Mac) or **`Ctrl+Shift+P`** (Windows/Linux)
- Type: **`BEAST MODE`**

---

## 🎯 **STEP 3: Test Commands**

You should see these commands:
- ✅ **BEAST MODE: Analyze Code Quality**
- ✅ **BEAST MODE: Get AI Suggestions** (or press `Cmd+Shift+B`)
- ✅ **BEAST MODE: Open Codebase Chat** (or press `Cmd+Shift+C`)
- ✅ **BEAST MODE: Generate Tests**
- ✅ **BEAST MODE: Refactor Code**
- ✅ **BEAST MODE: Index Codebase**

**Try it:**
1. Click on **"BEAST MODE: Analyze Code Quality"**
2. Should show a quality score notification

---

## ✅ **SUCCESS!**

If you see the commands and they work, the extension is working! 🎉

---

## 🐛 **If It Doesn't Work**

1. **Check Output Panel:**
   - View > Output
   - Select "BEAST MODE" from dropdown
   - Look for errors

2. **Check Debug Console:**
   - View > Debug Console
   - Look for TypeScript errors

3. **Recompile:**
   ```bash
   cd vscode-extension
   npm run compile
   ```

---

**That's it!** Just press **F5** and test in the new window! 🚀

