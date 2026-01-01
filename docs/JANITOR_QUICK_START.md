# BEAST MODE Janitor - Quick Start Guide
## The AI Janitor for Vibe Coders

**Get started in 5 minutes.**

---

## 🚀 Installation

```bash
# Install BEAST MODE
npm install -g @beast-mode/core

# Initialize in your project
beast-mode init
```

---

## 🧹 Core Features

### 1. Silent Refactoring (Overnight Maintenance)

```bash
# Enable overnight maintenance
beast-mode janitor enable --overnight

# Check what was fixed overnight
beast-mode janitor status

# Run manual refactoring
beast-mode janitor refactor
```

**What it does:**
- Runs 2 AM - 6 AM automatically
- De-duplicates code
- Fixes security issues
- Improves code quality
- Creates PRs or commits

---

### 2. Architecture Enforcement

```bash
# Check for violations
beast-mode architecture check

# View rules
beast-mode architecture rules
```

**What it does:**
- Prevents database logic in frontend
- Blocks secrets in code
- Enforces separation of concerns
- Auto-fixes common patterns

---

### 3. Vibe Restoration

```bash
# Check for regressions
beast-mode vibe check

# Restore to last good state
beast-mode vibe restore

# Analyze regression
beast-mode vibe analyze
```

**What it does:**
- Tracks code state over time
- Detects quality drops
- Restores automatically
- Analyzes what broke

---

### 4. Repo-Level Memory

```bash
# Build semantic graph
beast-mode memory build

# Get context for a file
beast-mode memory context src/components/Header.jsx

# View statistics
beast-mode memory stats
```

**What it does:**
- Creates semantic graph of codebase
- Understands architecture
- Preserves context
- Enforces rules

---

### 5. Vibe Ops (Visual AI Testing)

```bash
# Create test from English
beast-mode vibe-ops test "A user should be able to log in and see their dashboard" --run

# Run all tests
beast-mode vibe-ops run

# Generate report
beast-mode vibe-ops report
```

**What it does:**
- Tests described in English
- Visual AI agents
- Browser automation
- Plain English reports

---

### 6. Invisible CI/CD

```bash
# Run checks silently
beast-mode cicd check

# Show results
beast-mode cicd check --show

# View status
beast-mode cicd status
```

**What it does:**
- Silent linting
- Background testing
- Security scanning
- Auto-fix issues

---

### 7. Prompt Chain Debugger

```bash
# Track a prompt
beast-mode prompt track "Add login feature" --tool cursor

# Debug by prompt
beast-mode prompt debug "Login button not working"

# View history
beast-mode prompt history
```

**What it does:**
- Tracks prompts as source of truth
- Debugs by prompt chain
- Correlates with code changes
- Re-compiles from English

---

### 8. Enterprise Guardrail

```bash
# Check if push is allowed
beast-mode guardrail check

# List pending reviews
beast-mode guardrail reviews

# Approve review
beast-mode guardrail approve <reviewId>
```

**What it does:**
- Plain English diffs
- Governance layer
- Team safety
- Auto-approve safe changes

---

## 📊 Daily Workflow

### Morning Routine

```bash
# Check overnight fixes
beast-mode janitor status

# Check for regressions
beast-mode vibe check

# Run invisible CI/CD
beast-mode cicd check
```

### Before Committing

```bash
# Check architecture
beast-mode architecture check

# Check guardrail
beast-mode guardrail check
```

### If Something Breaks

```bash
# Check vibe
beast-mode vibe check

# Analyze regression
beast-mode vibe analyze

# Restore if needed
beast-mode vibe restore
```

---

## 🎯 Use Cases

### For Accelerators (Experienced Devs)

```bash
# Enable overnight maintenance
beast-mode janitor enable --overnight

# Code fast, we maintain it
# Wake up to clean codebase
```

### For Citizen Developers (Non-Devs)

```bash
# Test in English
beast-mode vibe-ops test "User can login" --run

# Get plain English reviews
beast-mode guardrail check
```

---

## 🔧 Configuration

### Enable All Features

```javascript
// In your project
const { BeastMode } = require('@beast-mode/core');

const beastMode = new BeastMode({
  janitor: {
    enabled: true,
    silentRefactoring: { overnightMode: true },
    architectureEnforcement: { autoFix: true },
    vibeRestoration: { autoTrack: true },
    repoMemory: { enabled: true },
    vibeOps: { enabled: true },
    enterpriseGuardrail: { requireApproval: true },
    invisibleCICD: { enabled: true },
    promptChainDebugger: { trackPrompts: true }
  }
});

await beastMode.initialize();
```

---

## 📈 Statistics

View statistics for any system:

```bash
beast-mode janitor status
beast-mode memory stats
beast-mode cicd status
beast-mode prompt history
```

---

## 🎸 The Vibe

**You write the features. We handle Day 2.**

> "Code fast. Ship confidently. We handle the mess."

---

**See Also:**
- Full Documentation: `docs/DAY2_OPERATIONS_COMPLETE.md`
- Vision: `docs/DAY2_OPERATIONS_VISION.md`
- Roadmap: `docs/VIBE_CODING_ROADMAP.md`

