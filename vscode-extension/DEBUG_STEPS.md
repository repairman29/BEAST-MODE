# Debug Steps - Extension Not Loading

## Step 1: Check Extension is Installed
1. Open Extensions panel (`Cmd+Shift+X`)
2. Search for "beast mode"
3. Should show as "Installed" and "Enabled"

## Step 2: Check Extension Host Logs
1. View > Output (`Cmd+Shift+U`)
2. Select "Log (Extension Host)" from dropdown
3. Look for:
   - `BEAST MODE extension is now active!` ✅ Good
   - Any error messages ❌ Bad

## Step 3: Check Developer Console
1. Help > Toggle Developer Tools
2. Go to Console tab
3. Look for errors (red text)

## Step 4: Try Direct Command
1. `Cmd+Shift+P`
2. Type: `>beastMode.analyzeQuality` (with the `>` prefix)
3. This uses the command ID directly

## Step 5: Check Extension Status
Run in terminal:
```bash
code --list-extensions | grep beast
```

Should show: `beastmode.beast-mode`

## Step 6: Manual Activation Test
1. Open any `.ts` or `.js` file
2. Check Output > Log (Extension Host)
3. Should see activation message when file opens

## Common Issues

### Extension Not Activating
- Check `activationEvents` in package.json
- Should include `onStartupFinished` or command activations

### Commands Not Showing
- Commands might be registered but not visible
- Try searching with `>` prefix: `>beastMode`
- Check if extension is enabled in Extensions panel

### Errors in Logs
- Check Output panel for specific error messages
- Common: Missing dependencies, syntax errors, API failures

---

**If still not working, share the error messages from Output panel!**

