import requests

def test_expanded_car_prediction():
    url = "http://localhost:8000/api/v1/predict-price"
    
    payload = {
        "brand": "Toyota",
        "model": "RAV4",
        "year": 2022,
        "mileage": 15000,
        "fuelType": "Petrol",
        "transmission": "Automatic",
        "listingType": "BUY",
        "city": "Addis Ababa",
        "subcity": "Bole",
        "region": "Addis Ababa",
        "village": "Gerji"
    }
    
    print(f"Testing with payload: {payload}")
    try:
        response = requests.post(url, json=payload)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"Predicted Price: {result['predicted_price']} {result['currency']}")
            print(f"Confidence: {result['confidence'] * 100}%")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Error connecting to AI service: {e}")

if __name__ == "__main__":
    test_expanded_car_prediction()
