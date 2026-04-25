import sys
import os
import pandas as pd
import numpy as np
import pickle
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer

# Add project root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import get_connection

def fetch_training_data():
    conn = get_connection()
    try:
        # 1. Fetch all interactions
        print("Fetching interactions...")
        query_interactions = """
            SELECT "userId", "propertyId", 'VIEW' as interaction_type FROM "PropertyView"
            UNION ALL
            SELECT "userId", "propertyId", 'FAVORITE' as interaction_type FROM "Favorite"
            UNION ALL
            SELECT "customerId" as "userId", "propertyId", 'APPLICATION' as interaction_type FROM "Application"
            UNION ALL
            SELECT "payerId" as "userId", "propertyId", 'TRANSACTION' as interaction_type FROM "Transaction" WHERE status = 'COMPLETED'
        """
        interactions = pd.read_sql_query(query_interactions, conn)
        
        # 2. Assign scores
        scores = {'VIEW': 1, 'FAVORITE': 5, 'APPLICATION': 20, 'TRANSACTION': 50}
        interactions['label'] = interactions['interaction_type'].map(scores)
        
        # Aggregate labels for user-property pairs
        # (If a user viewed and favorited, they get a higher score)
        training_df = interactions.groupby(['userId', 'propertyId'])['label'].sum().reset_index()

        # 3. Fetch Property features
        print("Fetching property features...")
        query_properties = """
            SELECT 
                p.id as "propertyId", p."assetType", p."propertyType", p.price, p.bedrooms, p.bathrooms,
                p.brand, p.model, p.year, p."fuelType", p.transmission,
                l.city, l.subcity, l.village
            FROM "Property" p
            LEFT JOIN "Location" l ON p."locationId" = l.id
        """
        properties = pd.read_sql_query(query_properties, conn)
        
        # 4. Fetch User features
        print("Fetching user features...")
        query_users = """
            SELECT id as "userId", kids, "marriageStatus" FROM "User"
        """
        users = pd.read_sql_query(query_users, conn)
        
        # Join everything
        data = training_df.merge(properties, on='propertyId', how='inner')
        data = data.merge(users, on='userId', how='inner')
        
        return data
    finally:
        conn.close()

def train_model():
    data = fetch_training_data()
    if data.empty:
        print("No interaction data found to train on.")
        return

    print(f"Training on {len(data)} interaction pairs...")

    # Define features
    cat_features = ['assetType', 'propertyType', 'brand', 'model', 'fuelType', 'transmission', 'city', 'subcity', 'village', 'marriageStatus']
    num_features = ['price', 'bedrooms', 'bathrooms', 'year', 'kids']
    
    X = data[cat_features + num_features]
    y = data['label']

    # Preprocessing pipeline
    cat_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='constant', fill_value='missing')),
        ('onehot', OneHotEncoder(handle_unknown='ignore'))
    ])
    
    num_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler())
    ])

    preprocessor = ColumnTransformer(
        transformers=[
            ('num', num_transformer, num_features),
            ('cat', cat_transformer, cat_features)
        ]
    )

    # Full pipeline with Random Forest
    model = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('regressor', RandomForestRegressor(n_estimators=100, random_state=42))
    ])

    # Train
    model.fit(X, y)
    print("Model trained successfully.")

    # Save
    os.makedirs('models', exist_ok=True)
    with open('models/recommendation_model.pkl', 'wb') as f:
        pickle.dump(model, f)
    print("Model saved to models/recommendation_model.pkl")

if __name__ == "__main__":
    train_model()
