#!/bin/bash
# Start MLflow server in background

echo "🚀 Starting MLflow server..."

# Check if MLflow is installed
if ! command -v mlflow &> /dev/null; then
    echo "⚠️  MLflow not installed. Installing..."
    pip install mlflow
fi

# Start MLflow UI in background
nohup mlflow ui --port 5000 --host 0.0.0.0 > mlflow.log 2>&1 &

# Get process ID
MLFLOW_PID=$!
echo $MLFLOW_PID > mlflow.pid

echo "✅ MLflow server started (PID: $MLFLOW_PID)"
echo "📊 Access at: http://localhost:5000"
echo "📝 Logs: mlflow.log"
echo "🛑 Stop with: kill \$(cat mlflow.pid)"

