#!/bin/bash

# Detect Secrets Using Grep
# This script uses grep patterns to find potential secrets in code and documentation
# Can be used by AI agents to scan for exposed secrets

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Directories to scan (adjust as needed)
SCAN_DIRS="${1:-.}"
EXCLUDE_PATTERNS="node_modules|.git|.next|dist|build|coverage|.rotated-secrets.json"

echo -e "${CYAN}🔍 Secret Detection with Grep${NC}\n"
echo "======================================================================\n"

# Secret patterns (common formats)
declare -A SECRET_PATTERNS=(
  ["Stripe Secret Key"]="sk_(live|test)_[a-zA-Z0-9]{24,}"
  ["Stripe Webhook Secret"]="whsec_[a-zA-Z0-9]{32,}"
  ["GitHub Token"]="ghp_[a-zA-Z0-9]{36,}"
  ["GitHub OAuth Secret"]="[0-9a-f]{40}"
  ["Supabase Service Role Key"]="sb_secret_[a-zA-Z0-9_-]{40,}"
  ["Supabase Anon Key"]="eyJ[a-zA-Z0-9_-]{100,}"
  ["JWT Secret"]="[A-Za-z0-9_-]{32,}"
  ["API Key (OpenAI)"]="sk-[a-zA-Z0-9]{32,}"
  ["API Key (Anthropic)"]="sk-ant-[a-zA-Z0-9-]{95,}"
  ["API Key (Generic)"]="[a-zA-Z0-9_-]{32,}"
  ["Encryption Key (Hex)"]="[0-9a-f]{64}"
  ["Database Connection String"]="(postgres|mysql|mongodb)://[^\\s\"']+"
  ["AWS Access Key"]="AKIA[0-9A-Z]{16}"
  ["AWS Secret Key"]="[A-Za-z0-9/+=]{40}"
  ["Private Key (RSA)"]="-----BEGIN (RSA )?PRIVATE KEY-----"
  ["OAuth Client Secret"]="[a-zA-Z0-9_-]{20,}"
)

# Placeholders to ignore (these are safe)
PLACEHOLDERS=(
  "\\[STORED_IN_DB\\]"
  "\\[REDACTED\\]"
  "YOUR_.*_HERE"
  "example\\.com"
  "placeholder"
  "changeme"
  "your-.*-here"
)

# Counters
TOTAL_MATCHES=0
FILES_WITH_SECRETS=0

# Function to check if match is a placeholder
is_placeholder() {
  local match="$1"
  for placeholder in "${PLACEHOLDERS[@]}"; do
    if echo "$match" | grep -qiE "$placeholder"; then
      return 0  # Is placeholder
    fi
  done
  return 1  # Not a placeholder
}

# Function to scan for a specific pattern
scan_pattern() {
  local pattern_name="$1"
  local pattern="$2"
  local matches=0

  echo -e "${CYAN}Scanning for: ${pattern_name}${NC}"

  # Use grep to find matches
  while IFS= read -r line; do
    # Extract file path and line content
    file=$(echo "$line" | cut -d: -f1)
    line_num=$(echo "$line" | cut -d: -f2)
    content=$(echo "$line" | cut -d: -f3-)

    # Skip if file matches exclude patterns
    if echo "$file" | grep -qE "$EXCLUDE_PATTERNS"; then
      continue
    fi

    # Extract potential secret from line
    potential_secret=$(echo "$content" | grep -oE "$pattern" | head -1)

    # Skip if it's a placeholder
    if is_placeholder "$potential_secret"; then
      continue
    fi

    # Skip if it's in a comment explaining it's a placeholder
    if echo "$content" | grep -qiE "(placeholder|example|redacted|stored_in_db)"; then
      continue
    fi

    # Found a potential secret
    matches=$((matches + 1))
    TOTAL_MATCHES=$((TOTAL_MATCHES + 1))
    
    if [ $matches -eq 1 ]; then
      FILES_WITH_SECRETS=$((FILES_WITH_SECRETS + 1))
    fi

    echo -e "${RED}  ⚠️  ${file}:${line_num}${NC}"
    echo -e "     ${content:0:100}..."
    
    # Show the secret (truncated for safety)
    if [ ${#potential_secret} -gt 50 ]; then
      echo -e "     Secret: ${potential_secret:0:20}...${potential_secret: -10}"
    else
      echo -e "     Secret: ${potential_secret}"
    fi
    echo ""

  done < <(grep -rnE "$pattern" $SCAN_DIRS 2>/dev/null || true)

  if [ $matches -eq 0 ]; then
    echo -e "${GREEN}  ✅ No matches found${NC}\n"
  else
    echo -e "${YELLOW}  Found ${matches} potential secret(s)${NC}\n"
  fi
}

# Scan each pattern
for pattern_name in "${!SECRET_PATTERNS[@]}"; do
  pattern="${SECRET_PATTERNS[$pattern_name]}"
  scan_pattern "$pattern_name" "$pattern"
done

# Summary
echo "======================================================================\n"
echo -e "${CYAN}📊 Scan Summary${NC}\n"
echo -e "Files scanned: $(find $SCAN_DIRS -type f 2>/dev/null | grep -vE "$EXCLUDE_PATTERNS" | wc -l | tr -d ' ')"
echo -e "Files with secrets: ${FILES_WITH_SECRETS}"
echo -e "Total matches: ${TOTAL_MATCHES}\n"

if [ $TOTAL_MATCHES -gt 0 ]; then
  echo -e "${RED}⚠️  WARNING: Potential secrets detected!${NC}\n"
  echo "Next steps:"
  echo "  1. Review each match above"
  echo "  2. Verify if they are real secrets or placeholders"
  echo "  3. If real secrets, rotate them immediately"
  echo "  4. Store in Supabase secrets table"
  echo "  5. Replace in code/docs with [STORED_IN_DB] placeholder"
  echo ""
  exit 1
else
  echo -e "${GREEN}✅ No secrets detected${NC}\n"
  exit 0
fi
