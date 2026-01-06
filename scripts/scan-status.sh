#!/bin/bash

# Quick status check for repository scanning

cd "$(dirname "$0")/.."

echo "🔍 Repository Scanning Status"
echo "=============================="
echo ""

# Check if scan is running
SCAN_PID=$(ps aux | grep "scan-discovered-repos" | grep -v grep | awk '{print $2}')
if [ -n "$SCAN_PID" ]; then
  echo "✅ Scan is RUNNING (PID: $SCAN_PID)"
else
  echo "⏸️  Scan is NOT running"
fi
echo ""

# Show latest progress from log
if [ -f ".beast-mode/scan-progress.log" ]; then
  echo "📊 Latest Progress:"
  tail -5 .beast-mode/scan-progress.log | grep -E "(Progress|Scanned|Opted|Rate Limit)" | tail -3
  echo ""
fi

# Run monitor for detailed status
echo "📈 Detailed Status:"
node scripts/monitor-scan-progress.js 2>&1 | head -40

