import requests
import json

base_url = "http://localhost:8000/api/v1"

def test_car_prediction():
    print("\nTesting Car Prediction (Bole Comparison data)...")
    payload = {
        "brand": "Toyota",
        "model": "Vitz",
        "year": 2010,
        "mileage": 50000,
        "fuelType": "Petrol",
        "transmission": "Manual",
        "listingType": "BUY",
        "city": "Addis Ababa",
        "subcity": "Bole",
        "region": "Addis Ababa",
        "village": "Unknown"
    }
    try:
        response = requests.post(f"{base_url}/predict-price", json=payload)
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"Error: {e}")

def test_house_prediction():
    print("\nTesting House Prediction...")
    payload = {
        "city": "Addis Ababa",
        "subcity": "Kirkos",
        "region": "Addis Ababa",
        "village": "Unknown",
        "listingType": "BUY",
        "propertyType": "VILLA",
        "area": 200,
        "bedrooms": 3,
        "bathrooms": 2
    }
    try:
        response = requests.post(f"{base_url}/predict-house-price", json=payload)
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"Error: {e}")

def test_rare_car_prediction():
    print("\nTesting Rare Car Prediction (Should return 400 Insufficient Data Error)...")
    payload = {
        "brand": "Ferrari",
        "model": "SF90",
        "year": 2024,
        "mileage": 100,
        "fuelType": "Hybrid",
        "transmission": "Automatic",
        "listingType": "BUY",
        "city": "Addis Ababa",
        "subcity": "Bole",
        "region": "Addis Ababa",
        "village": "Unknown"
    }
    try:
        response = requests.post(f"{base_url}/predict-price", json=payload)
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_car_prediction()
    test_house_prediction()
    test_rare_car_prediction()
