# Phase 4: Narrative Engines Consolidation Plan

**Date**: 2025-12-31  
**Status**: 🚧 **Starting**

---

## 🎯 **OBJECTIVE**

Consolidate 5 narrative engines into 1-2 primary engines:
- `NarrativeGenerator` → `PrimaryNarrativeEngine`
- `RAGNarrativeEngine` → `PrimaryNarrativeEngine`
- `ProceduralStoryGenerator` → `AdvancedNarrativeEngine` (plugin)
- `AgentBasedNarrativeEngine` → `AdvancedNarrativeEngine` (plugin)
- `MultimodalNarrativeGenerator` → `AdvancedNarrativeEngine` (plugin)

---

## 📊 **ANALYSIS**

### **Current Engines** (Frontend):

1. **NarrativeGenerator** - Standard generation
   - LLM narrative generation
   - Roll-based narratives
   - Context building
   - ML quality prediction
   - Media generation triggers

2. **RAGNarrativeEngine** - RAG-enhanced
   - Retrieval-Augmented Generation
   - Context retrieval
   - Enhanced narratives

3. **ProceduralStoryGenerator** - Procedural
   - Procedural narratives
   - Story structure
   - Dynamic generation

4. **AgentBasedNarrativeEngine** - Agent-based
   - Multi-agent system
   - Agent coordination
   - Complex narratives

5. **MultimodalNarrativeGenerator** - Multimodal
   - Text + media
   - Multimodal content
   - Rich narratives

---

## 🎯 **TARGET ARCHITECTURE**

### **1. PrimaryNarrativeEngine** (Default)
**Consolidates**: `NarrativeGenerator` + `RAGNarrativeEngine`

**Responsibilities**:
- Standard LLM narrative generation
- RAG enhancement (optional)
- Roll-based narratives
- Context building
- ML quality prediction
- Media generation triggers

**Design**:
- RAG as optional enhancement
- Default engine for all requests
- Backward compatible with existing code

### **2. AdvancedNarrativeEngine** (Plugin System)
**Consolidates**: `ProceduralStoryGenerator` + `AgentBasedNarrativeEngine` + `MultimodalNarrativeGenerator`

**Responsibilities**:
- Plugin system for advanced engines
- Procedural generation (plugin)
- Agent-based generation (plugin)
- Multimodal generation (plugin)
- Use when needed for special cases

**Design**:
- Plugin architecture
- Each advanced engine as a plugin
- Can be enabled/disabled
- Fallback to PrimaryNarrativeEngine

---

## ✅ **IMPLEMENTATION PLAN**

### **Step 1: Create PrimaryNarrativeEngine**
- Merge `NarrativeGenerator` + `RAGNarrativeEngine`
- Make RAG optional/enhancement
- Maintain all existing functionality
- Default engine for all requests

### **Step 2: Create AdvancedNarrativeEngine**
- Plugin system architecture
- Register plugins (Procedural, Agent, Multimodal)
- Plugin selection logic
- Fallback to PrimaryNarrativeEngine

### **Step 3: Update Integration**
- Update all services to use PrimaryNarrativeEngine
- Add plugin system for advanced engines
- Maintain backward compatibility
- Update HTML/script tags

---

## 📝 **NOTES**

- These are **frontend services** (browser JavaScript)
- Need to maintain browser compatibility
- May need to update script loading in HTML
- Should maintain backward compatibility
- Plugin system allows for extensibility

---

**Status**: 🚧 **Planning Complete - Starting Implementation**

