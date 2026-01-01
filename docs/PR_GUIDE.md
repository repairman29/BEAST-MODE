# BEAST MODE: Pull Request Guide
## How to Create and Review PRs

**Status:** 🥷 Stealth Mode  
**Repository:** https://github.com/repairman29/BEAST-MODE

---

## 📋 PR Template

### Standard PR Template

```markdown
## 🎯 Description

Brief description of changes

## 🔗 Related Issues

- Closes #XXX
- Related to #XXX

## 🧪 Testing

- [ ] Tests added/updated
- [ ] All tests passing
- [ ] Manual testing completed

## 📝 Changes

- Change 1
- Change 2
- Change 3

## ✅ Checklist

- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No breaking changes (or breaking changes documented)

## 📸 Screenshots (if applicable)

## 🎸 BEAST MODE Vibe

What makes this change awesome?
```

---

## 🎯 PR Types

### Feature PR
**Title:** `feat(scope): Description`

**Example:**
```
feat(janitor): Add overnight maintenance scheduling
```

**Requirements:**
- New functionality
- Tests included
- Documentation updated
- Backward compatible (or breaking changes documented)

### Fix PR
**Title:** `fix(scope): Description`

**Example:**
```
fix(architecture): Prevent false positives in secret detection
```

**Requirements:**
- Bug fix
- Tests for the fix
- Regression tests if applicable

### Docs PR
**Title:** `docs: Description`

**Example:**
```
docs: Add Sentinel brand guide
```

**Requirements:**
- Documentation only
- No code changes

### Refactor PR
**Title:** `refactor(scope): Description`

**Example:**
```
refactor(janitor): Optimize refactoring engine performance
```

**Requirements:**
- No functional changes
- Tests still passing
- Performance improvement (if applicable)

---

## 🧪 Testing Requirements

### Before Creating PR

1. **Run Tests**
   ```bash
   # Quick test suite
   node scripts/test-janitor.js
   
   # Comprehensive test suite
   node scripts/test-janitor-comprehensive.js
   ```

2. **Check Linting**
   ```bash
   npm run lint
   ```

3. **Manual Testing**
   - Test the feature manually
   - Verify edge cases
   - Check error handling

### Test Coverage

- **New Features:** Must include tests
- **Bug Fixes:** Must include regression tests
- **Refactors:** Existing tests must still pass

---

## 📝 PR Description Guidelines

### Good PR Description

```markdown
## 🎯 Description

Adds overnight maintenance scheduling to Silent Refactoring Engine.

## 🔗 Related Issues

- Closes #123
- Related to #456

## 🧪 Testing

- [x] Added tests for scheduling logic
- [x] All 18 tests passing
- [x] Manual testing: Verified scheduler runs at 2 AM

## 📝 Changes

- Added schedule configuration (start/end times)
- Implemented scheduler with interval checking
- Added status reporting for scheduled runs
- Updated CLI commands for schedule management

## ✅ Checklist

- [x] Code follows style guidelines
- [x] Self-review completed
- [x] Comments added for scheduler logic
- [x] Documentation updated (JANITOR_QUICK_START.md)
- [x] No breaking changes

## 🎸 BEAST MODE Vibe

This makes the janitor truly "silent" - it runs while you sleep! 🌙
```

### Bad PR Description

```markdown
Added scheduling
```

---

## 🔍 Review Checklist

### For Authors

Before requesting review:
- [ ] Self-review completed
- [ ] Tests added/updated
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Code follows style guidelines
- [ ] No console.logs or debug code
- [ ] No hardcoded secrets
- [ ] No breaking changes (or documented)

### For Reviewers

When reviewing:
- [ ] Code quality
- [ ] Test coverage
- [ ] Documentation completeness
- [ ] Performance implications
- [ ] Security considerations
- [ ] Breaking changes
- [ ] BEAST MODE vibe maintained

---

## 🚀 PR Workflow

### 1. Create Feature Branch

```bash
git checkout -b feat/janitor-overnight-scheduling
```

### 2. Make Changes

- Write code
- Add tests
- Update documentation

### 3. Commit Changes

```bash
git add .
git commit -m "feat(janitor): Add overnight maintenance scheduling"
```

### 4. Push Branch

```bash
git push origin feat/janitor-overnight-scheduling
```

### 5. Create PR

- Go to GitHub
- Click "New Pull Request"
- Select your branch
- Fill out PR template
- Request review

### 6. Address Review Feedback

- Make requested changes
- Push updates
- Respond to comments

### 7. Merge

- Wait for approval
- Ensure CI passes
- Merge when ready

---

## 🎯 PR Size Guidelines

### Small PRs (Preferred)
- **Size:** < 200 lines changed
- **Files:** < 5 files
- **Review Time:** < 30 minutes
- **Risk:** Low

### Medium PRs
- **Size:** 200-500 lines
- **Files:** 5-10 files
- **Review Time:** 30-60 minutes
- **Risk:** Medium

### Large PRs (Avoid if possible)
- **Size:** > 500 lines
- **Files:** > 10 files
- **Review Time:** > 60 minutes
- **Risk:** High

**Recommendation:** Break large PRs into smaller, focused PRs.

---

## 🛡️ Architecture Enforcement

### Pre-Commit Hook

The pre-commit hook automatically:
- Checks for architecture violations
- Detects hardcoded secrets
- Prevents bad patterns
- Auto-fixes when possible

**If hook fails:**
- Review the violations
- Fix or approve the auto-fixes
- Commit again

### Pre-Push Hook

The pre-push hook (Enterprise Guardrail):
- Checks if push requires approval
- Generates plain English diff
- Blocks push if violations found

**If hook blocks:**
- Review the plain English diff
- Get approval if needed
- Push again

---

## 📊 PR Status Labels

### Labels to Use

- `feature` - New feature
- `bugfix` - Bug fix
- `docs` - Documentation
- `refactor` - Code refactoring
- `test` - Test additions/updates
- `janitor` - Janitor system changes
- `sentinel` - Sentinel/enterprise changes
- `beast-mode` - BEAST MODE community changes

### Status Labels

- `ready-for-review` - Ready for review
- `in-review` - Currently being reviewed
- `needs-changes` - Requires changes
- `approved` - Approved, ready to merge
- `blocked` - Blocked by dependencies

---

## 🎸 BEAST MODE PR Principles

### Code with Passion
- Write code you're proud of
- Add helpful comments
- Make it maintainable

### Build with Purpose
- Every change has a reason
- Document the "why"
- Consider edge cases

### Ship with Style
- Clean, readable code
- Proper error handling
- Good test coverage

---

## 📝 Example PRs

### Example 1: Feature PR

```markdown
## 🎯 Description

Adds confidence threshold validation to Silent Refactoring Engine to prevent hallucination refactor risk.

## 🔗 Related Issues

- Addresses technical risk from BRAND_STRATEGY_REVISION.md
- Implements safety feature from TECHNICAL_RISK_MITIGATION.md

## 🧪 Testing

- [x] Added tests for confidence calculation
- [x] Added tests for auto-merge blocking
- [x] All 18 tests passing
- [x] Manual testing: Verified 95% confidence blocks merge

## 📝 Changes

- Added `canAutoMerge()` method with confidence check
- Added `calculateConfidence()` method
- Updated `createCommit()` to check confidence
- Added confidence threshold to options (default: 0.999)

## ✅ Checklist

- [x] Code follows style guidelines
- [x] Self-review completed
- [x] Comments added for confidence calculation
- [x] Documentation updated
- [x] No breaking changes (backward compatible)

## 🎸 BEAST MODE Vibe

This prevents the "hallucination refactor" risk - no more AI breaking production while you sleep! 🛡️
```

### Example 2: Fix PR

```markdown
## 🎯 Description

Fixes git hooks to use relative paths instead of package name, preventing module not found errors.

## 🔗 Related Issues

- Fixes git hook failures during commit/push

## 🧪 Testing

- [x] Verified hooks work with relative paths
- [x] Tested pre-commit hook
- [x] Tested pre-push hook
- [x] All tests still passing

## 📝 Changes

- Updated pre-commit hook to use relative paths
- Updated pre-push hook to use relative paths
- Added error handling for missing modules
- Made hooks fail gracefully

## ✅ Checklist

- [x] Code follows style guidelines
- [x] Self-review completed
- [x] Hooks tested manually
- [x] No breaking changes

## 🎸 BEAST MODE Vibe

Git hooks should work, not break! Fixed and ready. 🔧
```

---

## 🚨 Common PR Mistakes to Avoid

### 1. Too Large
- **Problem:** PR with 1000+ lines
- **Solution:** Break into smaller PRs

### 2. No Tests
- **Problem:** New feature without tests
- **Solution:** Always include tests

### 3. Breaking Changes Undocumented
- **Problem:** Breaking change not mentioned
- **Solution:** Document all breaking changes

### 4. No Description
- **Problem:** Empty PR description
- **Solution:** Use PR template

### 5. WIP in Main
- **Problem:** Work in progress merged
- **Solution:** Use draft PRs or feature branches

---

## 📈 PR Metrics

### Good PR Metrics
- **Review Time:** < 24 hours
- **Iterations:** < 3 rounds
- **Comments:** Constructive and actionable
- **Approval Rate:** > 80%

### PR Health Indicators
- ✅ Small, focused PRs
- ✅ Good test coverage
- ✅ Clear descriptions
- ✅ Quick reviews
- ✅ Fast merges

---

## 🎯 PR Review Best Practices

### For Authors
- Be open to feedback
- Respond to comments promptly
- Make requested changes
- Ask questions if unclear

### For Reviewers
- Be constructive
- Explain the "why"
- Suggest improvements
- Approve when ready

---

## 🎸 The BEAST MODE PR Vibe

**We review code with passion, build with purpose, and ship with style.**

> "Every PR makes BEAST MODE better. Let's make it awesome."

---

**See Also:**
- Contributing Guide: `CONTRIBUTING.md` (if exists)
- Code Style: `docs/CODE_STYLE.md` (if exists)
- Testing Guide: `docs/TEST_RESULTS.md`

