#!/bin/bash
# Start MLflow UI in Background
# Runs MLflow server in background and logs to file

MLFLOW_PORT=${MLFLOW_PORT:-5000}
MLFLOW_HOST=${MLFLOW_HOST:-0.0.0.0}
LOG_FILE="./logs/mlflow.log"
PID_FILE="./mlflow.pid"

# Create logs directory if it doesn't exist
mkdir -p logs

# Check if MLflow is already running
if [ -f "$PID_FILE" ]; then
  OLD_PID=$(cat "$PID_FILE")
  if ps -p "$OLD_PID" > /dev/null 2>&1; then
    echo "✅ MLflow already running (PID: $OLD_PID)"
    echo "   Access at: http://localhost:$MLFLOW_PORT"
    exit 0
  else
    rm "$PID_FILE"
  fi
fi

# Check if port is in use
if lsof -Pi :$MLFLOW_PORT -sTCP:LISTEN -t >/dev/null 2>&1 ; then
  echo "⚠️  Port $MLFLOW_PORT is already in use"
  echo "   Stop existing process or use different port: MLFLOW_PORT=5001 ./scripts/start-mlflow-background.sh"
  exit 1
fi

# Start MLflow UI in background
echo "🚀 Starting MLflow UI on http://$MLFLOW_HOST:$MLFLOW_PORT"
echo "   Logs: $LOG_FILE"
echo "   PID file: $PID_FILE"

nohup mlflow ui --port $MLFLOW_PORT --host $MLFLOW_HOST > "$LOG_FILE" 2>&1 &
MLFLOW_PID=$!

# Save PID
echo $MLFLOW_PID > "$PID_FILE"

# Wait a moment to check if it started
sleep 2

if ps -p "$MLFLOW_PID" > /dev/null 2>&1; then
  echo "✅ MLflow started successfully (PID: $MLFLOW_PID)"
  echo "   Access at: http://localhost:$MLFLOW_PORT"
  echo "   View logs: tail -f $LOG_FILE"
  echo "   Stop: kill $MLFLOW_PID or ./scripts/stop-mlflow.sh"
else
  echo "❌ MLflow failed to start"
  echo "   Check logs: cat $LOG_FILE"
  rm "$PID_FILE"
  exit 1
fi
