import requests
import json

base_car = {
    "brand": "Toyota", "model": "Corolla", "mileage": 50000, "fuelType": "Petrol",
    "transmission": "Manual", "listingType": "BUY", "city": "Addis Ababa", 
    "subcity": "Kirkos", "region": "Addis", "village": "Kazanchis", "amenities": []
}

r1 = requests.post("http://localhost:8000/api/v1/predict-price", json={**base_car, "year": 2010}).json()
r2 = requests.post("http://localhost:8000/api/v1/predict-price", json={**base_car, "year": 2024}).json()

print(f"Old: {r1['predicted_price']}")
print(f"New: {r2['predicted_price']}")
