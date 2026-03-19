import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

def test_weighted_influence():
    print("--- Testing Weighted Influence (Home) ---")
    # Scenario: 3-bed Apartment in Bole (100sqm).
    # DB Mocked references via grounding logic would return these:
    # 1. 3-bed Apartment in Bole (100sqm) -> Price: 1,000,000 (Perfect Match)
    # 2. 2-bed Apartment in Bole (80sqm)  -> Price: 800,000   (High Match)
    # 3. 5-bed Villa in Bole (300sqm)     -> Price: 5,000,000 (Low Match)
    
    # We will test this via the live system by picking a high-density area.
    payload = {
        "propertyType": "Apartment", "bedrooms": 3, "bathrooms": 1, "area": 100,
        "listingType": "BUY", "city": "Addis Ababa", "subcity": "Bole", "region": "Addis", 
        "village": "Gerji", "amenities": []
    }
    
    response = requests.post(f"{BASE_URL}/predict-house-price", json=payload)
    if response.status_code == 200:
        data = response.json()
        print(f"Price: ETB {data['predicted_price']:,}")
        print(f"Reasoning: {data['reasoning']}")
        print(f"Confidence: {data['confidence']}")
    else:
        print(f"Error: {response.text}")

def test_car_similarity():
    print("\n--- Testing Car Similarity (Toyota) ---")
    payload = {
        "brand": "Toyota", "model": "Corolla", "year": 2020, "mileage": 40000,
        "fuelType": "Petrol", "transmission": "Manual", "listingType": "BUY",
        "city": "Addis Ababa", "subcity": "Kirkos", "region": "Addis", "village": "Kazanchis"
    }
    
    response = requests.post(f"{BASE_URL}/predict-price", json=payload)
    if response.status_code == 200:
        data = response.json()
        print(f"Price: ETB {data['predicted_price']:,}")
        print(f"Reasoning: {data['reasoning']}")
    else:
        print(f"Error: {response.text}")

if __name__ == "__main__":
    test_weighted_influence()
    test_car_similarity()
