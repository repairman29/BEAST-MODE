# 🛡️ Brand/Reputation/Secret Interceptor

**Purpose:** Prevents vibe coding engines (AI assistants) from committing secrets, internal strategy documents, and business-sensitive content to public repositories.

**Status:** ✅ **ACTIVE**

---

## 🎯 What It Does

The Brand/Reputation/Secret Interceptor automatically:

1. **Scans staged files** before every commit
2. **Detects unsafe content:**
   - API keys and secrets (OpenAI, GitHub, Stripe, etc.)
   - Internal strategy documents (pricing, marketing, sales)
   - Business-sensitive content (revenue targets, margins, customer profiles)
   - Content/marketing materials (social media, press kits, brand guidelines)
3. **Blocks unsafe commits** and stores data in Supabase
4. **Allows bots/AI assistants** to access intercepted data via API

---

## 🚀 Quick Start

### Install the Interceptor

```bash
beast-mode interceptor install
```

This installs a pre-commit hook that automatically intercepts unsafe commits.

### Check Staged Files (Without Committing)

```bash
beast-mode interceptor check
```

### View Intercepted Data

```bash
beast-mode interceptor list
beast-mode interceptor list --repo BEAST-MODE --limit 50
```

### Check Status

```bash
beast-mode interceptor status
```

---

## 🔍 What Gets Intercepted

### Secrets (Critical)
- OpenAI API keys (`sk-...`)
- Anthropic API keys (`sk-ant-...`)
- GitHub tokens (`ghp_...`)
- Stripe keys (`sk_...`)
- Database connection strings
- JWT tokens
- Private keys

### Internal Documents (High)
- Pricing strategies (`PRICING_*.md`, `MARGIN_*.md`)
- Monetization plans (`MONETIZATION_*.md`)
- Sales playbooks (`SALES_*.md`, `PLAYBOOK_*.md`)
- Marketing strategies (`MARKETING_*.md`, `ICP_*.md`)
- Business strategies (`BUSINESS_*.md`, `EXECUTION_*.md`)

### Content Materials (Medium)
- Social media templates (`SOCIAL_*.md`)
- Content campaigns (`CONTENT_*.md`, `CAMPAIGN_*.md`)
- Press kits (`PRESS_*.md`)
- Brand materials (`BRAND_*.md`, `LAUNCH_*.md`)

### Business Content (High)
- Revenue targets (`$X MRR`, `$X ARR`)
- Margin information (`90% margin`, `gross margin`)
- Customer profiles (`ICP profile`, `target customer`)
- Competitive analysis (`competitor pricing`)

---

## 💾 Supabase Storage

Intercepted data is stored in the `intercepted_commits` table:

- **Full file content** - So bots can access it
- **Issue details** - What was wrong with the file
- **Metadata** - File size, issue count, severities
- **Timestamp** - When it was intercepted

### Access via API

```bash
# Get all intercepted commits
curl https://beast-mode.dev/api/intercepted-commits

# Filter by repo
curl https://beast-mode.dev/api/intercepted-commits?repo_name=BEAST-MODE

# Filter by status
curl https://beast-mode.dev/api/intercepted-commits?status=intercepted

# Update status
curl -X POST https://beast-mode.dev/api/intercepted-commits \
  -H "Content-Type: application/json" \
  -d '{"id": "uuid", "status": "reviewed"}'
```

---

## 🔧 Configuration

### Options

```javascript
const interceptor = new BrandReputationInterceptor({
  enabled: true,              // Enable/disable interceptor
  strictMode: true,            // Block commits with issues (vs. just warn)
  storeInSupabase: true,       // Store intercepted data in Supabase
  autoFix: false               // Attempt to auto-fix issues (future feature)
});
```

### Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (for storing intercepted data)

---

## 📋 Workflow

### Normal Flow

1. Developer/AI assistant stages files: `git add .`
2. Developer commits: `git commit -m "message"`
3. Pre-commit hook runs interceptor
4. If safe → Commit proceeds
5. If unsafe → Commit blocked, data stored in Supabase

### After Interception

1. Intercepted data stored in Supabase
2. Developer sees error message with details
3. Developer fixes issues (removes secrets, etc.)
4. Developer re-stages and commits
5. Bots can access intercepted data via API if needed

---

## 🎯 Use Cases

### For Vibe Coders (AI Assistants)

- **Prevents accidental commits** of internal docs
- **Stores data in Supabase** so bots can still access it
- **Only commits safe, necessary code**

### For Developers

- **Protects brand reputation** - No internal strategy leaks
- **Prevents secret exposure** - No API keys in public repos
- **Maintains professionalism** - Only public-safe content

### For Teams

- **Centralized storage** - All intercepted data in one place
- **Bot access** - AI assistants can query Supabase for data
- **Audit trail** - See what was blocked and when

---

## 🔐 Security

- **RLS Policies:** Only service role and authenticated users can access intercepted data
- **Encryption:** Sensitive data should be encrypted before storage (future enhancement)
- **Access Control:** Users can only see intercepted data for their own repos

---

## 📊 Statistics

Track interceptor effectiveness:

```bash
beast-mode interceptor status
```

Shows:
- Number of files intercepted
- Types of issues found
- Success rate of preventing unsafe commits

---

## 🛠️ Troubleshooting

### Hook Not Running

```bash
# Check if hook exists
ls -la .git/hooks/pre-commit

# Reinstall hook
beast-mode interceptor install
```

### Supabase Not Storing Data

```bash
# Check environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY

# Check Supabase connection
beast-mode interceptor status
```

### False Positives

If a file is incorrectly flagged:

1. Check the file content for patterns that match
2. Use `.gitignore` to exclude the file
3. Or modify the file to remove the pattern

---

## 🚀 Future Enhancements

- [ ] Auto-fix mode (remove secrets, replace with env vars)
- [ ] Machine learning to detect new patterns
- [ ] Integration with GitHub App for PR checks
- [ ] Dashboard to view intercepted data
- [ ] Encryption for sensitive intercepted data
- [ ] Automatic cleanup of old intercepted data

---

## 📚 Related Documentation

- [Public Repo Publishing Rules](../echeo-landing/docs/PUBLIC_REPO_PUBLISHING_RULES.md)
- [Architecture Enforcer](./ARCHITECTURE_ENFORCEMENT_FALSE_POSITIVE.md)
- [Enterprise Guardrail](../lib/janitor/enterprise-guardrail.js)

---

**Status:** ✅ Ready for use. Install the hook and start protecting your repos!
