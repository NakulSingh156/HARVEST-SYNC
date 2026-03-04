import joblib
import os
try:
    le = joblib.load('/Users/nakul/Desktop/HARVEST_SYNC/ML_models/le_crop.pkl')
    print("AVAILABLE CROPS:", le.classes_)
except Exception as e:
    print(f"Error: {e}")
