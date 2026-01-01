# Day 2 Operations - User Guide
## How to Use the AI Janitor Dashboard

**The AI Janitor works while you sleep. Here's how to use it.**

---

## 🚀 Quick Start

### Access the Dashboard

1. **From Sidebar:** Click "🧹 Day 2 Ops" in the left sidebar
2. **Keyboard Shortcut:** Press `4` to jump directly to Janitor dashboard
3. **URL:** Navigate to `/dashboard?view=janitor`

---

## 📊 Dashboard Overview

The Janitor Dashboard shows you:

- **Quick Stats:** Issues fixed, violations blocked, repo memory size, tests run
- **6 Feature Cards:** Each janitor feature with status and controls
- **Real-Time Updates:** Status refreshes every 30 seconds automatically

---

## 🧹 Feature 1: Silent Refactoring

**What it does:** Automatically cleans up your code overnight (2 AM - 6 AM).

### Enable/Disable
- Toggle the **ON/OFF** button on the Silent Refactoring card
- When enabled, refactoring runs automatically during silent hours

### Configure
1. Click **"Configure →"** on the Silent Refactoring card
2. Set options:
   - **Overnight Mode:** Enable/disable automatic runs
   - **Auto-Merge:** Automatically merge safe changes
   - **Confidence Threshold:** Minimum confidence for auto-merge (default: 99.9%)
   - **Require Tests:** Require tests to pass before merging
   - **Require Human Review:** Require manual review for all changes

### Manual Refactor
- Click **"Run Manual Refactor"** to trigger refactoring immediately
- Useful for testing or urgent cleanup

### View Results
- **Issues Fixed:** Number of issues resolved in last run
- **PRs Created:** Number of pull requests created
- **Last Run:** Timestamp of last refactoring cycle

---

## 🛡️ Feature 2: Architecture Enforcement

**What it does:** Prevents bad patterns before they reach your repo.

### Enable/Disable
- Toggle the **ON/OFF** button on the Architecture Enforcement card

### Active Rules
The dashboard shows which rules are active:
- ✅ Blocks secrets in code
- ✅ Prevents DB logic in frontend
- ✅ Enforces separation of concerns
- ✅ Auto-fixes common patterns

### View Rules
1. Click **"View Rules →"** on the Architecture Enforcement card
2. See all active rules and their configurations
3. Customize rules for your project

### Metrics
- **Violations Blocked:** Number of violations prevented
- **Last Check:** Timestamp of last enforcement check

---

## ⏮️ Feature 3: Vibe Restoration

**What it does:** Detects regressions and restores to last good state.

### Enable/Disable
- Toggle the **ON/OFF** button on the Vibe Restoration card

### How It Works
- Tracks code state over time
- Detects when quality drops
- Automatically restores to last known good state
- Analyzes what broke

### View History
1. Click **"View History →"** on the Vibe Restoration card
2. See timeline of code states
3. View regression events
4. Restore to any previous state

### Metrics
- **Regressions Detected:** Number of quality drops found
- **Last Restore:** Timestamp of last restoration

---

## 🧠 Feature 4: Repo-Level Memory

**What it does:** Builds a semantic graph of your entire codebase.

### Enable/Disable
- Toggle the **ON/OFF** button on the Repo-Level Memory card

### Capabilities
- **Architecture Understanding:** Knows your project structure
- **Context Preservation:** Maintains context across changes
- **Dependency Tracking:** Maps relationships between files

### View Graph
1. Click **"View Graph →"** on the Repo-Level Memory card
2. Explore the semantic graph
3. See file relationships
4. Understand architecture

### Metrics
- **Graph Size:** Number of nodes in the semantic graph
- **Last Update:** Timestamp of last graph update

---

## 🤖 Feature 5: Vibe Ops

**What it does:** Test in plain English, not code.

### Enable/Disable
- Toggle the **ON/OFF** button on the Vibe Ops card

### Create Test
1. Click **"Create Test →"** on the Vibe Ops card
2. Describe your test in plain English:
   - Example: "User can login and see dashboard"
   - Example: "Checkout flow completes successfully"
3. Vibe Ops translates to test code automatically
4. Visual AI agent runs the test
5. Get results in plain English

### Example Tests
- "User can login and see dashboard"
- "Checkout button works correctly"
- "Form validation prevents invalid input"

### Metrics
- **Tests Run:** Total number of tests executed
- **Last Test:** Timestamp of last test run

---

## 👻 Feature 6: Invisible CI/CD

**What it does:** Silent linting, testing, and security scanning in the background.

### Enable/Disable
- Toggle the **ON/OFF** button on the Invisible CI/CD card

### What Runs
- **Background Linting:** Code style checks
- **Security Scanning:** Vulnerability detection
- **Auto-Fix Violations:** Automatically fixes issues

### View Logs
1. Click **"View Logs →"** on the Invisible CI/CD card
2. See all scans and their results
3. View fixed issues
4. Monitor security findings

### Metrics
- **Scans Run:** Total number of scans executed
- **Issues Found:** Number of issues detected

---

## ⚙️ Global Controls

### Enable/Disable All
- Use the main **"Enable/Disable Janitor"** button at the top
- Turns all features on/off at once

### Status Badge
- **✓ Active:** Janitor is running
- **○ Inactive:** Janitor is disabled

---

## 📈 Understanding Metrics

### Quick Stats Bar
- **Issues Fixed:** Total issues resolved by Silent Refactoring
- **Violations Blocked:** Total violations prevented by Architecture Enforcement
- **Repo Memory Nodes:** Size of semantic graph
- **Vibe Ops Tests:** Total tests run

### Feature Cards
Each card shows:
- **Status:** Enabled/Disabled
- **Last Activity:** When it last ran
- **Metrics:** Feature-specific statistics
- **Actions:** Configure, view history, etc.

---

## 🔧 Configuration

### Per-Feature Configuration
1. Click **"Configure →"** on any feature card
2. Adjust settings:
   - Enable/disable specific features
   - Set thresholds and limits
   - Configure schedules
   - Customize rules

### Best Practices
- **Start Small:** Enable one feature at a time
- **Monitor Results:** Check metrics after enabling
- **Adjust Thresholds:** Fine-tune confidence levels
- **Review Changes:** Check PRs before merging

---

## 🎯 Common Workflows

### Workflow 1: Enable Overnight Refactoring
1. Go to Janitor Dashboard
2. Enable "Silent Refactoring"
3. Enable "Overnight Mode"
4. Go to sleep
5. Wake up to clean code and PRs

### Workflow 2: Set Up Architecture Enforcement
1. Enable "Architecture Enforcement"
2. Review active rules
3. Customize rules for your project
4. Commit code - violations are blocked automatically

### Workflow 3: Test in Plain English
1. Enable "Vibe Ops"
2. Click "Create Test →"
3. Describe test: "User can login"
4. Test runs automatically
5. Get results in plain English

### Workflow 4: Restore After Regression
1. Enable "Vibe Restoration"
2. If quality drops, dashboard shows regression
3. Click "View History →"
4. Select last good state
5. Click "Restore"
6. Code restored automatically

---

## ❓ Troubleshooting

### Feature Not Working
- Check if feature is enabled (ON/OFF button)
- Check if Janitor is enabled globally
- Review logs for errors
- Check API connectivity

### No Results Showing
- Wait for first run (may take a few minutes)
- Check if overnight mode is enabled
- Verify repository connection
- Review configuration settings

### Too Many Changes
- Increase confidence threshold
- Enable "Require Human Review"
- Disable auto-merge
- Review PRs before merging

---

## 🚀 Next Steps

1. **Enable Features:** Start with Silent Refactoring
2. **Monitor Results:** Check metrics daily
3. **Adjust Settings:** Fine-tune for your workflow
4. **Explore:** Try Vibe Ops for testing
5. **Review:** Check PRs created by janitor

---

## 📚 Related Documentation

- [Janitor Quick Start](../BEAST-MODE-PRODUCT/docs/JANITOR_QUICK_START.md)
- [Day 2 Operations Complete](../BEAST-MODE-PRODUCT/docs/DAY2_OPERATIONS_COMPLETE.md)
- [CLI Commands](../BEAST-MODE-PRODUCT/docs/JANITOR_QUICK_START.md#cli-commands)

---

**Status:** ✅ **UI Complete - Ready to Use**

All Day 2 Operations features are now accessible through the dashboard. Enable, configure, and monitor everything from one place.

