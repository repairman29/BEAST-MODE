#!/usr/bin/env python3
"""
Comprehensive Model Improvements
1. Feature Engineering
2. Hyperparameter Tuning
3. Try Different Models (XGBoost, Random Forest, Neural Network)
"""

import json
import os
import sys
from pathlib import Path
from datetime import datetime
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, cross_val_score, KFold
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
import xgboost as xgb

# Try to import neural network libraries (optional)
try:
    from sklearn.neural_network import MLPRegressor
    HAS_MLP = True
except ImportError:
    HAS_MLP = False

sys.path.insert(0, str(Path(__file__).parent.parent))

def load_training_data():
    """Load real-only training data"""
    real_only_file = Path(__file__).parent.parent / '.beast-mode' / 'training-data' / 'all-repos-real-only.json'
    
    if not real_only_file.exists():
        print("❌ Real-only data file not found. Run export-predictions-real-only.js first.")
        sys.exit(1)
    
    print("📥 Loading REAL FEEDBACK ONLY data...")
    with open(real_only_file, 'r') as f:
        data = json.load(f)
        repos = data.get('repositories', [])
        print(f"✅ Loaded {len(repos)} repositories with REAL feedback only\n")
        return repos

def engineer_features(df):
    """Advanced feature engineering"""
    print("🔧 Engineering features...")
    
    # Convert boolean/object columns to numeric
    bool_cols = ['hasCI', 'hasTests', 'hasReadme', 'hasLicense', 'hasDescription', 
                 'isActive', 'hasReleases', 'hasDocumentation', 'hasExamples', 
                 'hasChangelog', 'hasSecurityPolicy', 'hasContributing']
    
    for col in bool_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0).astype(int)
    
    # Ensure numeric columns
    numeric_cols = ['stars', 'forks', 'fileCount', 'openIssues', 'repoAgeDays', 
                    'daysSincePush', 'codeFileCount', 'totalLines', 'codeLines',
                    'readmeLength', 'testCoverage', 'watchers', 'totalIssues',
                    'commentLines', 'blankLines', 'commitCount', 'contributorCount',
                    'repoSizeKB', 'avgFileSize']
    
    for col in numeric_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
    
    # Log transformations for skewed features
    for col in ['stars', 'forks', 'fileCount', 'openIssues', 'repoAgeDays']:
        if col in df.columns:
            df[f'{col}_log'] = np.log1p(df[col])
    
    # Ratio features
    if 'stars' in df.columns and 'forks' in df.columns:
        df['stars_per_fork'] = df.apply(
            lambda row: row['stars'] / (row['forks'] + 1) if row['forks'] > 0 else row['stars'],
            axis=1
        )
    
    if 'stars' in df.columns and 'openIssues' in df.columns:
        df['engagement_rate'] = df.apply(
            lambda row: row['stars'] / (row['openIssues'] + 1) if row['openIssues'] > 0 else row['stars'],
            axis=1
        )
    
    # Interaction features
    if 'hasTests' in df.columns and 'hasCI' in df.columns:
        df['tests_and_ci'] = df['hasTests'] * df['hasCI']
    
    if 'hasReadme' in df.columns and 'hasDescription' in df.columns and 'hasLicense' in df.columns:
        df['docs_complete'] = df['hasReadme'] * df['hasDescription'] * df['hasLicense']
    
    # Activity features
    if 'daysSincePush' in df.columns:
        df['is_recently_active'] = (df['daysSincePush'] <= 30).astype(int)
        df['is_very_active'] = (df['daysSincePush'] <= 7).astype(int)
    
    print(f"   Features after engineering: {len(df.columns)}\n")
    return df

def prepare_data(repos):
    """Prepare training data with feature engineering"""
    # Convert to DataFrame
    df = pd.DataFrame(repos)
    
    # Extract features
    features_list = []
    for repo in repos:
        features = repo.get('features', {})
        features['quality_score'] = repo.get('quality_score', 0)
        features_list.append(features)
    
    df_features = pd.DataFrame(features_list)
    
    # Engineer features
    df_features = engineer_features(df_features)
    
    # Separate features and target
    feature_cols = [c for c in df_features.columns if c != 'quality_score']
    
    # Convert all features to numeric, handling any remaining object types
    for col in feature_cols:
        if df_features[col].dtype == 'object':
            # Try to convert to numeric
            df_features[col] = pd.to_numeric(df_features[col], errors='coerce').fillna(0)
        df_features[col] = pd.to_numeric(df_features[col], errors='coerce').fillna(0)
    
    X = df_features[feature_cols].fillna(0)
    y = df_features['quality_score'].fillna(0)
    
    # Ensure X is all numeric
    X = X.select_dtypes(include=[np.number])
    
    # Remove constant features
    constant_cols = [col for col in X.columns if X[col].nunique() <= 1]
    if constant_cols:
        print(f"   Removing {len(constant_cols)} constant features")
        X = X.drop(columns=constant_cols)
        feature_cols = [c for c in feature_cols if c not in constant_cols]
    
    return X, y, feature_cols

def train_xgboost_tuned(X_train, y_train, X_test, y_test):
    """Train XGBoost with tuned hyperparameters"""
    print("🚀 Training XGBoost (Tuned Hyperparameters)\n")
    
    # Tuned hyperparameters (more regularization)
    params = {
        'objective': 'reg:squarederror',
        'max_depth': 3,  # Reduced from 4
        'learning_rate': 0.05,  # Reduced from 0.1
        'n_estimators': 200,  # Increased from 100
        'subsample': 0.8,
        'colsample_bytree': 0.8,
        'min_child_weight': 3,  # Increased from 1
        'gamma': 0.1,  # Added
        'reg_alpha': 0.2,  # Increased from 0.1
        'reg_lambda': 2.0,  # Increased from 1.5
        'random_state': 42,
        'eval_metric': 'rmse'
    }
    
    dtrain = xgb.DMatrix(X_train, label=y_train)
    dtest = xgb.DMatrix(X_test, label=y_test)
    
    model = xgb.train(
        params,
        dtrain,
        num_boost_round=params['n_estimators'],
        evals=[(dtrain, 'train'), (dtest, 'test')],
        early_stopping_rounds=20,
        verbose_eval=False
    )
    
    y_pred_train = model.predict(dtrain)
    y_pred_test = model.predict(dtest)
    
    r2_train = r2_score(y_train, y_pred_train)
    r2_test = r2_score(y_test, y_pred_test)
    mae = mean_absolute_error(y_test, y_pred_test)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred_test))
    
    # Cross-validation
    kfold = KFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = []
    for train_idx, val_idx in kfold.split(X_train):
        X_cv_train, X_cv_val = X_train.iloc[train_idx], X_train.iloc[val_idx]
        y_cv_train, y_cv_val = y_train.iloc[train_idx], y_train.iloc[val_idx]
        
        dtrain_cv = xgb.DMatrix(X_cv_train, label=y_cv_train)
        dval_cv = xgb.DMatrix(X_cv_val, label=y_cv_val)
        
        model_cv = xgb.train(params, dtrain_cv, num_boost_round=params['n_estimators'],
                            early_stopping_rounds=20, evals=[(dval_cv, 'val')], verbose_eval=False)
        
        y_pred_cv = model_cv.predict(dval_cv)
        cv_scores.append(r2_score(y_cv_val, y_pred_cv))
    
    cv_mean = np.mean(cv_scores)
    cv_std = np.std(cv_scores)
    
    return {
        'model': model,
        'r2_train': r2_train,
        'r2_test': r2_test,
        'r2_cv': cv_mean,
        'r2_cv_std': cv_std,
        'mae': mae,
        'rmse': rmse,
        'name': 'XGBoost (Tuned)'
    }

def train_random_forest(X_train, y_train, X_test, y_test):
    """Train Random Forest"""
    print("🚀 Training Random Forest\n")
    
    model = RandomForestRegressor(
        n_estimators=200,
        max_depth=10,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1
    )
    
    model.fit(X_train, y_train)
    
    y_pred_train = model.predict(X_train)
    y_pred_test = model.predict(X_test)
    
    r2_train = r2_score(y_train, y_pred_train)
    r2_test = r2_score(y_test, y_pred_test)
    mae = mean_absolute_error(y_test, y_pred_test)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred_test))
    
    # Cross-validation
    cv_scores = cross_val_score(model, X_train, y_train, cv=5, scoring='r2')
    cv_mean = np.mean(cv_scores)
    cv_std = np.std(cv_scores)
    
    return {
        'model': model,
        'r2_train': r2_train,
        'r2_test': r2_test,
        'r2_cv': cv_mean,
        'r2_cv_std': cv_std,
        'mae': mae,
        'rmse': rmse,
        'name': 'Random Forest'
    }

def train_neural_network(X_train, y_train, X_test, y_test):
    """Train Neural Network (if available)"""
    if not HAS_MLP:
        return None
    
    print("🚀 Training Neural Network\n")
    
    # Scale features (handle any inf/nan values)
    X_train_clean = X_train.replace([np.inf, -np.inf], 0).fillna(0)
    X_test_clean = X_test.replace([np.inf, -np.inf], 0).fillna(0)
    
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train_clean)
    X_test_scaled = scaler.transform(X_test_clean)
    
    # Replace any remaining inf/nan
    X_train_scaled = np.nan_to_num(X_train_scaled, nan=0.0, posinf=0.0, neginf=0.0)
    X_test_scaled = np.nan_to_num(X_test_scaled, nan=0.0, posinf=0.0, neginf=0.0)
    
    model = MLPRegressor(
        hidden_layer_sizes=(50, 25),  # Smaller network
        activation='relu',
        solver='adam',
        alpha=0.1,  # Increased L2 regularization
        learning_rate='adaptive',
        max_iter=200,  # Reduced iterations
        random_state=42,
        early_stopping=True,
        validation_fraction=0.2,
        tol=1e-4
    )
    
    model.fit(X_train_scaled, y_train)
    
    y_pred_train = model.predict(X_train_scaled)
    y_pred_test = model.predict(X_test_scaled)
    
    r2_train = r2_score(y_train, y_pred_train)
    r2_test = r2_score(y_test, y_pred_test)
    mae = mean_absolute_error(y_test, y_pred_test)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred_test))
    
    # Cross-validation
    cv_scores = cross_val_score(model, X_train_scaled, y_train, cv=5, scoring='r2')
    cv_mean = np.mean(cv_scores)
    cv_std = np.std(cv_scores)
    
    return {
        'model': model,
        'scaler': scaler,
        'r2_train': r2_train,
        'r2_test': r2_test,
        'r2_cv': cv_mean,
        'r2_cv_std': cv_std,
        'mae': mae,
        'rmse': rmse,
        'name': 'Neural Network'
    }

def main():
    print("🚀 Comprehensive Model Improvements\n")
    print("=" * 70)
    print()
    
    # Load data
    repos = load_training_data()
    
    if len(repos) < 50:
        print(f"⚠️  Warning: Only {len(repos)} examples. Need at least 50 for reliable training.")
    
    # Prepare data
    X, y, feature_names = prepare_data(repos)
    
    print(f"📊 Dataset: {len(X)} examples, {len(feature_names)} features\n")
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    
    print(f"   Train: {len(X_train)} examples")
    print(f"   Test: {len(X_test)} examples\n")
    print("=" * 70)
    print()
    
    # Train all models
    results = []
    
    # 1. XGBoost (Tuned)
    try:
        result = train_xgboost_tuned(X_train, y_train, X_test, y_test)
        results.append(result)
    except Exception as e:
        print(f"❌ XGBoost failed: {e}\n")
    
    # 2. Random Forest
    try:
        result = train_random_forest(X_train, y_train, X_test, y_test)
        results.append(result)
    except Exception as e:
        print(f"❌ Random Forest failed: {e}\n")
    
    # 3. Neural Network
    if HAS_MLP:
        try:
            result = train_neural_network(X_train, y_train, X_test, y_test)
            if result:
                results.append(result)
        except Exception as e:
            print(f"❌ Neural Network failed: {e}\n")
    else:
        print("⚠️  Neural Network not available (sklearn.neural_network not found)\n")
    
    # Compare results
    print("=" * 70)
    print("📊 MODEL COMPARISON")
    print("=" * 70)
    print()
    
    for result in results:
        print(f"📈 {result['name']}:")
        print(f"   R² (train): {result['r2_train']:.3f}")
        print(f"   R² (test):  {result['r2_test']:.3f} {'✅' if result['r2_test'] > 0 else '❌'}")
        print(f"   R² (CV):    {result['r2_cv']:.3f} (+/- {result['r2_cv_std']:.3f}) {'✅' if result['r2_cv'] > 0 else '❌'}")
        print(f"   MAE:        {result['mae']:.3f} ✅")
        print(f"   RMSE:       {result['rmse']:.3f} ✅")
        print()
    
    # Find best model
    best_model = max(results, key=lambda x: x['r2_cv'])
    
    print("=" * 70)
    print(f"🏆 Best Model: {best_model['name']}")
    print(f"   R² (CV): {best_model['r2_cv']:.3f}")
    print("=" * 70)
    print()
    
    if best_model['r2_cv'] > 0:
        print("✅ Model shows positive predictive power!")
    else:
        print("⚠️  Model still needs improvement:")
        print("   - More training data")
        print("   - Better feature engineering")
        print("   - Different quality labels")
    
    print()
    
    # Log best model results to database
    try:
        import subprocess
        from pathlib import Path
        
        log_script = Path(__file__).parent / 'log-training-results.js'
        if log_script.exists():
            print('📊 Logging best model results to database...')
            args = [
                'node',
                str(log_script),
                best_model['name'].lower().replace(' ', '-'),
                str(best_model['r2_train']),
                str(best_model['r2_test']),
                str(best_model['r2_cv']),
                str(best_model['mae']),
                str(best_model['rmse']),
                str(len(repos)),
                str(len(feature_names))
            ]
            result = subprocess.run(args, capture_output=True, text=True, check=False)
            if result.returncode == 0:
                print(result.stdout)
            else:
                print(f'⚠️  Could not log results: {result.stderr}')
            print()
    except Exception as e:
        print(f'⚠️  Could not log results: {e}')
        print()

if __name__ == '__main__':
    main()
