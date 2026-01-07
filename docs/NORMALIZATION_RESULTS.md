# Feature Normalization Results
## Normalized vs Non-Normalized Model Comparison

**Date:** January 2026  
**Status:** ✅ **COMPLETE**

---

## 📊 **RESULTS**

### **Baseline Model (Non-Normalized):**
- R²: -4.3987
- MAE: 0.1758
- RMSE: 0.1879

### **Normalized Model:**
- R²: -4.3172 (+1.9% improvement)
- MAE: 0.1742 (-0.9% improvement)
- RMSE: 0.1865 (-0.8% improvement)

### **Test Set Performance:**
- R²: -517.61 (very poor - indicates overfitting)
- MAE: 0.2298
- RMSE: 0.2304

---

## 💡 **FINDINGS**

### **Improvements:**
- ✅ Normalization improved R² by 1.9%
- ✅ MAE and RMSE improved slightly
- ✅ Model is learning (R² improved)

### **Issues:**
- ⚠️ R² still very negative (model worse than predicting mean)
- ⚠️ Test set shows severe overfitting (R²: -517)
- ⚠️ Need more diverse data or different approach

### **Root Cause:**
- Dataset may be too homogeneous (97% high quality)
- Need more diverse quality distribution
- May need different algorithm (XGBoost) or more data

---

## 🎯 **NEXT STEPS**

1. Review normalization results
2. Run expanded dataset retraining (if normalization helped)
3. Run hyperparameter tuning (if needed)
4. Compare all models

---

**Status:** ✅ **Normalization complete - reviewing results!**

