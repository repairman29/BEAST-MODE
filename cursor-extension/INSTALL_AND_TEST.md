# Install and Test Cursor Extension

## ✅ Extension Ready: `beast-mode-cursor-1.0.0.vsix` (510KB)

---

## 🚀 **INSTALLATION**

### **Option 1: Install from VSIX File**

```bash
cd BEAST-MODE-PRODUCT/cursor-extension
code --install-extension beast-mode-cursor-1.0.0.vsix
```

### **Option 2: Install via VS Code UI**

1. Open VS Code or Cursor
2. Go to Extensions (`Cmd+Shift+X` / `Ctrl+Shift+X`)
3. Click the `...` menu (top right)
4. Select "Install from VSIX..."
5. Choose `beast-mode-cursor-1.0.0.vsix`

### **Option 3: Test in Development Mode**

```bash
cd BEAST-MODE-PRODUCT/cursor-extension
code .
# Press F5 to launch Extension Development Host
```

---

## 🧪 **TESTING**

### **1. Verify Installation**

1. Open VS Code/Cursor
2. `Cmd+Shift+P` / `Ctrl+Shift+P`
3. Type: `BEAST MODE`
4. Should see all commands listed

### **2. Test Model Selection**

1. `Cmd+Shift+P` → `BEAST MODE: Select Model`
2. Choose a model from the list
3. Status bar should update with selected model

### **3. Test Custom Model Registration**

1. `Cmd+Shift+P` → `BEAST MODE: Register Custom Model`
2. Enter:
   - Name: "My Local Llama"
   - ID: "custom:my-local-llama"
   - Endpoint: "https://my-model.com/v1/chat/completions"
   - Provider: "OpenAI-Compatible"
3. Should see success message

### **4. Test Chat**

1. `Cmd+Shift+P` → `BEAST MODE: Chat`
2. Enter a message
3. Should open response in new document

### **5. Test Quality Analysis**

1. Open any code file
2. `Cmd+Shift+P` → `BEAST MODE: Analyze Quality`
3. Should show quality score notification

---

## ✅ **VERIFICATION CHECKLIST**

- [ ] Extension installed
- [ ] Commands visible in palette
- [ ] Status bar shows model status
- [ ] Can select model
- [ ] Can register custom model
- [ ] Chat works
- [ ] Quality analysis works

---

## 🐛 **TROUBLESHOOTING**

### **Extension Not Appearing**
- Reload VS Code/Cursor: `Cmd+Shift+P` → "Reload Window"
- Check Output panel for errors

### **Commands Not Working**
- Check API URL in settings: `beastMode.apiUrl`
- Verify you're logged into BEAST MODE
- Check browser console for errors

### **Model Selection Fails**
- Verify API is accessible
- Check network connection
- Review extension logs

---

## 📚 **DOCUMENTATION**

- Complete Guide: `docs/CURSOR_CUSTOM_MODEL_COMPLETE.md`
- Proxy Setup: `docs/CURSOR_PROXY_SETUP.md`
- Phase 1 Details: `docs/CUSTOM_MODEL_IMPLEMENTATION_PHASE1.md`

---

**Status:** ✅ Ready for Testing
