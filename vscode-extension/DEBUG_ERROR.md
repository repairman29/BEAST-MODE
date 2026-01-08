# Debug Extension Errors

## What to Do When It Fails

### Step 1: Check the Output Panel
1. Open Output panel: `View > Output` (or `Cmd+Shift+U`)
2. Select **"Log (Extension Host)"** from the dropdown
3. Look for `[BEAST MODE]` messages
4. Copy any error messages you see

### Step 2: Check Developer Console
1. Open Developer Tools: `Help > Toggle Developer Tools` (or `Cmd+Option+I`)
2. Go to **Console** tab
3. Look for red error messages
4. Copy any errors related to BEAST MODE

### Step 3: Test the API Directly
Run this in terminal:
```bash
cd BEAST-MODE-PRODUCT/vscode-extension
node test-api-direct.js
```

This will tell you if the API is working.

### Step 4: Check Extension Settings
1. Open Settings: `Cmd+,`
2. Search for `beastMode`
3. Check `beastMode.apiUrl` - should be `https://beast-mode.dev`

### Step 5: Reload Extension
1. `Cmd+Shift+P`
2. Type: `Developer: Reload Window`
3. Try the command again

## Common Errors

### "Network error: Unable to reach..."
- **Cause**: Can't connect to API
- **Fix**: Check internet connection, verify API URL in settings

### "Analysis failed: [500] Internal Server Error"
- **Cause**: API server error
- **Fix**: Check API status at https://beast-mode.dev/api/health

### "Analysis failed: [404] Not Found"
- **Cause**: Wrong API endpoint
- **Fix**: Verify API URL is `https://beast-mode.dev`

### "No active editor"
- **Cause**: No file open
- **Fix**: Open any file first, then run the command

## Get Help

When reporting an error, include:
1. The exact error message
2. Output from "Log (Extension Host)" panel
3. Result of `node test-api-direct.js`
4. Your `beastMode.apiUrl` setting
