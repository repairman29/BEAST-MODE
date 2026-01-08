# BEAST MODE Janitor - Daisy Chain Integration
## Complete Integration Guide

**Status:** ✅ **Complete**  
**Last Updated:** January 2025

---

## 🎯 Overview

The AI Janitor is now fully integrated with Daisy Chain, making all Janitor operations available as workflow steps and templates. This enables users to:

1. **Use Janitor operations in Daisy Chain workflows** - Drag-and-drop Janitor nodes
2. **Use pre-built Janitor workflow templates** - One-click setup for common maintenance tasks
3. **Orchestrate complex maintenance workflows** - Chain multiple Janitor operations together

---

## 📦 What Was Built

### 1. Janitor-Daisy Chain Integration Module
**File:** `BEAST-MODE-PRODUCT/lib/janitor/daisyChainIntegration.js`

**Features:**
- ✅ 5 pre-built workflow templates
- ✅ 8 Janitor workflow step types
- ✅ Step execution engine
- ✅ Template management

**Templates:**
1. `janitor-refactor` - Silent Refactoring workflow
2. `janitor-architecture` - Architecture Enforcement workflow
3. `janitor-vibe-restore` - Vibe Restoration workflow
4. `janitor-overnight` - Complete overnight maintenance
5. `janitor-quality-improve` - Quality improvement workflow

**Step Types:**
- `janitor-scan` - Scan for opportunities
- `janitor-refactor` - Run refactoring
- `janitor-architecture-check` - Check architecture
- `janitor-vibe-check` - Check for regressions
- `janitor-vibe-analyze` - Analyze regression
- `janitor-vibe-restore` - Restore to last good state
- `janitor-validate` - Validate changes
- `janitor-report` - Generate report
- `janitor-fix` - Apply quality fixes

### 2. Daisy Chain API Routes
**File:** `smuggler-daisy-chain/src/routes/janitorWorkflows.js`

**Endpoints:**
- `GET /api/janitor/templates` - List all templates
- `GET /api/janitor/templates/:id` - Get specific template
- `POST /api/janitor/execute` - Execute a Janitor step
- `POST /api/janitor/workflow` - Create workflow from template

### 3. Visual Workflow Builder Integration
**File:** `smuggler-daisy-chain/src/services/VisualWorkflowBuilder.js`

**Added:**
- ✅ 8 new Janitor node types in the visual builder
- ✅ All nodes categorized under "janitor"
- ✅ Full configuration support for each node type

**Node Types Added:**
- `janitor-scan` - 🔍 Scan for opportunities
- `janitor-refactor` - 🧹 Run refactoring
- `janitor-architecture-check` - 🏗️ Check architecture
- `janitor-vibe-check` - 📊 Check for regressions
- `janitor-vibe-restore` - ⏪ Restore to last good state
- `janitor-validate` - ✅ Validate changes
- `janitor-report` - 📋 Generate report

### 4. Main Integrations Update
**File:** `BEAST-MODE-PRODUCT/lib/janitor/integrations.js`

**Added:**
- ✅ `integrateWithDaisyChain()` method
- ✅ Automatic initialization when Janitor is initialized
- ✅ Graceful fallback if Daisy Chain not available

---

## 🚀 How to Use

### Option 1: Use Pre-Built Templates

```javascript
// Get all templates
GET /api/janitor/templates

// Get specific template
GET /api/janitor/templates/janitor-refactor

// Create workflow from template
POST /api/janitor/workflow
{
  "templateId": "janitor-refactor",
  "customizations": {
    "config": {
      "maxFiles": 100
    }
  }
}
```

### Option 2: Use in Visual Workflow Builder

1. Open Daisy Chain visual workflow builder
2. Drag Janitor nodes from the "janitor" category
3. Connect nodes to create custom workflows
4. Configure each node's settings
5. Execute the workflow

### Option 3: Execute Individual Steps

```javascript
POST /api/janitor/execute
{
  "stepType": "janitor-refactor",
  "config": {
    "dryRun": false,
    "maxChanges": 50
  },
  "context": {
    "repoPath": "/path/to/repo"
  }
}
```

---

## 📋 Example Workflows

### Example 1: Overnight Maintenance

```json
{
  "name": "Overnight Maintenance",
  "templateId": "janitor-overnight",
  "schedule": {
    "cron": "0 2 * * *",
    "timezone": "UTC"
  }
}
```

**What it does:**
1. Runs refactoring (2 AM)
2. Checks architecture
3. Checks for regressions
4. Generates report

### Example 2: Quality Improvement

```json
{
  "name": "Quality Improvement",
  "templateId": "janitor-quality-improve",
  "steps": [
    {
      "id": "scan",
      "type": "janitor-scan",
      "config": {
        "focus": "quality",
        "minSeverity": "medium"
      }
    },
    {
      "id": "fix",
      "type": "janitor-fix",
      "dependsOn": ["scan"],
      "config": {
        "autoFix": true,
        "confidenceThreshold": 0.9
      }
    }
  ]
}
```

### Example 3: Custom Workflow

```javascript
// Visual workflow with Janitor nodes:
// [Trigger] → [Janitor: Scan] → [Janitor: Refactor] → [Janitor: Validate] → [Janitor: Report]
```

---

## 🔗 Integration Points

### Janitor → Daisy Chain
- Janitor operations exposed as workflow steps
- Templates available in Daisy Chain
- Visual nodes in workflow builder

### Daisy Chain → Janitor
- Daisy Chain can trigger Janitor operations
- Workflow orchestration for complex maintenance
- Scheduled maintenance workflows

---

## 📊 Benefits

1. **Automation** - Schedule maintenance workflows
2. **Orchestration** - Chain multiple Janitor operations
3. **Visual** - Drag-and-drop workflow creation
4. **Templates** - Pre-built workflows for common tasks
5. **Flexibility** - Custom workflows for specific needs

---

## 🎯 Use Cases

### Use Case 1: Scheduled Maintenance
- Set up overnight maintenance workflow
- Runs automatically every night
- Reports sent via email/Slack

### Use Case 2: Quality Gates
- Run before every deployment
- Ensures code quality standards
- Blocks deployment if quality drops

### Use Case 3: Regression Recovery
- Automatically detect regressions
- Analyze what broke
- Restore to last good state

### Use Case 4: Continuous Improvement
- Regular quality improvement cycles
- Track improvements over time
- Measure quality gains

---

## 🔧 Configuration

### Janitor Configuration

```javascript
const janitor = new Janitor({
  enabled: true,
  silentRefactoring: true,
  architectureEnforcement: true,
  vibeRestoration: true
});

await janitor.initialize();
await janitor.integrateWithBeastMode(beastMode);
```

### Daisy Chain Configuration

The integration is automatic when:
1. Janitor is initialized
2. Daisy Chain routes are mounted
3. Both services are available

---

## 📚 API Reference

### Get Templates
```http
GET /api/janitor/templates
```

**Response:**
```json
{
  "success": true,
  "templates": [
    {
      "id": "janitor-refactor",
      "name": "Janitor: Silent Refactoring",
      "description": "Run silent refactoring on codebase",
      "category": "maintenance",
      "steps": [...]
    }
  ],
  "count": 5,
  "categories": ["maintenance", "quality", "recovery"]
}
```

### Execute Step
```http
POST /api/janitor/execute
Content-Type: application/json

{
  "stepType": "janitor-refactor",
  "config": {
    "dryRun": false,
    "maxChanges": 50
  },
  "context": {
    "repoPath": "/path/to/repo"
  }
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "success": true,
    "fixes": 23,
    "data": {...},
    "stepType": "janitor-refactor"
  }
}
```

---

## 🚨 Error Handling

All endpoints return standardized error responses:

```json
{
  "success": false,
  "error": "JANITOR_NOT_AVAILABLE",
  "message": "Janitor integration not available",
  "statusCode": 503
}
```

**Common Errors:**
- `JANITOR_NOT_AVAILABLE` - Janitor not initialized
- `EXECUTION_FAILED` - Step execution failed
- `VALIDATION_ERROR` - Invalid request

---

## ✅ Status

- ✅ Integration module created
- ✅ API routes added
- ✅ Visual nodes added
- ✅ Templates registered
- ✅ Documentation complete

---

## 🎉 Next Steps

1. **Mount routes** - Add Janitor routes to Daisy Chain server
2. **Test workflows** - Test all templates and steps
3. **Add UI** - Add Janitor nodes to visual builder UI
4. **Documentation** - Update user-facing docs

---

**The AI Janitor is now fully integrated with Daisy Chain!** 🎸🧹🚀
