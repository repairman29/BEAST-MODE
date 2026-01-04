#!/bin/bash
# Start MLflow server for ML training

echo "🚀 Starting MLflow server..."

# Check if MLflow is installed
if ! python3 -c "import mlflow" 2>/dev/null; then
    echo "❌ MLflow not installed. Installing..."
    pip3 install mlflow
fi

# Check if already running
if curl -s http://localhost:5000/health > /dev/null 2>&1; then
    echo "✅ MLflow server already running on http://localhost:5000"
    exit 0
fi

# Start MLflow server
cd "$(dirname "$0")/.."
python3 -m mlflow ui --port 5000 --host 0.0.0.0 &

# Save PID
echo $! > mlflow.pid

# Wait a moment
sleep 2

# Check if it started
if curl -s http://localhost:5000/health > /dev/null 2>&1; then
    echo "✅ MLflow server started!"
    echo "   URL: http://localhost:5000"
    echo "   PID: $(cat mlflow.pid)"
else
    echo "⚠️  MLflow server may still be starting..."
    echo "   Check: http://localhost:5000"
fi
