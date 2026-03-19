import requests
import json

def test_car_reasoning():
    print("--- Testing Car Reasoning ---")
    data = {
        "brand": "Toyota",
        "model": "Corolla",
        "year": 2024,
        "mileage": 5000,
        "fuelType": "petrol",
        "transmission": "automatic",
        "city": "Addis Ababa",
        "subcity": "Bole",
        "region": "Addis Ababa",
        "village": "Gerji",
        "listingType": "BUY"
    }
    resp = requests.post("http://localhost:8000/api/v1/predict-price", json=data)
    result = resp.json()
    print(f"Price: {result['predicted_price']:,} ETB")
    print(f"Reasoning: {result['reasoning']}\n")

def test_house_reasoning():
    print("--- Testing House Reasoning ---")
    data = {
        "region": "Addis Ababa",
        "city": "Addis Ababa",
        "subcity": "Kirkos",
        "village": "Bulbula",
        "propertyType": "building",
        "bedrooms": 94,
        "bathrooms": 92,
        "area": 361,
        "listingType": "BUY"
    }
    resp = requests.post("http://localhost:8000/api/v1/predict-house-price", json=data)
    result = resp.json()
    print(f"Price: {result['predicted_price']:,} ETB")
    print(f"Reasoning: {result['reasoning']}\n")

if __name__ == "__main__":
    try:
        test_car_reasoning()
        test_house_reasoning()
    except Exception as e:
        print(f"Error: {e}. Make sure the AI service is running at http://localhost:8000")
