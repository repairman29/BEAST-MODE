#!/bin/bash

# BEAST MODE Cursor CLI Session Tracker
# Use this script to manually track Cursor sessions from the terminal

API_URL="${BEAST_MODE_API_URL:-https://beastmode.dev}"
SESSION_ID="cursor_$(date +%s)_$$"
WORKSPACE="${1:-$(pwd)}"
EVENT="${2:-session_start}"

# Get GitHub repo if available
REPO=""
if [ -d "$WORKSPACE/.git" ]; then
  REMOTE_URL=$(cd "$WORKSPACE" && git remote get-url origin 2>/dev/null)
  if [ -n "$REMOTE_URL" ]; then
    # Extract owner/repo from GitHub URL
    REPO=$(echo "$REMOTE_URL" | sed -E 's|.*github\.com[/:]([^/]+)/([^/]+)(\.git)?$|\1/\2|')
  fi
fi

# Send to BEAST MODE
curl -X POST "$API_URL/api/cursor/session" \
  -H "Content-Type: application/json" \
  ${BEAST_MODE_TOKEN:+ -H "Authorization: Bearer $BEAST_MODE_TOKEN"} \
  -d "{
    \"sessionId\": \"$SESSION_ID\",
    \"event\": \"$EVENT\",
    \"metadata\": {
      \"workspace\": \"$WORKSPACE\",
      \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
      \"shell\": \"$SHELL\"
    },
    \"context\": {
      \"project\": \"$(basename "$WORKSPACE")\",
      \"repo\": \"$REPO\"
    }
  }" 2>/dev/null

echo "✅ Tracked $EVENT to BEAST MODE"

