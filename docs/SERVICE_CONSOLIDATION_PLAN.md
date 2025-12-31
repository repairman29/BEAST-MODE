# Service Consolidation Plan
## Reducing 60+ Services to 20-30 Core Services

**Date**: 2025-12-31  
**Status**: 🚀 **Implementation In Progress**

---

## 🎯 **CONSOLIDATION GOALS**

**Current**: 60+ services  
**Target**: 20-30 core services  
**Reduction**: ~50% reduction in service count  
**Timeline**: 4-6 weeks

---

## 📋 **PHASE 1: QUALITY SERVICES** (Week 1-2) 🔴 CRITICAL

### **Current State**:
- `AIGMQualityPredictionService` - Heuristic-based prediction
- `AIGMQualityPredictionServiceML` - ML-enhanced wrapper
- `QualityAnalyzer` - Post-generation analysis

### **Target State**:
- `UnifiedQualityService` - Single service with all capabilities

### **Implementation Plan**:

1. **Create Unified Service**
   - Merge all 3 services
   - Support both ML and heuristic prediction
   - Include post-generation analysis
   - Maintain backward compatibility

2. **Update All References**
   - Update `mlModelIntegration.js`
   - Update `aiGMEnsembleMLEnhanced.js`
   - Update API routes
   - Update frontend services

3. **Testing**
   - Unit tests for unified service
   - Integration tests
   - Performance benchmarks

---

## 📋 **PHASE 2: MEMORY SERVICES** (Week 3-4) 🔴 CRITICAL

### **Current State**:
- `MemoryService` - Basic vector search
- `AIGMMemoryService` - Advanced context optimization
- `NarrativeMemory` (frontend) - Keep separate

### **Target State**:
- `UnifiedMemoryService` - Backend only
- `NarrativeMemory` (frontend) - Keep as-is

### **Implementation Plan**:

1. **Merge Backend Services**
   - Combine vector search + context optimization
   - Unified API for all memory operations
   - Maintain all existing features

2. **Update References**
   - Update API routes
   - Update services using memory
   - Update frontend to use unified API

---

## 📋 **PHASE 3: CONTEXT SERVICES** (Week 5-8) 🟡 HIGH

### **Current State** (9 services):
- `Context` - Basic context management
- `ContextRelevanceScorer` - Relevance scoring
- `ContextSummarizer` - Context compression
- `ContextClustering` - Context grouping
- `ContextExpiration` - Context cleanup
- `ContextualInference` - Context inference
- `PredictiveContextLoader` - Pre-loading
- `ContextSystemIntegration` - System integration
- `ContextAwareSuggestions` - Smart suggestions
- `ContextAwareDifficulty` - Difficulty adjustment

### **Target State** (3-4 services):
- `ContextManager` - Core context operations
- `ContextOptimizer` - Relevance, summarization, clustering, expiration
- `ContextPredictor` - Inference, pre-loading
- `ContextAwareServices` - Suggestions, difficulty (optional)

### **Implementation Plan**:

1. **Create ContextManager**
   - Core context CRUD operations
   - Basic context building
   - Context storage/retrieval

2. **Create ContextOptimizer**
   - Relevance scoring
   - Summarization
   - Clustering
   - Expiration/cleanup

3. **Create ContextPredictor**
   - Contextual inference
   - Predictive loading
   - Context prediction

4. **Optional: ContextAwareServices**
   - Suggestions
   - Difficulty adjustment
   - (Can be separate if needed)

---

## 📋 **PHASE 4: NARRATIVE ENGINES** (Week 9-12) 🟡 HIGH

### **Current State** (5 engines):
- `NarrativeGenerator` - Standard generation
- `RAGNarrativeEngine` - RAG-enhanced
- `ProceduralStoryGenerator` - Procedural
- `AgentBasedNarrativeEngine` - Agent-based
- `MultimodalNarrativeGenerator` - Multimodal

### **Target State** (1-2 engines):
- `PrimaryNarrativeEngine` - Standard + RAG (default)
- `AdvancedNarrativeEngine` - Procedural + Agent + Multimodal (plugins)

### **Implementation Plan**:

1. **Create PrimaryNarrativeEngine**
   - Merge `NarrativeGenerator` + `RAGNarrativeEngine`
   - Make RAG optional/enhancement
   - Default engine for all requests

2. **Create AdvancedNarrativeEngine**
   - Plugin system for advanced engines
   - Procedural, Agent, Multimodal as plugins
   - Use when needed for special cases

3. **Update Integration**
   - Update all services to use PrimaryNarrativeEngine
   - Add plugin system for advanced engines
   - Maintain backward compatibility

---

## 📋 **PHASE 5: SYSTEM INTEGRATION** (Week 13-14) 🟢 MEDIUM

### **Current State** (2 services):
- `SystemIntegration` - Basic integration
- `SystemIntegrationHandler` - Advanced handler

### **Target State** (1 service):
- `UnifiedSystemIntegration` - Single service

---

## 📋 **PHASE 6: MONITORING & DOCUMENTATION** (Week 15-16) 🟢 MEDIUM

### **Add Service Monitoring**:
- Performance tracking per service
- Error rate monitoring
- Latency tracking
- Service health checks

### **Update Documentation**:
- Service architecture diagrams
- API documentation
- Integration guides
- Migration guides

---

## 🚀 **IMPLEMENTATION ORDER**

### **Week 1-2**: Quality Services ✅ STARTING NOW
### **Week 3-4**: Memory Services
### **Week 5-8**: Context Services
### **Week 9-12**: Narrative Engines
### **Week 13-14**: System Integration
### **Week 15-16**: Monitoring & Documentation

---

## 📊 **SUCCESS METRICS**

- **Service Count**: 60+ → 20-30 (50% reduction)
- **Services Per Request**: 23 → 8-10 (60% reduction)
- **Code Maintainability**: Improved
- **Performance**: Reduced latency
- **Debugging**: Easier to trace issues

---

## ⚠️ **RISKS & MITIGATION**

### **Risk 1**: Breaking existing functionality
**Mitigation**: Maintain backward compatibility, extensive testing

### **Risk 2**: Performance regression
**Mitigation**: Benchmark before/after, optimize as needed

### **Risk 3**: Integration issues
**Mitigation**: Phased rollout, feature flags

---

**Status**: 🚀 **Starting Phase 1**  
**Next**: Create UnifiedQualityService

