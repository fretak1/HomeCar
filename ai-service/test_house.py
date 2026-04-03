import requests
import json

base_url = "http://localhost:8000/api/v1/predict-house-price"

payload = {
    "propertyType": "building",
    "area": 543,
    "bathrooms": 3,
    "bedrooms": 3,
    "city": "Addis abeba",
    "listingType": "RENT",
    "region": "Addis abeba",
    "subcity": "Lideta",
    "village": "Cherkos"
}

try:
    r = requests.post(base_url, json=payload)
    print(r.json())
except Exception as e:
    print(f"Error: {e}")
