# BEAST MODE API Documentation

Complete API reference for BEAST MODE endpoints.

## Base URL

- **Production**: `https://beast-mode.dev/api`
- **Development**: `http://localhost:7777/api`

## Authentication

Most endpoints require authentication via API key or session token.

```http
Authorization: Bearer YOUR_API_KEY
```

## Response Format

All API responses follow this structure:

```json
{
  "data": {},
  "error": null,
  "meta": {
    "timestamp": "2025-01-15T10:30:00Z",
    "version": "1.0.0"
  }
}
```

Error responses:

```json
{
  "error": {
    "name": "ErrorName",
    "message": "Error message",
    "code": "ERROR_CODE",
    "statusCode": 400,
    "details": {},
    "timestamp": "2025-01-15T10:30:00Z"
  }
}
```

## Endpoints

### Quality & Analysis

#### `GET /api/github/scan`
Scan GitHub repository for quality metrics.

**Query Parameters:**
- `repo` (required): Repository in format `owner/repo`
- `branch`: Branch to scan (default: `main`)

**Response:**
```json
{
  "data": {
    "score": 85,
    "grade": "B+",
    "metrics": {},
    "issues": []
  }
}
```

#### `POST /api/beast-mode/self-improve`
Analyze codebase and suggest improvements.

**Request Body:**
```json
{
  "code": "function example() {}",
  "language": "javascript"
}
```

### Marketplace

#### `GET /api/beast-mode/marketplace/plugins`
List available plugins.

**Query Parameters:**
- `category`: Filter by category
- `search`: Search query
- `limit`: Results limit (default: 50)

#### `POST /api/beast-mode/marketplace/install`
Install a plugin.

**Request Body:**
```json
{
  "pluginId": "plugin-id",
  "version": "1.0.0"
}
```

#### `GET /api/beast-mode/marketplace/installed`
List installed plugins.

#### `POST /api/beast-mode/marketplace/execute`
Execute a plugin.

**Request Body:**
```json
{
  "pluginId": "plugin-id",
  "input": {}
}
```

### Intelligence

#### `POST /api/beast-mode/conversation`
AI conversation endpoint.

**Request Body:**
```json
{
  "message": "How can I improve code quality?",
  "context": {}
}
```

#### `GET /api/beast-mode/missions`
List missions.

#### `POST /api/beast-mode/missions`
Create a new mission.

**Request Body:**
```json
{
  "title": "Improve code quality",
  "description": "Focus on reducing technical debt",
  "priority": "high"
}
```

### Enterprise

#### `GET /api/beast-mode/enterprise/repos`
List enterprise repositories.

#### `GET /api/beast-mode/enterprise/teams`
List teams.

#### `GET /api/beast-mode/enterprise/users`
List users.

### Health & Monitoring

#### `GET /api/beast-mode/health`
Get system health status.

**Response:**
```json
{
  "data": {
    "isMonitoring": true,
    "components": {},
    "alerts": []
  }
}
```

#### `POST /api/beast-mode/heal`
Trigger self-healing for components.

**Request Body:**
```json
{
  "component": "quality-engine"
}
```

### Deployments

#### `GET /api/beast-mode/deployments`
List deployments.

#### `POST /api/beast-mode/deployments`
Create a deployment.

**Request Body:**
```json
{
  "platform": "vercel",
  "environment": "production",
  "strategy": "blue-green"
}
```

### CI/CD Integrations

#### `POST /api/ci/github-actions`
GitHub Actions webhook handler.

#### `POST /api/ci/vercel/webhook`
Vercel webhook handler.

### Third-Party Integrations

#### `POST /api/integrations/slack`
Send Slack notification.

#### `POST /api/integrations/discord`
Send Discord notification.

#### `POST /api/integrations/email`
Send email notification.

### ML & Analytics

#### `GET /api/ml/predict`
Get ML predictions.

#### `GET /api/ml/monitoring`
Get ML monitoring data.

## Rate Limits

- **Free Tier**: 100 requests/hour
- **Developer Tier**: 1,000 requests/hour
- **Team Tier**: 10,000 requests/hour
- **Enterprise**: Unlimited

Rate limit headers:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 950
X-RateLimit-Reset: 1642248000
```

## Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `AUTHENTICATION_ERROR` | 401 | Authentication required |
| `AUTHORIZATION_ERROR` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `RATE_LIMIT_ERROR` | 429 | Rate limit exceeded |
| `INTERNAL_ERROR` | 500 | Internal server error |

## SDK Examples

### JavaScript/Node.js

```javascript
const beastMode = require('@beast-mode/core');

const client = new beastMode.BeastMode({
  apiKey: process.env.BEAST_MODE_API_KEY
});

await client.initialize();

// Get quality score
const score = await client.getQualityScore();
console.log(`Quality Score: ${score.overall}`);
```

### cURL

```bash
curl -X GET "https://beast-mode.dev/api/github/scan?repo=owner/repo" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

## Webhooks

BEAST MODE can send webhooks for events:

- `mission.completed`
- `deployment.success`
- `quality.alert`
- `plugin.installed`

Configure webhooks in the dashboard settings.

## Support

- **Documentation**: https://beast-mode.dev/docs
- **Support**: support@beast-mode.dev
- **Status**: https://status.beast-mode.dev

