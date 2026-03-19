import requests
import json

def test_car_prediction():
    url = "http://localhost:8000/api/v1/predict-price"
    payload = {
        "brand": "Toyota",
        "model": "RAV4",
        "year": 2020,
        "mileage": 35000,
        "condition": "Excellent"
    }
    
    print(f"\n--- Testing Car Price Prediction ---")
    print(f"Payload: {payload}")
    try:
        response = requests.post(url, json=payload)
        if response.status_code == 200:
            data = response.json()
            print(f"SUCCESS: Predicted Price: {data['currency']} {data['predicted_price']:,.2f}")
            print(f"Confidence: {data['confidence']*100}%")
        else:
            print(f"FAILURE: Status Code {response.status_code}")
            print(f"Detail: {response.text}")
    except Exception as e:
        print(f"ERROR: {e}")

def test_house_prediction():
    url = "http://localhost:8000/api/v1/predict-house-price"
    payload = {
        "location": "Bole",
        "propertyType": "Villa",
        "area": 250,
        "bedrooms": 4,
        "bathrooms": 3
    }
    
    print(f"\n--- Testing House Price Prediction ---")
    print(f"Payload: {payload}")
    try:
        response = requests.post(url, json=payload)
        if response.status_code == 200:
            data = response.json()
            print(f"SUCCESS: Predicted Price: {data['currency']} {data['predicted_price']:,.2f}")
            print(f"Confidence: {data['confidence']*100}%")
        else:
            print(f"FAILURE: Status Code {response.status_code}")
            print(f"Detail: {response.text}")
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    test_car_prediction()
    test_house_prediction()
