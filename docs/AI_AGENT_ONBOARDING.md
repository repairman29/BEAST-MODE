# AI Agent Onboarding Guide
## Quick Setup for New Cursor Bot Sessions

**How to configure new AI agents to use BEAST MODE's custom model system**

---

## 🎯 Quick Start (30 seconds)

When starting a new Cursor bot session, share this message:

```
I'm working on the BEAST MODE project. Here's what you need to know:

1. Custom Models System:
   - Location: BEAST-MODE-PRODUCT/lib/mlops/
   - Smart selector: smartModelSelector.js
   - Model router: modelRouter.js
   - Documentation: docs/CUSTOM_MODELS_ARCHITECTURE.md

2. Key Files:
   - Custom models API: website/app/api/models/custom/route.ts
   - Chat endpoint: website/app/api/codebase/chat/route.ts
   - Feature generation: website/app/api/repos/quality/generate-feature/route.ts

3. Current Setup:
   - 9 custom models registered
   - 6 provider API keys ready (openai, anthropic, gemini, groq, mistral, together)
   - Auto-selection: Uses custom models first, falls back to providers

4. How It Works:
   - Smart selector auto-chooses best model
   - Custom models: ~$0.001/1K tokens (97% savings)
   - Provider models: ~$0.03/1K tokens (automatic fallback)

5. Testing:
   - node scripts/build-real-feature.js --user-id=YOUR_USER_ID
   - node scripts/monitor-custom-models.js
   - node scripts/get-user-api-keys.js --user-id=YOUR_USER_ID

Read docs/CUSTOM_MODELS_ARCHITECTURE.md for full details.
```

---

## 📋 Essential Context for AI Agents

### 1. System Architecture

**Custom Models System:**
- **Location:** `BEAST-MODE-PRODUCT/lib/mlops/`
- **Smart Selector:** Automatically chooses best model (custom or provider)
- **Model Router:** Routes requests to appropriate endpoint
- **Monitoring:** Tracks usage, costs, and performance

**Key Components:**
```
lib/mlops/
├── smartModelSelector.js    # Auto-selects best model
├── modelRouter.js           # Routes to custom/provider
├── customModelMonitoring.js # Tracks metrics
├── llmCodeGenerator.js      # Code generation with models
└── codebaseChat.js          # Chat interface
```

### 2. Current Configuration

**Your Setup:**
- ✅ **9 custom models** registered
- ✅ **6 provider API keys** ready (in Supabase)
- ✅ **Auto-selection** enabled (custom first, provider fallback)
- ✅ **Monitoring** active

**Current Selection:**
- Model: `custom:demo-code-model-1767889155418`
- Type: Custom (primary)
- Fallback: Provider models (automatic)

### 3. How Requests Work

**Request Flow:**
```
User Request
    ↓
Smart Model Selector
    ├─ Custom model available? → Use custom ✅
    └─ No custom? → Use provider ✅
    ↓
Model Router
    ├─ custom:model-id → Route to custom endpoint
    └─ openai:gpt-4 → Route to OpenAI API
    ↓
Response
```

**Auto-Selection Logic:**
1. Check for custom models (user has registered)
2. If found → Use custom model
3. If not found → Use provider model (openai:gpt-3.5-turbo default)
4. If custom fails → Auto-fallback to provider

### 4. Key Endpoints

**Custom Models:**
- `POST /api/models/custom` - Register model
- `GET /api/models/custom` - List models
- `GET /api/models/list` - List all (custom + provider)

**Code Generation:**
- `POST /api/codebase/chat` - Chat with codebase
- `POST /api/repos/quality/generate-feature` - Generate features
- `POST /api/codebase/refactor` - Refactor code

**Monitoring:**
- `GET /api/models/custom/monitoring` - View metrics

### 5. Testing & Verification

**Quick Tests:**
```bash
# Check model selection
node -e "const {getSmartModelSelector} = require('./lib/mlops/smartModelSelector'); (async () => { const s = getSmartModelSelector(); const sel = await s.selectModel('35379b45-d966-45d7-8644-1233338c542d'); console.log(sel); })();"

# Build with custom models
node scripts/build-real-feature.js --user-id=YOUR_USER_ID

# Monitor usage
node scripts/monitor-custom-models.js

# Check API keys
node scripts/get-user-api-keys.js --user-id=YOUR_USER_ID
```

---

## 🔧 Configuration Files

### .cursorrules

**Location:** `/Users/jeffadkins/Smugglers/.cursorrules`

**Key Sections:**
- Custom models documentation
- API endpoints
- Testing commands
- Architecture details

**For AI Agents:**
- Read `.cursorrules` for project context
- Check `docs/CUSTOM_MODELS_ARCHITECTURE.md` for system details
- Use `docs/CUSTOM_MODELS_QUICK_START.md` for quick reference

### Environment Variables

**Required:**
- `SUPABASE_URL` - Database connection
- `SUPABASE_SERVICE_ROLE_KEY` - Database access
- `API_KEYS_ENCRYPTION_KEY` - Decrypt stored API keys

**Location:** `website/.env.local`

---

## 📚 Documentation Hierarchy

**For New AI Agents, Read in This Order:**

1. **Quick Start:** `docs/CUSTOM_MODELS_QUICK_START.md`
   - 3-step setup
   - Basic usage
   - Examples

2. **Architecture:** `docs/CUSTOM_MODELS_ARCHITECTURE.md`
   - How it works
   - Fallback strategy
   - Cost implications

3. **Code Generation:** `docs/CUSTOM_MODELS_CODE_GENERATION.md`
   - Integration details
   - API reference
   - Advanced usage

4. **Workflow:** `docs/CUSTOM_MODELS_WORKFLOW_INTEGRATION.md`
   - CI/CD integration
   - VS Code/Cursor setup
   - GitHub Actions

---

## 🎯 Common Tasks for AI Agents

### Task 1: Add New Custom Model

**What to do:**
1. Use: `node scripts/simple-setup-custom-model.js`
2. Or API: `POST /api/models/custom`
3. System auto-selects it after registration

**Code:**
```javascript
// Register via API
POST /api/models/custom
{
  "modelName": "My Model",
  "modelId": "custom:my-model",
  "endpointUrl": "https://api.example.com/v1/chat",
  "provider": "openai-compatible",
  "apiKey": "sk-..."
}
```

### Task 2: Test Code Generation

**What to do:**
1. Use: `node scripts/build-real-feature.js --user-id=YOUR_USER_ID`
2. Or API: `POST /api/codebase/chat`
3. System auto-selects best model

**Code:**
```javascript
// Auto-selects model
POST /api/codebase/chat
{
  "message": "Create a component",
  "useLLM": true
  // No model specified - auto-selects!
}
```

### Task 3: Check System Status

**What to do:**
1. Check models: `GET /api/models/list`
2. Check monitoring: `GET /api/models/custom/monitoring`
3. Check API keys: `node scripts/get-user-api-keys.js`

### Task 4: Debug Issues

**What to do:**
1. Check model selection: Test smart selector
2. Check routing: Test model router
3. Check monitoring: View metrics
4. Check API keys: Verify decryption

---

## 💡 Key Principles for AI Agents

### 1. Always Use Smart Selector

**Don't:**
```javascript
// Hardcode model
model: 'openai:gpt-4'
```

**Do:**
```javascript
// Let system choose
const selector = getSmartModelSelector();
const selection = await selector.selectModel(userId);
// Uses custom if available, provider if not
```

### 2. Handle Fallbacks Gracefully

**Don't:**
```javascript
// Fail if custom model unavailable
if (!customModel) throw new Error('No custom model');
```

**Do:**
```javascript
// Auto-fallback to provider
const selection = await selector.selectModel(userId);
// Always returns a model (custom or provider)
```

### 3. Monitor Everything

**Don't:**
```javascript
// No tracking
await modelRouter.route(modelId, request, userId);
```

**Do:**
```javascript
// Track usage
const monitoring = getCustomModelMonitoring();
monitoring.recordRequest(modelId, endpoint, latency, success, error, usage);
```

### 4. Use Existing Infrastructure

**Don't:**
```javascript
// Create new routing logic
const customRouter = new CustomRouter();
```

**Do:**
```javascript
// Use existing model router
const { getModelRouter } = require('./lib/mlops/modelRouter');
const router = getModelRouter();
await router.route(modelId, request, userId);
```

---

## 🚨 Common Mistakes to Avoid

### ❌ Mistake 1: Hardcoding Models

**Bad:**
```javascript
model: 'openai:gpt-4' // Always uses provider
```

**Good:**
```javascript
// Auto-selects best model
const selection = await selector.selectModel(userId);
model: selection.modelId
```

### ❌ Mistake 2: Not Handling Fallbacks

**Bad:**
```javascript
if (!customModel) {
  return { error: 'No custom model' };
}
```

**Good:**
```javascript
// Auto-fallback built-in
const selection = await selector.selectModel(userId);
// Always returns a model
```

### ❌ Mistake 3: Ignoring Monitoring

**Bad:**
```javascript
await router.route(modelId, request, userId);
// No tracking
```

**Good:**
```javascript
const monitoring = getCustomModelMonitoring();
monitoring.recordRequest(...);
```

---

## ✅ Checklist for New AI Agents

When starting a new session, verify:

- [ ] Read `.cursorrules` for project context
- [ ] Read `docs/CUSTOM_MODELS_ARCHITECTURE.md`
- [ ] Understand smart selector logic
- [ ] Know model router flow
- [ ] Know current setup (9 custom models, 6 provider keys)
- [ ] Know testing commands
- [ ] Know monitoring endpoints
- [ ] Understand fallback strategy

---

## 📞 Quick Reference

**Key Commands:**
```bash
# Test model selection
node scripts/build-real-feature.js --user-id=YOUR_USER_ID

# Monitor usage
node scripts/monitor-custom-models.js

# Check API keys
node scripts/get-user-api-keys.js --user-id=YOUR_USER_ID

# Register model
node scripts/simple-setup-custom-model.js --user-id=YOUR_USER_ID
```

**Key Files:**
- `lib/mlops/smartModelSelector.js` - Model selection
- `lib/mlops/modelRouter.js` - Request routing
- `website/app/api/codebase/chat/route.ts` - Chat endpoint
- `docs/CUSTOM_MODELS_ARCHITECTURE.md` - Full documentation

**Key Endpoints:**
- `/api/models/custom` - Custom model management
- `/api/codebase/chat` - Code generation
- `/api/models/custom/monitoring` - Metrics

---

## 🎉 You're Ready!

**For new AI agents:**
1. Read this guide
2. Read `docs/CUSTOM_MODELS_ARCHITECTURE.md`
3. Test with `node scripts/build-real-feature.js`
4. Start building!

**The system is production-ready and fully automated!** 🚀
