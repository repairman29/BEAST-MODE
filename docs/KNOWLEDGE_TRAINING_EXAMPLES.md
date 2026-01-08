# Knowledge Training Examples

**Real examples of how to train your LLM on expertise**

---

## 🎯 Use Cases

### 1. Train on UX Principles

```bash
# Initialize knowledge base
node scripts/initialize-knowledge-base.js

# Export UX principles for training
node scripts/export-knowledge-for-training.js ux-principles

# Fine-tune model
node scripts/fine-tune-with-knowledge.js ux-principles
```

**Result:** Model understands UX principles and applies them in code generation.

---

### 2. Train on Software Engineering Best Practices

```javascript
const { getKnowledgeRepository } = require('./lib/mlops/knowledgeRepository');

const repo = getKnowledgeRepository();
await repo.initialize();

// Add best practices
await repo.addKnowledge(
  'software-engineering',
  'SOLID Principles',
  'Single Responsibility: Each class should have one reason to change...',
  {
    source: 'Clean Code by Robert Martin',
    tags: ['solid', 'principles', 'oop'],
    priority: 'high'
  }
);

// Export and train
await repo.exportForFineTuning('./training-data/software-engineering.json', 'software-engineering');
```

---

### 3. Use RAG for Context-Aware Generation

```javascript
const { getKnowledgeRAG } = require('./lib/mlops/knowledgeRAG');
const { getLLMCodeGenerator } = require('./lib/mlops/llmCodeGenerator');

const rag = getKnowledgeRAG();
const generator = getLLMCodeGenerator();

// User wants to create a button
const featureRequest = 'Create a login button component';

// Get relevant UX knowledge
const knowledge = await rag.getRelevantKnowledge('button design', 3);

// Build enhanced prompt
const enhancedPrompt = await rag.buildContextPrompt(featureRequest);

// Generate code with knowledge
const code = await generator.generateCode(enhancedPrompt, {
  knowledge: knowledge.map(k => k.content)
});
```

**Result:** Generated code follows UX principles automatically.

---

### 4. Continuous Learning from Feedback

```javascript
const { getKnowledgeRepository } = require('./lib/mlops/knowledgeRepository');
const { getFeedbackLoop } = require('./lib/mlops/feedbackLoop');

const repo = getKnowledgeRepository();
const feedbackLoop = getFeedbackLoop();

// When user provides positive feedback
feedbackLoop.onPositiveFeedback(async (feedback) => {
  // Extract what worked well
  const principle = extractPrinciple(feedback);
  
  // Add to knowledge base
  await repo.addKnowledge(
    'ux-principles',
    `User Validated: ${principle.title}`,
    principle.content,
    {
      source: 'user-feedback',
      tags: ['validated', 'user-approved'],
      priority: 'high'
    }
  );
  
  // Trigger fine-tuning with new knowledge
  await triggerFineTuning();
});
```

---

## 📚 Knowledge Sources

### From Documentation

```javascript
// Load from markdown files
const fs = require('fs');
const markdown = fs.readFileSync('docs/UX_PSYCHOLOGY_PRINCIPLES.md', 'utf8');

// Parse and add to knowledge base
const principles = parseMarkdown(markdown);
for (const principle of principles) {
  await repo.addKnowledge('ux-principles', principle.title, principle.content);
}
```

### From Code Examples

```javascript
// Extract patterns from high-quality code
const highQualityCode = await getHighQualityRepositories();

for (const repo of highQualityCode) {
  const patterns = extractPatterns(repo);
  for (const pattern of patterns) {
    await repo.addKnowledge(
      'design-patterns',
      pattern.name,
      pattern.description,
      { source: repo.url, tags: pattern.tags }
    );
  }
}
```

### From User Feedback

```javascript
// Learn from what users like
const positiveFeedback = await getPositiveFeedback();

for (const feedback of positiveFeedback) {
  const knowledge = extractKnowledge(feedback);
  await repo.addKnowledge(
    'code-quality',
    `User Validated: ${knowledge.title}`,
    knowledge.content,
    { source: 'user-feedback', priority: 'high' }
  );
}
```

---

## 🔄 Training Pipeline

### Step 1: Collect Knowledge

```bash
# Add knowledge manually
node scripts/add-knowledge.js

# Or load from files
node scripts/load-knowledge-from-file.js path/to/knowledge.json
```

### Step 2: Export Training Data

```bash
# Export all knowledge
node scripts/export-knowledge-for-training.js

# Export specific category
node scripts/export-knowledge-for-training.js ux-principles
```

### Step 3: Fine-Tune Model

```bash
# Fine-tune with knowledge
node scripts/fine-tune-with-knowledge.js

# Fine-tune specific category
node scripts/fine-tune-with-knowledge.js ux-principles
```

### Step 4: Deploy & Monitor

```javascript
// Deploy fine-tuned model
const { getModelRouter } = require('./lib/mlops/modelRouter');
const router = getModelRouter();

// Use fine-tuned model
const response = await router.route('custom:ux-expert-model', {
  messages: [{ role: 'user', content: 'Design a button' }]
}, userId);

// Monitor performance
const { getModelQualityScorer } = require('./lib/mlops/modelQualityScorer');
const quality = await getModelQualityScorer().scoreModelResponse(response);
```

---

## 🎓 Example Knowledge Entries

### UX Principle

```json
{
  "category": "ux-principles",
  "title": "Visual Hierarchy",
  "content": "Guide user attention through size, color, contrast, and spacing. Primary actions should be large, high contrast, and prominent. Secondary actions should be medium and subtle.",
  "metadata": {
    "source": "UX_PSYCHOLOGY_PRINCIPLES.md",
    "tags": ["visual-design", "hierarchy"],
    "priority": "high"
  }
}
```

### Software Engineering

```json
{
  "category": "software-engineering",
  "title": "DRY Principle",
  "content": "Don't Repeat Yourself. Every piece of knowledge should have a single, unambiguous representation within a system. Extract common logic into reusable functions, components, or modules.",
  "metadata": {
    "source": "Clean Code",
    "tags": ["principles", "maintainability"],
    "priority": "high"
  }
}
```

### Design Pattern

```json
{
  "category": "design-patterns",
  "title": "Observer Pattern",
  "content": "Define a one-to-many dependency between objects. When one object changes state, all dependents are notified and updated automatically. Use for event handling, MVC architectures.",
  "metadata": {
    "source": "Design Patterns: Elements of Reusable OOP",
    "tags": ["patterns", "behavioral"],
    "priority": "medium"
  }
}
```

---

## 🚀 Next Steps

1. **Populate Knowledge Base**: Add your expertise
2. **Fine-Tune Models**: Train on knowledge
3. **Integrate RAG**: Use knowledge in generation
4. **Monitor Performance**: Track improvements
5. **Iterate**: Add more knowledge based on results

---

**Status**: ✅ Ready to use  
**Last Updated**: January 8, 2026
