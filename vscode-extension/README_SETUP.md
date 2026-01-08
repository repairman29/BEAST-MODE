# 🚀 BEAST MODE Extension - Complete Setup

## ✅ Status: Ready to Test!

The extension is compiled and ready. Follow these steps:

## Step 1: Reload Cursor (30 seconds)

1. **Press:** `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows)
2. **Type:** `Developer: Reload Window`
3. **Press:** Enter

## Step 2: Verify Extension is Active (30 seconds)

1. **Open Output Panel:** `View > Output` (or `Cmd+Shift+U`)
2. **Select:** `Log (Extension Host)` from dropdown
3. **Look for:** `BEAST MODE extension is now active!`

If you see that message → ✅ Extension is loaded!

## Step 3: Test Commands (2 minutes)

### Open Test File
Open: `vscode-extension/src/test-file.ts`

### Test 1: Analyze Quality
1. Press `Cmd+Shift+P`
2. Type: `BEAST MODE: Analyze Code Quality`
3. Should show a notification with quality score

### Test 2: Get Suggestions
1. Place cursor in `test-file.ts` (anywhere in a function)
2. Press `Cmd+Shift+B`
3. Should show suggestions menu

### Test 3: Open Chat
1. Press `Cmd+Shift+C`
2. Should open chat panel
3. Type: "What does this code do?"

## Quick Reference

| Action | Command |
|--------|---------|
| **Reload Extension** | `Cmd+Shift+P` → `Developer: Reload Window` |
| **Analyze Quality** | `Cmd+Shift+P` → `BEAST MODE: Analyze Code Quality` |
| **Get Suggestions** | `Cmd+Shift+B` |
| **Open Chat** | `Cmd+Shift+C` |
| **View Output** | `Cmd+Shift+U` → Select `Log (Extension Host)` |

## Troubleshooting

### Extension Not Loading?
```bash
cd vscode-extension
npm run compile
# Then reload window
```

### Commands Not Appearing?
- Check Output Panel for errors
- Try full restart: `Cmd+Q` then reopen Cursor

### API Not Working?
- Check settings: `Cmd+,` → Search `beastMode.apiUrl`
- Should be: `https://beast-mode.dev`
- Test API: `node test-extension.js`

## Files Created

- ✅ `CURSOR_SETUP.md` - Detailed setup guide
- ✅ `TEST_IN_CURSOR.md` - Testing instructions
- ✅ `setup.sh` - Automated setup script
- ✅ `test-extension.js` - API test script
- ✅ `src/test-file.ts` - Test file for commands

## Next Steps

1. ✅ Reload Cursor
2. ✅ Verify extension loaded
3. ✅ Test all commands
4. ✅ Report any issues

---

**Ready?** Start with Step 1 above! 🎉

