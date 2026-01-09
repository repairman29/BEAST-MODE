#!/usr/bin/env python3
"""
Improved XGBoost Training with Feature Engineering
Addresses issues found in data quality analysis
"""

import json
import os
import sys
from pathlib import Path
from datetime import datetime
import numpy as np
import xgboost as xgb
from sklearn.model_selection import train_test_split, KFold
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error
from sklearn.preprocessing import StandardScaler, RobustScaler
import pandas as pd

sys.path.insert(0, str(Path(__file__).parent.parent))

def load_training_data():
    """Load training data"""
    exported_file = Path(__file__).parent.parent / '.beast-mode' / 'training-data' / 'all-repos-for-python.json'
    
    if not exported_file.exists():
        raise FileNotFoundError(f"Training data not found: {exported_file}")
    
    with open(exported_file, 'r') as f:
        data = json.load(f)
        repos = data.get('repositories', [])
    
    return repos

def remove_constant_features(df):
    """Remove features with no variance"""
    constant_features = []
    for col in df.columns:
        if col in ['repo', 'quality_score', 'prediction_id', 'source', 'synthetic']:
            continue
        if df[col].nunique() <= 1:
            constant_features.append(col)
        elif df[col].dtype in [np.float64, np.int64] and df[col].std() < 1e-10:
            constant_features.append(col)
    
    if constant_features:
        print(f"🗑️  Removing {len(constant_features)} constant features: {constant_features[:5]}...")
        df = df.drop(columns=constant_features)
    
    return df

def engineer_features(df):
    """Create new features through engineering"""
    print("🔧 Engineering features...")
    
    original_count = len(df.columns)
    
    # 1. Log transformations for highly skewed features
    skewed_features = ['stars', 'forks', 'fileCount', 'codeFileCount', 'openIssues']
    for feat in skewed_features:
        if feat in df.columns:
            # Add 1 to avoid log(0)
            df[f'{feat}_log'] = np.log1p(df[feat])
    
    # 2. Ratio features
    if 'stars' in df.columns and 'forks' in df.columns:
        df['stars_forks_ratio'] = df['stars'] / (df['forks'] + 1)
    
    if 'stars' in df.columns and 'fileCount' in df.columns:
        df['stars_per_file'] = df['stars'] / (df['fileCount'] + 1)
    
    if 'codeFileCount' in df.columns and 'fileCount' in df.columns:
        df['code_ratio'] = df['codeFileCount'] / (df['fileCount'] + 1)
    
    # 3. Interaction features (top correlated features)
    if 'hasTests' in df.columns and 'hasCI' in df.columns:
        df['tests_and_ci'] = df['hasTests'] * df['hasCI']
    
    if 'hasReadme' in df.columns and 'hasLicense' in df.columns:
        df['docs_complete'] = df['hasReadme'] * df['hasLicense']
    
    # 4. Activity features
    if 'daysSincePush' in df.columns:
        df['is_recently_active'] = (df['daysSincePush'].fillna(999) <= 30).astype(int)
        df['is_very_active'] = (df['daysSincePush'].fillna(999) <= 7).astype(int)
    
    # 5. Engagement features
    if 'openIssues' in df.columns and 'stars' in df.columns:
        df['engagement_rate'] = df['openIssues'] / (df['stars'] + 1)
    
    # 6. Size categories (simplified to avoid categorical issues)
    if 'fileCount' in df.columns:
        df['size_category'] = 0
        df.loc[df['fileCount'] > 100, 'size_category'] = 1
        df.loc[df['fileCount'] > 1000, 'size_category'] = 2
        df.loc[df['fileCount'] > 10000, 'size_category'] = 3
        df['size_category'] = df['size_category'].fillna(0).astype(int)
    
    if 'stars' in df.columns:
        df['popularity_category'] = 0
        df.loc[df['stars'] > 100, 'popularity_category'] = 1
        df.loc[df['stars'] > 1000, 'popularity_category'] = 2
        df.loc[df['stars'] > 10000, 'popularity_category'] = 3
        df['popularity_category'] = df['popularity_category'].fillna(0).astype(int)
    
    new_count = len(df.columns)
    print(f"   Created {new_count - original_count} new features")
    
    return df

def prepare_training_data(repos):
    """Prepare training data with improved feature handling"""
    print("\n📊 Preparing training data...\n")
    
    # Convert to DataFrame
    rows = []
    for repo in repos:
        row = {
            'repo': repo.get('repo', 'unknown'),
            'quality_score': repo.get('quality_score', 0),
            'prediction_id': repo.get('prediction_id', ''),
            'source': repo.get('source', 'unknown'),
            'synthetic': repo.get('metadata', {}).get('synthetic', False)
        }
        
        features = repo.get('features', {})
        for key, value in features.items():
            row[key] = value
        
        rows.append(row)
    
    df = pd.DataFrame(rows)
    
    print(f"   Loaded {len(df)} samples")
    print(f"   Original features: {len([c for c in df.columns if c not in ['repo', 'quality_score', 'prediction_id', 'source', 'synthetic']])}")
    
    # Remove constant features
    df = remove_constant_features(df)
    
    # Engineer features
    df = engineer_features(df)
    
    # Separate features and target
    feature_cols = [c for c in df.columns if c not in ['repo', 'quality_score', 'prediction_id', 'source', 'synthetic']]
    
    # Handle missing values
    for col in feature_cols:
        if df[col].isnull().sum() > 0:
            if df[col].dtype in [np.float64, np.int64]:
                df[col] = df[col].fillna(df[col].median())
            else:
                df[col] = df[col].fillna(0)
    
    # Convert to numpy
    X = df[feature_cols].values.astype(np.float32)
    y = df['quality_score'].values.astype(np.float32)
    
    # Remove any infinite or NaN values
    mask = np.isfinite(X).all(axis=1) & np.isfinite(y)
    X = X[mask]
    y = y[mask]
    
    print(f"   Final features: {len(feature_cols)}")
    print(f"   Valid samples: {len(X)}")
    print(f"   Target range: [{y.min():.3f}, {y.max():.3f}]")
    print(f"   Target mean: {y.mean():.3f}, std: {y.std():.3f}")
    
    return X, y, feature_cols, df

def train_xgboost_model(X, y, feature_names, options={}):
    """Train XGBoost with improved hyperparameters"""
    print("\n🚀 Training Improved XGBoost Model...\n")
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, shuffle=True
    )
    
    print(f"   Training samples: {len(X_train)}")
    print(f"   Test samples: {len(X_test)}")
    print(f"   Features: {len(feature_names)}")
    print(f"   Target range: [{y.min():.3f}, {y.max():.3f}]\n")
    
    # Improved hyperparameters based on analysis
    params = {
        'objective': 'reg:squarederror',
        'max_depth': 3,  # Further reduced for generalization
        'learning_rate': 0.05,  # Lower learning rate for stability
        'n_estimators': 200,  # More trees with lower learning rate
        'subsample': 0.8,
        'colsample_bytree': 0.8,
        'min_child_weight': 3,  # Increased to prevent overfitting
        'gamma': 0.1,  # Added minimum loss reduction
        'reg_alpha': 0.2,  # Increased L1 regularization
        'reg_lambda': 2.0,  # Increased L2 regularization
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
        early_stopping_rounds=20,  # More patience
        verbose_eval=25  # Show progress every 25 rounds
    )
    
    # Evaluate
    y_pred_train = model.predict(dtrain)
    y_pred_test = model.predict(dtest)
    
    r2_train = r2_score(y_train, y_pred_train)
    r2_test = r2_score(y_test, y_pred_test)
    mae_test = mean_absolute_error(y_test, y_pred_test)
    rmse_test = np.sqrt(mean_squared_error(y_test, y_pred_test))
    
    # Cross-validation
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
            early_stopping_rounds=20,
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
            'r2': r2_test,
            'r2_cv_mean': cv_mean,
            'r2_cv_std': cv_std,
            'mae': mae_test,
            'rmse': rmse_test
        },
        'feature_names': feature_names,
        'feature_importance': feature_importance
    }

def save_model(trained_model, output_dir):
    """Save model and metadata"""
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    timestamp = datetime.now().strftime('%Y-%m-%dT%H-%M-%S')
    model_dir = output_dir / f'model-xgboost-improved-{timestamp}'
    model_dir.mkdir(parents=True, exist_ok=True)
    
    # Save model
    model_path = model_dir / 'model.json'
    trained_model['model'].save_model(str(model_path))
    
    # Save metadata
    metadata = {
        'model_type': 'xgboost',
        'version': 'improved-v1.0.0',
        'training_date': timestamp,
        'training_size': 500,
        'features': len(trained_model['feature_names']),
        'metrics': trained_model['metrics'],
        'top_features': trained_model['feature_importance'][:20],
        'hyperparameters': {
            'max_depth': 3,
            'learning_rate': 0.05,
            'n_estimators': 200,
            'reg_alpha': 0.2,
            'reg_lambda': 2.0
        }
    }
    
    metadata_path = model_dir / 'model-metadata.json'
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    
    return model_dir

def main():
    print("=" * 70)
    print("🚀 IMPROVED XGBOOST TRAINING")
    print("=" * 70)
    print()
    
    repos = load_training_data()
    X, y, feature_names, df = prepare_training_data(repos)
    
    result = train_xgboost_model(X, y, feature_names)
    
    print("\n" + "=" * 70)
    print("📊 Model Performance:")
    print("=" * 70)
    print()
    print(f"   R² (train): {result['metrics']['r2_train']:.3f}")
    print(f"   R² (test):  {result['metrics']['r2_test']:.3f} {'✅' if result['metrics']['r2_test'] > 0 else '❌'}")
    print(f"   R² (CV):    {result['metrics']['r2_cv_mean']:.3f} (+/- {result['metrics']['r2_cv_std']:.3f}) {'✅' if result['metrics']['r2_cv_mean'] > 0 else '❌'}")
    print(f"   MAE:        {result['metrics']['mae']:.4f} {'✅' if result['metrics']['mae'] < 0.1 else '⚠️'}")
    print(f"   RMSE:       {result['metrics']['rmse']:.4f} {'✅' if result['metrics']['rmse'] < 0.15 else '⚠️'}")
    print()
    
    print("🔍 Top 15 Features by Importance:")
    for i, (feature, importance) in enumerate(result['feature_importance'][:15], 1):
        print(f"   {i:2d}. {feature:40s}: {importance:.4f}")
    print()
    
    # Save model
    output_dir = Path(__file__).parent.parent / '.beast-mode' / 'models'
    model_dir = save_model(result, output_dir)
    
    print(f"💾 Model saved to: {model_dir}")
    print()
    
    if result['metrics']['r2_test'] > 0:
        print("✅ Model is learning! R² > 0 indicates better than baseline.")
    else:
        print("⚠️  Model still needs improvement. Consider:")
        print("   - More training data with real feedback")
        print("   - Further feature engineering")
        print("   - Different model architectures")
    
    print()

if __name__ == '__main__':
    main()
