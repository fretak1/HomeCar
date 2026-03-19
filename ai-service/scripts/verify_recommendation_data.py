import requests
import json

def verify_recommendation_structure():
    url = "http://localhost:8000/api/v1/recommendations"
    payload = {"userId": "cmmcdcyr8000qw6ms0e9wyg5m"} # Using a known user ID
    
    print(f"--- Verifying AI Recommendations at {url} ---")
    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()
        data = response.json()
        
        recommendations = data.get("recommendations", [])
        if not recommendations:
            print("No recommendations found.")
            return

        first = recommendations[0]
        print(f"\nTitle: {first.get('title')}")
        
        # Check Location
        loc = first.get("location")
        if isinstance(loc, dict) and (loc.get("city") or loc.get("subcity")):
            print(f"SUCCESS: Nested location found: {loc}")
        else:
            print(f"FAILURE: Nested location missing or invalid: {loc}")
            
        # Check Images
        images = first.get("images")
        if isinstance(images, list) and len(images) > 0:
            print(f"SUCCESS: Multiple images found: {len(images)} images")
        else:
            print(f"FAILURE: Images missing or empty: {images}")
            
    except Exception as e:
        print(f"Error during verification: {e}")

if __name__ == "__main__":
    verify_recommendation_structure()
