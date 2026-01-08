# BEAST MODE Testing Guide

**Last Updated:** January 8, 2026  
**Status:** ✅ **Comprehensive Test Suite Available**

---

## 🧪 Testing Overview

BEAST MODE has a comprehensive testing infrastructure covering:
- ✅ E2E (End-to-End) tests
- ✅ API integration tests
- ✅ Performance tests
- ✅ Custom model tests
- ✅ Automated test suites

---

## 🚀 Quick Start

### Run All Tests
```bash
npm test
# or
node scripts/run-all-tests.js
```

### Run Specific Test Suites
```bash
# E2E tests only
npm run test:e2e

# Integration tests
npm run test:integration

# Performance tests
npm run test:performance
```

---

## 📋 Test Suites

### 1. E2E Test Suite (`scripts/e2e-test-suite.js`)

**Purpose:** Comprehensive end-to-end testing of all API endpoints and features

**Tests:**
- ✅ Health check
- ✅ Models list API
- ✅ Custom models monitoring
- ✅ Quality API
- ✅ Codebase chat API
- ✅ Feature generation API
- ✅ Analytics API
- ✅ Anomaly detection API
- ✅ Predictive analysis API
- ✅ Bug tracking API
- ✅ Productivity API
- ✅ Cost tracking API
- ✅ Model quality API
- ✅ Model tuning API
- ✅ Latency optimization API
- ✅ Performance tests (response time, success rate)
- ✅ Integration tests (model router, smart selector)

**Usage:**
```bash
node scripts/e2e-test-suite.js --base-url=http://localhost:3000 --user-id=YOUR_USER_ID
```

**Output:**
- Console output with test results
- JSON file in `test-output/e2e-test-results-*.json`

---

### 2. Custom Model Integration Tests (`scripts/test-custom-model-integration.js`)

**Purpose:** Test custom model registration, listing, and usage

**Tests:**
- Custom model registration
- Model listing
- Model usage in code generation
- Model monitoring

**Usage:**
```bash
node scripts/test-custom-model-integration.js
```

---

### 3. Performance Tests (`scripts/response-time-tracker.js`)

**Purpose:** Measure and track API response times

**Tests:**
- Response time tracking
- Latency percentiles (p50, p95, p99)
- Success rate monitoring
- Throughput measurement

**Usage:**
```bash
node scripts/response-time-tracker.js --endpoint=/api/health --duration=60
```

**Output:**
- Real-time latency metrics
- JSON file with detailed results
- Performance recommendations

---

### 4. Quality Tests (`scripts/test-custom-model-quality.js`)

**Purpose:** Test code generation quality

**Tests:**
- Simple function generation
- Medium component generation
- Complex feature generation
- Quality scoring

**Usage:**
```bash
node scripts/test-custom-model-quality.js --user-id=YOUR_USER_ID --model=custom:my-model
```

---

### 5. Delivery Metrics Tests (`scripts/track-delivery-metrics.js`)

**Purpose:** Track delivery metrics (time-to-code, feature completion)

**Usage:**
```bash
node scripts/track-delivery-metrics.js --user-id=YOUR_USER_ID --feature="Feature request"
```

---

## 📊 Test Results

### Where to Find Results

All test results are saved to `test-output/` directory:
- `e2e-test-results-*.json` - E2E test results
- `response-times-*.json` - Performance test results
- `quality-test-*.json` - Quality test results
- `delivery-metrics.json` - Delivery metrics
- `all-tests-results-*.json` - Combined test suite results

### Reading Results

**E2E Test Results:**
```json
{
  "total": 20,
  "passed": 18,
  "failed": 2,
  "tests": [
    {
      "name": "Health Check",
      "status": "passed"
    },
    ...
  ],
  "duration": 5234
}
```

**Performance Test Results:**
```json
{
  "endpoint": "/api/health",
  "duration": 60,
  "summary": {
    "totalRequests": 88,
    "successful": 88,
    "successRate": 100,
    "requestsPerSecond": 8.80
  },
  "latency": {
    "average": 13,
    "p50": 9,
    "p95": 17,
    "p99": 219
  }
}
```

---

## 🔧 Test Configuration

### Environment Variables

```bash
# Base URL for testing
BEAST_MODE_URL=http://localhost:3000

# User ID for authenticated tests
TEST_USER_ID=your-user-id

# API keys (if needed)
API_KEYS_ENCRYPTION_KEY=your-encryption-key
```

### Command Line Options

**E2E Test Suite:**
- `--base-url=URL` - Base URL to test against
- `--user-id=ID` - User ID for authenticated tests

**Response Time Tracker:**
- `--endpoint=PATH` - API endpoint to test
- `--duration=SECONDS` - Duration of test in seconds

---

## 🎯 Test Coverage

### API Endpoints Tested

✅ **Core APIs:**
- `/api/health` - Health check
- `/api/models/list` - Model listing
- `/api/models/custom/*` - Custom model management
- `/api/repos/quality` - Quality analysis
- `/api/codebase/*` - Codebase operations

✅ **Analytics APIs:**
- `/api/analytics` - Aggregated analytics
- `/api/analytics/anomalies` - Anomaly detection
- `/api/analytics/predictions` - Predictive analysis

✅ **Delivery APIs:**
- `/api/delivery/bug-tracking` - Bug tracking
- `/api/delivery/productivity` - Productivity metrics

✅ **Optimization APIs:**
- `/api/optimization/latency` - Latency optimization
- `/api/models/quality` - Model quality
- `/api/models/tuning` - Model tuning

### Features Tested

✅ **Core Features:**
- Model routing
- Smart model selection
- Code generation
- Feature generation
- Quality analysis

✅ **Advanced Features:**
- Anomaly detection
- Predictive analysis
- Performance optimization
- Cost tracking

---

## 🚨 Common Issues

### Tests Failing with "Module not available"

**Issue:** Some tests fail because modules aren't loaded in production

**Solution:**
- Run tests against local dev server (`npm run dev`)
- Or ensure modules are properly bundled for production

### Tests Failing with Authentication Errors

**Issue:** Tests requiring authentication fail

**Solution:**
- Provide `--user-id=YOUR_USER_ID` argument
- Or set `TEST_USER_ID` environment variable
- Ensure user has valid API keys in Supabase

### Performance Tests Showing High Latency

**Issue:** Response times are higher than expected

**Solution:**
- Check if dev server is running
- Verify network conditions
- Check for rate limiting
- Review server logs

---

## 📈 Continuous Integration

### GitHub Actions Integration

Add to `.github/workflows/tests.yml`:

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '22'
      - run: npm install
      - run: npm run dev &
      - run: sleep 10
      - run: npm test
```

### Pre-commit Testing

Add to `package.json`:
```json
{
  "scripts": {
    "precommit": "npm test"
  }
}
```

---

## 🎯 Best Practices

1. **Run tests before committing**
   ```bash
   npm test
   ```

2. **Test against local dev server**
   ```bash
   npm run dev &
   npm test
   ```

3. **Test specific features**
   ```bash
   npm run test:e2e
   ```

4. **Monitor performance**
   ```bash
   npm run test:performance
   ```

5. **Review test results**
   - Check `test-output/` directory
   - Review JSON results
   - Address failures promptly

---

## 📝 Adding New Tests

### Adding E2E Tests

Edit `scripts/e2e-test-suite.js`:

```javascript
runner.test('My New Test', async () => {
  const result = await request('/api/my-endpoint');
  if (!result.ok) {
    throw new Error(`Test failed: ${result.status}`);
  }
});
```

### Adding Performance Tests

Edit `scripts/response-time-tracker.js` or create new script:

```javascript
// Test specific endpoint
node scripts/response-time-tracker.js --endpoint=/api/my-endpoint --duration=30
```

---

## ✅ Test Status

**Current Status:**
- ✅ E2E Test Suite: Available
- ✅ Integration Tests: Available
- ✅ Performance Tests: Available
- ✅ Quality Tests: Available
- ✅ Delivery Tests: Available

**Coverage:**
- API Endpoints: 15+ endpoints tested
- Features: All major features covered
- Performance: Response time tracking
- Integration: Model routing, selection

---

**Last Updated:** January 8, 2026  
**Maintained By:** BEAST MODE Team
