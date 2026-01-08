# Automated Deployment Guide

## 🚀 Quick Start

### **Option 1: NPM Script (Recommended)**
```bash
npm run deploy
```

### **Option 2: Node.js Script**
```bash
node scripts/auto-deploy.js
```

### **Option 3: Bash Script**
```bash
bash scripts/deploy-and-test.sh
```

---

## 📋 What It Does

1. **Pre-deployment Checks**
   - Verifies git status
   - Checks for uncommitted changes

2. **Build**
   - Runs `npm run build` in website directory
   - Validates build succeeds

3. **Deploy**
   - Deploys to Vercel production
   - Captures deployment URL

4. **Wait**
   - Waits 15-20 seconds for deployment to propagate

5. **Test**
   - Tests `/api/models/list`
   - Tests `/api/cursor/proxy`
   - Tests `/api/codebase/chat`
   - Runs integration test suite

6. **Summary**
   - Reports test results
   - Provides next steps

---

## 🎯 Usage Examples

### **Basic Deployment**
```bash
npm run deploy
```

### **Full Deployment with Tests**
```bash
npm run deploy:full
```

### **Test Only (No Deploy)**
```bash
npm run deploy:test
```

### **Custom API URL**
```bash
BEAST_MODE_API_URL=https://staging.beast-mode.dev npm run deploy
```

---

## ⚙️ Configuration

### **Environment Variables**
- `BEAST_MODE_API_URL` - API URL to test against (default: https://beast-mode.dev)

### **Scripts Location**
- `scripts/auto-deploy.js` - Node.js deployment script
- `scripts/deploy-and-test.sh` - Bash deployment script
- `scripts/test-custom-model-integration.js` - Integration tests

---

## ✅ Verification

After deployment, verify:

1. **Extension**
   ```bash
   code --install-extension cursor-extension/beast-mode-cursor-1.0.0.vsix
   ```

2. **Authentication**
   ```bash
   node scripts/test-custom-model-auth.js
   ```

3. **Production**
   - Visit: https://beast-mode.dev
   - Test endpoints manually

---

## 🐛 Troubleshooting

### **Build Fails**
- Check: `website/npm run build` manually
- Review: Build logs in `/tmp/beast-mode-build.log`

### **Deployment Fails**
- Check: Vercel CLI is installed (`vercel --version`)
- Verify: You're logged in (`vercel whoami`)
- Review: Vercel dashboard for errors

### **Tests Fail**
- Wait: Endpoints may need time to propagate
- Check: API URL is correct
- Verify: Services are running

---

## 📚 Related Documentation

- `docs/CURSOR_CUSTOM_MODEL_COMPLETE.md` - Complete integration guide
- `cursor-extension/INSTALL_AND_TEST.md` - Extension testing guide
- `scripts/test-custom-model-auth.js` - Authentication testing

---

**Status:** ✅ Ready for Automation
