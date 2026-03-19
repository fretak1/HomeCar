import joblib
import pandas as pd
import numpy as np
import os

def check_model():
    encoder_path = 'models/house_buy_encoder.joblib'
    model_path = 'models/house_buy_model.joblib'
    
    if not os.path.exists(encoder_path):
        print("Encoder not found!")
        return

    enc = joblib.load(encoder_path)
    model = joblib.load(model_path)
    
    print(f"Categories in Encoder: {len(enc.categories_)}")
    for i, cat in enumerate(enc.categories_):
        print(f"Feature {i} (e.g. {['region', 'city', 'subcity', 'village', 'propertyType'][i]}): {len(cat)} categories")
        if i == 3: # Village
            print(f"Sample Villages: {cat[:5]}")
            if "Bole Bulbula" in cat:
                print("✅ 'Bole Bulbula' found in training set")
            if "Gerji" in cat:
                print("✅ 'Gerji' found in training set")

    # Check feature importance if possible
    try:
        import xgboost as xgb
        importance = model.feature_importances_
        print(f"\nTotal Features (Encoded): {len(importance)}")
        # Village starts after region, city, subcity
        start_idx = len(enc.categories_[0]) + len(enc.categories_[1]) + len(enc.categories_[2])
        end_idx = start_idx + len(enc.categories_[3])
        village_importance = sum(importance[start_idx:end_idx])
        print(f"Total Village Feature Importance: {village_importance:.6f}")
    except Exception as e:
        print(f"Could not calculate importance: {e}")

if __name__ == "__main__":
    check_model()
