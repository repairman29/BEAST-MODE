#!/bin/bash

# Quick Start Script for Parallel Roadmap Execution
# Safe defaults to prevent server overload

echo "🚀 BEAST MODE Parallel Roadmap Executor"
echo "========================================"
echo ""

# Set safe defaults
export MAX_CONCURRENCY=${MAX_CONCURRENCY:-2}
export RATE_LIMIT=${RATE_LIMIT:-5}
export TASK_TIMEOUT=${TASK_TIMEOUT:-30000}
export BEAST_MODE_API=${BEAST_MODE_API:-http://localhost:3000}
export CUSTOM_MODEL=${CUSTOM_MODEL:-custom:default}

echo "Configuration:"
echo "  Max Concurrency: $MAX_CONCURRENCY"
echo "  Rate Limit: $RATE_LIMIT req/s"
echo "  Task Timeout: ${TASK_TIMEOUT}ms"
echo "  API: $BEAST_MODE_API"
echo "  Model: $CUSTOM_MODEL"
echo ""

# Check if batch mode requested
if [ "$1" = "batch" ]; then
  echo "📦 Starting Batch Execution (Safest Mode)"
  echo ""
  node scripts/roadmap-batch-executor.js all
else
  echo "⚡ Starting Parallel Execution"
  echo ""
  node scripts/parallel-roadmap-executor.js "$@"
fi
