import requests
import json

url = "http://localhost:8000/api/v1/predict-house-price"
data = {
    "city": "Addis Ababa",
    "subcity": "Akaky Kaliti",
    "region": "Addis Ababa",
    "village": "Mekanisa",
    "listingType": "BUY",
    "propertyType": "compound",
    "area": 200,
    "bedrooms": 1,
    "bathrooms": 1
}

try:
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    print(json.dumps(response.json(), indent=2))
except Exception as e:
    print(f"Error: {e}")
