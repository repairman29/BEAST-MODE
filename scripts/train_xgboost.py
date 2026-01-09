#!/usr/bin/env python3
"""
Train XGBoost Model for Repository Quality Prediction

XGBoost often outperforms Random Forest for regression tasks.
This script trains an XGBoost model using the same dataset.
"""

import json
import os
import sys
from pathlib import Path
from datetime import datetime
import numpy as np
import xgboost as xgb
from sklearn.model_selection import train_test_split, cross_val_score, KFold
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

def load_training_data(use_real_only=False):
    """Load training data from exported JSON file or local files"""
    # Try real-only file first if requested
    if use_real_only:
        real_only_file = Path(__file__).parent.parent / '.beast-mode' / 'training-data' / 'all-repos-real-only.json'
        if real_only_file.exists():
            print("📥 Loading REAL FEEDBACK ONLY (no synthetic data)...")
            with open(real_only_file, 'r') as f:
                data = json.load(f)
                repos = data.get('repositories', [])
                print(f"✅ Loaded {len(repos)} repositories with REAL feedback only")
                return repos
    
    # Try exported file (from Storage)
    exported_file = Path(__file__).parent.parent / '.beast-mode' / 'training-data' / 'all-repos-for-python.json'
    
    if exported_file.exists():
        print("📥 Loading from exported file (Storage)...")
        with open(exported_file, 'r') as f:
            data = json.load(f)
            repos = data.get('repositories', [])
            print(f"✅ Loaded {len(repos)} repositories from exported file")
            return repos
    
    # Fallback to local files
    scanned_dir = Path(__file__).parent.parent / '.beast-mode' / 'training-data' / 'scanned-repos'
    
    if not scanned_dir.exists():
        raise FileNotFoundError(f"Scanned repos directory not found: {scanned_dir}")
    
    all_repos = []
    seen_repos = set()
    files_loaded = 0
    
    # Load all scanned repo files (including all variations)
    for file_path in sorted(scanned_dir.glob('scanned-repos-*.json'), reverse=True):
        try:
            with open(file_path, 'r') as f:
                data = json.load(f)
                repos = data.get('trainingData', [])
                
                if repos:
                    files_loaded += 1
                    for repo in repos:
                        repo_key = repo.get('repo') or repo.get('url') or str(repo.get('features', {}))
                        if repo_key not in seen_repos:
                            seen_repos.add(repo_key)
                            all_repos.append(repo)
        except Exception as e:
            print(f"⚠️  Error loading {file_path.name}: {e}")
            continue
    
    print(f"✅ Loaded {len(all_repos)} unique repositories from {files_loaded} file(s)")
    return all_repos

def normalize_features(repo):
    """Normalize feature structure"""
    features = repo.get('features', {})
    if 'metadata' in features:
        normalized = {**features['metadata'], **features}
        del normalized['metadata']
        return normalized
    return features

def calculate_hybrid_quality(repo):
    """Calculate hybrid quality score (simplified)"""
    f = repo.get('features', {})
    stars = f.get('stars', 0)
    
    # Base quality from stars (log scale)
    quality = min(1.0, np.log10(stars + 1) / 6)
    
    # Small bonuses for quality indicators
    quality += f.get('hasTests', 0) * 0.05
    quality += f.get('hasCI', 0) * 0.05
    quality += f.get('hasReadme', 0) * 0.03
    quality += f.get('hasLicense', 0) * 0.03
    quality += f.get('isActive', 0) * 0.04
    
    return max(0.0, min(1.0, quality))

def prepare_training_data(repos):
    """Prepare training data with features and labels"""
    print("\n📊 Preparing quality labels...\n")
    
    training_data = []
    for repo in repos:
        normalized_features = normalize_features(repo)
        normalized_repo = {**repo, 'features': normalized_features}
        
        # Use quality_score if available (from feedback), otherwise calculate
        if 'quality_score' in repo and repo['quality_score'] is not None:
            quality = float(repo['quality_score'])
        else:
            quality = calculate_hybrid_quality(normalized_repo)
        
        if not np.isnan(quality) and quality >= 0:
            training_data.append({
                'features': normalized_features,
                'quality': quality,
                'repo': repo.get('name') or repo.get('repo') or repo.get('url')
            })
    
    # Quality distribution
    qualities = [d['quality'] for d in training_data]
    print('📊 Quality Label Distribution:')
    print(f"   Min: {min(qualities):.3f}")
    print(f"   Max: {max(qualities):.3f}")
    print(f"   Mean: {np.mean(qualities):.3f}")
    print(f"   Std Dev: {np.std(qualities):.3f}")
    print(f"   Variance: {np.var(qualities):.3f}\n")
    
    # Extract features
    feature_names = set()
    for ex in training_data:
        for key, value in ex['features'].items():
            if isinstance(value, (int, float)) and not np.isnan(value):
                feature_names.add(key)
    
    feature_array = sorted(list(feature_names))
    X = np.array([[ex['features'].get(name, 0) for name in feature_array] for ex in training_data])
    y = np.array([ex['quality'] for ex in training_data])
    
    return X, y, feature_array, training_data

def train_xgboost_model(X, y, feature_names):
    """Train XGBoost model"""
    print('🚀 Training XGBoost Model...\n')
    print(f"   Training samples: {len(X)}")
    print(f"   Features: {len(feature_names)}")
    print(f"   Target range: [{y.min():.3f}, {y.max():.3f}]\n")
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, shuffle=True
    )
    
    # XGBoost parameters
    params = {
        'objective': 'reg:squarederror',
        'max_depth': 4,  # Reduced from 6 to reduce overfitting
        'learning_rate': 0.1,
        'n_estimators': 100,
        'subsample': 0.8,
        'colsample_bytree': 0.8,
        'min_child_weight': 1,
        'gamma': 0,
        'reg_alpha': 0.1,  # Added L1 regularization
        'reg_lambda': 1.5,  # Increased L2 regularization
        'random_state': 42,
        'eval_metric': 'rmse'
    }
    
    print('📊 XGBoost Parameters:')
    for key, value in params.items():
        print(f"   {key}: {value}")
    print()
    
    # Create DMatrix
    dtrain = xgb.DMatrix(X_train, label=y_train)
    dtest = xgb.DMatrix(X_test, label=y_test)
    
    # Train model
    print('🔄 Training...\n')
    model = xgb.train(
        params,
        dtrain,
        num_boost_round=params['n_estimators'],
        evals=[(dtrain, 'train'), (dtest, 'test')],
        early_stopping_rounds=10,
        verbose_eval=False  # Reduce output for cleaner logs
    )
    
    # Evaluate
    y_pred_train = model.predict(dtrain)
    y_pred_test = model.predict(dtest)
    
    r2_train = r2_score(y_train, y_pred_train)
    r2_test = r2_score(y_test, y_pred_test)
    mae_test = mean_absolute_error(y_test, y_pred_test)
    rmse_test = np.sqrt(mean_squared_error(y_test, y_pred_test))
    
    # Cross-validation for overfitting check
    print('\n🔄 Running 5-fold cross-validation...')
    kfold = KFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = []
    for train_idx, val_idx in kfold.split(X):
        X_cv_train, X_cv_val = X[train_idx], X[val_idx]
        y_cv_train, y_cv_val = y[train_idx], y[val_idx]
        
        dtrain_cv = xgb.DMatrix(X_cv_train, label=y_cv_train)
        dval_cv = xgb.DMatrix(X_cv_val, label=y_cv_val)
        
        model_cv = xgb.train(
            params,
            dtrain_cv,
            num_boost_round=params['n_estimators'],
            early_stopping_rounds=10,
            evals=[(dval_cv, 'val')],
            verbose_eval=False
        )
        
        y_pred_cv = model_cv.predict(dval_cv)
        r2_cv = r2_score(y_cv_val, y_pred_cv)
        cv_scores.append(r2_cv)
    
    cv_mean = np.mean(cv_scores)
    cv_std = np.std(cv_scores)
    print(f"   CV R²: {cv_mean:.3f} (+/- {cv_std:.3f})")
    
    # Feature importance
    importance = model.get_score(importance_type='gain')
    feature_importance = [(name, importance.get(f'f{i}', 0)) for i, name in enumerate(feature_names)]
    feature_importance.sort(key=lambda x: x[1], reverse=True)
    
    return {
        'model': model,
        'metrics': {
            'r2_train': r2_train,
            'r2_test': r2_test,
            'r2': r2_test,  # Use test R² as primary metric
            'r2_cv_mean': cv_mean,
            'r2_cv_std': cv_std,
            'mae': mae_test,
            'rmse': rmse_test
        },
        'feature_names': feature_names,
        'feature_importance': feature_importance
    }

def save_model(trained_model, output_dir):
    """Save XGBoost model and metadata"""
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Save model
    model_path = output_dir / 'model.json'
    trained_model['model'].save_model(str(model_path))
    
    # Save metadata
    metadata = {
        'algorithm': 'xgboost',
        'metrics': trained_model['metrics'],
        'feature_names': trained_model['feature_names'],
        'feature_importance': trained_model['feature_importance'][:20],  # Top 20
        'trainedAt': datetime.now().isoformat(),
    }
    
    metadata_path = output_dir / 'model-metadata.json'
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    
    return model_path, metadata_path

def main():
    print('🚀 Retraining ML Model with XGBoost\n')
    print('=' * 60)
    
    try:
        # Load data
        repos = load_training_data()
        X, y, feature_names, training_data = prepare_training_data(repos)
        
        # Train model
        trained_model = train_xgboost_model(X, y, feature_names)
        
        # Display results
        print('📊 Model Performance:\n')
        metrics = trained_model['metrics']
        r2_icon = '✅' if metrics['r2'] > 0.5 else '⚠️' if metrics['r2'] > 0.1 else '❌'
        mae_icon = '✅' if metrics['mae'] < 0.2 else '⚠️' if metrics['mae'] < 0.3 else '❌'
        rmse_icon = '✅' if metrics['rmse'] < 0.25 else '⚠️' if metrics['rmse'] < 0.35 else '❌'
        
        print(f"   R² (train): {metrics['r2_train']:.3f}")
        print(f"   R² (test):  {metrics['r2']:.3f} {r2_icon}")
        if 'r2_cv_mean' in metrics:
            cv_icon = '✅' if metrics['r2_cv_mean'] > 0.5 else '⚠️' if metrics['r2_cv_mean'] > 0.1 else '❌'
            print(f"   R² (CV):    {metrics['r2_cv_mean']:.3f} (+/- {metrics['r2_cv_std']:.3f}) {cv_icon}")
        print(f"   MAE:        {metrics['mae']:.3f} {mae_icon}")
        print(f"   RMSE:       {metrics['rmse']:.3f} {rmse_icon}\n")
        
        # Feature importance
        print('🔍 Top 10 Features by Importance:\n')
        for i, (name, importance) in enumerate(trained_model['feature_importance'][:10], 1):
            print(f"   {i:2}. {name:25} {importance:.2f}")
        print()
        
        # Save model
        models_dir = Path(__file__).parent.parent / '.beast-mode' / 'models'
        timestamp = datetime.now().strftime('%Y-%m-%dT%H-%M-%S')
        model_dir = models_dir / f'model-xgboost-{timestamp}'
        
        model_path, metadata_path = save_model(trained_model, model_dir)
        
        print(f"💾 Model saved to: {model_path}")
        print(f"💾 Metadata saved to: {metadata_path}\n")
        
        # Performance summary
        print('=' * 60)
        if metrics['r2'] > 0.5:
            print('✅ Excellent! Model shows strong predictive power (R² > 0.5)')
        elif metrics['r2'] > 0.1:
            print('✅ Good! Model is learning (R² > 0.1)')
        else:
            print('⚠️  Model R² is still low. Consider:')
            print('   - More training data')
            print('   - Hyperparameter tuning')
            print('   - Feature engineering')
            print('   - Different quality labels')
        
        print('=' * 60)
        print('✅ Retraining complete!\n')
        
        # Auto-log results to database
        try:
            import subprocess
            log_script = Path(__file__).parent / 'auto-log-training-results.py'
            if log_script.exists():
                print('📊 Logging training results to database...')
                subprocess.run(['python3', str(log_script)], check=False)
                print()
        except Exception as e:
            print(f'⚠️  Could not log results to database: {e}')
            print()
        
    except Exception as error:
        print(f'❌ Error: {error}')
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    main()

