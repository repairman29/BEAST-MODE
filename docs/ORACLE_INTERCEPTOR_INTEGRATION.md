# Oracle + Interceptor Integration

**Purpose:** Enables Oracle to query intercepted commits and provide commit safety context to AI agents.

**Status:** ✅ **ACTIVE**

---

## 🎯 What It Does

The Oracle-Interceptor integration allows:

1. **Oracle Knowledge Search** - Query intercepted commits like any other knowledge
2. **Commit Safety Checks** - Check if a file is safe to commit before committing
3. **Context for AI Agents** - Oracle provides context about what was blocked and why
4. **Access to Intercepted Data** - Bots can access intercepted data via Oracle

---

## 🔍 Usage

### Via Oracle Service

```javascript
const oracleService = new OracleService();

// Search intercepted commits
const results = await oracleService.searchKnowledge('intercepted commits with secrets', {
  repoName: 'BEAST-MODE',
  limit: 20
});

// Check commit safety
const safety = await oracleService.getCommitSafetyContext('docs/PRICING_STRATEGY.md', 'BEAST-MODE');
if (!safety.safe) {
  console.log('⚠️  File was intercepted:', safety.message);
  console.log('Issues:', safety.issues);
  console.log('Recommendations:', safety.recommendations);
}
```

### Via Direct Integration

```javascript
const { getOracleInterceptorIntegration } = require('./lib/oracle/interceptor-integration');
const interceptor = getOracleInterceptorIntegration();
await interceptor.initialize();

// Query intercepted commits
const commits = await interceptor.queryInterceptedCommits('secrets', {
  repoName: 'BEAST-MODE',
  limit: 50,
  severity: 'critical'
});

// Get stats
const stats = await interceptor.getInterceptorStats('BEAST-MODE');
console.log('Total intercepted:', stats.total);
console.log('By type:', stats.byType);
console.log('By severity:', stats.bySeverity);
```

---

## 📊 Oracle Knowledge Format

Intercepted commits are returned in Oracle's standard knowledge format:

```javascript
{
  file_path: 'docs/PRICING_STRATEGY.md',
  type: 'intercepted_commit',
  summary: 'Intercepted commit: docs/PRICING_STRATEGY.md - 3 issue(s)',
  technical_context: 'File was intercepted due to: internal_document. Issues: [...]',
  intercepted_at: '2025-01-11T...',
  issues: [...],
  status: 'intercepted',
  search_method: 'interceptor',
  confidence: 1.0
}
```

---

## 🔗 Integration Points

### 1. Oracle Service

**File:** `oracle/src/services/oracleService.js`

**Methods:**
- `searchInterceptedCommits(query, options)` - Search intercepted commits
- `getCommitSafetyContext(filePath, repoName)` - Check commit safety

**Auto-detection:**
- Queries containing "intercepted", "blocked commit", or "commit safety" automatically route to interceptor search

### 2. Interceptor Integration Module

**File:** `BEAST-MODE-PRODUCT/lib/oracle/interceptor-integration.js`

**Methods:**
- `queryInterceptedCommits(query, options)` - Query intercepted commits
- `getInterceptedFile(filePath, repoName)` - Get specific intercepted file
- `getInterceptorStats(repoName)` - Get statistics
- `getCommitSafetyContext(filePath, repoName)` - Get safety context

---

## 🎯 Use Cases

### For AI Agents

**Before Committing:**
```javascript
// Check if file is safe to commit
const safety = await oracleService.getCommitSafetyContext('docs/new-feature.md');
if (!safety.safe) {
  // File was intercepted before - review issues
  console.log('Issues:', safety.issues);
  console.log('Recommendations:', safety.recommendations);
}
```

**Querying Intercepted Data:**
```javascript
// Find intercepted files with secrets
const results = await oracleService.searchKnowledge('intercepted commits with API keys');
results.forEach(result => {
  console.log(`File: ${result.file_path}`);
  console.log(`Issues: ${result.issues.length}`);
});
```

### For Oracle Knowledge Base

**Adding Intercepted Commits to Knowledge:**
- Intercepted commits are automatically searchable via Oracle
- Use standard Oracle search: `oracleService.searchKnowledge('intercepted commits')`
- Results include full context about what was blocked

---

## 📋 API Reference

### `queryInterceptedCommits(query, options)`

Query intercepted commits.

**Parameters:**
- `query` (string, optional) - Search query
- `options.repoName` (string, optional) - Filter by repository
- `options.limit` (number, default: 50) - Max results
- `options.status` (string, optional) - Filter by status
- `options.severity` (string, optional) - Filter by severity

**Returns:** Array of intercepted commit objects

### `getCommitSafetyContext(filePath, repoName)`

Get commit safety context for a file.

**Parameters:**
- `filePath` (string) - File path to check
- `repoName` (string, optional) - Repository name

**Returns:**
```javascript
{
  safe: boolean,
  intercepted: boolean,
  file: string,
  issues: Array,
  reason: string,
  intercepted_at: string,
  message: string,
  recommendations: Array
}
```

### `getInterceptorStats(repoName)`

Get interceptor statistics.

**Parameters:**
- `repoName` (string, optional) - Filter by repository

**Returns:**
```javascript
{
  total: number,
  byType: Object,
  bySeverity: Object,
  byStatus: Object,
  recent: Array
}
```

---

## 🔐 Security

- **RLS Policies:** Only service role and authenticated users can access intercepted data
- **Access Control:** Users can only see intercepted data for their own repos
- **No Public Exposure:** Intercepted data is never exposed publicly

---

## 📚 Related Documentation

- [Brand/Reputation/Secret Interceptor Guide](./BRAND_REPUTATION_INTERCEPTOR_GUIDE.md)
- [Oracle Service Documentation](../oracle/src/services/oracleService.js)
- [AI Agent Onboarding](./AI_AGENT_ONBOARDING.md)

---

**Status:** ✅ Ready for use. Oracle can now query intercepted commits and provide commit safety context!
