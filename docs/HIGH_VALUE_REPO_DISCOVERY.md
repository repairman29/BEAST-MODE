# High-Value Repository Discovery Guide

**Date:** January 5, 2026  
**Status:** ✅ **Complete Discovery System**

---

## 🎯 Overview

Instead of randomly scanning repositories, we use a **smart discovery system** that:
1. **Searches thousands** of GitHub repositories
2. **Scores them** based on quality criteria
3. **Selects diverse top 500** with language variety
4. **Scans only high-quality** repositories for ML training

---

## 📊 Scoring System

### Total Score: 100 Points

#### 1. Engagement (30 points)
- **Stars** (0-15 points)
  - 1000+ stars: 15 points
  - 500+ stars: 12 points
  - 100+ stars: 10 points
  - 50+ stars: 7 points
  - 10+ stars: 5 points

- **Forks** (0-10 points)
  - 100+ forks: 10 points
  - 50+ forks: 8 points
  - 20+ forks: 6 points
  - 10+ forks: 4 points
  - 5+ forks: 2 points

- **Stars/Forks Ratio** (0-5 points)
  - Ratio > 10: 5 points (very popular)
  - Ratio > 5: 3 points
  - Ratio > 2: 1 point

#### 2. Activity (20 points)
- **Recent Activity** (0-10 points)
  - Updated < 7 days: 10 points
  - Updated < 30 days: 8 points
  - Updated < 90 days: 6 points
  - Updated < 180 days: 4 points
  - Updated < 365 days: 2 points

- **Repository Age** (0-5 points)
  - 2+ years old: 5 points (stable)
  - 1+ years old: 3 points
  - 6+ months old: 1 point

- **Update Frequency** (0-5 points)
  - Very active: 5 points
  - Moderately active: 3 points
  - Somewhat active: 1 point

#### 3. Quality Indicators (30 points)
- **Has License** (0-5 points)
- **Has Description** (0-5 points)
- **Has Topics** (0-5 points)
- **Low Issue Ratio** (0-5 points)
  - Well maintained: 5 points
  - Moderately maintained: 3 points
  - Some maintenance: 1 point

- **Not Archived/Disabled** (0-10 points)

#### 4. Documentation (10 points)
- **Good Description** (0-5 points)
- **Multiple Topics** (0-5 points)

#### 5. Community (10 points)
- **Stars** (0-5 points)
- **Forks** (0-5 points)

---

## 🌍 Diversity Criteria

### Language Distribution

**Supported Languages:**
- JavaScript
- TypeScript
- Python
- Rust
- Go
- Java
- C++
- C#
- Ruby
- PHP
- Swift
- Kotlin

**Distribution Strategy:**
- **Balanced**: Equal representation (default)
- **Proportional**: Based on availability

**Constraints:**
- Minimum 20 repos per language
- Maximum 100 repos per language
- Total: 500 repositories

---

## 🔍 Search Criteria

### Default Criteria

```javascript
{
  languages: [12 languages],
  minStars: 10,        // Minimum quality
  maxStars: 100000,    // Avoid overly popular
  minForks: 5,         // Community engagement
  hasLicense: true,    // Legal compliance
}
```

### Exclusion Criteria

- ❌ Archived repositories
- ❌ Disabled repositories
- ❌ Forks (original repos only)
- ❌ Private repositories
- ❌ Repos with `.ai_exclude` file (opt-out)

---

## 🚀 Usage

### Step 1: Discover High-Value Repos

```bash
node scripts/discover-high-value-repos.js
```

**What it does:**
1. Searches 5000+ repositories across 12 languages
2. Scores each repository (0-100 points)
3. Selects diverse top 500
4. Saves target list

**Output:**
- `high-value-repos-{timestamp}.json` - Full data
- `target-list-{timestamp}.txt` - Simple list

### Step 2: Scan Discovered Repos

```bash
node scripts/scan-discovered-repos.js
```

**What it does:**
1. Loads discovered target list
2. Scans each repository (metadata only)
3. Extracts enhanced features (51 features)
4. Generates training data

**Output:**
- `scanned-repos-{timestamp}.json` - Training data

---

## 📊 Example Results

### Discovery Statistics

```
📊 Discovery complete: 5000 repositories found

📊 Language distribution:
   javascript: 850 repos
   typescript: 720 repos
   python: 680 repos
   rust: 450 repos
   go: 420 repos
   ...
```

### Selection Results

```
✅ Selected 500 repositories:
   javascript: 42 repos
   typescript: 42 repos
   python: 42 repos
   rust: 42 repos
   go: 42 repos
   ...

📊 Selection Statistics:
   Average score: 72.5
   Score range: 45.0 - 95.0
   Languages: 12
```

---

## 🎯 Benefits

### Quality
- ✅ Only high-quality repositories
- ✅ Active and maintained
- ✅ Good documentation
- ✅ Community engagement

### Diversity
- ✅ Multiple languages
- ✅ Balanced distribution
- ✅ Various repository types
- ✅ Different activity levels

### Efficiency
- ✅ Scan only 500 (not thousands)
- ✅ Focus on best repositories
- ✅ Better training data
- ✅ Faster processing

---

## 🔧 Customization

### Adjust Search Criteria

```javascript
const searchCriteria = {
  languages: ['javascript', 'python'], // Custom languages
  minStars: 50,                       // Higher threshold
  maxStars: 50000,                    // Different range
  minForks: 10,                       // More engagement
  hasLicense: true,
};
```

### Adjust Diversity

```javascript
const diversityCriteria = {
  minPerLanguage: 30,    // More per language
  maxPerLanguage: 150,   // Higher max
  languageDistribution: 'proportional', // Different strategy
};
```

### Adjust Target Count

```javascript
const selection = await discovery.discoverAndSelect({
  targetCount: 1000,  // More repositories
  searchCriteria,
  diversityCriteria,
});
```

---

## 📈 Performance

### Discovery Phase
- **Time**: ~10-15 minutes (5000 repos)
- **API Calls**: ~50-100 (rate limited)
- **Output**: 500 target repositories

### Scanning Phase
- **Time**: ~8-10 minutes (500 repos)
- **API Calls**: ~500 (one per repo)
- **Output**: 500 training examples

### Total
- **Time**: ~20-25 minutes
- **API Calls**: ~550-600
- **Output**: 500 high-quality training examples

---

## ✅ Status

**Complete Discovery System:**
- ✅ Multi-language search
- ✅ Quality scoring (100-point system)
- ✅ Diversity selection
- ✅ Opt-out respect
- ✅ Audit trail integration
- ✅ Ready for production

---

**Status:** ✅ **Production Ready**

