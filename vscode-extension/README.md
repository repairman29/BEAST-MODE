# BEAST MODE VS Code Extension
## Testing & Development Guide

**Version:** 1.0.0  
**Status:** 🚧 **In Development**

---

## 🚀 **QUICK START**

### **1. Install Dependencies**
```bash
cd vscode-extension
npm install
```

### **2. Build Extension**
```bash
npm run compile
# or
npm run watch  # For continuous compilation
```

### **3. Test Extension**

#### **Option A: Launch Extension Development Host** (Recommended)
1. Open VS Code
2. Press `F5` or go to **Run > Start Debugging**
3. A new "Extension Development Host" window will open
4. Your extension will be loaded in this window

#### **Option B: Package and Install**
```bash
# Install vsce (VS Code Extension Manager)
npm install -g @vscode/vsce

# Package extension
vsce package

# Install locally
code --install-extension beast-mode-*.vsix
```

---

## 🧪 **TESTING**

### **Manual Testing Checklist**

#### **1. Quality Analysis**
- [ ] Open a code file
- [ ] Run command: `BEAST MODE: Analyze Quality`
- [ ] Verify quality score appears
- [ ] Check quality hints in editor

#### **2. Code Suggestions**
- [ ] Type code in editor
- [ ] Verify inline suggestions appear
- [ ] Test accepting suggestions
- [ ] Check suggestion quality

#### **3. Codebase Chat**
- [ ] Open chat panel
- [ ] Ask questions about codebase
- [ ] Verify responses are codebase-aware
- [ ] Test multi-turn conversations

#### **4. Test Generation**
- [ ] Select a function/class
- [ ] Run: `BEAST MODE: Generate Tests`
- [ ] Verify tests are generated
- [ ] Check test quality

#### **5. Refactoring**
- [ ] Select code to refactor
- [ ] Run: `BEAST MODE: Refactor`
- [ ] Verify refactoring suggestions
- [ ] Test applying refactorings

#### **6. Codebase Indexing**
- [ ] Run: `BEAST MODE: Index Codebase`
- [ ] Verify indexing completes
- [ ] Test search functionality
- [ ] Check symbol navigation

---

## 🔧 **DEVELOPMENT**

### **Project Structure**
```
vscode-extension/
├── src/
│   ├── extension.ts          # Main entry point
│   ├── beastModeClient.ts    # API client
│   ├── suggestionProvider.ts # Code suggestions
│   └── qualityHintsProvider.ts # Quality hints
├── package.json              # Extension manifest
├── tsconfig.json             # TypeScript config
└── README.md                 # This file
```

### **Available Commands**
- `beastMode.analyzeQuality` - Analyze code quality
- `beastMode.getSuggestions` - Get code suggestions
- `beastMode.openChat` - Open codebase chat
- `beastMode.generateTests` - Generate tests
- `beastMode.refactor` - Refactor code
- `beastMode.indexCodebase` - Index codebase

### **Configuration**
```json
{
  "beastMode.apiUrl": "https://beast-mode.dev",
  "beastMode.enableSuggestions": true,
  "beastMode.enableQualityHints": true,
  "beastMode.enableChat": true
}
```

---

## 🐛 **DEBUGGING**

### **Debug Configuration**
1. Open `.vscode/launch.json` (create if needed)
2. Add:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Extension",
      "type": "extensionHost",
      "request": "launch",
      "args": [
        "--extensionDevelopmentPath=${workspaceFolder}/vscode-extension"
      ],
      "outFiles": [
        "${workspaceFolder}/vscode-extension/out/**/*.js"
      ],
      "preLaunchTask": "npm: compile"
    }
  ]
}
```

### **Debug Steps**
1. Set breakpoints in `src/extension.ts`
2. Press `F5` to start debugging
3. Extension Development Host opens
4. Breakpoints will hit when commands are executed

### **View Logs**
- Open **Output** panel
- Select "BEAST MODE" from dropdown
- View extension logs

---

## 📦 **PACKAGING**

### **Build for Distribution**
```bash
# Install vsce
npm install -g @vscode/vsce

# Package extension
vsce package

# Output: beast-mode-1.0.0.vsix
```

### **Publish to Marketplace**
```bash
# Login to marketplace
vsce login <publisher-name>

# Publish
vsce publish
```

---

## 🔗 **API INTEGRATION**

### **API Endpoints Used**
- `POST /api/repos/quality` - Quality analysis
- `POST /api/codebase/suggestions` - Code suggestions
- `POST /api/codebase/chat` - Codebase chat
- `POST /api/codebase/tests/generate` - Test generation
- `POST /api/codebase/refactor` - Refactoring
- `POST /api/codebase/index` - Codebase indexing

### **Authentication**
- Uses GitHub OAuth token from VS Code
- Token stored securely in VS Code secrets

---

## ✅ **TESTING CHECKLIST**

### **Before Release**
- [ ] All commands work
- [ ] API integration tested
- [ ] Error handling works
- [ ] Configuration options work
- [ ] Documentation complete
- [ ] Extension packaged successfully
- [ ] Tested on Windows/Mac/Linux

---

## 📝 **TROUBLESHOOTING**

### **Extension Not Loading**
- Check `package.json` for correct activation events
- Verify `extension.ts` exports `activate` function
- Check Output panel for errors

### **API Calls Failing**
- Verify `beastMode.apiUrl` configuration
- Check network connectivity
- Verify API endpoint is accessible
- Check authentication token

### **Suggestions Not Appearing**
- Verify `beastMode.enableSuggestions` is true
- Check suggestion provider is registered
- Verify API endpoint is working

---

## 🚀 **NEXT STEPS**

1. **Complete Core Features**
   - [ ] Quality analysis integration
   - [ ] Code suggestions provider
   - [ ] Chat interface
   - [ ] Test generation
   - [ ] Refactoring tools

2. **Testing**
   - [ ] Unit tests
   - [ ] Integration tests
   - [ ] End-to-end tests

3. **Documentation**
   - [ ] User guide
   - [ ] API documentation
   - [ ] Video tutorials

4. **Publishing**
   - [ ] Marketplace listing
   - [ ] Screenshots
   - [ ] Release notes

---

**Last Updated:** January 8, 2026  
**Status:** Development in progress
