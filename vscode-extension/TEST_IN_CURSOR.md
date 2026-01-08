# 🧪 Testing BEAST MODE Extension in Cursor

## Quick Setup (2 minutes)

### 1. Compile the Extension
```bash
cd vscode-extension
chmod +x setup.sh
./setup.sh
```

Or manually:
```bash
cd vscode-extension
npm install
npm run compile
```

### 2. Reload Cursor
1. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows)
2. Type: `Developer: Reload Window`
3. Press Enter

### 3. Verify Extension is Loaded
1. Open the Output Panel: `View > Output` (or `Cmd+Shift+U`)
2. In the dropdown, select: `Log (Extension Host)`
3. You should see: `BEAST MODE extension is now active!`

## Test the Extension

### Test File
Open: `vscode-extension/src/test-file.ts`

### Test Commands

#### 1. Analyze Code Quality
1. Open `test-file.ts`
2. Press `Cmd+Shift+P`
3. Type: `BEAST MODE: Analyze Code Quality`
4. Should show a quality score notification

#### 2. Get AI Suggestions
1. Place cursor in `test-file.ts` (e.g., after `function calculateSum`)
2. Press `Cmd+Shift+B`
3. Should show suggestions in a quick pick menu

#### 3. Open Codebase Chat
1. Press `Cmd+Shift+C`
2. Should open a chat panel
3. Type a question about your code

#### 4. Generate Tests
1. Open `test-file.ts`
2. Press `Cmd+Shift+P`
3. Type: `BEAST MODE: Generate Tests`
4. Should generate test file

## Troubleshooting

### Extension Not Loading?
```bash
# Recompile
cd vscode-extension
npm run compile

# Check for errors
npm run compile 2>&1 | grep -i error
```

### Commands Not Appearing?
1. Check Output Panel for errors
2. Verify `package.json` has correct `activationEvents`
3. Try full restart: `Cmd+Q` then reopen Cursor

### API Not Working?
1. Check settings: `Cmd+,` → Search `beastMode.apiUrl`
2. Should be: `https://beast-mode.dev`
3. Test API manually:
   ```bash
   cd vscode-extension
   node test-extension.js
   ```

## Expected Behavior

✅ **Working:**
- Commands appear in Command Palette
- Quality analysis shows score
- Suggestions appear when triggered
- Chat panel opens
- No errors in Output Panel

❌ **Not Working:**
- Commands don't appear → Check compilation
- API errors → Check API URL and network
- Extension not activating → Check Output Panel logs

## Next Steps

Once working:
1. ✅ Test all commands
2. ✅ Verify API connectivity
3. ✅ Check quality scores
4. ✅ Test suggestions
5. ✅ Try chat feature

