#!/bin/bash
# Stop MLflow UI

PID_FILE="./mlflow.pid"

if [ ! -f "$PID_FILE" ]; then
  echo "⚠️  MLflow PID file not found - may not be running"
  exit 0
fi

PID=$(cat "$PID_FILE")

if ps -p "$PID" > /dev/null 2>&1; then
  echo "🛑 Stopping MLflow (PID: $PID)..."
  kill "$PID"
  sleep 1
  
  if ps -p "$PID" > /dev/null 2>&1; then
    echo "⚠️  Process still running, force killing..."
    kill -9 "$PID"
  fi
  
  rm "$PID_FILE"
  echo "✅ MLflow stopped"
else
  echo "⚠️  Process not running (PID: $PID)"
  rm "$PID_FILE"
fi

