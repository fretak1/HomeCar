import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

def print_result(name, response):
    print(f"\n--- {name} ---")
    if response.status_code == 200:
        data = response.json()
        print(f"Price: ETB {data['predicted_price']:,}")
        print(f"Reasoning: {data['reasoning']}")
        print(f"Confidence: {data['confidence']}")
    else:
        print(f"Status: {response.status_code}")
        try:
            print(f"Message: {response.json()['detail']}")
        except:
            print(f"Text: {response.text}")

# 1. WAY 1: The Guardrail (Impossible Property)
def test_impossible_property():
    payload = {
        "propertyType": "Spaceship Hangar", "bedrooms": 1, "bathrooms": 1, "area": 500,
        "listingType": "BUY", "city": "Addis Ababa", "subcity": "Bole", "region": "Addis", "village": "Gerji"
    }
    response = requests.post(f"{BASE_URL}/predict-house-price", json=payload)
    print_result("WAY 1: Guardrail (Impossible Property)", response)

# 2. WAY 2: Hierarchical Fallback (Village -> Subcity)
def test_village_fallback():
    # Apartments in Bole have high density (5 matches). Using fallback from Fake Village.
    payload = {
        "propertyType": "Apartment", "bedrooms": 3, "bathrooms": 1, "area": 120,
        "listingType": "BUY", "city": "Addis Ababa", "subcity": "Bole", "region": "Addis", "village": "ImaginaryVillageX"
    }
    response = requests.post(f"{BASE_URL}/predict-house-price", json=payload)
    print_result("WAY 2: Hierarchical Fallback (Village -> Subcity)", response)

# 3. WAY 3: Amenity Value Analysis (House Premium)
def test_house_amenities():
    base_payload = {
        "propertyType": "Apartment", "bedrooms": 3, "bathrooms": 1, "area": 120,
        "listingType": "BUY", "city": "Addis Ababa", "subcity": "Bole", "region": "Addis", "village": "Bole",
        "amenities": []
    }
    luxury_payload = base_payload.copy()
    luxury_payload["amenities"] = ["Elevator", "Fully Furnished", "Security Alarm"]
    
    print("\n--- WAY 3: Amenity Analysis (Comparing Base vs Luxury Apartment) ---")
    res1 = requests.post(f"{BASE_URL}/predict-house-price", json=base_payload)
    if res1.status_code == 200:
        print(f"Standard Apartment: ETB {res1.json()['predicted_price']:,}")
    
    res2 = requests.post(f"{BASE_URL}/predict-house-price", json=luxury_payload)
    if res2.status_code == 200:
        print(f"Luxury Apartment (+Elevator/Furnished): ETB {res2.json()['predicted_price']:,}")
        print(f"Smart reasoning: {res2.json()['reasoning']}")

# 4. WAY 4: Age Decay (Car Depreciation)
def test_car_depreciation():
    # Toyota in Kirkos has high density (10 matches).
    base_car = {
        "brand": "Toyota", "model": "Corolla", "mileage": 50000, "fuelType": "Petrol",
        "transmission": "Manual", "listingType": "BUY", "city": "Addis Ababa", 
        "subcity": "Kirkos", "region": "Addis", "village": "Kazanchis", "amenities": []
    }
    
    classic_car = base_car.copy()
    classic_car["year"] = 2010 # Old
    
    modern_car = base_car.copy()
    modern_car["year"] = 2024 # New
    
    print("\n--- WAY 4: Age Decay (Depreciation Math - Toyota)")
    res1 = requests.post(f"{BASE_URL}/predict-price", json=classic_car)
    if res1.status_code == 200:
        print(f"2010 Toyota: ETB {res1.json()['predicted_price']:,}")

    res2 = requests.post(f"{BASE_URL}/predict-price", json=modern_car)
    if res2.status_code == 200:
        print(f"2024 Toyota: ETB {res2.json()['predicted_price']:,}")
        print(f"Difference logic: {res2.json()['reasoning']}")

# 5. WAY 5: Feature Premium (Automatic/Sunroof)
def test_car_features():
    payload = {
        "brand": "Toyota", "model": "Corolla", "year": 2020, "mileage": 40000,
        "fuelType": "Hybrid", "transmission": "Automatic", "listingType": "BUY",
        "city": "Addis Ababa", "subcity": "Kirkos", "region": "Addis", "village": "Olympia",
        "amenities": ["Sunroof", "Automatic", "Leather Seats"]
    }
    response = requests.post(f"{BASE_URL}/predict-price", json=payload)
    print_result("WAY 5: Feature Premium (Hybrid + Automatic + Sunroof)", response)

if __name__ == "__main__":
    test_impossible_property()
    test_village_fallback()
    test_house_amenities()
    test_car_depreciation()
    test_car_features()
