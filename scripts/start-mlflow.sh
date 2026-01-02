#!/bin/bash
# MLflow Setup Script

echo "🔧 Setting up MLflow..."

# Install MLflow
pip install mlflow

# Start MLflow UI
echo "🚀 Starting MLflow UI on http://localhost:5000"
mlflow ui --port 5000 --host 0.0.0.0
