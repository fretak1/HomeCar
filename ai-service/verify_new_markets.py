import sys
import os
# Add the project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'app')))

from app.services.prediction_service import prediction_service

def test_new_market_predictions():
    print("--- Verifying Predictions across New Regions ---")
    
    tests = [
        {
            "label": "HOSAINA COMPOUND (Rent)",
            "data": {
                "region": "Central Ethiopia", "city": "Hosaina", "village": "Hosaina City",
                "propertyType": "compound", "listingType": "RENT", "area": 300,
                "bedrooms": 4, "bathrooms": 3
            }
        },
        {
            "label": "BONGA VILLA (Sale)",
            "data": {
                "region": "Southern West Ethiopia", "city": "Bonga", "village": "Bonga",
                "propertyType": "villa", "listingType": "BUY", "area": 400,
                "bedrooms": 5, "bathrooms": 4
            }
        },
        {
            "label": "ADDIS ABABA BUILDING (Sale)",
            "data": {
                "region": "Addis Ababa", "city": "Addis Ababa", "village": "Bole",
                "propertyType": "building", "listingType": "BUY", "area": 800,
                "bedrooms": 0, "bathrooms": 0
            }
        }
    ]

    for t in tests:
        res = prediction_service.predict_house(t["data"])
        if "error" in res:
            print(f"[{t['label']}] ERROR: {res['error']}")
        else:
            print(f"[{t['label']}] -> Predicted: {res['predicted_price']:,.2f} ETB")

if __name__ == "__main__":
    test_new_market_predictions()
