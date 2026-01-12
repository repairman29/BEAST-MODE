# Grep-Based Secret Detection Guide

## Overview

This guide explains how to use `grep` to detect exposed secrets in code and documentation. This pattern can be used by AI agents to automatically scan for security issues.

## Quick Start

### Basic Usage

```bash
# Scan current directory
./scripts/detect-secrets-with-grep.sh

# Scan specific directory
./scripts/detect-secrets-with-grep.sh website/

# Scan multiple directories
./scripts/detect-secrets-with-grep.sh "website/ docs/"
```

### One-Liner for AI Agents

```bash
grep -rnE "sk_(live|test)_[a-zA-Z0-9]{24,}|whsec_[a-zA-Z0-9]{32,}|ghp_[a-zA-Z0-9]{36,}" . \
  --exclude-dir=node_modules \
  --exclude-dir=.git \
  --exclude-dir=.next \
  | grep -vE "\[STORED_IN_DB\]|\[REDACTED\]|placeholder|example"
```

## Secret Patterns

### Common Secret Formats

| Secret Type | Pattern | Example |
|------------|---------|---------|
| Stripe Secret Key | `sk_(live\|test)_[a-zA-Z0-9]{24,}` | `sk_live_51...` |
| Stripe Webhook Secret | `whsec_[a-zA-Z0-9]{32,}` | `whsec_...` |
| GitHub Token | `ghp_[a-zA-Z0-9]{36,}` | `ghp_...` |
| GitHub OAuth Secret | `[0-9a-f]{40}` | `5aa15f76ca0300cc932ad6a988cfd79bd72f35fd` |
| Supabase Service Role | `sb_secret_[a-zA-Z0-9_-]{40,}` | `sb_secret_...` |
| OpenAI API Key | `sk-[a-zA-Z0-9]{32,}` | `sk-...` |
| Anthropic API Key | `sk-ant-[a-zA-Z0-9-]{95,}` | `sk-ant-...` |
| JWT Secret | `[A-Za-z0-9_-]{32,}` | `...` |
| Encryption Key (Hex) | `[0-9a-f]{64}` | `bf2a41e444299868737fe08554a655170ee99dd36c06ed666b0d54b2443ea8e2` |
| Database Connection | `(postgres\|mysql\|mongodb)://[^\s"']+` | `postgres://...` |

### Grep Pattern Syntax

```bash
# Basic pattern matching
grep -E "pattern" file

# Recursive search
grep -rE "pattern" directory/

# Case insensitive
grep -iE "pattern" file

# Exclude directories
grep -rE "pattern" . --exclude-dir=node_modules --exclude-dir=.git

# Show line numbers
grep -rnE "pattern" file

# Only show filenames
grep -rlE "pattern" directory/
```

## Implementation for AI Agents

### Pattern 1: Simple Detection

```javascript
// Node.js example
const { execSync } = require('child_process');

function detectSecrets(directory = '.') {
  const patterns = [
    'sk_(live|test)_[a-zA-Z0-9]{24,}',  // Stripe
    'whsec_[a-zA-Z0-9]{32,}',            // Stripe webhook
    'ghp_[a-zA-Z0-9]{36,}',              // GitHub token
    'sb_secret_[a-zA-Z0-9_-]{40,}',      // Supabase
  ];

  const excludeDirs = '--exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.next';
  
  for (const pattern of patterns) {
    try {
      const result = execSync(
        `grep -rnE "${pattern}" ${directory} ${excludeDirs} 2>/dev/null || true`,
        { encoding: 'utf-8' }
      );
      
      if (result.trim()) {
        console.log(`Found matches for ${pattern}:`);
        console.log(result);
      }
    } catch (err) {
      // No matches found
    }
  }
}
```

### Pattern 2: Advanced Detection with Filtering

```bash
#!/bin/bash
# detect-secrets.sh

PATTERN="sk_(live|test)_[a-zA-Z0-9]{24,}|whsec_[a-zA-Z0-9]{32,}|ghp_[a-zA-Z0-9]{36,}"

# Find matches
grep -rnE "$PATTERN" . \
  --exclude-dir=node_modules \
  --exclude-dir=.git \
  --exclude-dir=.next \
  --exclude-dir=dist \
  | while IFS= read -r line; do
    # Skip if contains placeholder indicators
    if echo "$line" | grep -qiE "\[STORED_IN_DB\]|\[REDACTED\]|placeholder|example"; then
      continue
    fi
    
    # Extract and show
    file=$(echo "$line" | cut -d: -f1)
    line_num=$(echo "$line" | cut -d: -f2)
    content=$(echo "$line" | cut -d: -f3-)
    
    echo "⚠️  $file:$line_num"
    echo "   $content"
    echo ""
  done
```

### Pattern 3: Python Implementation

```python
import re
import subprocess
from pathlib import Path

SECRET_PATTERNS = {
    'stripe_secret': r'sk_(live|test)_[a-zA-Z0-9]{24,}',
    'stripe_webhook': r'whsec_[a-zA-Z0-9]{32,}',
    'github_token': r'ghp_[a-zA-Z0-9]{36,}',
    'github_oauth': r'[0-9a-f]{40}',
    'supabase_key': r'sb_secret_[a-zA-Z0-9_-]{40,}',
}

PLACEHOLDERS = [
    r'\[STORED_IN_DB\]',
    r'\[REDACTED\]',
    r'YOUR_.*_HERE',
    r'placeholder',
]

def detect_secrets(directory='.'):
    results = []
    
    for name, pattern in SECRET_PATTERNS.items():
        try:
            result = subprocess.run(
                ['grep', '-rnE', pattern, directory,
                 '--exclude-dir=node_modules',
                 '--exclude-dir=.git',
                 '--exclude-dir=.next'],
                capture_output=True,
                text=True
            )
            
            for line in result.stdout.split('\n'):
                if not line:
                    continue
                
                # Skip placeholders
                if any(re.search(ph, line, re.IGNORECASE) for ph in PLACEHOLDERS):
                    continue
                
                results.append({
                    'type': name,
                    'match': line
                })
        except Exception as e:
            print(f"Error scanning {name}: {e}")
    
    return results
```

## Best Practices for AI Agents

### 1. Always Exclude Common Directories

```bash
--exclude-dir=node_modules
--exclude-dir=.git
--exclude-dir=.next
--exclude-dir=dist
--exclude-dir=build
--exclude-dir=coverage
```

### 2. Filter Out Placeholders

Always skip lines containing:
- `[STORED_IN_DB]`
- `[REDACTED]`
- `placeholder`
- `example`
- `YOUR_*_HERE`

### 3. Use Specific Patterns

Avoid overly broad patterns that match too many false positives:
- ❌ Bad: `[a-zA-Z0-9]{20,}` (too generic)
- ✅ Good: `sk_live_[a-zA-Z0-9]{24,}` (specific to Stripe)

### 4. Show Context

Always show:
- File path
- Line number
- Surrounding context (if possible)

### 5. Report Findings

```bash
# Count matches
grep -cE "pattern" file

# List files with matches
grep -rlE "pattern" directory/

# Show matches with context
grep -rnE "pattern" file -A 2 -B 2
```

## Integration with Existing Tools

### Pre-commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit

if ./scripts/detect-secrets-with-grep.sh; then
  echo "✅ No secrets detected"
  exit 0
else
  echo "❌ Secrets detected! Commit blocked."
  exit 1
fi
```

### CI/CD Integration

```yaml
# .github/workflows/secret-scan.yml
name: Secret Detection
on: [push, pull_request]
jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Detect Secrets
        run: |
          chmod +x scripts/detect-secrets-with-grep.sh
          ./scripts/detect-secrets-with-grep.sh
```

## Common False Positives

### 1. Documentation Examples

```markdown
<!-- This is OK -->
Stripe key: `sk_test_YOUR_KEY_HERE`
```

### 2. Placeholder Values

```javascript
// This is OK
const key = process.env.STRIPE_KEY || '[STORED_IN_DB]';
```

### 3. Hash Identifiers (Not Secrets)

```markdown
<!-- This is OK - it's a hash identifier, not a secret -->
Secret ID: `014c7fab1ba6cc6a7398b5bde04e26463f16f4e9`
```

## Troubleshooting

### Grep Not Finding Matches

1. Check pattern syntax: Use `-E` for extended regex
2. Verify file encoding: Some files may need `-a` flag
3. Check permissions: Ensure read access to files

### Too Many False Positives

1. Add more exclude patterns
2. Refine regex patterns to be more specific
3. Add placeholder detection

### Performance Issues

1. Exclude large directories (node_modules, .git)
2. Use `-l` flag to only show filenames first
3. Limit search depth with `--max-depth`

## Examples

### Example 1: Quick Scan

```bash
# Find all Stripe keys
grep -rnE "sk_(live|test)_[a-zA-Z0-9]{24,}" . \
  --exclude-dir=node_modules \
  --exclude-dir=.git
```

### Example 2: Comprehensive Scan

```bash
# Scan for multiple secret types
./scripts/detect-secrets-with-grep.sh website/
```

### Example 3: CI/CD Check

```bash
# Exit with error if secrets found
if ./scripts/detect-secrets-with-grep.sh; then
  echo "✅ No secrets"
  exit 0
else
  echo "❌ Secrets found!"
  exit 1
fi
```

## Related Scripts

- `scripts/check-secrets-in-docs.js` - Node.js implementation
- `scripts/detect-secrets-with-grep.sh` - Bash implementation
- `scripts/scan-docs-for-secrets.js` - Scan and store in Supabase

## References

- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [TruffleHog](https://github.com/trufflesecurity/trufflehog) - Advanced secret scanner
- [gitleaks](https://github.com/gitleaks/gitleaks) - Secret scanning tool
