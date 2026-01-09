#!/usr/bin/env python3
"""
Auto-Log Training Results
Automatically logs training results to database after model training
"""

import json
import sys
import os
from pathlib import Path
from datetime import datetime
import subprocess

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

def load_latest_metadata():
    """Load latest model metadata"""
    models_dir = Path(__file__).parent.parent / '.beast-mode' / 'models'
    
    if not models_dir.exists():
        return None
    
    # Find latest model directory
    model_dirs = sorted([d for d in models_dir.iterdir() if d.is_dir() and d.name.startswith('model-')], 
                       reverse=True)
    
    if not model_dirs:
        return None
    
    latest_dir = model_dirs[0]
    metadata_file = latest_dir / 'model-metadata.json'
    
    if not metadata_file.exists():
        return None
    
    with open(metadata_file, 'r') as f:
        return json.load(f)

def log_to_database(metadata):
    """Log training results to database via Node.js script"""
    metrics = metadata.get('metrics', {})
    training_data = metadata.get('training_data', {})
    
    # Build command
    script_path = Path(__file__).parent / 'log-training-results.js'
    
    args = [
        'node',
        str(script_path),
        metadata.get('model_type', 'xgboost'),
        str(metrics.get('r2_train', 0)),
        str(metrics.get('r2_test', 0)),
        str(metrics.get('r2_cv', 0)),
        str(metrics.get('mae', 0)),
        str(metrics.get('rmse', 0)),
        str(training_data.get('size', 0)),
        str(training_data.get('feature_count', 0))
    ]
    
    try:
        result = subprocess.run(args, capture_output=True, text=True, check=True)
        print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error logging to database: {e.stderr}")
        return False

if __name__ == '__main__':
    print("📊 Auto-Logging Training Results\n")
    
    metadata = load_latest_metadata()
    
    if not metadata:
        print("⚠️  No model metadata found")
        sys.exit(1)
    
    print(f"✅ Found model metadata: {metadata.get('version', 'unknown')}")
    print(f"   Training date: {metadata.get('training_date', 'unknown')}")
    print()
    
    success = log_to_database(metadata)
    
    if success:
        print("✅ Training results logged to database!")
    else:
        print("❌ Failed to log training results")
        sys.exit(1)
