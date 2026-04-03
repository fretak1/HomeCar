import requests
import json

url = "http://localhost:8000/api/v1/predict-price"
data = {
    "brand": "Suzuki",
    "model": "Alto",
    "year": 2010,
    "mileage": 50000,
    "fuelType": "Petrol",
    "city": "Addis Ababa",
    "transmission": "Manual",
    "village": "CMC",
    "subcity": "Lideta",
    "region": "Addis Ababa",
    "listingType": "BUY"
}

try:
    response = requests.post(url, json=data)
    if response.status_code == 200:
        results = response.json()
        print(f"Predicted Price: {results.get('predicted_price')}")
        print("\nSimilar Listings:")
        for listing in results.get('similar_listings', []):
            print(f"- {listing.get('title')} ({listing.get('price')} ETB) | Reason: {listing.get('reason')}")
    else:
        print(f"Failed: {response.text}")
except Exception as e:
    print(f"Error: {e}")
