# Test the Extension Now!
## It's Installed - Let's Test It!

---

## 🧪 **QUICK TEST (2 Minutes)**

### **Step 1: Open a Code File**
- Open any `.ts`, `.js`, `.tsx`, or `.jsx` file
- Example: `website/app/api/repos/quality/route.ts`

### **Step 2: Run Quality Analysis**
1. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows)
2. Type: `BEAST MODE` or `Analyze Code Quality`
3. Select: **"BEAST MODE: Analyze Code Quality"**
4. ✅ Should show a quality score notification!

### **Step 3: Try Suggestions**
1. In the same file, press `Cmd+Shift+B` (Mac) or `Ctrl+Shift+B` (Windows)
2. ✅ Should show code suggestions picker

### **Step 4: Try Chat**
1. Press `Cmd+Shift+C` (Mac) or `Ctrl+Shift+C` (Windows)
2. ✅ Chat panel should open

---

## ✅ **SUCCESS INDICATORS**

- [ ] Commands appear in Command Palette
- [ ] Quality analysis shows a score
- [ ] No errors in Output panel
- [ ] Extension shows as "Enabled" in Extensions panel

---

## 🐛 **If Commands Don't Work**

1. **Check Output Panel:**
   - View > Output (`Cmd+Shift+U`)
   - Select "Log (Extension Host)"
   - Look for: `BEAST MODE extension is now active!`
   - Check for any red error messages

2. **Check Extension Status:**
   - Extensions panel (`Cmd+Shift+X`)
   - Search: `beast mode`
   - Should show "Enabled" (not "Disabled")

3. **Try Direct Command:**
   - `Cmd+Shift+P`
   - Type: `>beastMode.analyzeQuality` (with `>` prefix)

---

## 🎯 **What to Test**

- ✅ **Quality Analysis** - Should call API and show score
- ✅ **Suggestions** - Should show code suggestions
- ✅ **Chat** - Should open chat interface
- ✅ **Test Generation** - Should generate tests
- ✅ **Refactoring** - Should show refactoring options
- ✅ **Indexing** - Should index codebase

---

**Go ahead and test it!** 🚀


