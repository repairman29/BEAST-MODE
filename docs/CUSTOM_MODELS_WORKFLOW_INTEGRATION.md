# Custom Models Workflow Integration

## Overview

This guide shows how to integrate custom models into your development workflows and monitor their performance.

## Table of Contents

1. [Workflow Integration](#workflow-integration)
2. [Monitoring & Metrics](#monitoring--metrics)
3. [Testing & Validation](#testing--validation)
4. [Health Checks](#health-checks)
5. [Cost Tracking](#cost-tracking)

---

## Workflow Integration

### 1. Development Workflow

**Before (Using Paid Models):**
```javascript
// Code generation costs $0.03/1K tokens
const response = await fetch('/api/codebase/chat', {
  method: 'POST',
  body: JSON.stringify({
    message: 'Create a login component',
    model: 'openai:gpt-4', // $0.03/1K tokens
    useLLM: true
  })
});
```

**After (Using Custom Models):**
```javascript
// Code generation costs $0.001/1K tokens (97% savings!)
const response = await fetch('/api/codebase/chat', {
  method: 'POST',
  body: JSON.stringify({
    message: 'Create a login component',
    model: 'custom:my-code-model', // $0.001/1K tokens
    useLLM: true
  })
});
```

### 2. CI/CD Integration

**GitHub Actions Example:**
```yaml
name: Code Generation with Custom Model

on:
  workflow_dispatch:
    inputs:
      feature_request:
        description: 'Feature to generate'
        required: true

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Generate Feature
        run: |
          curl -X POST https://beast-mode.dev/api/repos/quality/generate-feature \
            -H "Content-Type: application/json" \
            -H "Cookie: github_oauth_user_id=${{ secrets.USER_ID }}" \
            -d '{
              "repo": "${{ github.repository }}",
              "featureRequest": "${{ inputs.feature_request }}",
              "model": "custom:my-code-model"
            }'
```

### 3. VS Code/Cursor Integration

**Using Cursor Extension:**
1. Install BEAST MODE Cursor Extension
2. Register custom model: `Cmd+Shift+P` → `BEAST MODE: Register Custom Model`
3. Select model: `Cmd+Shift+P` → `BEAST MODE: Select Model`
4. Use in chat: Model is automatically used for all code generation

### 4. API Integration

**Node.js Example:**
```javascript
const axios = require('axios');

async function generateCodeWithCustomModel(prompt) {
  const response = await axios.post('https://beast-mode.dev/api/codebase/chat', {
    sessionId: 'my-session',
    message: prompt,
    model: 'custom:my-code-model',
    useLLM: true
  }, {
    headers: {
      'Cookie': `github_oauth_user_id=${process.env.USER_ID}`
    }
  });
  
  return response.data.code;
}
```

---

## Monitoring & Metrics

### Real-Time Monitoring

**Command Line:**
```bash
# One-time check
node scripts/monitor-custom-models.js

# Continuous monitoring
node scripts/monitor-custom-models.js --watch
```

**API Endpoint:**
```bash
GET /api/models/custom/monitoring
```

**Response:**
```json
{
  "success": true,
  "metrics": {
    "requests": {
      "total": 1250,
      "success": 1200,
      "failures": 50,
      "successRate": "96.00%",
      "byModel": {
        "custom:my-model": 1000,
        "custom:other-model": 250
      }
    },
    "performance": {
      "averageLatency": "450.23ms",
      "p50Latency": "380.00ms",
      "p95Latency": "850.00ms",
      "p99Latency": "1200.00ms"
    },
    "costs": {
      "customModelCost": "$1.25",
      "providerModelCost": "$37.50",
      "savings": "$36.25",
      "savingsPercent": "96.7%"
    }
  },
  "health": {
    "status": "healthy",
    "successRate": "96.00%",
    "averageLatency": "450ms",
    "totalRequests": 1250,
    "issues": []
  }
}
```

### Key Metrics to Monitor

1. **Success Rate**
   - Target: >95%
   - Action if <90%: Check model endpoint health

2. **Latency**
   - Target: <1000ms (p95)
   - Action if >5000ms: Optimize model or endpoint

3. **Cost Savings**
   - Track: Custom vs Provider costs
   - Goal: >90% savings

4. **Error Rate**
   - Target: <5%
   - Action if >10%: Investigate errors

---

## Testing & Validation

### 1. Health Check Script

```bash
# Test custom model health
node scripts/test-custom-model-health.js --model-id=custom:my-model
```

**What it checks:**
- ✅ Model exists in database
- ✅ Endpoint is reachable
- ✅ API key is valid
- ✅ Response format is correct
- ✅ Latency is acceptable

### 2. Integration Test

```bash
# Test full workflow
node scripts/test-custom-model-workflow.js --user-id=YOUR_USER_ID
```

**What it tests:**
- ✅ Registration
- ✅ Listing
- ✅ Code generation
- ✅ Performance
- ✅ Cost tracking

### 3. Load Testing

```bash
# Test under load
node scripts/load-test-custom-models.js \
  --model-id=custom:my-model \
  --requests=100 \
  --concurrency=10
```

---

## Health Checks

### Automated Health Monitoring

**Set up cron job:**
```bash
# Check every 5 minutes
*/5 * * * * cd /path/to/BEAST-MODE-PRODUCT && node scripts/check-custom-model-health.js
```

**Health Check Script:**
```javascript
const monitoring = require('./lib/mlops/customModelMonitoring');
const { getCustomModelMonitoring } = monitoring;

const health = getCustomModelMonitoring().getHealthStatus();

if (health.status !== 'healthy') {
  // Send alert (email, Slack, etc.)
  console.error('⚠️  Custom models health check failed:', health.issues);
  process.exit(1);
}
```

### Health Status Levels

- **healthy**: Success rate >90%, latency <5000ms
- **degraded**: Success rate 80-90% OR latency 5000-10000ms
- **unhealthy**: Success rate <80% OR latency >10000ms OR more failures than successes

---

## Cost Tracking

### Real-Time Cost Tracking

All custom model usage is automatically tracked:

```javascript
// Metrics include cost breakdown
const metrics = await getCustomModelMonitoring().getMetrics();

console.log('Cost Savings:', metrics.costs.savings);
console.log('Savings %:', metrics.costs.savingsPercent);
```

### Monthly Cost Report

```bash
# Generate monthly report
node scripts/generate-cost-report.js --month=2026-01
```

**Report includes:**
- Total requests
- Custom model costs
- Provider costs (if any)
- Total savings
- Savings percentage
- Per-model breakdown

---

## Workflow Examples

### Example 1: Daily Development

```bash
# Morning: Check health
node scripts/monitor-custom-models.js

# During development: Use custom model
# (automatic via Cursor extension or API)

# Evening: Review metrics
node scripts/monitor-custom-models.js --watch
```

### Example 2: Feature Generation

```javascript
// Generate feature using custom model
const feature = await generateFeature({
  repo: 'my-repo',
  featureRequest: 'Add user authentication',
  model: 'custom:my-code-model' // 97% cost savings!
});
```

### Example 3: Batch Code Generation

```javascript
// Generate multiple files using custom model
const files = [
  'login.js',
  'signup.js',
  'profile.js'
];

for (const file of files) {
  await generateCode({
    file,
    model: 'custom:my-code-model'
  });
}

// Check total cost savings
const metrics = await getMetrics();
console.log('Total savings:', metrics.costs.savings);
```

---

## Best Practices

### 1. Model Selection

- **Use custom models** for routine code generation
- **Use provider models** (GPT-4) for complex reasoning
- **Mix and match** based on task complexity

### 2. Monitoring

- **Monitor daily** during initial rollout
- **Set up alerts** for health degradation
- **Review weekly** cost savings

### 3. Testing

- **Test before production** use
- **Validate response quality** regularly
- **Compare** custom vs provider outputs

### 4. Optimization

- **Optimize latency** if >1000ms
- **Scale endpoint** if high load
- **Cache responses** when possible

---

## Troubleshooting

### Low Success Rate

**Symptoms:** Success rate <90%

**Diagnosis:**
```bash
# Check error logs
node scripts/monitor-custom-models.js
# Look at "Recent Errors" section
```

**Solutions:**
1. Check model endpoint is accessible
2. Verify API key is valid
3. Check endpoint response format
4. Review error messages

### High Latency

**Symptoms:** Average latency >5000ms

**Diagnosis:**
```bash
# Check performance metrics
GET /api/models/custom/monitoring
# Look at "Performance Metrics"
```

**Solutions:**
1. Optimize model endpoint
2. Use faster model instance
3. Enable response caching
4. Check network latency

### No Cost Savings

**Symptoms:** Savings <90%

**Diagnosis:**
```bash
# Check cost metrics
GET /api/models/custom/monitoring
# Look at "Cost Metrics"
```

**Solutions:**
1. Verify custom model is being used
2. Check model pricing
3. Compare token usage

---

## Next Steps

1. **Set up monitoring**: `node scripts/monitor-custom-models.js --watch`
2. **Integrate into workflows**: Use `model: "custom:your-model"` in API calls
3. **Track metrics**: Review daily/weekly
4. **Optimize**: Based on metrics and feedback

---

**Ready to save 97% on code generation?** Start using custom models today! 🚀
