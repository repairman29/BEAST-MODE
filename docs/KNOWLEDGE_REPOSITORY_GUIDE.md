# Knowledge Repository & LLM Training Guide

**How to train your LLM on UX principles and software development expertise**

---

## 🎯 Overview

The Knowledge Repository system allows you to:
1. **Store** UX principles, best practices, and expertise
2. **Train** your LLM models on this knowledge
3. **Retrieve** relevant knowledge for context-aware generation (RAG)
4. **Continuously improve** your models with new knowledge

---

## 📚 Knowledge Categories

- **ux-principles**: UX Psychology Principles
- **software-engineering**: Software Engineering Best Practices
- **design-patterns**: Design Patterns
- **code-quality**: Code Quality Standards
- **architecture**: Architecture Patterns
- **api-design**: API Design Principles
- **security**: Security Best Practices
- **performance**: Performance Optimization
- **testing**: Testing Strategies
- **devops**: DevOps Practices

---

## 🚀 Quick Start

### 1. Initialize Knowledge Base

```bash
node scripts/initialize-knowledge-base.js
```

This loads initial knowledge from files in `knowledge-base/` directory.

### 2. Add Knowledge

```javascript
const { getKnowledgeRepository } = require('./lib/mlops/knowledgeRepository');

const repo = getKnowledgeRepository();
await repo.initialize();

await repo.addKnowledge(
  'ux-principles',
  'Visual Hierarchy',
  'Guide user attention through size, color, contrast...',
  {
    source: 'UX_PSYCHOLOGY_PRINCIPLES.md',
    tags: ['visual-design', 'hierarchy'],
    priority: 'high'
  }
);
```

### 3. Export for Training

```bash
node scripts/export-knowledge-for-training.js [category]
```

This creates training data in `.beast-mode/training-data/` directory.

### 4. Fine-Tune Model

```bash
node scripts/fine-tune-with-knowledge.js [category] [base-model]
```

This fine-tunes your model with the knowledge base.

---

## 🔄 Using Knowledge in Code Generation

### RAG (Retrieval-Augmented Generation)

```javascript
const { getKnowledgeRAG } = require('./lib/mlops/knowledgeRAG');

const rag = getKnowledgeRAG();

// Get relevant knowledge for a query
const knowledge = await rag.getRelevantKnowledge('How to design a button?');

// Build context-aware prompt
const prompt = await rag.buildContextPrompt('Create a login button');

// Enhance code generation
const enhancement = await rag.enhanceCodeGeneration(
  'Create a login form',
  'React, TypeScript, Tailwind CSS'
);
```

---

## 📝 Knowledge Format

Knowledge entries follow this structure:

```json
{
  "id": "ux-principles-1234567890-abc123",
  "category": "ux-principles",
  "title": "Visual Hierarchy",
  "content": "Detailed explanation of the principle...",
  "metadata": {
    "source": "UX_PSYCHOLOGY_PRINCIPLES.md",
    "tags": ["visual-design", "hierarchy"],
    "priority": "high",
    "createdAt": "2026-01-08T...",
    "updatedAt": "2026-01-08T..."
  }
}
```

---

## 🎓 Training Data Format

When exported, knowledge is converted to training examples:

```json
{
  "instruction": "You are an expert software engineer and UX designer. Apply the following UX Psychology Principles principle:",
  "input": "Visual Hierarchy",
  "output": "Guide user attention through size, color, contrast...",
  "category": "ux-principles",
  "metadata": { ... }
}
```

---

## 🔧 Integration with Existing Systems

### With Model Router

```javascript
const { getModelRouter } = require('./lib/mlops/modelRouter');
const { getKnowledgeRAG } = require('./lib/mlops/knowledgeRAG');

const router = getModelRouter();
const rag = getKnowledgeRAG();

// Enhance prompt with knowledge
const enhancedPrompt = await rag.buildContextPrompt(userQuery);

// Route to model with enhanced prompt
const response = await router.route(modelId, {
  messages: [{ role: 'user', content: enhancedPrompt }]
}, userId);
```

### With Code Generator

```javascript
const { getLLMCodeGenerator } = require('./lib/mlops/llmCodeGenerator');
const { getKnowledgeRAG } = require('./lib/mlops/knowledgeRAG');

const generator = getLLMCodeGenerator();
const rag = getKnowledgeRAG();

// Enhance feature request with knowledge
const enhancement = await rag.enhanceCodeGeneration(featureRequest, codebaseContext);

// Generate code with knowledge-enhanced context
const code = await generator.generateCode(featureRequest, {
  knowledge: enhancement
});
```

---

## 📊 Knowledge Statistics

```javascript
const repo = getKnowledgeRepository();
const stats = await repo.getStats();

console.log(`Total entries: ${stats.total}`);
console.log(`By category:`, stats.byCategory);
```

---

## 🔍 Searching Knowledge

```javascript
const repo = getKnowledgeRepository();

// Search all categories
const results = await repo.searchKnowledge('visual hierarchy');

// Search specific category
const uxResults = await repo.searchKnowledge('button design', 'ux-principles');
```

---

## 🎯 Best Practices

1. **Start Small**: Begin with high-priority knowledge (UX principles, code quality)
2. **Iterate**: Add knowledge as you discover new patterns
3. **Categorize**: Use consistent categories for better retrieval
4. **Tag**: Add relevant tags for better search
5. **Version**: Keep track of knowledge sources and updates
6. **Validate**: Test fine-tuned models before deploying

---

## 🚀 Next Steps

1. **Add More Knowledge**: Populate knowledge base with your expertise
2. **Fine-Tune Models**: Train models on knowledge base
3. **Integrate RAG**: Use knowledge retrieval in code generation
4. **Monitor Performance**: Track how knowledge improves outputs
5. **Continuous Learning**: Update knowledge base based on feedback

---

**Status**: ✅ Ready to use  
**Last Updated**: January 8, 2026
