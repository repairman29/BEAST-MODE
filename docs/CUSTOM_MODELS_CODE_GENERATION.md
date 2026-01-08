# Using Custom Models for Code Generation

This guide explains how to use your own custom models (instead of paid providers like OpenAI/Anthropic) for code generation in BEAST MODE.

## Overview

BEAST MODE now supports using custom models for all code generation tasks:
- **Codebase Chat** - Conversational code assistance
- **Feature Generation** - Generate new features from descriptions
- **Code Refactoring** - Automated code improvements
- **Test Generation** - Generate test files
- **Real-time Suggestions** - Inline code suggestions

## Architecture

The system uses a **Model Router** that automatically routes requests to:
1. **Custom Models** - Your own hosted models (via API endpoint)
2. **Provider Models** - OpenAI, Anthropic, etc. (fallback)

```
Code Generation Request
    ↓
Model Router
    ↓
┌─────────────┬──────────────┐
│ Custom Model│ Provider API │
│ (Your API)  │ (OpenAI/etc) │
└─────────────┴──────────────┘
```

## Setup

### 1. Register Your Custom Model

Register your model via the API or Cursor extension:

**Via API:**
```bash
curl -X POST https://beast-mode.dev/api/models/custom \
  -H "Content-Type: application/json" \
  -H "Cookie: github_oauth_user_id=YOUR_USER_ID" \
  -d '{
    "model_name": "My Code Model",
    "model_id": "my-code-model",
    "endpoint_url": "https://your-model-api.com/v1/chat/completions",
    "provider": "openai-compatible",
    "api_key": "your-api-key",
    "description": "Custom model for code generation",
    "context_window": 8192,
    "max_tokens": 4000,
    "temperature": 0.7
  }'
```

**Via Cursor Extension:**
1. Open Command Palette (`Cmd+Shift+P`)
2. Run: `BEAST MODE: Register Custom Model`
3. Fill in the form

### 2. Use Custom Model in Code Generation

#### Option A: Via API (Codebase Chat)

```javascript
// POST /api/codebase/chat
{
  "sessionId": "session-123",
  "message": "Create a new API endpoint for user authentication",
  "repo": "my-repo",
  "model": "custom:my-code-model",  // ← Use your custom model
  "files": [...],
  "useLLM": true
}
```

#### Option B: Via Code (Direct Integration)

```javascript
const codebaseChat = require('./lib/mlops/codebaseChat');

const response = await codebaseChat.processMessage(
  'session-123',
  'Create a new API endpoint',
  {
    repo: 'my-repo',
    model: 'custom:my-code-model',  // ← Custom model
    customModelId: 'my-code-model',
    userId: 'user-123',
    useLLM: true
  }
);
```

## Model Router Integration

The `ModelRouter` automatically handles:
- ✅ Custom model detection (`custom:model-id`)
- ✅ API key decryption
- ✅ Request formatting (OpenAI/Anthropic compatible)
- ✅ Response parsing
- ✅ Fallback to provider models

### How It Works

1. **Request comes in** with `model: "custom:my-model"`
2. **Model Router** looks up model in database
3. **Decrypts** API key from secure storage
4. **Formats** request to match provider type (OpenAI/Anthropic compatible)
5. **Calls** your custom model endpoint
6. **Parses** response and returns formatted result

## Supported Provider Types

### OpenAI-Compatible
```json
{
  "provider": "openai-compatible",
  "endpoint_url": "https://your-api.com/v1/chat/completions"
}
```

**Request Format:**
```json
{
  "model": "your-model",
  "messages": [...],
  "temperature": 0.7,
  "max_tokens": 4000
}
```

**Response Format:**
```json
{
  "choices": [{
    "message": {
      "content": "generated code..."
    }
  }]
}
```

### Anthropic-Compatible
```json
{
  "provider": "anthropic-compatible",
  "endpoint_url": "https://your-api.com/v1/messages"
}
```

**Request Format:**
```json
{
  "model": "your-model",
  "messages": [...],
  "temperature": 0.7,
  "max_tokens": 4000
}
```

**Response Format:**
```json
{
  "content": [{
    "text": "generated code..."
  }]
}
```

## Code Generation Endpoints

All these endpoints now support custom models:

### 1. Codebase Chat
```bash
POST /api/codebase/chat
{
  "model": "custom:my-model",
  "message": "Generate a login component"
}
```

### 2. Feature Generation
```bash
POST /api/repos/quality/generate-feature
{
  "model": "custom:my-model",
  "featureRequest": "Add user authentication"
}
```

### 3. Code Refactoring
```bash
POST /api/codebase/refactor
{
  "model": "custom:my-model",
  "file": "src/api/users.js",
  "opportunity": {...}
}
```

### 4. Test Generation
```bash
POST /api/codebase/tests/generate
{
  "model": "custom:my-model",
  "file": "src/api/users.js"
}
```

## Cost Savings

Using custom models can significantly reduce costs:

| Task | OpenAI GPT-4 | Custom Model | Savings |
|------|--------------|--------------|---------|
| Code Generation | $0.03/1K tokens | $0.001/1K tokens | 97% |
| Chat (1000 msgs) | $30 | $1 | 97% |
| Feature Gen (100) | $150 | $5 | 97% |

**Example:** If you generate code 1000 times/month:
- OpenAI: $300/month
- Custom Model: $10/month
- **Savings: $290/month (97%)**

## Best Practices

### 1. Model Selection
- Use **custom models** for routine code generation
- Use **provider models** (GPT-4) for complex reasoning tasks
- Mix and match based on task complexity

### 2. Model Configuration
```javascript
{
  "temperature": 0.3,  // Lower = more deterministic (good for code)
  "max_tokens": 4000,  // Match your model's context window
  "context_window": 8192  // Your model's max context
}
```

### 3. Error Handling
The system automatically falls back to provider models if:
- Custom model is unavailable
- API key is invalid
- Request times out

### 4. Monitoring
Track usage in BEAST MODE dashboard:
- Custom model usage vs provider usage
- Cost per request
- Response times
- Error rates

## Examples

### Example 1: Generate API Endpoint
```javascript
const response = await fetch('https://beast-mode.dev/api/codebase/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionId: 'session-123',
    message: 'Create a REST API endpoint for user registration',
    repo: 'my-api',
    model: 'custom:my-code-model',
    useLLM: true
  })
});
```

### Example 2: Generate Feature
```javascript
const response = await fetch('https://beast-mode.dev/api/repos/quality/generate-feature', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    repo: 'my-app',
    featureRequest: 'Add dark mode toggle',
    model: 'custom:my-code-model',
    useLLM: true
  })
});
```

## Troubleshooting

### Custom Model Not Found
**Error:** `Custom model not found: my-model`

**Solution:**
1. Verify model is registered: `GET /api/models/list`
2. Check model ID matches exactly: `custom:my-model`
3. Ensure user has access to the model

### API Key Decryption Failed
**Error:** `Failed to decrypt API key`

**Solution:**
1. Re-register model with correct API key
2. Check `ENCRYPTION_KEY` environment variable
3. Verify encryption key hasn't changed

### Request Format Error
**Error:** `Custom model request failed: Invalid request format`

**Solution:**
1. Verify `provider` type matches your API
2. Check `endpoint_url` is correct
3. Ensure request format matches provider spec

## Next Steps

1. **Register your model** via API or extension
2. **Test with codebase chat** using `model: "custom:your-model"`
3. **Monitor usage** in BEAST MODE dashboard
4. **Optimize** model configuration for your use case

## Support

- **Documentation:** `/docs/CUSTOM_MODELS_CODE_GENERATION.md`
- **API Reference:** `/docs/API_REFERENCE.md`
- **Issues:** GitHub Issues

---

**Ready to save 97% on code generation costs?** Register your custom model today! 🚀
