import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
import joblib
import os

def train_car_model():
    print("Training Car Model...")
    df = pd.read_csv('data/cars_synthetic.csv')
    
    X = df.drop('price', axis=1)
    y = df['price']
    
    categorical_features = ['brand', 'model', 'condition']
    categorical_transformer = OneHotEncoder(handle_unknown='ignore')
    
    preprocessor = ColumnTransformer(
        transformers=[
            ('cat', categorical_transformer, categorical_features)
        ], remainder='passthrough'
    )
    
    model = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('regressor', RandomForestRegressor(n_estimators=100, random_state=42))
    ])
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    model.fit(X_train, y_train)
    
    joblib.dump(model, 'models/car_price_model.joblib')
    print("Car model saved.")

def train_house_model():
    print("Training House Model...")
    df = pd.read_csv('data/houses_synthetic.csv')
    
    X = df.drop('price', axis=1)
    y = df['price']
    
    categorical_features = ['location', 'propertyType']
    categorical_transformer = OneHotEncoder(handle_unknown='ignore')
    
    preprocessor = ColumnTransformer(
        transformers=[
            ('cat', categorical_transformer, categorical_features)
        ], remainder='passthrough'
    )
    
    model = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('regressor', RandomForestRegressor(n_estimators=100, random_state=42))
    ])
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    model.fit(X_train, y_train)
    
    joblib.dump(model, 'models/house_price_model.joblib')
    print("House model saved.")

if __name__ == "__main__":
    os.makedirs('models', exist_ok=True)
    if os.path.exists('data/cars_synthetic.csv'):
        train_car_model()
    if os.path.exists('data/houses_synthetic.csv'):
        train_house_model()
