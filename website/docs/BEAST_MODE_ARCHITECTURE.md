# BEAST MODE Architecture

## Philosophy

**BEAST MODE is the galaxy's best vibe-coder's oasis.**

We don't use external providers. We ARE the provider. BEAST MODE uses its own infrastructure, models, and backend for all code generation.

## Architecture

### Code Generation Flow

```
User Request
    ↓
BEAST MODE API Key Authentication
    ↓
BEAST MODE Backend API (/api/v1/code/generate)
    ↓
BEAST MODE Custom Models
    ↓
Generated Code
```

### No External Providers

- ❌ No Anthropic API calls
- ❌ No OpenAI API calls  
- ❌ No fallback to external providers
- ✅ BEAST MODE backend only
- ✅ BEAST MODE custom models only

## API Endpoints

### Code Generation

**Endpoint:** `POST /api/beast-mode/generate-code`

**Headers:**
- `X-BEAST-MODE-API-KEY`: Your BEAST MODE API key (required)
- `Content-Type`: `application/json`

**Body:**
```json
{
  "prompt": "Create a React component",
  "language": "typescript",
  "context": {
    "description": "Optional context",
    "techStack": ["react", "typescript"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "code": "// Generated code here",
  "language": "typescript",
  "source": "beast-mode-backend",
  "timestamp": "2026-01-16T..."
}
```

## Configuration

### Environment Variables

```bash
# BEAST MODE API Key (required)
BEAST_MODE_API_KEY=bm_live_...

# BEAST MODE Backend URL (optional, defaults to api.beast-mode.dev)
BEAST_MODE_API_URL=https://api.beast-mode.dev
```

### Backend API

BEAST MODE backend should implement:

```
POST /api/v1/code/generate
Headers:
  Authorization: Bearer {BEAST_MODE_API_KEY}
  X-BEAST-MODE-API-KEY: {BEAST_MODE_API_KEY}
  X-User-Id: {userId}

Body:
{
  "prompt": "...",
  "language": "typescript",
  "context": {...},
  "userId": "..."
}

Response:
{
  "code": "...",
  "language": "typescript",
  "response": "..." // Optional
}
```

## Fallback Strategy

If BEAST MODE backend is unavailable:

1. Try local BEAST MODE custom model (`custom:beast-mode-code-generator`)
2. Return helpful error message
3. **Never fall back to external providers**

## Custom Models

BEAST MODE uses custom models stored in Supabase:

- Table: `custom_models`
- Model ID: `custom:beast-mode-code-generator`
- Provider: `beast-mode` (our own provider)

## Security

- BEAST MODE API keys authenticate all requests
- No external API keys needed
- All code generation goes through BEAST MODE infrastructure
- User isolation via `userId` in requests

## Testing

```bash
# Test code generation
curl -X POST http://localhost:7777/api/beast-mode/generate-code \
  -H "Content-Type: application/json" \
  -H "X-BEAST-MODE-API-KEY: bm_live_..." \
  -d '{"prompt":"Create a React button","language":"typescript"}'

# Run E2E tests
node scripts/e2e-test-beast-mode.js
```

## Status

✅ **BEAST MODE-only architecture implemented**
✅ **No external provider dependencies**
✅ **Self-contained code generation**
✅ **Galaxy's best vibe-coder's oasis** 🌌
