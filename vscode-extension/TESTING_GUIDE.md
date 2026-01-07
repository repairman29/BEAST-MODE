# VS Code Extension Testing Guide
## Step-by-Step Testing Instructions

**Date:** January 8, 2026  
**Status:** ✅ **Ready for Testing**

---

## 🎯 **QUICK TEST (5 Minutes)**

### **Step 1: Setup**
```bash
cd BEAST-MODE-PRODUCT/vscode-extension
npm install
npm run compile
```

### **Step 2: Launch Extension**
1. Open VS Code in the `BEAST-MODE-PRODUCT` directory
2. Press `F5` (or Run > Start Debugging)
3. New "Extension Development Host" window opens
4. Extension is now loaded!

### **Step 3: Test Commands**
1. Open any code file in the Extension Development Host
2. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
3. Type "BEAST MODE" to see available commands
4. Try: `BEAST MODE: Analyze Quality`

---

## 🧪 **COMPREHENSIVE TESTING**

### **Test 1: Quality Analysis**

**Steps:**
1. Open a code file (e.g., `website/app/api/repos/quality/route.ts`)
2. Run command: `BEAST MODE: Analyze Quality`
3. **Expected:** Quality score appears in notification or output panel

**Verify:**
- [ ] Command executes without errors
- [ ] API call is made to `/api/repos/quality`
- [ ] Quality score is displayed
- [ ] Error handling works (if API fails)

---

### **Test 2: Code Suggestions**

**Steps:**
1. Open a code file
2. Start typing code
3. **Expected:** Inline suggestions appear

**Verify:**
- [ ] Suggestions appear as you type
- [ ] Suggestions are relevant to context
- [ ] Accepting suggestions works
- [ ] Suggestions use codebase context

---

### **Test 3: Quality Hints**

**Steps:**
1. Open a code file with quality issues
2. **Expected:** Quality hints appear inline

**Verify:**
- [ ] Hints appear for low-quality code
- [ ] Hints are actionable
- [ ] Clicking hints shows details
- [ ] Hints update as code changes

---

### **Test 4: Codebase Chat**

**Steps:**
1. Run command: `BEAST MODE: Open Chat`
2. Ask: "What does this function do?"
3. **Expected:** Chat panel opens with codebase-aware response

**Verify:**
- [ ] Chat panel opens
- [ ] Responses are codebase-aware
- [ ] Multi-turn conversations work
- [ ] Code references are clickable

---

### **Test 5: Test Generation**

**Steps:**
1. Select a function or class
2. Run command: `BEAST MODE: Generate Tests`
3. **Expected:** Tests are generated

**Verify:**
- [ ] Tests are generated for selected code
- [ ] Tests are relevant
- [ ] Tests follow project conventions
- [ ] Tests can be saved

---

### **Test 6: Refactoring**

**Steps:**
1. Select code to refactor
2. Run command: `BEAST MODE: Refactor`
3. **Expected:** Refactoring suggestions appear

**Verify:**
- [ ] Refactoring suggestions are shown
- [ ] Suggestions improve code quality
- [ ] Preview changes before applying
- [ ] Applying refactoring works

---

### **Test 7: Codebase Indexing**

**Steps:**
1. Run command: `BEAST MODE: Index Codebase`
2. **Expected:** Codebase is indexed

**Verify:**
- [ ] Indexing completes successfully
- [ ] Progress indicator shows
- [ ] Search works after indexing
- [ ] Symbol navigation works

---

## 🔧 **DEBUGGING**

### **View Extension Logs**
1. In Extension Development Host
2. Open **Output** panel (`Cmd+Shift+U` / `Ctrl+Shift+U`)
3. Select "BEAST MODE" from dropdown
4. View logs

### **Set Breakpoints**
1. Open `src/extension.ts`
2. Set breakpoint (click left margin)
3. Press `F5` to start debugging
4. Execute command that triggers breakpoint

### **Inspect Variables**
- Hover over variables in debugger
- Use Debug Console to evaluate expressions
- Check Call Stack for execution flow

---

## 🐛 **COMMON ISSUES**

### **Extension Not Loading**
**Problem:** Extension doesn't appear in command palette

**Solutions:**
- Check `package.json` activation events
- Verify `extension.ts` exports `activate`
- Check Output panel for errors
- Restart Extension Development Host

### **API Calls Failing**
**Problem:** Commands fail with API errors

**Solutions:**
- Verify `beastMode.apiUrl` in settings
- Check network connectivity
- Verify API endpoint is accessible
- Check authentication token

### **Suggestions Not Appearing**
**Problem:** No inline suggestions

**Solutions:**
- Verify `beastMode.enableSuggestions` is true
- Check suggestion provider is registered
- Verify API endpoint is working
- Check extension logs

---

## 📊 **TEST RESULTS TEMPLATE**

```markdown
## Test Results - [Date]

### Quality Analysis
- Status: ✅ Pass / ❌ Fail
- Notes: [Any issues]

### Code Suggestions
- Status: ✅ Pass / ❌ Fail
- Notes: [Any issues]

### Quality Hints
- Status: ✅ Pass / ❌ Fail
- Notes: [Any issues]

### Codebase Chat
- Status: ✅ Pass / ❌ Fail
- Notes: [Any issues]

### Test Generation
- Status: ✅ Pass / ❌ Fail
- Notes: [Any issues]

### Refactoring
- Status: ✅ Pass / ❌ Fail
- Notes: [Any issues]

### Codebase Indexing
- Status: ✅ Pass / ❌ Fail
- Notes: [Any issues]
```

---

## ✅ **PRE-RELEASE CHECKLIST**

- [ ] All commands work
- [ ] API integration tested
- [ ] Error handling works
- [ ] Configuration options work
- [ ] Tested on Windows
- [ ] Tested on Mac
- [ ] Tested on Linux
- [ ] Documentation complete
- [ ] Extension packages successfully
- [ ] No console errors

---

**Last Updated:** January 8, 2026  
**Next Review:** After implementing core features

