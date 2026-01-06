# Language & Skill Coverage Strategy
## Comprehensive Dataset Strategy for Repository Quality Model

**Date:** January 6, 2026  
**Current Status:** 1,580 repos, 18 languages, mostly high quality

---

## 🎯 Goal

Ensure comprehensive coverage of:
1. **All major programming languages** (30+ languages)
2. **All skill categories** (web, backend, mobile, data, etc.)
3. **Quality distribution** (high, medium, low quality repos per language)
4. **Project types** (libraries, apps, frameworks, tools)

---

## 📊 Current Coverage Analysis

### Languages Covered (18)
- ✅ TypeScript: 258 repos (16.3%)
- ✅ JavaScript: 198 repos (12.5%)
- ✅ Python: 142 repos (9.0%)
- ✅ C++: 93 repos (5.9%)
- ✅ Go: 93 repos (5.9%)
- ✅ Java: 92 repos (5.8%) - **Need 8 more**
- ✅ PHP: 83 repos (5.3%)
- ✅ Kotlin: 83 repos (5.3%)
- ✅ Swift: 79 repos (5.0%)
- ✅ C#: 76 repos (4.8%)
- ✅ Rust: 69 repos (4.4%)
- ✅ Ruby: 59 repos (3.7%)
- ✅ Dart: 54 repos (3.4%)
- ✅ Scala: 25 repos (1.6%)
- ✅ Clojure: 14 repos (0.9%)
- ✅ Elixir: 14 repos (0.9%)
- ✅ Haskell: 11 repos (0.7%)
- ✅ R: 4 repos (0.3%)

### Critical Gaps
- ⚠️ Java: 92/100 (need 8 more)
- ⚠️ Missing: HTML, CSS, C, Shell, Vue, React, Angular, and others

---

## 🎯 Target Coverage

### Critical Languages (Must Have 100+ repos each)
1. **JavaScript** - ✅ 198 (exceeded)
2. **TypeScript** - ✅ 258 (exceeded)
3. **Python** - ✅ 142 (exceeded)
4. **Java** - ⚠️ 92 (need 8 more)
5. **Go** - ✅ 93 (close, could add 7 more)
6. **Rust** - ⚠️ 69 (need 31 more)
7. **C++** - ✅ 93 (close)
8. **C#** - ⚠️ 76 (need 24 more)

### High Priority Languages (80+ repos each)
9. **PHP** - ✅ 83 (exceeded)
10. **Swift** - ⚠️ 79 (need 1 more)
11. **Kotlin** - ✅ 83 (exceeded)
12. **Ruby** - ⚠️ 59 (need 21 more)

### Medium Priority Languages (50+ repos each)
13. **Dart** - ✅ 54 (exceeded)
14. **Scala** - ⚠️ 25 (need 25 more)
15. **R** - ⚠️ 4 (need 46 more)
16. **Haskell** - ⚠️ 11 (need 39 more)
17. **Elixir** - ⚠️ 14 (need 36 more)
18. **Shell** - ❌ 0 (need 50+)
19. **C** - ❌ 0 (need 50+)
20. **HTML** - ❌ 0 (need 50+)
21. **CSS** - ❌ 0 (need 50+)

### Missing Languages to Add
- **Web Frameworks:** Vue, React, Angular, Svelte
- **Systems:** C, Assembly, Zig, Nim
- **Scripting:** Shell, PowerShell, Lua, Perl
- **Data:** Julia, MATLAB, SQL
- **Functional:** F#, Erlang, OCaml
- **Mobile:** Objective-C, Flutter (Dart)
- **Config:** YAML, JSON, TOML, HCL

---

## 📋 Coverage Strategy

### Phase 1: Fix Critical Gaps (This Week)

#### 1.1 Complete Critical Languages
```bash
# Discover and scan missing repos for critical languages
node scripts/discover-missing-languages.js --priority critical
```

**Target:**
- Java: +8 repos
- Rust: +31 repos
- C#: +24 repos
- Go: +7 repos (optional, already close)

**Total:** ~70 repos

#### 1.2 Fix Language Data Quality
**Issue:** Some repos may have missing language data

**Solution:**
- Re-scan repos with missing language
- Extract language from file extensions
- Use GitHub API language data

```bash
# Script to fix missing language data
node scripts/fix-missing-languages.js
```

---

### Phase 2: Add High Priority Languages (Next 2 Weeks)

#### 2.1 Complete High Priority Coverage
```bash
# Discover repos for high-priority languages
node scripts/discover-missing-languages.js --priority high
```

**Target:**
- Swift: +1 repo
- Ruby: +21 repos
- Shell: +50 repos (new)
- C: +50 repos (new)
- HTML: +50 repos (new)
- CSS: +50 repos (new)

**Total:** ~222 repos

---

### Phase 3: Add Medium Priority Languages (Next Month)

#### 3.1 Complete Medium Priority Coverage
**Target:**
- Scala: +25 repos
- R: +46 repos
- Haskell: +39 repos
- Elixir: +36 repos
- Vue: +50 repos (new)
- React: +50 repos (new)
- Angular: +30 repos (new)

**Total:** ~276 repos

---

### Phase 4: Comprehensive Coverage (Ongoing)

#### 4.1 Add Low Priority Languages
- F#, Erlang, OCaml, Julia, MATLAB, etc.
- Target: 20-30 repos each

#### 4.2 Add Quality Distribution
**Current Issue:** 96.8% high quality repos

**Target Distribution per Language:**
- High Quality (≥0.7): 60%
- Medium Quality (0.4-0.7): 30%
- Low Quality (<0.4): 10%

**Strategy:**
- Discover repos with lower stars/engagement
- Include newer/experimental projects
- Add repos with known issues

---

## 🔧 Implementation Plan

### Step 1: Create Discovery Script for Missing Languages

```javascript
// scripts/discover-missing-languages.js
// Auto-discovers repos for languages with gaps
```

**Features:**
- Reads coverage analysis
- Identifies gaps
- Discovers repos by language
- Respects rate limits
- Prioritizes by gap size

### Step 2: Enhance Language Detection

**Current Issue:** Some repos may have incorrect/missing language data

**Solution:**
- Use GitHub API language percentages
- Fallback to file extension analysis
- Store primary + secondary languages
- Validate language data during scanning

### Step 3: Quality Distribution per Language

**Strategy:**
- For each language, ensure quality distribution:
  - High: 60%
  - Medium: 30%
  - Low: 10%

**Discovery Queries:**
- High quality: `stars:>1000 language:X`
- Medium quality: `stars:100-1000 language:X`
- Low quality: `stars:10-100 language:X`

---

## 📊 Success Metrics

### Language Coverage
- [ ] All critical languages: 100+ repos each
- [ ] All high priority: 80+ repos each
- [ ] All medium priority: 50+ repos each
- [ ] 30+ total languages covered

### Quality Distribution
- [ ] Each language has quality variance
- [ ] High: 60%, Medium: 30%, Low: 10%
- [ ] No language is 100% high quality

### Data Quality
- [ ] 0% "Unknown" language repos
- [ ] All repos have primary language
- [ ] Language data validated

---

## 🚀 Quick Start Commands

### Analyze Current Coverage
```bash
node scripts/analyze-language-coverage.js
```

### Discover Missing Languages
```bash
node scripts/discover-missing-languages.js --priority critical
node scripts/discover-missing-languages.js --priority high
```

### Fix Language Data
```bash
node scripts/fix-missing-languages.js
```

### Scan New Repos
```bash
node scripts/scan-notable-repos.js --maxRepos 500
```

### Retrain with Expanded Dataset
```bash
node scripts/retrain-with-notable-quality.js
```

---

## 📈 Timeline

### Week 1
- ✅ Analyze current coverage
- [ ] Fix critical language gaps (Java, Rust, C#)
- [ ] Fix missing language data

### Week 2
- [ ] Add high priority languages
- [ ] Add Shell, C, HTML, CSS

### Week 3-4
- [ ] Add medium priority languages
- [ ] Ensure quality distribution

### Month 2
- [ ] Comprehensive coverage (30+ languages)
- [ ] Quality distribution per language
- [ ] Retrain model with expanded dataset

---

## 💡 Best Practices

### Language Discovery
1. **Use GitHub Search API** - Most reliable
2. **Filter by stars** - Ensure quality
3. **Check recency** - Active projects
4. **Diversity** - Different project types

### Quality Distribution
1. **High Quality:** Stars >1000, good engagement
2. **Medium Quality:** Stars 100-1000, moderate engagement
3. **Low Quality:** Stars 10-100, newer projects

### Validation
1. **Verify language data** - Check GitHub API
2. **Validate features** - Ensure completeness
3. **Check quality scores** - Ensure distribution

---

**Status:** 🟡 **Good Coverage - Needs Expansion for Comprehensive Model**

**Next Action:** Fix critical gaps and add missing languages

