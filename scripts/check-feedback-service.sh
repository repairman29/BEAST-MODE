#!/bin/bash
# Check if feedback service is running

echo "🔍 Checking Feedback Service Status..."
echo ""

# Check if process is running
if pgrep -f "start-feedback-service" > /dev/null; then
    echo "✅ Feedback service is RUNNING"
    echo ""
    echo "Process details:"
    ps aux | grep "start-feedback-service" | grep -v grep
    echo ""
    echo "To stop: pkill -f start-feedback-service"
else
    echo "❌ Feedback service is NOT running"
    echo ""
    echo "To start: cd BEAST-MODE-PRODUCT && npm run service:feedback"
fi

echo ""
echo "📊 Current Stats:"
cd "$(dirname "$0")/.." && npm run monitor:feedback 2>&1 | grep -A 8 "Statistics:" | head -8

