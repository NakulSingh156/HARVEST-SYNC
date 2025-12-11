# HARVEST_SYNC/backend/farmer_api/ml_loader.py

import os
import joblib
import json
import pandas as pd
import numpy as np
import tensorflow as tf # Required for loading the disease model later

# --- Path Adjustment for ML_models Directory ---
# Current directory: farmer_api/
# Parent directory: backend/
# Grandparent directory: HARVEST_SYNC/ (Where ML_models/ is located)

# This line goes up two directories to find the HARVEST_SYNC/ root folder:
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))) 
ML_MODELS_DIR = os.path.join(BASE_DIR, 'ML_models')

# The column list required for the yield model feature input
YIELD_FEATURE_COLS = ['Crop', 'Crop_Year', 'State', 'Annual_Rainfall', 'Fertilizer', 'Pesticide', 'Season_Kharif', 'Season_Rabi', 'Season_Summer', 'Season_Whole Year', 'Season_Winter']


# --- Model and Data Loading ---
try:
    # 1. Load Yield Prediction Model and Preprocessors
    yield_model = joblib.load(os.path.join(ML_MODELS_DIR, "yield_model_adaboost.pkl"))
    scaler = joblib.load(os.path.join(ML_MODELS_DIR, "scaler.pkl"))
    le_crop = joblib.load(os.path.join(ML_MODELS_DIR, "le_crop.pkl"))
    le_state = joblib.load(os.path.join(ML_MODELS_DIR, "le_state.pkl"))
    
    # 2. Load Yield Solution Data
    with open(os.path.join(ML_MODELS_DIR, "yield_solutions.json"), 'r') as f: 
        yield_solutions_data = json.load(f)
        
    # 3. Load Disease Model (Required for the second API later)
    disease_model = tf.keras.models.load_model(os.path.join(ML_MODELS_DIR, "plant_disease_model_fine_tuned.h5"), compile=False)
    with open(os.path.join(ML_MODELS_DIR, "remedies.json"), 'r') as f: 
        remedies_data = json.load(f)
    
    # 4. Disease Model Class Names
    disease_classes = ["Apple___Apple_scab", "Apple___Black_rot", "Apple___Cedar_apple_rust", "Apple___healthy", "Blueberry___healthy", "Cherry_(including_sour)___Powdery_mildew", "Cherry_(including_sour)___healthy", "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot", "Corn_(maize)___Common_rust", "Corn_(maize)___Northern_Leaf_Blight", "Corn_(maize)___healthy", "Grape___Black_rot", "Grape___Esca_(Black_Measles)", "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)", "Grape___healthy", "Orange___Haunglongbing_(Citrus_greening)", "Peach___Bacterial_spot", "Peach___healthy", "Pepper,_bell___Bacterial_spot", "Pepper,_bell___healthy", "Potato___Early_blight", "Potato___Late_blight", "Potato___healthy", "Raspberry___healthy", "Soybean___healthy", "Squash___Powdery_mildew", "Strawberry___Leaf_scorch", "Strawberry___healthy", "Tomato___Bacterial_spot", "Tomato___Early_blight", "Tomato___Late_blight", "Tomato___Leaf_Mold", "Tomato___Septoria_leaf_spot", "Tomato___Spider_mites Two-spotted_spider_mite", "Tomato___Target_Spot", "Tomato___Tomato_Yellow_Leaf_Curl_Virus", "Tomato___Tomato_mosaic_virus", "Tomato___healthy"]


    print("✅ All ML models and data loaded successfully for Django.")

except Exception as e:
    print(f"⚠️ Error loading ML files in Django: {e}")
    # Set to None to prevent crashing the server
    yield_model, scaler, le_crop, le_state, yield_solutions_data = None, None, None, None, None
    disease_model, remedies_data, disease_classes = None, None, None


# --- Helper Functions (Copied from Old Backend) ---

def find_correct_label(user_input, label_encoder):
    """Finds the correct capitalized label from the encoder classes based on user input."""
    known_labels = list(label_encoder.classes_)
    for label in known_labels:
        if user_input.strip().lower() == label.strip().lower():
            return label
    return None

def preprocess_yield_input(data):
    """
    Preprocesses the raw user input data into the format required by the yield prediction model.
    """
    df = pd.DataFrame([data])
    
    # Apply Label Encoders
    df['Crop'] = le_crop.transform(df['Crop'])
    df['State'] = le_state.transform(df['State'])
    
    # One-Hot Encode Season (based on your existing columns)
    for season in ['Kharif', 'Rabi', 'Summer', 'Whole Year', 'Winter']:
        df[f"Season_{season}"] = (df['Season'] == season).astype(int)
    
    # Apply Log Transformation (as per your model's training pipeline)
    for col in ['Area', 'Production', 'Annual_Rainfall', 'Fertilizer', 'Pesticide']:
        df[col] = np.log1p(df[col])
    
    # Apply Standard Scaler
    scaler_cols = [
        "Crop_Year", "Area", "Production", 
        "Annual_Rainfall", "Fertilizer", "Pesticide"
    ]
    
    df[scaler_cols] = scaler.transform(df[scaler_cols])
    
    return df[YIELD_FEATURE_COLS].values