import schedule
import time
import pandas as pd
import numpy as np
import joblib
import os
import datetime
from xgboost import XGBRegressor
from sklearn.preprocessing import OneHotEncoder
from app.database import get_all_properties

# Ensure model directory exists
MODEL_DIR = "models"
if not os.path.exists(MODEL_DIR):
    os.makedirs(MODEL_DIR)

def train_segment(df, features, categorical_cols, target_col, model_prefix):
    if df.empty or len(df) < 50:
        print(f"Not enough data to train {model_prefix}. Needed 50, got {len(df)}")
        return

    print(f"Training {model_prefix} with {len(df)} samples...")
    
    # Remove outliers
    q1 = df[target_col].quantile(0.05)
    q3 = df[target_col].quantile(0.95)
    iqr = q3 - q1
    df = df[(df[target_col] >= q1 - 1.5*iqr) & (df[target_col] <= q3 + 1.5*iqr)].copy()

    X = df[features].copy()
    y = df[target_col].astype(float)

    # Impute missing categoricals
    for col in categorical_cols:
        X[col] = X[col].fillna('Unknown')
    
    # Impute numeric
    numeric_cols = [c for c in features if c not in categorical_cols]
    for col in numeric_cols:
        X[col] = X.loc[:, col].fillna(X.loc[:, col].median() if not X.loc[:, col].isna().all() else 0).astype(float)

    # Encode Categoricals
    encoder = OneHotEncoder(handle_unknown='ignore', sparse_output=False)
    X_encoded = encoder.fit_transform(X[categorical_cols])
    
    # Merge Encoded + Numeric
    X_final = np.hstack([X_encoded, X[numeric_cols].values])

    # Train
    model = XGBRegressor(n_estimators=300, learning_rate=0.05, max_depth=8)
    model.fit(X_final, y)

    # Save
    joblib.dump(model, os.path.join(MODEL_DIR, f"{model_prefix}_model.joblib"))
    joblib.dump(encoder, os.path.join(MODEL_DIR, f"{model_prefix}_encoder.joblib"))
    print(f"{model_prefix} Model Saved.")


def train_and_save():
    print(f"[{datetime.datetime.now()}] --- STARTING ML RETRAINING (SPLIT SCALES) ---")
    
    df = get_all_properties()
    if df.empty:
        print("No data found for training.")
        return

    df['listingType'] = df['listingType'].apply(lambda x: ','.join(x) if isinstance(x, list) else str(x))
    
    # Split into 4 Core Segments (House Buy, House Rent, Car Buy, Car Rent)
    homes_df = df[df['assetType'] == 'HOME'].copy()
    cars_df = df[df['assetType'] == 'CAR'].copy()

    home_buy = homes_df[homes_df['listingType'].str.contains('BUY', na=False)]
    home_rent = homes_df[homes_df['listingType'].str.contains('RENT', na=False)]
    
    car_buy = cars_df[cars_df['listingType'].str.contains('BUY', na=False)]
    car_rent = cars_df[cars_df['listingType'].str.contains('RENT', na=False)]

    # Features
    home_features = ['region', 'city', 'subcity', 'village', 'propertyType', 'bedrooms', 'bathrooms', 'area']
    home_categorical = ['region', 'city', 'subcity', 'village', 'propertyType']

    car_features = ['brand', 'model', 'year', 'fuelType', 'transmission', 'city']
    car_categorical = ['brand', 'model', 'fuelType', 'transmission', 'city']

    # Train
    train_segment(home_buy, home_features, home_categorical, 'price', 'house_buy')
    train_segment(home_rent, home_features, home_categorical, 'price', 'house_rent')
    
    train_segment(car_buy, car_features, car_categorical, 'price', 'car_buy')
    train_segment(car_rent, car_features, car_categorical, 'price', 'car_rent')

    print(f"[{datetime.datetime.now()}] --- RETRAINING COMPLETE ---")

if __name__ == "__main__":
    train_and_save()
