# Grep Secret Detection - Quick Reference for AI Agents

## One-Liner Commands

### Basic Secret Detection
```bash
grep -rnE "sk_(live|test)_[a-zA-Z0-9]{24,}|whsec_[a-zA-Z0-9]{32,}|ghp_[a-zA-Z0-9]{36,}" . \
  --exclude-dir=node_modules \
  --exclude-dir=.git \
  --exclude-dir=.next \
  | grep -vE "\[STORED_IN_DB\]|\[REDACTED\]|placeholder|example"
```

### Find Stripe Secrets
```bash
grep -rnE "sk_(live|test)_[a-zA-Z0-9]{24,}" . --exclude-dir=node_modules --exclude-dir=.git
```

### Find GitHub Tokens
```bash
grep -rnE "ghp_[a-zA-Z0-9]{36,}" . --exclude-dir=node_modules --exclude-dir=.git
```

### Find Supabase Keys
```bash
grep -rnE "sb_secret_[a-zA-Z0-9_-]{40,}" . --exclude-dir=node_modules --exclude-dir=.git
```

### Find Webhook Secrets
```bash
grep -rnE "whsec_[a-zA-Z0-9]{32,}" . --exclude-dir=node_modules --exclude-dir=.git
```

## Common Patterns

| Secret Type | Grep Pattern | Example Match |
|------------|--------------|---------------|
| Stripe Secret | `sk_(live\|test)_[a-zA-Z0-9]{24,}` | `sk_live_51AbC...` |
| Stripe Webhook | `whsec_[a-zA-Z0-9]{32,}` | `whsec_AbC123...` |
| GitHub Token | `ghp_[a-zA-Z0-9]{36,}` | `ghp_AbC123...` |
| GitHub OAuth | `[0-9a-f]{40}` | `5aa15f76ca0300cc932ad6a988cfd79bd72f35fd` |
| Supabase Key | `sb_secret_[a-zA-Z0-9_-]{40,}` | `sb_secret_AbC...` |
| OpenAI Key | `sk-[a-zA-Z0-9]{32,}` | `sk-AbC123...` |
| Encryption Key | `[0-9a-f]{64}` | `bf2a41e444299868737fe08554a655170ee99dd36c06ed666b0d54b2443ea8e2` |

## Filtering False Positives

Always exclude:
- `[STORED_IN_DB]`
- `[REDACTED]`
- `placeholder`
- `example`
- File extensions (`.json`, `.js`, `.md`)
- Variable/function names

## Usage in Scripts

```bash
# In a bash script
if grep -rnE "sk_(live|test)_[a-zA-Z0-9]{24,}" . --exclude-dir=node_modules | grep -v "STORED_IN_DB"; then
  echo "⚠️ Secrets found!"
  exit 1
fi
```

```javascript
// In Node.js
const { execSync } = require('child_process');
const result = execSync(
  'grep -rnE "sk_(live|test)_[a-zA-Z0-9]{24,}" . --exclude-dir=node_modules',
  { encoding: 'utf-8' }
);
if (result && !result.includes('[STORED_IN_DB]')) {
  console.error('Secrets found!');
}
```

## Full Script

Use the provided script:
```bash
./scripts/detect-secrets-with-grep.sh [directory]
```
