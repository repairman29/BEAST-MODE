#!/usr/bin/env python3
"""
XGBoost Prediction Script
Called by Node.js to make predictions
"""

import json
import sys
import xgboost as xgb
import numpy as np
from pathlib import Path

def load_model_and_metadata(model_dir):
    """Load XGBoost model and metadata"""
    model_dir = Path(model_dir)
    model_path = model_dir / 'model.json'
    metadata_path = model_dir / 'model-metadata.json'
    
    if not model_path.exists():
        raise FileNotFoundError(f"Model file not found: {model_path}")
    
    # Load model
    model = xgb.Booster()
    model.load_model(str(model_path))
    
    # Load metadata
    metadata = {}
    if metadata_path.exists():
        with open(metadata_path, 'r') as f:
            metadata = json.load(f)
    
    return model, metadata

def normalize_features(features, metadata):
    """Normalize features using stored normalization params"""
    # For now, we'll use the feature names from metadata
    # In production, you'd want to store normalization params
    feature_names = metadata.get('feature_names', [])
    
    # Extract features in the correct order
    feature_vector = [features.get(name, 0) for name in feature_names]
    
    return np.array([feature_vector])

def predict(features_json, model_dir):
    """Make prediction"""
    try:
        # Parse features
        features = json.loads(features_json)
        
        # Load model
        model, metadata = load_model_and_metadata(model_dir)
        
        # Prepare features
        X = normalize_features(features, metadata)
        
        # Make prediction
        dmatrix = xgb.DMatrix(X)
        prediction = model.predict(dmatrix)[0]
        
        # Ensure prediction is in [0, 1] range
        prediction = max(0.0, min(1.0, prediction))
        
        return prediction
    except Exception as e:
        raise Exception(f"Prediction error: {str(e)}")

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print(json.dumps({'error': 'Usage: python3 predict_xgboost.py <model-dir> <features-json>'}))
        sys.exit(1)
    
    model_dir = sys.argv[1]
    features_json = sys.argv[2]
    
    try:
        quality = predict(features_json, model_dir)
        print(json.dumps({'predictedQuality': quality}))
    except Exception as e:
        print(json.dumps({'error': str(e)}))
        sys.exit(1)

