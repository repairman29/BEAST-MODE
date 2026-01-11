# Electron IDE Integration Test Guide

**Purpose:** Manual testing guide for BEAST MODE Electron IDE  
**Status:** Foundation Ready - Needs Completion

---

## 🧪 Testing Checklist

### Setup
- [ ] Run: `cd beast-mode-ide && npm run dev`
- [ ] Electron window opens
- [ ] IDE interface displays

### Test 1: Window Launch
- [ ] Window opens successfully
- [ ] Window size: 1400x900 (or configured)
- [ ] Window title: "BEAST MODE IDE"
- [ ] Menu bar visible

### Test 2: UI Layout
- [ ] Status bar visible at bottom
- [ ] Sidebar visible on left
- [ ] Editor area visible in center
- [ ] Panels visible on right
- [ ] Terminal visible at bottom

### Test 3: Monaco Editor
- [ ] Editor loads
- [ ] Code can be typed
- [ ] Syntax highlighting works
- [ ] Editor theme: vs-dark
- [ ] Font: JetBrains Mono or Fira Code

### Test 4: Panels
- [ ] Click "🛡️ Interceptor" tab
- [ ] Panel content displays
- [ ] Click "✨ Quality" tab
- [ ] Panel switches
- [ ] Click "🧠 Oracle" tab
- [ ] Panel switches

### Test 5: Interceptor Panel
- [ ] Click "Check for Secrets" button
- [ ] API call made (check Network tab)
- [ ] Results displayed

### Test 6: Quality Panel
- [ ] Quality score displayed (95/100)
- [ ] Click "Run Self-Healing" button
- [ ] API call made
- [ ] Results displayed

### Test 7: Oracle Panel
- [ ] Input field visible
- [ ] Type query: "What is BEAST MODE?"
- [ ] Click "Search" button
- [ ] API call made
- [ ] Results displayed

### Test 8: Menu Actions
- [ ] File → New File
- [ ] File → Open File
- [ ] File → Save
- [ ] BEAST MODE → Secret Interceptor
- [ ] BEAST MODE → Architecture Enforcement
- [ ] BEAST MODE → Quality Panel
- [ ] BEAST MODE → Oracle AI

### Test 9: Keyboard Shortcuts
- [ ] Cmd/Ctrl+S → Check Secrets
- [ ] Cmd/Ctrl+A → Check Architecture
- [ ] Verify shortcuts work

### Test 10: Terminal
- [ ] Terminal placeholder visible
- [ ] Terminal integration coming soon message
- [ ] (Full terminal test after xterm.js integration)

---

## 🐛 Known Limitations

1. **Monaco Editor**
   - May need full integration
   - Check browser console for errors

2. **Terminal**
   - Placeholder only
   - xterm.js integration needed

3. **File Explorer**
   - Placeholder only
   - Full implementation needed

---

## ✅ Success Criteria

Foundation tests pass if:
- ✅ Window opens
- ✅ UI layout displays
- ✅ Panels switch
- ✅ API calls work
- ✅ Menu actions work
- ✅ No console errors

---

**Last Updated:** January 11, 2025
