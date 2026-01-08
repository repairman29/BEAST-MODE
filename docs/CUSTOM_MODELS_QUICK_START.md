# Custom Models Quick Start

## How to Use Your Own Models for Code Generation

### The Problem
- **Paid models** (OpenAI GPT-4, Anthropic Claude) cost **$0.03/1K tokens**
- **Custom models** cost **$0.001/1K tokens** (97% savings!)
- You want to use your own models but don't know how

### The Solution
BEAST MODE now routes all code generation through a **Model Router** that supports:
1. ✅ **Custom Models** - Your own hosted models
2. ✅ **Provider Models** - OpenAI, Anthropic (fallback)

## 3-Step Setup

### Step 1: Register Your Model

**Via API:**
```bash
POST /api/models/custom
{
  "model_name": "My Code Model",
  "model_id": "my-code-model",
  "endpoint_url": "https://your-api.com/v1/chat/completions",
  "provider": "openai-compatible",
  "api_key": "your-key"
}
```

**Via Cursor Extension:**
1. `Cmd+Shift+P` → `BEAST MODE: Register Custom Model`
2. Fill in the form
3. Done!

### Step 2: Use It in Code Generation

**Codebase Chat:**
```javascript
POST /api/codebase/chat
{
  "message": "Create a login component",
  "model": "custom:my-code-model"  // ← Your model!
}
```

**Feature Generation:**
```javascript
POST /api/repos/quality/generate-feature
{
  "featureRequest": "Add dark mode",
  "model": "custom:my-code-model"  // ← Your model!
}
```

### Step 3: Save Money! 💰

**Before (OpenAI):**
- 1000 code generations = $300/month

**After (Custom Model):**
- 1000 code generations = $10/month
- **Savings: $290/month (97%)**

## What Works Now

All these endpoints support custom models:

| Endpoint | Purpose | Custom Model Support |
|----------|---------|---------------------|
| `/api/codebase/chat` | Chat with codebase | ✅ |
| `/api/repos/quality/generate-feature` | Generate features | ✅ |
| `/api/codebase/refactor` | Refactor code | ✅ |
| `/api/codebase/tests/generate` | Generate tests | ✅ |
| `/api/codebase/suggestions` | Real-time suggestions | ✅ |

## Example: Generate Code with Custom Model

```javascript
// Generate an API endpoint using your custom model
const response = await fetch('https://beast-mode.dev/api/codebase/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionId: 'session-123',
    message: 'Create a REST API endpoint for user registration with validation',
    repo: 'my-api',
    model: 'custom:my-code-model',  // ← Your custom model
    useLLM: true
  })
});

const { code, message } = await response.json();
console.log('Generated code:', code);
```

## How It Works

```
Your Request
    ↓
Model Router (checks model ID)
    ↓
┌─────────────────┐
│ custom:my-model │ → Your API Endpoint
└─────────────────┘
    ↓
Generated Code
```

The Model Router:
1. Detects `custom:` prefix
2. Looks up your model config
3. Decrypts your API key
4. Formats request (OpenAI/Anthropic compatible)
5. Calls your endpoint
6. Returns formatted response

## Supported Providers

### OpenAI-Compatible
```json
{
  "provider": "openai-compatible",
  "endpoint_url": "https://your-api.com/v1/chat/completions"
}
```

### Anthropic-Compatible
```json
{
  "provider": "anthropic-compatible",
  "endpoint_url": "https://your-api.com/v1/messages"
}
```

## Troubleshooting

**"Custom model not found"**
→ Check model ID: `custom:my-model` (must match exactly)

**"API key decryption failed"**
→ Re-register model with correct API key

**"Request format error"**
→ Verify `provider` type matches your API format

## Next Steps

1. **Register your model** (API or extension)
2. **Test with chat**: `model: "custom:your-model"`
3. **Monitor savings** in BEAST MODE dashboard
4. **Scale up** to all code generation tasks

## Full Documentation

See `/docs/CUSTOM_MODELS_CODE_GENERATION.md` for:
- Detailed API reference
- Advanced configuration
- Cost analysis
- Best practices

---

**Ready to save 97%?** Register your model now! 🚀
