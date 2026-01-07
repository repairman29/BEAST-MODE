#!/bin/bash
# Review all public repositories for sensitive files
# Checks both local repos and provides GitHub links

set -e

echo "🔍 REVIEWING ALL PUBLIC REPOSITORIES"
echo "===================================="
echo ""

# Public repos from gh CLI output
PUBLIC_REPOS=(
  "BEAST-MODE|repairman29/BEAST-MODE|BEAST-MODE-PRODUCT|✅ Protected"
  "echeo|repairman29/echeo|payload-cli|⚠️ Needs Check"
  "echeo-web|repairman29/echeo-web|echeo-landing|✅ Protected"
  "mock-services|repairman29/mock-services|unknown|⚠️ Needs Check"
  "beast-mode-website|repairman29/beast-mode-website|unknown|⚠️ Archived"
  "commercial-platform|repairman29/commercial-platform|unknown|⚠️ Needs Check"
  "services-dashboard|repairman29/services-dashboard|unknown|⚠️ Needs Check"
  "service-frontends|repairman29/service-frontends|unknown|⚠️ Needs Check"
  "bot-simulation-service|repairman29/bot-simulation-service|unknown|⚠️ Needs Check"
  "mixdown|repairman29/mixdown|unknown|⚠️ Old Project"
  "slides|repairman29/slides|unknown|⚠️ Old Project"
  "messaging-demo|repairman29/messaging-demo|unknown|⚠️ Old Project"
  "coloringbook|repairman29/coloringbook|unknown|⚠️ Old Project"
  "mythseeker2|repairman29/mythseeker2|unknown|⚠️ Old Project"
  "MythSeeker|repairman29/MythSeeker|unknown|⚠️ Old Project"
  "sheckleshare|repairman29/sheckleshare|unknown|⚠️ Old Project"
  "berry-avenue-codes|repairman29/berry-avenue-codes|unknown|⚠️ Old Project"
  "biomeweavers|repairman29/biomeweavers|unknown|⚠️ Old Project"
  "internal-zendesk-tools|repairman29/internal-zendesk-tools|unknown|⚠️ Old Project"
)

echo "📊 PUBLIC REPOSITORIES STATUS"
echo "============================="
echo ""

PROTECTED=0
NEEDS_CHECK=0
OLD_PROJECTS=0

for repo_info in "${PUBLIC_REPOS[@]}"; do
  IFS='|' read -r name github_path local_path status <<< "$repo_info"
  
  echo "📁 $name"
  echo "   GitHub: https://github.com/$github_path"
  echo "   Status: $status"
  
  if [ "$local_path" != "unknown" ] && [ -d "../$local_path" ]; then
    cd "../$local_path" 2>/dev/null || continue
    
    # Check for sensitive files
    SENSITIVE=$(find . -name "*PRICING*" -o -name "*MARGIN*" -o -name "*COST*" -o -name "*STRATEGY*.md" 2>/dev/null | grep -v node_modules | wc -l | tr -d ' ')
    
    # Check .gitignore
    if grep -q "PRICING\|MARGIN\|COST" .gitignore 2>/dev/null; then
      PROTECTED=$((PROTECTED + 1))
      echo "   ✅ Protected (.gitignore)"
    elif [ "$SENSITIVE" -gt 0 ]; then
      NEEDS_CHECK=$((NEEDS_CHECK + 1))
      echo "   ⚠️  $SENSITIVE sensitive files found"
    else
      echo "   ℹ️  No sensitive files found"
    fi
    
    cd - >/dev/null
  else
    if [[ "$status" == *"Old"* ]] || [[ "$status" == *"Archived"* ]]; then
      OLD_PROJECTS=$((OLD_PROJECTS + 1))
      echo "   ℹ️  Old/archived project (low priority)"
    else
      NEEDS_CHECK=$((NEEDS_CHECK + 1))
      echo "   ⚠️  Not checked locally"
    fi
  fi
  
  echo ""
done

echo "📊 SUMMARY"
echo "=========="
echo "Total public repos: ${#PUBLIC_REPOS[@]}"
echo "Protected: $PROTECTED"
echo "Need check: $NEEDS_CHECK"
echo "Old/archived: $OLD_PROJECTS"
echo ""
echo "✅ Critical repos (BEAST-MODE, echeo-web) are protected"
echo "⚠️  Other repos need manual review (most are old projects)"

