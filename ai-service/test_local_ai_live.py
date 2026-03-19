import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

def test_car_prediction():
    print("\n--- Testing Local CAR Prediction ---")
    payload = {
        "brand": "Toyota",
        "model": "Camry",
        "year": 2022,
        "mileage": 15000,
        "fuelType": "Petrol",
        "transmission": "Automatic",
        "listingType": "sell",
        "city": "Addis Ababa",
        "subcity": "Bole",
        "region": "Addis Ababa",
        "village": "Rwanda"
    }
    try:
        response = requests.post(f"{BASE_URL}/predict-price", json=payload)
        if response.status_code == 200:
            result = response.json()
            print(f"Predicted Price: ETB {result['predicted_price']:,}")
            print(f"Confidence: {result['confidence']}")
            print(f"Reasoning: {result['reasoning']}")
            print(f"Method: {result['method']}")
        else:
            print(f"Error: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Request failed: {e}")

def test_house_prediction():
    print("\n--- Testing Local HOUSE Prediction ---")
    payload = {
        "propertyType": "Villa",
        "bedrooms": 4,
        "bathrooms": 3,
        "area": 250,
        "listingType": "sell",
        "city": "Addis Ababa",
        "subcity": "Bole",
        "region": "Addis Ababa",
        "village": "Rwanda"
    }
    try:
        response = requests.post(f"{BASE_URL}/predict-house-price", json=payload)
        if response.status_code == 200:
            result = response.json()
            print(f"Predicted Price: ETB {result['predicted_price']:,}")
            print(f"Confidence: {result['confidence']}")
            print(f"Reasoning: {result['reasoning']}")
            print(f"Method: {result['method']}")
        else:
            print(f"Error: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    test_car_prediction()
    test_house_prediction()
