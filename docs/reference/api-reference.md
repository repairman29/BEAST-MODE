# BEAST MODE API Reference
## Complete API Documentation

**Base URL:** `https://beastmode.dev/api`  
**API Version:** 1.0.0  
**Authentication:** Bearer token (API key)

---

## 🔐 Authentication

All API requests require authentication using a BEAST MODE API key.

### Getting an API Key

1. Sign up at [beastmode.dev](https://beastmode.dev)
2. Navigate to Dashboard → API Keys
3. Generate a new API key
4. **Save the key immediately** - it's only shown once!

### Using Your API Key

Include your API key in the `Authorization` header:

```bash
curl -H "Authorization: Bearer bm_live_your_api_key_here" \
  https://beastmode.dev/api/auth/validate
```

---

## 📊 Rate Limits

Rate limits are based on your subscription tier:

| Tier | Monthly Limit | Overage Pricing |
|------|--------------|-----------------|
| Free | 10,000 calls | N/A |
| Developer | 100,000 calls | $0.001/call |
| Team | 500,000 calls | $0.0008/call |
| Enterprise | 2,000,000 calls | $0.0005/call |

---

## 🔗 Endpoints

### Authentication & API Keys

#### Validate API Key
```http
GET /api/auth/validate
```

Validates your API key and returns subscription information.

**Headers:**
- `Authorization: Bearer <api_key>`

**Response:**
```json
{
  "valid": true,
  "tier": "developer",
  "subscription": {
    "name": "Developer",
    "apiCalls": 100000,
    "features": ["basic-quality-checks", "day2-operations", "priority-support"]
  },
  "apiCallsUsed": 5420,
  "apiCallsLimit": 100000,
  "apiCallsRemaining": 94580
}
```

---

#### Get API Usage
```http
GET /api/auth/usage
```

Returns current API usage statistics.

**Headers:**
- `Authorization: Bearer <api_key>`

**Response:**
```json
{
  "tier": "developer",
  "used": 5420,
  "limit": 100000,
  "remaining": 94580,
  "usagePercentage": 5,
  "limitExceeded": false,
  "currentMonth": "2026-01",
  "recentUsage": [
    {
      "endpoint": "/api/auth/validate",
      "method": "GET",
      "status_code": 200,
      "created_at": "2026-01-06T04:30:00Z"
    }
  ]
}
```

---

#### List API Keys
```http
GET /api/auth/api-keys?userId=<user_id>
```

Returns all API keys for a user.

**Query Parameters:**
- `userId` (required): User ID

**Response:**
```json
{
  "keys": [
    {
      "id": "uuid",
      "key_prefix": "bm_live_abc...",
      "name": "My API Key",
      "tier": "developer",
      "is_active": true,
      "last_used_at": "2026-01-06T04:30:00Z",
      "created_at": "2026-01-01T00:00:00Z"
    }
  ],
  "tier": "developer",
  "subscription": { ... }
}
```

---

#### Create API Key
```http
POST /api/auth/api-keys
```

Generates a new API key. **The full key is only returned once!**

**Request Body:**
```json
{
  "userId": "user_id",
  "name": "My New API Key" // optional
}
```

**Response:**
```json
{
  "success": true,
  "apiKey": "bm_live_full_key_here",
  "key": {
    "id": "uuid",
    "prefix": "bm_live_abc...",
    "name": "My New API Key",
    "tier": "developer",
    "created_at": "2026-01-06T04:30:00Z"
  },
  "warning": "Save this API key now - it will not be shown again!"
}
```

---

#### Revoke API Key
```http
DELETE /api/auth/api-keys/{id}
```

Revokes (deletes) an API key. **This action cannot be undone.**

**Path Parameters:**
- `id` (required): API key ID

**Response:**
```json
{
  "success": true,
  "message": "API key revoked"
}
```

---

## 📚 OpenAPI Specification

For complete API documentation with interactive examples, see:
- **OpenAPI Spec**: `/api/openapi.json`
- **Interactive Docs**: Coming soon (Swagger UI)

---

## 🎯 Feature Endpoints

### Quality Checks
- `GET /api/beast-mode/quality` - Get quality score
- `POST /api/beast-mode/quality/check` - Run quality check

### Day 2 Operations (AI Janitor)
- `GET /api/beast-mode/janitor/status` - Get janitor status
- `POST /api/beast-mode/janitor/refactor` - Trigger refactoring
- `GET /api/beast-mode/janitor/refactoring/history` - Get refactoring history

### Intelligence
- `POST /api/beast-mode/intelligence/analyze` - Analyze codebase
- `GET /api/beast-mode/intelligence/recommendations` - Get recommendations

### Marketplace
- `GET /api/beast-mode/marketplace/plugins` - Browse plugins
- `POST /api/beast-mode/marketplace/install` - Install plugin

---

## 🔒 Security

- API keys are hashed using SHA-256 before storage
- Keys are never returned after initial creation
- Use HTTPS for all API requests
- Rotate keys regularly
- Never commit API keys to version control

---

## 📝 Error Handling

All errors follow this format:

```json
{
  "error": "Error message",
  "valid": false,
  "tier": "free"
}
```

**HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (missing/invalid parameters)
- `401` - Unauthorized (invalid/missing API key)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Rate Limit Exceeded
- `500` - Internal Server Error

---

## 💡 Examples

### cURL
```bash
# Validate API key
curl -H "Authorization: Bearer bm_live_your_key" \
  https://beastmode.dev/api/auth/validate

# Get usage
curl -H "Authorization: Bearer bm_live_your_key" \
  https://beastmode.dev/api/auth/usage

# Create API key
curl -X POST https://beastmode.dev/api/auth/api-keys \
  -H "Content-Type: application/json" \
  -d '{"userId": "user_id", "name": "My Key"}'
```

### JavaScript
```javascript
const apiKey: process.env.APIKEY || '';

// Validate
const response = await fetch('https://beastmode.dev/api/auth/validate', {
  headers: {
    'Authorization': `Bearer ${apiKey}`
  }
});

const data = await response.json();
console.log(data);
```

### Python
```python
import requests

api_key: process.env.API_KEY || ''
headers = {'Authorization': f'Bearer {api_key}'}

# Validate
response = requests.get(
    'https://beastmode.dev/api/auth/validate',
    headers=headers
)
print(response.json())
```

---

## 📖 Related Documentation

- [Getting Started Guide](../getting-started/README.md)
- [CLI Reference](./cli-reference.md)
- [Pricing](../business/pricing.md)
- [Licensing](../business/licensing.md)

---

**Last Updated:** January 2026

