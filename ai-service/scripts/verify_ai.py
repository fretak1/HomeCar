import pandas as pd
import joblib
import os
from app.services.recommendation import recommendation_service
from app.schemas.prediction import InteractionHistory

def verify_predictions():
    print("--- Verifying Price Predictions ---")
    
    # Test Cars
    if os.path.exists('data/cars_synthetic.csv') and os.path.exists('models/car_price_model.joblib'):
        df = pd.read_csv('data/cars_synthetic.csv')
        model = joblib.load('models/car_price_model.joblib')
        
        # Pick 3 random samples
        samples = df.sample(3)
        for _, row in samples.iterrows():
            X = pd.DataFrame([row.drop('price').to_dict()])
            actual = row['price']
            predicted = model.predict(X)[0]
            diff = abs(actual - predicted)
            error_pct = (diff / actual) * 100
            
            print(f"Car: {row['brand']} {row['model']} ({row['year']})")
            print(f"  Actual: ${actual:,.2f} | Predicted: ${predicted:,.2f}")
            print(f"  Accuracy: {100 - error_pct:.1f}%\n")

    # Test Houses
    if os.path.exists('data/houses_synthetic.csv') and os.path.exists('models/house_price_model.joblib'):
        df = pd.read_csv('data/houses_synthetic.csv')
        model = joblib.load('models/house_price_model.joblib')
        
        samples = df.sample(2)
        for _, row in samples.iterrows():
            X = pd.DataFrame([row.drop('price').to_dict()])
            actual = row['price']
            predicted = model.predict(X)[0]
            diff = abs(actual - predicted)
            error_pct = (diff / actual) * 100
            
            print(f"House: {row['propertyType']} in {row['location']}")
            print(f"  Actual: ${actual:,.2f} | Predicted: ${predicted:,.2f}")
            print(f"  Accuracy: {100 - error_pct:.1f}%\n")

def verify_recommendations():
    print("--- Verifying Recommendations ---")
    # Simulate a user who loves BMWs
    history = [
        InteractionHistory(
            propertyId="test_1",
            assetType="CAR",
            brand="BMW",
            price=45000
        )
    ]
    
    recs = recommendation_service.get_recommendations(history, limit=3)
    print(f"User History: Looked at a BMW ($45k)")
    print("Top Recommendations:")
    for r in recs:
        print(f"  - {r['brand']} {r['model']} (${r['price']:,.2f}) [Match: {r['score']*100}%]")

if __name__ == "__main__":
    verify_predictions()
    verify_recommendations()
