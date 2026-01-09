# 📅 Month 1 Implementation Guide
## Fix & Monitor - Week-by-Week Execution Plan

**Start Date:** January 2026  
**Status:** 🚀 Ready to Execute  
**Dog Fooding:** Maximum 🐕

---

## 🎯 Month 1 Goals

1. ✅ Fix all monitoring gaps
2. ✅ Achieve 40%+ cache hit rate
3. ✅ Implement comprehensive cost tracking
4. ✅ Establish baseline metrics

---

## 📋 WEEK 1-2: Fix Monitoring Gaps

### **Day 1-2: Fix Failed Request Tracking**

#### **Problem**
Currently, `modelRouter.js` only tracks successful requests. Failed requests aren't recorded in monitoring.

#### **Solution**
Update `modelRouter.js` to track ALL requests (success + failure) before throwing errors.

#### **Implementation**

**File:** `BEAST-MODE-PRODUCT/lib/mlops/modelRouter.js`

**Changes Needed:**

1. **Track requests BEFORE routing:**
```javascript
async route(modelId, request, userId) {
  if (!modelId) {
    throw new Error('Model ID is required');
  }

  const startTime = Date.now();
  let success = false;
  let error = null;
  let result = null;
  
  try {
    // ... existing routing logic ...
    
    // Check cache first (if enabled and not streaming)
    if (this.cache && !request.stream) {
      const cached = this.cache.get({ ...request, model: modelId });
      if (cached) {
        log.debug(`Cache hit for model ${modelId}`);
        // Track cache hit
        this.trackRequest(modelId, request, Date.now() - startTime, true, null, null, true);
        return cached;
      }
    }

    // Route request
    if (modelId.startsWith('custom:')) {
      result = await this.routeToCustomModel(modelId, request, userId);
    } else {
      const canUseProvider = await this.canUseProviderModels(userId);
      if (!canUseProvider) {
        throw new Error('Provider models are only available for paid tier users...');
      }
      result = await this.routeToProvider(modelId, request, userId);
    }

    success = true;
    
    // Cache result if enabled and not streaming
    if (this.cache && result && !request.stream) {
      this.cache.set({ ...request, model: modelId }, result);
    }

    // Track successful request
    this.trackRequest(modelId, request, Date.now() - startTime, true, null, result.usage || null, false);
    
    return result;
  } catch (err) {
    error = err;
    success = false;
    
    // Track failed request (CRITICAL - this was missing!)
    this.trackRequest(modelId, request, Date.now() - startTime, false, err, null, false);
    
    throw err;
  }
}
```

2. **Add trackRequest method:**
```javascript
/**
 * Track request in monitoring (success or failure)
 */
trackRequest(modelId, request, latency, success, error, usage, fromCache) {
  try {
    const monitoring = require('./customModelMonitoring');
    const { getCustomModelMonitoring } = monitoring;
    const monitor = getCustomModelMonitoring();
    
    // Extract endpoint for custom models
    let endpoint = null;
    if (modelId.startsWith('custom:')) {
      // We'll need to get this from the model config
      // For now, use modelId as endpoint identifier
      endpoint = modelId;
    } else {
      endpoint = modelId; // Provider model identifier
    }
    
    monitor.recordRequest(
      modelId,
      endpoint,
      latency,
      success,
      error,
      usage
    );
    
    // Also track cache hits separately
    if (fromCache) {
      log.debug(`Cache hit tracked for ${modelId}`);
    }
  } catch (monError) {
    // Non-critical - don't fail request if monitoring fails
    log.debug('Monitoring failed (non-critical):', monError.message);
  }
}
```

#### **Testing**

**Use BEAST MODE to generate tests:**
```bash
# Generate test for failed request tracking
POST /api/codebase/chat
{
  "message": "Generate a test for modelRouter.js that verifies failed requests are tracked in monitoring. Test should simulate a failed custom model request and verify it's recorded.",
  "model": "custom:your-model"
}
```

#### **Success Criteria**
- ✅ All requests (success + failure) tracked
- ✅ Monitoring shows 100% request coverage
- ✅ Error details captured in monitoring

---

### **Day 3-4: Enhanced Error Context**

#### **Problem**
Error messages are generic and don't provide actionable information.

#### **Solution**
Generate better error messages with context and actionable tips.

#### **Implementation**

**File:** `BEAST-MODE-PRODUCT/lib/mlops/modelRouter.js`

**Update error handling in `routeToCustomModel`:**

```javascript
async routeToCustomModel(modelId, request, userId) {
  const model = await this.getCustomModel(modelId, userId);
  if (!model) {
    throw new Error(`Custom model not found: ${modelId}. Please verify the model ID and ensure it's registered.`);
  }

  // ... existing request setup ...

  try {
    const response = await axios(requestConfig);
    // ... success handling ...
  } catch (err) {
    // Enhanced error messages with context
    let errorMessage = `Custom model request failed: ${err.message}`;
    let actionableTips = [];
    
    if (err.response) {
      const status = err.response.status;
      if (status === 401) {
        errorMessage = `Custom model authentication failed for ${modelId}`;
        actionableTips = [
          'Check your API key in the custom model configuration',
          'Verify the API key is valid and not expired',
          'Ensure the API key has the correct permissions'
        ];
      } else if (status === 404) {
        errorMessage = `Custom model endpoint not found: ${model.endpointUrl}`;
        actionableTips = [
          'Verify the endpoint URL is correct',
          'Check if the endpoint is accessible',
          'Ensure the endpoint path is correct (e.g., /v1/chat/completions)'
        ];
      } else if (status >= 500) {
        errorMessage = `Custom model server error (${status})`;
        actionableTips = [
          'The model endpoint is experiencing issues',
          'Try again in a few moments',
          'Check the model endpoint status'
        ];
      } else {
        errorMessage = `Custom model error (${status}): ${err.response.data?.error?.message || err.message}`;
      }
    } else if (err.code === 'ECONNREFUSED') {
      errorMessage = `Cannot connect to custom model endpoint: ${model.endpointUrl}`;
      actionableTips = [
        'Verify the endpoint URL is correct',
        'Check if the endpoint is running',
        'Ensure network connectivity to the endpoint'
      ];
    } else if (err.code === 'ETIMEDOUT') {
      errorMessage = `Custom model request timed out after ${requestConfig.timeout || 30000}ms`;
      actionableTips = [
        'The endpoint took too long to respond',
        'Check if the model endpoint is overloaded',
        'Consider increasing the timeout or optimizing the model'
      ];
    }
    
    // Create enhanced error with context
    const enhancedError = new Error(errorMessage);
    enhancedError.modelId = modelId;
    enhancedError.endpoint = model.endpointUrl;
    enhancedError.statusCode = err.response?.status;
    enhancedError.actionableTips = actionableTips;
    enhancedError.originalError = err.message;
    
    // Track failed request (IMPORTANT - before throwing)
    const latency = Date.now() - startTime;
    this.trackRequest(modelId, request, latency, false, enhancedError, null, false);
    
    log.error(`Failed to call custom model ${modelId}:`, errorMessage);
    if (actionableTips.length > 0) {
      log.info(`Actionable tips: ${actionableTips.join('; ')}`);
    }
    
    throw enhancedError;
  }
}
```

#### **Testing**

**Use BEAST MODE to generate error scenario tests:**
```bash
POST /api/codebase/chat
{
  "message": "Generate tests for enhanced error handling in modelRouter.js. Test scenarios: 401 auth error, 404 not found, 500 server error, connection refused, timeout. Verify error messages include actionable tips.",
  "model": "custom:your-model"
}
```

#### **Success Criteria**
- ✅ Error messages include context
- ✅ Actionable tips provided
- ✅ Error details logged properly

---

### **Day 5-7: Real-time Monitoring Dashboard**

#### **Problem**
No real-time dashboard to view monitoring metrics.

#### **Solution**
Build a monitoring dashboard using BEAST MODE's code generation.

#### **Implementation**

**Use BEAST MODE to generate dashboard:**

```bash
POST /api/codebase/chat
{
  "message": "Create a real-time monitoring dashboard component for custom model metrics. Should display: total requests, success/failure rates, average latency, cache hit rate, cost savings, and recent errors. Use Next.js, TypeScript, and real-time updates via polling or websockets.",
  "model": "custom:your-model",
  "repo": "BEAST-MODE-PRODUCT"
}
```

**Files to create:**
1. `website/app/api/models/custom/monitoring/dashboard/route.ts` - API endpoint
2. `website/components/monitoring/CustomModelDashboard.tsx` - Dashboard component
3. `website/app/monitoring/page.tsx` - Dashboard page

#### **Dashboard Features**

**Metrics to Display:**
- Total requests (last 24h, 7d, 30d)
- Success rate (%)
- Failure rate (%)
- Average latency (p50, p95, p99)
- Cache hit rate (%)
- Cost savings ($ and %)
- Requests by model
- Recent errors (last 10)

**Real-time Updates:**
- Poll every 5 seconds
- Or use WebSockets for instant updates

#### **Success Criteria**
- ✅ Dashboard displays all key metrics
- ✅ Updates in real-time (<1s latency)
- ✅ Shows actionable insights

---

## 📋 WEEK 3-4: Cache Optimization

### **Day 1-3: Cache Key Intelligence**

#### **Problem**
Current cache keys are too strict - similar requests don't hit cache.

#### **Solution**
Implement semantic similarity for cache keys using embeddings.

#### **Implementation**

**File:** `BEAST-MODE-PRODUCT/lib/mlops/llmCache.js`

**Add semantic cache key generation:**

```javascript
const crypto = require('crypto');
const { createLogger } = require('../utils/logger');

const log = createLogger('LLMCache');

class LLMCache {
  constructor(options = {}) {
    this.options = {
      maxSize: options.maxSize || 1000,
      ttl: options.ttl || 3600000, // 1 hour default
      enabled: options.enabled !== false,
      semanticSimilarity: options.semanticSimilarity !== false, // NEW
      similarityThreshold: options.similarityThreshold || 0.95 // NEW
    };
    
    this.cache = new Map();
    this.accessTimes = new Map();
    this.semanticCache = new Map(); // NEW: Store embeddings for semantic matching
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      semanticHits: 0 // NEW
    };
  }

  /**
   * Generate semantic embedding for message (simplified version)
   * In production, use actual embedding model
   */
  async generateEmbedding(text) {
    // Simplified: Use hash-based similarity for now
    // TODO: Replace with actual embedding model (OpenAI, etc.)
    const normalized = text.toLowerCase().trim();
    return crypto.createHash('sha256').update(normalized).digest('hex');
  }

  /**
   * Calculate similarity between two embeddings
   */
  calculateSimilarity(embedding1, embedding2) {
    // Simplified: Use hash comparison
    // TODO: Replace with cosine similarity for real embeddings
    if (embedding1 === embedding2) return 1.0;
    
    // Simple character-based similarity
    let matches = 0;
    const minLen = Math.min(embedding1.length, embedding2.length);
    for (let i = 0; i < minLen; i++) {
      if (embedding1[i] === embedding2[i]) matches++;
    }
    return matches / Math.max(embedding1.length, embedding2.length);
  }

  /**
   * Find semantically similar cache entry
   */
  async findSemanticMatch(request) {
    if (!this.options.semanticSimilarity) return null;

    const requestEmbedding = await this.generateEmbedding(
      typeof request.message === 'string' 
        ? request.message 
        : JSON.stringify(request.message)
    );

    let bestMatch = null;
    let bestSimilarity = 0;

    for (const [key, cached] of this.cache.entries()) {
      const cachedEmbedding = this.semanticCache.get(key);
      if (!cachedEmbedding) continue;

      const similarity = this.calculateSimilarity(requestEmbedding, cachedEmbedding);
      if (similarity >= this.options.similarityThreshold && similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestMatch = { key, cached, similarity };
      }
    }

    return bestMatch;
  }

  /**
   * Generate cache key from request
   */
  generateKey(request) {
    // Normalize request for consistent hashing
    const normalized = {
      message: typeof request.message === 'string' 
        ? request.message.trim() 
        : JSON.stringify(request.message),
      model: request.model || 'default',
      temperature: request.temperature || 0.7,
      maxTokens: request.maxTokens || 4000
    };

    const keyString = JSON.stringify(normalized);
    return crypto.createHash('sha256').update(keyString).digest('hex');
  }

  /**
   * Get cached response (with semantic matching)
   */
  async get(request) {
    if (!this.options.enabled) {
      return null;
    }

    // First, try exact match
    const key = this.generateKey(request);
    const cached = this.cache.get(key);

    if (cached) {
      const age = Date.now() - cached.timestamp;
      if (age <= this.options.ttl) {
        this.accessTimes.set(key, Date.now());
        this.stats.hits++;
        log.debug(`Cache hit (exact) for key: ${key.substring(0, 8)}...`);
        return cached.response;
      }
    }

    // If no exact match, try semantic matching
    const semanticMatch = await this.findSemanticMatch(request);
    if (semanticMatch && semanticMatch.cached) {
      const age = Date.now() - semanticMatch.cached.timestamp;
      if (age <= this.options.ttl) {
        this.accessTimes.set(semanticMatch.key, Date.now());
        this.stats.hits++;
        this.stats.semanticHits++;
        log.debug(`Cache hit (semantic, similarity: ${(semanticMatch.similarity * 100).toFixed(1)}%) for key: ${semanticMatch.key.substring(0, 8)}...`);
        return semanticMatch.cached.response;
      }
    }

    this.stats.misses++;
    return null;
  }

  /**
   * Set cached response (with semantic embedding)
   */
  async set(request, response) {
    if (!this.options.enabled) {
      return;
    }

    const key = this.generateKey(request);
    
    // Evict if cache is full
    if (this.cache.size >= this.options.maxSize) {
      this.evictLRU();
    }

    // Store response
    this.cache.set(key, {
      response,
      timestamp: Date.now()
    });
    this.accessTimes.set(key, Date.now());
    
    // Store semantic embedding for semantic matching
    if (this.options.semanticSimilarity) {
      const messageText = typeof request.message === 'string' 
        ? request.message 
        : JSON.stringify(request.message);
      const embedding = await this.generateEmbedding(messageText);
      this.semanticCache.set(key, embedding);
    }
    
    log.debug(`Cached response for key: ${key.substring(0, 8)}...`);
  }

  /**
   * Get cache statistics (with semantic stats)
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total * 100).toFixed(2) : 0;
    const semanticHitRate = this.stats.hits > 0 
      ? (this.stats.semanticHits / this.stats.hits * 100).toFixed(2) 
      : 0;

    return {
      ...this.stats,
      size: this.cache.size,
      maxSize: this.options.maxSize,
      hitRate: `${hitRate}%`,
      semanticHitRate: `${semanticHitRate}%`,
      ttl: this.options.ttl
    };
  }
}
```

#### **Testing**

**Use BEAST MODE to generate tests:**
```bash
POST /api/codebase/chat
{
  "message": "Generate tests for semantic cache matching in llmCache.js. Test scenarios: exact match, semantic match (similar messages), no match, cache expiration. Verify semantic hits are tracked separately.",
  "model": "custom:your-model"
}
```

#### **Success Criteria**
- ✅ Semantic matching working
- ✅ 40%+ cache hit rate achieved
- ✅ Semantic hits tracked separately

---

### **Day 4-5: Multi-Tier Caching**

#### **Problem**
Single-tier in-memory cache limits hit rate.

#### **Solution**
Implement 3-tier caching: L1 (memory), L2 (Redis), L3 (database).

#### **Implementation**

**Create new file:** `BEAST-MODE-PRODUCT/lib/mlops/multiTierCache.js`

**Use BEAST MODE to generate:**
```bash
POST /api/codebase/chat
{
  "message": "Create a multi-tier cache system for LLM responses with 3 tiers: L1 (in-memory Map, fastest), L2 (Redis, fast), L3 (Supabase database, slower but persistent). Implement fallback logic: check L1 first, then L2, then L3. Write to all tiers on cache miss. Include TTL management for each tier.",
  "model": "custom:your-model",
  "repo": "BEAST-MODE-PRODUCT"
}
```

#### **Success Criteria**
- ✅ 3-tier cache operational
- ✅ Fallback logic working
- ✅ 60%+ overall hit rate

---

### **Day 6-7: Cache Warming Strategy**

#### **Problem**
Cold cache means first requests are slow.

#### **Solution**
Predict common requests and pre-warm cache.

#### **Implementation**

**Create new file:** `BEAST-MODE-PRODUCT/lib/mlops/cacheWarmer.js`

**Use BEAST MODE to generate:**
```bash
POST /api/codebase/chat
{
  "message": "Create a cache warming system that predicts common LLM requests and pre-warms the cache. Analyze historical request patterns, identify top N most common requests, and pre-execute them to populate cache. Include scheduling (daily warm-up), pattern analysis, and warm-up execution.",
  "model": "custom:your-model",
  "repo": "BEAST-MODE-PRODUCT"
}
```

#### **Success Criteria**
- ✅ Cache warming operational
- ✅ Common requests pre-warmed
- ✅ 20% improvement in first-request latency

---

## 🎯 Month 1 Success Checklist

### **Week 1-2: Monitoring**
- [ ] All requests tracked (success + failure)
- [ ] Enhanced error messages with actionable tips
- [ ] Real-time monitoring dashboard
- [ ] 100% request coverage in monitoring

### **Week 3-4: Cache Optimization**
- [ ] Semantic cache matching implemented
- [ ] Multi-tier cache (L1/L2/L3) operational
- [ ] Cache warming strategy active
- [ ] 40%+ cache hit rate achieved

### **Overall Month 1**
- [ ] Baseline metrics established
- [ ] All monitoring gaps fixed
- [ ] Cache optimized to 40%+ hit rate
- [ ] Documentation updated
- [ ] Tests written (90%+ coverage)

---

## 🐕 Dog Fooding Checklist

### **Every Task:**
- [ ] Use `/api/codebase/chat` to generate code
- [ ] Use custom models to test changes
- [ ] Use monitoring to validate improvements
- [ ] Use BEAST MODE to write tests
- [ ] Use BEAST MODE to generate documentation

### **Week 1-2:**
- [ ] Monitoring fixes generated by BEAST MODE
- [ ] Dashboard generated by BEAST MODE
- [ ] Tests generated by BEAST MODE

### **Week 3-4:**
- [ ] Cache optimizations generated by BEAST MODE
- [ ] Multi-tier cache generated by BEAST MODE
- [ ] Cache warming generated by BEAST MODE

---

## 📊 Metrics to Track

### **Monitoring:**
- Request coverage: **100%** (target)
- Error message quality: **Actionable** (target)
- Dashboard update latency: **<1s** (target)

### **Cache:**
- Cache hit rate: **40%+** (target, from 15%)
- Semantic hit rate: **10%+** (target)
- First-request latency improvement: **20%** (target)

---

## 🚀 Ready to Start!

**First Action:** Fix failed request tracking in `modelRouter.js`

**Use BEAST MODE to help:**
```bash
POST /api/codebase/chat
{
  "message": "Update modelRouter.js route() method to track ALL requests (success and failure) in monitoring before throwing errors. Add a trackRequest() helper method that calls customModelMonitoring.recordRequest() for both success and failure cases.",
  "model": "custom:your-model"
}
```

**Let's dog food our way to excellence!** 🐕🚀

---

**Status:** 🎯 **READY TO EXECUTE**  
**Next Step:** Day 1 - Fix Failed Request Tracking  
**Dog Fooding:** 🐕 **MAXIMUM**
