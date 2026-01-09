#!/usr/bin/env python3
"""
Analyze Training Data Quality
Deep dive into the training data to understand why model performance is poor
"""

import json
import numpy as np
import pandas as pd
from pathlib import Path
from scipy import stats
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend
import matplotlib.pyplot as plt

def load_training_data():
    """Load training data"""
    data_file = Path(__file__).parent.parent / '.beast-mode' / 'training-data' / 'all-repos-for-python.json'
    
    if not data_file.exists():
        raise FileNotFoundError(f"Training data not found: {data_file}")
    
    with open(data_file, 'r') as f:
        data = json.load(f)
        repos = data.get('repositories', [])
    
    return repos

def analyze_data_quality(repos):
    """Comprehensive data quality analysis"""
    print("=" * 70)
    print("📊 TRAINING DATA QUALITY ANALYSIS")
    print("=" * 70)
    print()
    
    # Convert to DataFrame for easier analysis
    rows = []
    for repo in repos:
        row = {
            'repo': repo.get('repo', 'unknown'),
            'quality_score': repo.get('quality_score', 0),
            'prediction_id': repo.get('prediction_id', ''),
            'source': repo.get('source', 'unknown'),
            'synthetic': repo.get('metadata', {}).get('synthetic', False)
        }
        
        # Extract features
        features = repo.get('features', {})
        for key, value in features.items():
            row[key] = value
        
        rows.append(row)
    
    df = pd.DataFrame(rows)
    
    print(f"📈 Dataset Overview:")
    print(f"   Total samples: {len(df)}")
    print(f"   Features: {len([c for c in df.columns if c not in ['repo', 'quality_score', 'prediction_id', 'source', 'synthetic']])}")
    print(f"   Synthetic feedback: {df['synthetic'].sum()} ({df['synthetic'].sum() / len(df) * 100:.1f}%)")
    print()
    
    # Quality score distribution
    print("📊 Quality Score Distribution:")
    print(f"   Mean: {df['quality_score'].mean():.3f}")
    print(f"   Median: {df['quality_score'].median():.3f}")
    print(f"   Std: {df['quality_score'].std():.3f}")
    print(f"   Min: {df['quality_score'].min():.3f}")
    print(f"   Max: {df['quality_score'].max():.3f}")
    print(f"   Range: {df['quality_score'].max() - df['quality_score'].min():.3f}")
    print()
    
    # Check for issues
    issues = []
    
    # 1. Check variance
    if df['quality_score'].std() < 0.1:
        issues.append("⚠️  Low variance in quality scores - model has little to learn from")
    
    # 2. Check distribution
    if df['quality_score'].skew() > 2 or df['quality_score'].skew() < -2:
        issues.append("⚠️  Highly skewed distribution - may need transformation")
    
    # 3. Check for missing values
    feature_cols = [c for c in df.columns if c not in ['repo', 'quality_score', 'prediction_id', 'source', 'synthetic']]
    missing_counts = df[feature_cols].isnull().sum()
    if missing_counts.sum() > 0:
        issues.append(f"⚠️  Missing values in features: {missing_counts[missing_counts > 0].to_dict()}")
    
    # 4. Check feature correlations with target
    print("🔍 Feature-Target Correlations (Top 20):")
    correlations = {}
    for col in feature_cols:
        if df[col].dtype in [np.float64, np.int64]:
            try:
                corr = df[col].corr(df['quality_score'])
                if not np.isnan(corr):
                    correlations[col] = corr
            except:
                pass
    
    sorted_corrs = sorted(correlations.items(), key=lambda x: abs(x[1]), reverse=True)[:20]
    for feature, corr in sorted_corrs:
        print(f"   {feature:30s}: {corr:7.3f}")
    print()
    
    # 5. Check for constant features
    constant_features = []
    for col in feature_cols:
        if df[col].nunique() <= 1:
            constant_features.append(col)
        elif df[col].dtype in [np.float64, np.int64] and df[col].std() < 1e-10:
            constant_features.append(col)
    
    if constant_features:
        issues.append(f"⚠️  Constant features (no variance): {constant_features}")
    
    # 6. Check feature ranges
    print("📏 Feature Value Ranges (Top 10 by variance):")
    variances = {}
    for col in feature_cols:
        if df[col].dtype in [np.float64, np.int64]:
            try:
                var = df[col].var()
                if not np.isnan(var):
                    variances[col] = var
            except:
                pass
    
    sorted_vars = sorted(variances.items(), key=lambda x: x[1], reverse=True)[:10]
    for feature, var in sorted_vars:
        mean_val = df[feature].mean()
        min_val = df[feature].min()
        max_val = df[feature].max()
        print(f"   {feature:30s}: mean={mean_val:8.2f}, range=[{min_val:8.2f}, {max_val:8.2f}], var={var:10.2f}")
    print()
    
    # 7. Synthetic vs Real feedback comparison
    if df['synthetic'].sum() > 0:
        print("🔬 Synthetic vs Real Feedback Comparison:")
        synthetic = df[df['synthetic'] == True]['quality_score']
        real = df[df['synthetic'] == False]['quality_score']
        
        if len(real) > 0:
            print(f"   Synthetic: mean={synthetic.mean():.3f}, std={synthetic.std():.3f}, n={len(synthetic)}")
            print(f"   Real:      mean={real.mean():.3f}, std={real.std():.3f}, n={len(real)}")
            
            # Statistical test
            if len(real) > 10 and len(synthetic) > 10:
                t_stat, p_value = stats.ttest_ind(synthetic, real)
                print(f"   T-test: t={t_stat:.3f}, p={p_value:.3f}")
                if p_value < 0.05:
                    issues.append("⚠️  Synthetic and real feedback have significantly different distributions")
        print()
    
    # 8. Check for outliers
    print("🎯 Outlier Detection (Quality Scores):")
    Q1 = df['quality_score'].quantile(0.25)
    Q3 = df['quality_score'].quantile(0.75)
    IQR = Q3 - Q1
    lower_bound = Q1 - 1.5 * IQR
    upper_bound = Q3 + 1.5 * IQR
    outliers = df[(df['quality_score'] < lower_bound) | (df['quality_score'] > upper_bound)]
    print(f"   Outliers: {len(outliers)} ({len(outliers) / len(df) * 100:.1f}%)")
    if len(outliers) > 0:
        print(f"   Range: [{lower_bound:.3f}, {upper_bound:.3f}]")
        print(f"   Outlier examples: {outliers['quality_score'].head(5).tolist()}")
    print()
    
    # Summary
    print("=" * 70)
    print("📋 SUMMARY & RECOMMENDATIONS")
    print("=" * 70)
    print()
    
    if issues:
        print("⚠️  Issues Found:")
        for issue in issues:
            print(f"   {issue}")
        print()
    
    # Recommendations
    recommendations = []
    
    if abs(max(correlations.values(), key=abs)) < 0.3:
        recommendations.append("🔧 Features have weak correlations with target - consider feature engineering")
    
    if df['quality_score'].std() < 0.15:
        recommendations.append("🔧 Low variance in target - model may struggle to learn patterns")
    
    if df['synthetic'].sum() / len(df) > 0.8:
        recommendations.append("🔧 Too much synthetic data - prioritize collecting real user feedback")
    
    if len(constant_features) > 0:
        recommendations.append(f"🔧 Remove constant features: {constant_features[:5]}")
    
    if len(recommendations) > 0:
        print("💡 Recommendations:")
        for rec in recommendations:
            print(f"   {rec}")
        print()
    
    # Feature importance hints
    print("🎯 Top Features to Focus On (by correlation):")
    top_features = sorted_corrs[:10]
    for i, (feature, corr) in enumerate(top_features, 1):
        direction = "↑" if corr > 0 else "↓"
        print(f"   {i:2d}. {feature:30s} {direction} {abs(corr):.3f}")
    print()
    
    return df, issues, recommendations

def create_visualizations(df, output_dir):
    """Create visualization plots"""
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # 1. Quality score distribution
    plt.figure(figsize=(10, 6))
    plt.hist(df['quality_score'], bins=50, edgecolor='black', alpha=0.7)
    plt.xlabel('Quality Score')
    plt.ylabel('Frequency')
    plt.title('Quality Score Distribution')
    plt.grid(True, alpha=0.3)
    plt.savefig(output_dir / 'quality_distribution.png', dpi=150, bbox_inches='tight')
    plt.close()
    
    # 2. Feature correlations heatmap (top 15)
    feature_cols = [c for c in df.columns if c not in ['repo', 'quality_score', 'prediction_id', 'source', 'synthetic']]
    numeric_cols = [c for c in feature_cols if df[c].dtype in [np.float64, np.int64]]
    
    if len(numeric_cols) > 0:
        # Get top correlated features
        correlations = {}
        for col in numeric_cols:
            try:
                corr = df[col].corr(df['quality_score'])
                if not np.isnan(corr):
                    correlations[col] = corr
            except:
                pass
        
        top_features = sorted(correlations.items(), key=lambda x: abs(x[1]), reverse=True)[:15]
        top_feature_names = [f[0] for f in top_features]
        
        if len(top_feature_names) > 1:
            corr_matrix = df[top_feature_names + ['quality_score']].corr()
            
            plt.figure(figsize=(12, 10))
            plt.imshow(corr_matrix, cmap='coolwarm', aspect='auto', vmin=-1, vmax=1)
            plt.colorbar(label='Correlation')
            plt.xticks(range(len(corr_matrix.columns)), corr_matrix.columns, rotation=45, ha='right')
            plt.yticks(range(len(corr_matrix.columns)), corr_matrix.columns)
            plt.title('Feature Correlation Matrix (Top 15)')
            plt.tight_layout()
            plt.savefig(output_dir / 'feature_correlations.png', dpi=150, bbox_inches='tight')
            plt.close()
    
    print(f"📊 Visualizations saved to: {output_dir}")

def main():
    print("🔍 Analyzing Training Data Quality...\n")
    
    repos = load_training_data()
    df, issues, recommendations = analyze_data_quality(repos)
    
    # Create visualizations
    viz_dir = Path(__file__).parent.parent / '.beast-mode' / 'analysis'
    create_visualizations(df, viz_dir)
    
    print("✅ Analysis complete!")
    print()

if __name__ == '__main__':
    main()
