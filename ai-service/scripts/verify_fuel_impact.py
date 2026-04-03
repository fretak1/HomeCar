import requests
import json
import time

url = "http://localhost:8000/api/v1/predict-price"

def predict_fuel(fuel_type):
    data = {
        "brand": "Toyota", # Using Toyota since it has both Petrol (Hilux/Corolla) and Electric (bZ4X) variants now
        "model": "bZ4X", # Using bZ4X as a base frame
        "year": 2023,
        "mileage": 10000,
        "fuelType": fuel_type,
        "city": "Addis Ababa",
        "transmission": "Automatic",
        "village": "Bole",
        "subcity": "Bole",
        "region": "Addis Ababa",
        "listingType": "BUY"
    }

    try:
        response = requests.post(url, json=data)
        if response.status_code == 200:
            return response.json()['predicted_price']
        return 0
    except Exception as e:
        print(f"Error: {e}")
        return 0

print("--- AI Model Fuel Type Verification ---")
print("Target Vehicle: 2023 Toyota bZ4X (Automatic) in Addis Ababa\n")

petrol_price = predict_fuel("Petrol")
electric_price = predict_fuel("Electric")
hybrid_price = predict_fuel("Hybrid")
diesel_price = predict_fuel("Diesel")

print(f"Petrol Price:   {petrol_price:,.2f} ETB")
print(f"Diesel Price:   {diesel_price:,.2f} ETB")
print(f"Hybrid Price:   {hybrid_price:,.2f} ETB")
print(f"Electric Price: {electric_price:,.2f} ETB")

if petrol_price > 0:
    print(f"\nConclusion: Electric is {(electric_price / petrol_price * 100) - 100:.1f}% more expensive than Petrol.")
    print(f"Conclusion: Hybrid is {(hybrid_price / petrol_price * 100) - 100:.1f}% more expensive than Petrol.")
    print(f"Conclusion: Diesel is {(diesel_price / petrol_price * 100) - 100:.1f}% compared to Petrol (negative = cheaper).")
