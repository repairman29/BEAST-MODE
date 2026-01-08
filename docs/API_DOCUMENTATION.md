# BEAST MODE API Documentation
## Complete API Reference for All Endpoints

**Last Updated:** January 8, 2026  
**Status:** 📚 Complete API Documentation

---

## 📋 Table of Contents

1. [Enterprise APIs](#enterprise-apis)
2. [Integration APIs](#integration-apis)
3. [Marketplace APIs](#marketplace-apis)
4. [AI Feature APIs](#ai-feature-apis)
5. [Performance & Monitoring APIs](#performance--monitoring-apis)
6. [Core APIs](#core-apis)

---

## Enterprise APIs

### Teams Management

#### `GET /api/enterprise/teams`
Get all teams for the authenticated user.

**Response:**
```json
{
  "teams": [
    {
      "id": "team-123",
      "name": "Engineering Team",
      "description": "Main engineering team",
      "memberCount": 5,
      "role": "admin"
    }
  ]
}
```

#### `POST /api/enterprise/teams`
Create a new team.

**Request:**
```json
{
  "name": "New Team",
  "description": "Team description"
}
```

**Response:**
```json
{
  "team": {
    "id": "team-456",
    "name": "New Team",
    "description": "Team description",
    "memberCount": 1
  }
}
```

---

### Role-Based Access Control (RBAC)

#### `GET /api/enterprise/rbac`
Get all roles and permissions.

**Response:**
```json
{
  "roles": [
    {
      "role": "admin",
      "context": "team",
      "permissions": ["read", "write", "delete"]
    }
  ]
}
```

#### `POST /api/enterprise/rbac`
Assign a role to a user.

**Request:**
```json
{
  "userId": "user-123",
  "role": "admin",
  "context": "team",
  "contextId": "team-123"
}
```

---

### Audit Logging

#### `GET /api/enterprise/audit`
Get audit logs.

**Query Parameters:**
- `limit` (number): Number of logs to return (default: 50)
- `timeRange` (string): Time range filter (e.g., "7d", "30d")

**Response:**
```json
{
  "logs": [
    {
      "id": "log-123",
      "action": "team.create",
      "userId": "user-123",
      "timestamp": "2026-01-08T12:00:00Z",
      "result": "success",
      "metadata": {}
    }
  ]
}
```

---

### Compliance

#### `GET /api/enterprise/compliance`
Get compliance status.

**Response:**
```json
{
  "status": {
    "compliant": true,
    "policies": [
      {
        "id": "gdpr",
        "name": "GDPR Compliance",
        "status": "compliant"
      }
    ],
    "requirements": {
      "encryption": true,
      "auditLogging": true,
      "accessControls": true
    }
  }
}
```

#### `POST /api/enterprise/compliance`
Request compliance report.

**Request:**
```json
{
  "type": "gdpr",
  "format": "pdf"
}
```

---

## Integration APIs

### GitHub Actions

#### `POST /api/integrations/github-actions`
Generate GitHub Actions workflow.

**Request:**
```json
{
  "repo": "owner/repo",
  "workflow": "quality-check",
  "options": {
    "onPush": true,
    "onPR": true
  }
}
```

**Response:**
```json
{
  "workflow": {
    "id": "workflow-123",
    "name": "quality-check",
    "yaml": "..."
  }
}
```

---

### GitLab

#### `POST /api/integrations/gitlab`
Generate GitLab CI/CD pipeline.

**Request:**
```json
{
  "repo": "owner/repo",
  "pipeline": "quality-check",
  "options": {}
}
```

**Response:**
```json
{
  "pipeline": {
    "id": "pipeline-123",
    "yaml": "..."
  }
}
```

---

### Bitbucket

#### `POST /api/integrations/bitbucket`
Generate Bitbucket Pipelines configuration.

**Request:**
```json
{
  "repo": "owner/repo",
  "pipeline": "quality-check",
  "options": {}
}
```

**Response:**
```json
{
  "pipeline": {
    "id": "pipeline-123",
    "yaml": "..."
  }
}
```

---

### Slack

#### `POST /api/integrations/slack`
Send notification to Slack.

**Request:**
```json
{
  "message": "Quality check completed",
  "channel": "#engineering",
  "webhookUrl": "https://hooks.slack.com/..."
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "msg-123"
}
```

---

### Jira

#### `POST /api/integrations/jira`
Create Jira issue.

**Request:**
```json
{
  "issue": {
    "summary": "Quality issue found",
    "description": "Details...",
    "project": "PROJ",
    "issueType": "Bug"
  },
  "jiraUrl": "https://your-domain.atlassian.net",
  "apiToken": "your-token"
}
```

**Response:**
```json
{
  "issue": {
    "id": "PROJ-123",
    "key": "PROJ-123",
    "url": "https://..."
  }
}
```

---

## Marketplace APIs

### Models

#### `GET /api/marketplace/models`
Get available models.

**Query Parameters:**
- `popular` (boolean): Get popular models
- `q` (string): Search query
- `category` (string): Filter by category

**Response:**
```json
{
  "models": [
    {
      "modelId": "model-123",
      "name": "Code Quality Model",
      "description": "High-quality code generation",
      "rating": 4.5,
      "downloads": 1000,
      "category": "code-generation"
    }
  ]
}
```

#### `POST /api/marketplace/models`
Share a model publicly.

**Request:**
```json
{
  "modelId": "model-123",
  "name": "My Model",
  "description": "Model description",
  "category": "code-generation",
  "public": true
}
```

---

### Templates

#### `GET /api/marketplace/templates`
Get model templates.

**Query Parameters:**
- `q` (string): Search query
- `category` (string): Filter by category
- `framework` (string): Filter by framework

**Response:**
```json
{
  "templates": [
    {
      "id": "template-123",
      "name": "JavaScript Code Generator",
      "description": "Template for JS code generation",
      "category": "code-generation",
      "framework": "javascript"
    }
  ]
}
```

#### `POST /api/marketplace/templates`
Create a template from a model.

**Request:**
```json
{
  "modelId": "model-123",
  "name": "Template Name",
  "description": "Template description",
  "category": "code-generation"
}
```

---

## AI Feature APIs

### Test Generation

#### `POST /api/ai/test-generation`
Generate intelligent test cases.

**Request:**
```json
{
  "functionInfo": {
    "name": "calculateTotal",
    "params": ["items", "tax"]
  },
  "code": "function calculateTotal(items, tax) { ... }",
  "options": {
    "language": "javascript",
    "framework": "jest"
  }
}
```

**Response:**
```json
{
  "result": {
    "tests": [
      {
        "name": "should calculate total correctly",
        "code": "expect(calculateTotal([1, 2], 0.1)).toBe(3.3);"
      }
    ]
  }
}
```

---

### Code Review

#### `POST /api/ai/code-review`
Automated code review.

**Request:**
```json
{
  "code": "function test() { return true; }",
  "filePath": "src/test.js",
  "options": {
    "checkSecurity": true,
    "checkPerformance": true
  }
}
```

**Response:**
```json
{
  "result": {
    "score": 85,
    "issues": [
      {
        "severity": "warning",
        "message": "Missing error handling",
        "line": 5
      }
    ],
    "suggestions": ["Add try-catch block"]
  }
}
```

---

### Learning System

#### `GET /api/ai/learning`
Get learning system insights.

**Response:**
```json
{
  "preferences": {
    "preferredLanguage": "javascript",
    "codeStyle": "functional"
  },
  "patterns": [
    {
      "pattern": "async-await",
      "frequency": 0.8
    }
  ]
}
```

#### `POST /api/ai/learning`
Update learning preferences.

**Request:**
```json
{
  "preferences": {
    "preferredLanguage": "typescript"
  }
}
```

---

### Predictions

#### `POST /api/ai/predictions`
Get predictive analysis.

**Request:**
```json
{
  "type": "bugs",
  "code": "function test() { ... }",
  "filePath": "src/test.js"
}
```

**Response:**
```json
{
  "result": {
    "predictions": [
      {
        "type": "bug",
        "probability": 0.75,
        "description": "Potential null pointer exception",
        "location": { "line": 10, "column": 5 }
      }
    ]
  }
}
```

---

### Documentation Generation

#### `POST /api/ai/documentation`
Generate code documentation.

**Request:**
```json
{
  "code": "function test() { return true; }",
  "filePath": "src/test.js",
  "options": {
    "format": "markdown",
    "includeExamples": true
  }
}
```

**Response:**
```json
{
  "result": {
    "documentation": "# test()\n\nFunction description...",
    "format": "markdown"
  }
}
```

---

## Performance & Monitoring APIs

### Custom Model Monitoring

#### `GET /api/models/custom/monitoring`
Get custom model monitoring metrics.

**Query Parameters:**
- `timeRange` (string): Time range (e.g., "24h", "7d", "30d")

**Response:**
```json
{
  "metrics": {
    "requests": {
      "total": 1000,
      "success": 950,
      "failed": 50,
      "successRate": 0.95
    },
    "latency": {
      "average": 150,
      "p50": 120,
      "p95": 300,
      "p99": 500
    }
  }
}
```

---

### Latency Optimization

#### `GET /api/optimization/latency`
Get latency optimization stats.

**Response:**
```json
{
  "stats": {
    "cacheHits": 500,
    "cacheMisses": 50,
    "averageLatency": 100,
    "optimizations": ["caching", "batching"]
  }
}
```

#### `POST /api/optimization/latency`
Clear cache or optimize.

**Request:**
```json
{
  "action": "clearCache"
}
```

---

### Performance Monitoring

#### `GET /api/beast-mode/monitoring/performance`
Get performance metrics.

**Query Parameters:**
- `timeRange` (string): Time range filter

**Response:**
```json
{
  "metrics": {
    "operations": [
      {
        "name": "quality-check",
        "count": 100,
        "avgDuration": 150,
        "p95": 300,
        "p99": 500
      }
    ]
  }
}
```

---

## Core APIs

### Health Check

#### `GET /api/health`
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-08T12:00:00Z"
}
```

---

## Error Responses

All APIs return errors in the following format:

```json
{
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "status": 400
  }
}
```

**Common Status Codes:**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error

---

## Authentication

Most endpoints require authentication. Include authentication in headers:

```
Authorization: Bearer <token>
```

Or use API key:

```
X-API-Key: <api-key>
```

---

## Rate Limiting

- Free tier: 100 requests/hour
- Developer tier: 1,000 requests/hour
- Team tier: 10,000 requests/hour
- Enterprise: Unlimited

Rate limit headers:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 950
X-RateLimit-Reset: 1641600000
```

---

## Support

For API support:
- Documentation: https://docs.beastmode.dev
- Support: support@beastmode.dev
- GitHub: https://github.com/repairman29/BEAST-MODE

---

**Last Updated:** January 8, 2026
