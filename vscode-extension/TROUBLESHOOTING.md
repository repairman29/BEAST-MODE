# Troubleshooting VS Code Extension

## F5 Doesn't Work?

### **Check 1: Launch Configuration**
1. Open Command Palette: `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows)
2. Type: `Debug: Select and Start Debugging`
3. Select: `Run Extension`
4. Should launch Extension Development Host

### **Check 2: Extension Compiled?**
```bash
cd vscode-extension
npm run compile
```

Should see: `out/extension.js` created

### **Check 3: Check for Errors**
1. View > Output
2. Select "Tasks" from dropdown
3. Look for compilation errors

### **Check 4: Manual Launch**
1. Command Palette: `Cmd+Shift+P`
2. Type: `Debug: Start Debugging`
3. If no configuration, select "Add Configuration..."
4. Choose "Extension Development"

---

## Alternative: Package and Install

### **Step 1: Install vsce**
```bash
npm install -g @vscode/vsce
```

### **Step 2: Package Extension**
```bash
cd vscode-extension
vsce package
```

### **Step 3: Install**
```bash
code --install-extension beast-mode-*.vsix
```

### **Step 4: Reload VS Code**
- Command Palette: `Developer: Reload Window`

### **Step 5: Test**
- Command Palette: `BEAST MODE: Analyze Code Quality`

---

## Common Issues

### **"No configuration found"**
- Solution: Use `.vscode/launch.json` (should be in root now)

### **"Extension not found"**
- Solution: Make sure you're in `BEAST-MODE-PRODUCT` directory
- Check `vscode-extension/out/extension.js` exists

### **"TypeScript errors"**
- Solution: Run `cd vscode-extension && npm run compile`
- Fix any TypeScript errors shown

### **"Commands not appearing"**
- Solution: Reload window after installing
- Check Output panel for errors

---

## Quick Fix Checklist

- [ ] Extension compiled? (`out/extension.js` exists)
- [ ] Launch.json exists? (`.vscode/launch.json`)
- [ ] No TypeScript errors? (`npm run compile` succeeds)
- [ ] VS Code restarted? (Reload window)

---

**Still not working?** Check the Output panel for specific error messages!

