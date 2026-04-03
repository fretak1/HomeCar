import requests
import json

base_url = "http://localhost:8000/api/v1/predict-price"

payload_petrol = {
    "brand": "Suzuki",
    "model": "Alto",
    "year": 2024,
    "mileage": 50000,
    "fuelType": "Petrol",
    "city": "Addis Ababa",
    "transmission": "Manual",
    "village": "CMC",
    "subcity": "Akaky Kaliti",
    "region": "Addis Ababa",
    "listingType": "BUY"
}

payload_electric = payload_petrol.copy()
payload_electric["fuelType"] = "Electric"

try:
    r_petrol = requests.post(base_url, json=payload_petrol)
    r_electric = requests.post(base_url, json=payload_electric)
    
    p_petrol = r_petrol.json().get('predicted_price')
    p_electric = r_electric.json().get('predicted_price')
    
    print(f"Petrol Price:   {p_petrol:,.2f} ETB")
    print(f"Electric Price: {p_electric:,.2f} ETB")
    
    if p_petrol > 0:
        increase = ((p_electric - p_petrol) / p_petrol) * 100
        print(f"Percentage Difference: +{increase:.2f}%")
        
except Exception as e:
    print(f"Error: {e}")
