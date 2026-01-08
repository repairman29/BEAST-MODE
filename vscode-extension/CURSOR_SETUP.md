# 🚀 BEAST MODE Extension - Cursor Setup Guide

## Quick Start (5 minutes)

### Step 1: Compile the Extension
```bash
cd vscode-extension
npm install
npm run compile
```

### Step 2: Open Extension in Development Mode

**Option A: Using Cursor's Extension Development**
1. Open Cursor
2. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows)
3. Type: `Developer: Reload Window`
4. The extension should now be active

**Option B: Using Launch Configuration**
1. Open the `BEAST-MODE-PRODUCT` folder in Cursor
2. Press `F5` or go to Run > Start Debugging
3. A new Cursor window will open with the extension loaded

### Step 3: Test the Extension

1. **Open a test file** (create `test-file.ts` in the workspace):
```typescript
function calculateSum(a: number, b: number): number {
  return a + b;
}
```

2. **Try the commands:**
   - `Cmd+Shift+P` → Type "BEAST MODE: Analyze Code Quality"
   - `Cmd+Shift+B` → Get AI Suggestions
   - `Cmd+Shift+C` → Open Codebase Chat

3. **Check the Output Panel:**
   - `View > Output` (or `Cmd+Shift+U`)
   - Select "Log (Extension Host)"
   - Should see: `BEAST MODE extension is now active!`

## Configuration

### Set API URL
1. `Cmd+,` (Settings)
2. Search: `beastMode.apiUrl`
3. Set to: `https://beast-mode.dev`

### Enable Features
- `beastMode.enableSuggestions`: `true` (default)
- `beastMode.enableQualityHints`: `true` (default)
- `beastMode.useLLM`: `false` (set to `true` if you have API keys)

## Troubleshooting

### Extension Not Loading?
1. **Check compilation:**
   ```bash
   cd vscode-extension
   npm run compile
   ```
   Should create `out/extension.js`

2. **Check Output Panel:**
   - Look for errors in "Log (Extension Host)"
   - Check for TypeScript errors

3. **Reload Window:**
   - `Cmd+Shift+P` → `Developer: Reload Window`

### Commands Not Appearing?
1. **Check activation events** in `package.json`
2. **Verify extension is loaded:**
   - `Cmd+Shift+P` → Type "BEAST MODE"
   - Should see all commands listed

### API Not Responding?
1. **Test API manually:**
   ```bash
   cd vscode-extension
   node test-extension.js
   ```

2. **Check API URL in settings:**
   - Should be `https://beast-mode.dev`

## Available Commands

| Command | Shortcut | Description |
|---------|----------|-------------|
| Analyze Code Quality | - | Get quality score for current file |
| Get AI Suggestions | `Cmd+Shift+B` | Get code suggestions at cursor |
| Open Codebase Chat | `Cmd+Shift+C` | Chat about your codebase |
| Generate Tests | - | Generate tests for current file |
| Refactor Code | - | Find and apply refactoring opportunities |
| Index Codebase | - | Index workspace for search |

## Development Workflow

1. **Make changes** to `src/*.ts` files
2. **Compile:** `npm run compile` (or `npm run watch` for auto-compile)
3. **Reload:** `Cmd+Shift+P` → `Developer: Reload Window`
4. **Test:** Try the commands

## Next Steps

- ✅ Extension compiled and loaded
- ✅ Commands visible in Command Palette
- ✅ API connected to `beast-mode.dev`
- 🧪 Test each command
- 📝 Report any issues

