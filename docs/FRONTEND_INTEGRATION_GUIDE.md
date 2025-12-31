# Frontend Integration Guide - Unified Services

**Date**: 2025-12-31  
**Status**: 📋 **Integration Guide**

---

## 🎯 **OVERVIEW**

This guide explains how to integrate the new unified services into the frontend HTML and JavaScript code.

---

## 📝 **SERVICES TO INTEGRATE**

### **Backend Services** (Already Integrated ✅)
- `UnifiedQualityService` - Used in API routes
- `UnifiedMemoryService` - Used in API routes

### **Frontend Services** (Need Integration ⏳)
1. **ContextOptimizer** - Replaces: `contextRelevanceScorer`, `contextSummarizer`, `contextClustering`, `contextExpiration`
2. **ContextPredictor** - Replaces: `contextualInference`, `predictiveContextLoader`
3. **ContextManager** - Replaces: `context.js`, `contextSystemIntegration`
4. **PrimaryNarrativeEngine** - Replaces: `NarrativeGenerator` (wraps), `RAGNarrativeEngine` (integrates)
5. **AdvancedNarrativeEngine** - Replaces: `ProceduralStoryGenerator`, `AgentBasedNarrativeEngine`, `MultimodalNarrativeGenerator` (as plugins)
6. **UnifiedSystemIntegration** - Replaces: `SystemIntegration`, `SystemIntegrationHandler`, `AIGMSystemIntegration`

---

## 🔧 **INTEGRATION STEPS**

### **Step 1: Update HTML Script Tags**

Add new unified services to `game-new.html` (or relevant HTML file):

```html
<!-- Unified Context Services -->
<script src="/js/aiGM/contextOptimizer.js"></script>
<script src="/js/aiGM/contextPredictor.js"></script>
<script src="/js/aiGM/contextManager.js"></script>

<!-- Unified Narrative Engines -->
<script src="/js/aiGM/core/primaryNarrativeEngine.js"></script>
<script src="/js/aiGM/core/advancedNarrativeEngine.js"></script>

<!-- Unified System Integration -->
<script src="/js/core/unifiedSystemIntegration.js"></script>
```

**Location**: Add these scripts **before** the AI GM core.js script loads, ideally in the `<head>` or early in the body.

### **Step 2: Remove Old Service Scripts** (Optional - for cleanup)

Old services can be removed after full integration:
- `contextRelevanceScorer.js`
- `contextSummarizer.js`
- `contextClustering.js`
- `contextExpiration.js`
- `contextualInference.js`
- `predictiveContextLoader.js`
- `contextSystemIntegration.js`
- `SystemIntegrationHandler.js` (in core/)
- `SystemIntegration.js` (in core/)
- `systemIntegration.js` (in aiGM/)

**Note**: Keep old services during transition for backward compatibility.

### **Step 3: Update JavaScript References**

#### **Context Services**

**Old Code**:
```javascript
// Old way
if (window.contextRelevanceScorer) {
  const score = window.contextRelevanceScorer.scoreContext(context);
}
if (window.contextSummarizer) {
  const summary = window.contextSummarizer.summarize(context);
}
```

**New Code**:
```javascript
// New way - use ContextOptimizer
if (window.contextOptimizer) {
  const score = window.contextOptimizer.scoreContext(context);
  const summary = window.contextOptimizer.summarizeEvent(context);
}
```

#### **Context Prediction**

**Old Code**:
```javascript
// Old way
if (window.contextualInference) {
  const inferred = window.contextualInference.inferContext(context);
}
if (window.predictiveContextLoader) {
  await window.predictiveContextLoader.preloadContextForAction(action);
}
```

**New Code**:
```javascript
// New way - use ContextPredictor
if (window.contextPredictor) {
  const inferred = window.contextPredictor.inferContext(context);
  await window.contextPredictor.preloadContextForAction(action);
}
```

#### **Context Management**

**Old Code**:
```javascript
// Old way
if (window.Context) {
  const context = Context.getScenarioContext(scenario, stat, rollType);
}
if (window.contextSystemIntegration) {
  window.contextSystemIntegration.runMaintenance();
}
```

**New Code**:
```javascript
// New way - use ContextManager
if (window.contextManager) {
  const context = window.contextManager.getScenarioContext(scenario, stat, rollType);
  window.contextManager.runMaintenance();
}
```

#### **Narrative Generation**

**Old Code**:
```javascript
// Old way
if (window.NarrativeGenerator) {
  const narrative = await window.NarrativeGenerator.generateRollNarrative(aigm, rollData);
}
if (window.RAGNarrativeEngine) {
  const ragContext = await window.RAGNarrativeEngine.semanticSearch(query);
}
```

**New Code**:
```javascript
// New way - use PrimaryNarrativeEngine
if (window.primaryNarrativeEngine) {
  const narrative = await window.primaryNarrativeEngine.generateRollNarrative(aigm, rollData);
  const ragContext = await window.primaryNarrativeEngine.semanticSearch(query);
}
```

#### **Advanced Narrative**

**Old Code**:
```javascript
// Old way
if (window.ProceduralStoryGenerator) {
  const story = await window.ProceduralStoryGenerator.generateStorylet(context);
}
if (window.AgentBasedNarrativeEngine) {
  const narrative = await window.AgentBasedNarrativeEngine.generateNarrative(context);
}
```

**New Code**:
```javascript
// New way - use AdvancedNarrativeEngine
if (window.advancedNarrativeEngine) {
  const narrative = await window.advancedNarrativeEngine.generateNarrative(context, 'procedural');
  // Or use default plugin
  const narrative2 = await window.advancedNarrativeEngine.generateNarrative(context);
}
```

#### **System Integration**

**Old Code**:
```javascript
// Old way
if (window.SystemIntegration) {
  window.SystemIntegration.integrateAllSystems();
}
if (window.SystemIntegrationHandler) {
  window.SystemIntegrationHandler.checkClueDiscovery(rollData);
}
```

**New Code**:
```javascript
// New way - use UnifiedSystemIntegration
if (window.unifiedSystemIntegration) {
  window.unifiedSystemIntegration.init();
  window.unifiedSystemIntegration.checkClueDiscovery(rollData);
  window.unifiedSystemIntegration.checkSystemVisibility();
}
```

---

## 🔄 **MIGRATION STRATEGY**

### **Phase 1: Add New Services** ✅
- Add script tags for unified services
- Keep old services for backward compatibility

### **Phase 2: Update References** ⏳
- Update code to use unified services
- Test each service individually

### **Phase 3: Remove Old Services** ⏳
- After full testing, remove old service scripts
- Clean up unused code

---

## ✅ **VERIFICATION**

After integration, verify:

1. **Services Load**:
   ```javascript
   console.log('ContextOptimizer:', !!window.contextOptimizer);
   console.log('ContextPredictor:', !!window.contextPredictor);
   console.log('ContextManager:', !!window.contextManager);
   console.log('PrimaryNarrativeEngine:', !!window.primaryNarrativeEngine);
   console.log('AdvancedNarrativeEngine:', !!window.advancedNarrativeEngine);
   console.log('UnifiedSystemIntegration:', !!window.unifiedSystemIntegration);
   ```

2. **Methods Available**:
   ```javascript
   if (window.contextOptimizer) {
     console.log('ContextOptimizer methods:', Object.keys(window.contextOptimizer));
   }
   ```

3. **Functionality Works**:
   - Test context scoring
   - Test narrative generation
   - Test system integration

---

## 📋 **CHECKLIST**

- [ ] Add unified service script tags to HTML
- [ ] Update context service references
- [ ] Update narrative engine references
- [ ] Update system integration references
- [ ] Test each service individually
- [ ] Test full integration
- [ ] Remove old service scripts (after testing)
- [ ] Update documentation

---

**Status**: 📋 **Ready for Integration**

