import requests
import json
import pandas as pd

API_URL = "http://localhost:8000/api/v1/predict"

def test_prediction(data, label):
    print(f"\n--- Testing: {label} ---")
    try:
        response = requests.post(API_URL, json=data)
        if response.status_code == 200:
            result = response.json()
            print(f"Predicted Price: {result['predicted_price']:,.0f} ETB")
            print(f"Confidence: {result['confidence']}")
            print("Reasoning Highlights:")
            # Show first 10 lines of reasoning
            reasoning = result.get('reasoning', '')
            print("\n".join(reasoning.split('\n')[:15]))
        else:
            print(f"Error ({response.status_code}): {response.text}")
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    # Scenario 1: High-end Villa in Bole, Addis Ababa
    test_prediction({
        "assetType": "HOME",
        "listingType": "BUY",
        "region": "Addis Ababa",
        "city": "Addis Ababa",
        "subcity": "Bole",
        "village": "Kazanchis",
        "propertyType": "villa",
        "bedrooms": 5,
        "bathrooms": 4,
        "area": 450
    }, "Addis Ababa - High-end Villa")

    # Scenario 2: Apartment in Hawassa, Sidama
    test_prediction({
        "assetType": "HOME",
        "listingType": "RENT",
        "region": "Sidama",
        "city": "Hawassa",
        "subcity": "Tabor",
        "village": "Lake Front",
        "propertyType": "apartment",
        "bedrooms": 2,
        "bathrooms": 1,
        "area": 120
    }, "Hawassa - Lakeside Apartment")

    # Scenario 3: Toyota Hilux in Adama
    test_prediction({
        "assetType": "CAR",
        "listingType": "BUY",
        "city": "Adama",
        "brand": "Toyota",
        "model": "Hilux",
        "year": 2022,
        "fuelType": "Diesel",
        "transmission": "Manual"
    }, "Adama - 2022 Toyota Hilux")
