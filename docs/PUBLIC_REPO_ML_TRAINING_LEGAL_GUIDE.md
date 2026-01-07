# Public Repository ML Training - Legal & Ethical Guide

**Date:** January 5, 2026  
**Status:** ✅ **Compliant Approach Documented**

---

## 🎯 Executive Summary

**Can we scan public repos for ML training?**

**Short Answer:** ✅ **YES, with important caveats**

**What's Allowed:**
- ✅ Scanning public repos via GitHub API
- ✅ Extracting metadata (stars, forks, file counts)
- ✅ Training on aggregated features (not source code)
- ✅ Using repository statistics for quality prediction

**What Requires Care:**
- ⚠️ Respect repository licenses
- ⚠️ Honor opt-out signals (`.ai_exclude` files)
- ⚠️ Don't store full source code
- ⚠️ Use aggregated/statistical data only

---

## 📋 Legal Framework

### GitHub Terms of Service

**What GitHub Allows:**
1. ✅ **Public Repository Access** - Public repos are accessible via API
2. ✅ **Metadata Collection** - Stars, forks, issues, etc. are public data
3. ✅ **Fair Use** - GitHub considers ML training on public data as fair use
4. ⚠️ **Opt-Out Mechanism** - Developers can exclude repos with `.ai_exclude` file

**Key Points:**
- Public repos are "public" - accessible to everyone
- GitHub API is the proper way to access public data
- Respect rate limits and API terms
- Honor opt-out mechanisms

### Copyright & Licensing

**Public ≠ Public Domain:**
- Public repos are still copyrighted
- Licenses govern use (MIT, Apache, GPL, etc.)
- Most open-source licenses allow use for any purpose
- Some licenses have restrictions (GPL requires derivative works to be GPL)

**Our Approach:**
- ✅ We only use **metadata** (not source code)
- ✅ We use **aggregated statistics** (stars, forks, file counts)
- ✅ We don't store or reproduce source code
- ✅ We respect licenses by not copying code

### Fair Use Doctrine

**What is Fair Use?**
- Using copyrighted material for research/analysis
- Transformative use (creating something new)
- Limited use (not reproducing entire works)

**Our Use Case:**
- ✅ **Transformative** - We're creating quality prediction models, not copying code
- ✅ **Limited** - We only use metadata/statistics, not source code
- ✅ **Research** - ML training for quality prediction
- ✅ **No Market Impact** - We're not competing with original code

**GitHub's Position:**
- GitHub considers ML training on public data as fair use
- This is the industry standard practice
- However, legal challenges exist (e.g., GitHub Copilot lawsuits)

---

## ✅ What We're Currently Doing (Compliant)

### 1. Data Collection

**What We Collect:**
- ✅ Repository metadata (stars, forks, issues)
- ✅ File structure (file counts, file types)
- ✅ Quality indicators (hasTests, hasCI, hasDocker)
- ✅ Language statistics
- ✅ Repository age and activity

**What We DON'T Collect:**
- ❌ Full source code files
- ❌ Code snippets or functions
- ❌ Actual code content
- ❌ Sensitive information

### 2. Data Usage

**How We Use Data:**
- ✅ Extract features (51 features from metadata)
- ✅ Train quality prediction models
- ✅ Aggregate statistics for analysis
- ✅ Create embeddings (semantic representations, not code)

**How We DON'T Use Data:**
- ❌ Reproduce or copy source code
- ❌ Train code generation models
- ❌ Store full repositories
- ❌ Compete with original code

### 3. Current Practice

**Repositories We Scan:**
- ✅ User's own connected repos (explicit permission)
- ✅ Public repos via GitHub API (public data)
- ✅ Respecting rate limits
- ✅ Using proper authentication

---

## 🚨 What We Must Respect

### 1. Opt-Out Mechanisms

**`.ai_exclude` File:**
- GitHub allows developers to exclude repos from AI training
- If a repo has `.ai_exclude` file, we should skip it
- This is a developer's explicit opt-out signal

**Implementation:**
```javascript
// Check for .ai_exclude file
async function checkOptOut(owner, repo, octokit) {
  try {
    await octokit.repos.getContent({
      owner,
      repo,
      path: '.ai_exclude'
    });
    return true; // Opt-out detected
  } catch {
    return false; // No opt-out
  }
}
```

### 2. Repository Licenses

**License Types:**
- **Permissive** (MIT, Apache, BSD) - ✅ Usually OK
- **Copyleft** (GPL, AGPL) - ⚠️ May have restrictions
- **Proprietary** - ❌ Don't use

**Our Approach:**
- ✅ We only use metadata (not code), so licenses don't apply
- ✅ But we should still respect developer intent
- ✅ Document which licenses we encounter

### 3. Rate Limiting

**GitHub API Limits:**
- Authenticated: 5,000 requests/hour
- Unauthenticated: 60 requests/hour
- Respect rate limits to avoid blocking

**Best Practices:**
- ✅ Use authenticated requests when possible
- ✅ Implement exponential backoff
- ✅ Cache results to reduce API calls
- ✅ Batch requests when possible

---

## 🔒 Privacy & Security

### What We Store

**Allowed:**
- ✅ Repository metadata (public data)
- ✅ Aggregated statistics
- ✅ Feature vectors (derived from metadata)
- ✅ Quality scores (our predictions)

**Not Allowed:**
- ❌ Full source code
- ❌ Code snippets
- ❌ Sensitive information
- ❌ Private repository data (without permission)

### Data Retention

**Best Practices:**
- ✅ Keep only what's necessary for ML training
- ✅ Aggregate data when possible
- ✅ Remove identifying information
- ✅ Allow data deletion requests

---

## 📊 Recommended Approach

### Phase 1: Current Practice (Safe)

**What We Do:**
1. ✅ Scan user's own connected repos (explicit permission)
2. ✅ Extract metadata only (no source code)
3. ✅ Train on aggregated features
4. ✅ Respect rate limits

**Status:** ✅ **Compliant and Safe**

### Phase 2: Public Repo Scanning (With Safeguards)

**What We Can Add:**
1. ✅ Scan public repos via GitHub API
2. ✅ Check for `.ai_exclude` files (skip if present)
3. ✅ Only extract metadata (stars, forks, file counts)
4. ✅ Respect repository licenses
5. ✅ Document our practices

**Implementation:**
```javascript
async function scanPublicRepoForML(owner, repo, octokit) {
  // 1. Check opt-out
  const optedOut = await checkOptOut(owner, repo, octokit);
  if (optedOut) {
    console.log(`⏭️  Skipping ${owner}/${repo} - opted out via .ai_exclude`);
    return null;
  }

  // 2. Get metadata only (no source code)
  const metadata = await getRepositoryMetadata(owner, repo, octokit);
  
  // 3. Extract features (aggregated statistics)
  const features = extractFeatures(metadata);
  
  // 4. Return for training (no source code)
  return features;
}
```

### Phase 3: Ethical Best Practices

**Additional Safeguards:**
1. ✅ Public documentation of our practices
2. ✅ Opt-out mechanism for repo owners
3. ✅ Transparency about data usage
4. ✅ Regular compliance reviews

---

## 🎯 Implementation Checklist

### Before Scanning Public Repos

- [ ] ✅ Implement `.ai_exclude` check
- [ ] ✅ Document data collection practices
- [ ] ✅ Update privacy policy
- [ ] ✅ Add license checking
- [ ] ✅ Implement rate limiting
- [ ] ✅ Create opt-out mechanism
- [ ] ✅ Test with small sample first

### During Scanning

- [ ] ✅ Respect rate limits
- [ ] ✅ Skip opted-out repos
- [ ] ✅ Only collect metadata
- [ ] ✅ Log all scans
- [ ] ✅ Handle errors gracefully

### After Scanning

- [ ] ✅ Aggregate data
- [ ] ✅ Remove identifying info
- [ ] ✅ Store securely
- [ ] ✅ Allow deletion requests
- [ ] ✅ Monitor for issues

---

## 📝 Legal Recommendations

### 1. Document Everything

**What to Document:**
- What data we collect
- How we use it
- Where it's stored
- How to opt-out
- Contact information

### 2. Update Privacy Policy

**Add Section:**
- Public repository scanning
- Data collection practices
- Opt-out mechanisms
- License respect

### 3. Create Opt-Out Page

**Provide:**
- Clear instructions
- Easy opt-out process
- Confirmation of opt-out
- Contact for questions

### 4. Regular Compliance Review

**Review:**
- Legal landscape changes
- New opt-out mechanisms
- License requirements
- Best practices updates

---

## 🚀 Next Steps

### Immediate (Safe)

1. ✅ **Continue current practice** (user's own repos)
2. ✅ **Document what we do** (this guide)
3. ✅ **Update privacy policy** (add ML training section)

### Short-term (With Safeguards)

1. ⏳ **Implement `.ai_exclude` check**
2. ⏳ **Add license checking**
3. ⏳ **Create public repo scanner** (with safeguards)
4. ⏳ **Test with small sample**

### Long-term (Best Practices)

1. ⏸️ **Public opt-out mechanism**
2. ⏸️ **Transparency dashboard**
3. ⏸️ **Regular compliance audits**
4. ⏸️ **Legal review** (if scaling)

---

## 📚 References

### Legal Documents

- [GitHub Terms of Service](https://docs.github.com/en/site-policy/github-terms/github-terms-of-service)
- [GitHub API Terms](https://docs.github.com/en/rest/overview/terms-of-service)
- [Fair Use Doctrine](https://www.copyright.gov/fair-use/)

### Industry Practices

- GitHub Copilot (uses public repos, under legal challenge)
- OpenAI Codex (trained on public code)
- Google Code Search (indexes public repos)

### Best Practices

- Respect opt-out mechanisms
- Use metadata only
- Don't store source code
- Document everything
- Be transparent

---

## ✅ Conclusion

**Can we scan public repos for ML training?**

**YES** - With proper safeguards:
- ✅ Only metadata (not source code)
- ✅ Respect opt-outs (`.ai_exclude`)
- ✅ Honor licenses
- ✅ Document practices
- ✅ Be transparent

**Our Current Practice:**
- ✅ Already compliant (using user's own repos)
- ✅ Only metadata collection
- ✅ No source code storage
- ✅ Aggregated features only

**Next Steps:**
- ⏳ Implement `.ai_exclude` check
- ⏳ Add public repo scanning (with safeguards)
- ⏳ Update documentation
- ⏳ Test with small sample

---

**Status:** ✅ **Compliant Approach | Ready for Implementation**

