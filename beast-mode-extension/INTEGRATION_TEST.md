# VS Code Extension Integration Test Guide

**Purpose:** Manual testing guide for BEAST MODE VS Code Extension  
**Status:** Ready for Testing

---

## 🧪 Testing Checklist

### Setup
- [ ] Open `beast-mode-extension` folder in VS Code
- [ ] Press `F5` to launch Extension Development Host
- [ ] New VS Code window opens with extension loaded

### Test 1: Extension Activation
- [ ] Check status bar shows "🛡️ BEAST MODE"
- [ ] Verify extension activated (no errors in Debug Console)
- [ ] Check Output panel for "BEAST MODE extension is now active!"

### Test 2: Command Palette
- [ ] Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
- [ ] Type "BEAST MODE"
- [ ] Verify all commands appear:
  - [ ] BEAST MODE: Check for Secrets
  - [ ] BEAST MODE: Install Pre-Commit Hook
  - [ ] BEAST MODE: Check Architecture
  - [ ] BEAST MODE: Show Quality Panel
  - [ ] BEAST MODE: Run Self-Healing
  - [ ] BEAST MODE: Oracle AI Chat
  - [ ] BEAST MODE: Show Status

### Test 3: Secret Interceptor
- [ ] Create a test file with an API key: `const key = "sk-1234567890";`
- [ ] Stage the file: `git add test-file.js`
- [ ] Run: `BEAST MODE: Check for Secrets`
- [ ] Verify: Issues appear in Problems panel
- [ ] Verify: Diagnostic shows secret detected
- [ ] Verify: Output channel shows interceptor results

### Test 4: Pre-Commit Hook Installation
- [ ] Run: `BEAST MODE: Install Pre-Commit Hook`
- [ ] Verify: Success message appears
- [ ] Check: `.git/hooks/pre-commit` file exists
- [ ] Verify: Hook is executable (`chmod +x`)

### Test 5: Architecture Enforcement
- [ ] Open a TypeScript/JavaScript file
- [ ] Add code: `const data = supabase.from('users').select('*');`
- [ ] Run: `BEAST MODE: Check Architecture`
- [ ] Verify: Warning appears in Problems panel
- [ ] Run: `BEAST MODE: Auto-Fix Architecture Issues`
- [ ] Verify: Fix applied (if available)

### Test 6: Quality Panel
- [ ] Run: `BEAST MODE: Show Quality Panel`
- [ ] Verify: Panel opens in side view
- [ ] Verify: Quality score displayed
- [ ] Verify: Issues list shown
- [ ] Click "Self-Heal" button
- [ ] Verify: Self-healing runs

### Test 7: Oracle AI Panel
- [ ] Run: `BEAST MODE: Oracle AI Chat`
- [ ] Verify: Panel opens
- [ ] Type a query: "What is the secret interceptor?"
- [ ] Click "Search"
- [ ] Verify: Results displayed

### Test 8: Status Command
- [ ] Run: `BEAST MODE: Show Status`
- [ ] Verify: Status message shows all features enabled/disabled

### Test 9: Configuration
- [ ] Open Settings (Cmd+, / Ctrl+,)
- [ ] Search for "BEAST MODE"
- [ ] Verify all settings appear:
  - [ ] beast-mode.enabled
  - [ ] beast-mode.interceptor.enabled
  - [ ] beast-mode.architecture.enabled
  - [ ] beast-mode.quality.enabled
  - [ ] beast-mode.oracle.enabled
- [ ] Toggle a setting
- [ ] Verify: Extension responds to change

### Test 10: File Watcher
- [ ] Enable architecture enforcement in settings
- [ ] Edit a TypeScript file
- [ ] Save the file
- [ ] Verify: Architecture check runs automatically
- [ ] Verify: Diagnostics update

---

## 🐛 Known Issues to Watch For

1. **Module Import Errors**
   - If BEAST MODE lib not found, extension falls back to API
   - Check Debug Console for warnings

2. **API Connection**
   - If localhost:3000 not running, API calls will fail
   - Extension should handle gracefully

3. **Git Hook Installation**
   - Requires git repository
   - May fail if not in git repo

---

## ✅ Success Criteria

All tests pass if:
- ✅ Extension activates without errors
- ✅ All commands accessible
- ✅ Panels display correctly
- ✅ Diagnostics appear in Problems panel
- ✅ Configuration works
- ✅ File watcher works

---

**Last Updated:** January 11, 2025
