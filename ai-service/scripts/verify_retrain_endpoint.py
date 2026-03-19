import requests
import time

def test_retrain():
    url = "http://localhost:8000/api/v1/retrain"
    print(f"Triggering retrain at {url}...")
    try:
        response = requests.post(url)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            print("Successfully triggered. Checking for 'busy' state...")
            time.sleep(1)
            response2 = requests.post(url)
            print(f"Second call response: {response2.json()}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_retrain()
