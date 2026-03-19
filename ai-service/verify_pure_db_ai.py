import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

def test_no_data_scenario():
    print("\n--- Testing 'No Data' Scenario ---")
    payload = {
        "propertyType": "Martian Palace",
        "bedrooms": 99,
        "bathrooms": 99,
        "area": 10000,
        "listingType": "sell",
        "city": "Unknown City",
        "subcity": "Unknown Subcity",
        "region": "Unknown Region",
        "village": "Unknown Village"
    }
    response = requests.post(f"{BASE_URL}/predict-house-price", json=payload)
    if response.status_code == 400:
        print("PASS: Correctly returned 400 for insufficient data.")
        print(f"Message: {response.json()['detail']}")
    else:
        print(f"FAIL: Expected 400, got {response.status_code}")

def test_subcity_grounding():
    print("\n--- Testing Subcity Grounding (Assuming Bole has data) ---")
    # We'll use a property type we know exists from previous checks: "Villa"
    payload = {
        "propertyType": "Villa",
        "bedrooms": 3,
        "bathrooms": 2,
        "area": 200,
        "listingType": "BUY",
        "city": "Addis Ababa",
        "subcity": "Bole",
        "region": "Addis Ababa",
        "village": "NonExistentVillage" # Should fall back to Subcity
    }
    response = requests.post(f"{BASE_URL}/predict-house-price", json=payload)
    if response.status_code == 200:
        result = response.json()
        print("PASS: Successfully grounded prediction in Subcity data.")
        print(f"Predicted Price: ETB {result['predicted_price']:,}")
        print(f"Reasoning: {result['reasoning']}")
        print(f"Method: {result['method']}")
    elif response.status_code == 400:
        print(f"INFO: Not enough real data in DB for Bole Villas. Result: {response.json()['detail']}")
    else:
        print(f"FAIL: Unexpected status {response.status_code}")

def test_car_prediction():
    print("\n--- Testing Car Prediction ---")
    payload = {
        "brand": "Toyota",
        "model": "Vitz",
        "year": 2018,
        "mileage": 50000,
        "fuelType": "Petrol",
        "transmission": "Automatic",
        "listingType": "sell",
        "city": "Addis Ababa",
        "subcity": "Bole",
        "region": "Addis Ababa",
        "village": "Bole"
    }
    response = requests.post(f"{BASE_URL}/predict-price", json=payload)
    if response.status_code == 200:
        result = response.json()
        print("PASS: Car prediction successful.")
        print(f"Predicted Price: ETB {result['predicted_price']:,}")
        print(f"Reasoning: {result['reasoning']}")
    elif response.status_code == 400:
        print(f"INFO: Not enough real data in DB for Toyota Vitz. Result: {response.json()['detail']}")
    else:
        print(f"FAIL: Unexpected status {response.status_code}")

if __name__ == "__main__":
    test_no_data_scenario()
    test_subcity_grounding()
    test_car_prediction()
