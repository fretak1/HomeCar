from app.services.prediction_service import prediction_service
import json

def test_ml_predictions():
    test_cases = [
        # 1. Addis Ababa Villa (BUY)
        {
            "assetType": "HOME",
            "region": "Addis Ababa",
            "city": "Addis Ababa",
            "propertyType": "villa",
            "listingType": "BUY",
            "bedrooms": 4,
            "area": 300
        },
        # 2. Hawassa Apartment (RENT)
        {
            "assetType": "HOME",
            "region": "Sidama",
            "city": "Hawassa",
            "propertyType": "apartment",
            "listingType": "RENT",
            "bedrooms": 2,
            "area": 120
        },
        # 3. Toyota Corolla 2018 (BUY)
        {
            "assetType": "CAR",
            "brand": "Toyota",
            "model": "Corolla",
            "year": 2018,
            "fuelType": "Petrol",
            "transmission": "Manual",
            "city": "Addis Ababa",
            "listingType": "BUY"
        },
        # 4. Suzuki Alto 2019 (BUY)
        {
            "assetType": "CAR",
            "brand": "Suzuki",
            "model": "Alto",
            "year": 2019,
            "fuelType": "Petrol",
            "transmission": "Manual",
            "city": "Semera",
            "listingType": "BUY"
        }
    ]

    print("--- PURE ML AI PREDICTION TEST ---")
    for i, case in enumerate(test_cases):
        print(f"\nTest {i+1}: {case.get('propertyType', case.get('model'))} in {case['city']}")
        if case["assetType"] == "HOME":
            result = prediction_service.predict_house(case)
        else:
            result = prediction_service.predict_car(case)
        
        print(json.dumps(result, indent=2))

if __name__ == "__main__":
    test_ml_predictions()
