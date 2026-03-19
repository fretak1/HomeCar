import sys
import os
import json

# Add project root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.recommendation import recommendation_service

def verify_recommendation_logic():
    user_id = "cmmcdcyr8000qw6ms0e9wyg5m" # Use a known user or empty string for general
    print(f"--- Verifying Recommendation Logic for User: {user_id} ---")
    
    try:
        # 1. Get Recommendations (Calls both DB and Formatting Logic)
        recommendations = recommendation_service.get_recommendations_for_user(user_id, limit=3)
        
        if not recommendations:
            print("No recommendations found. Trying general recommendations...")
            recommendations = recommendation_service.get_general_recommendations(limit=3)
            
        if not recommendations:
            print("FAILURE: No properties found in DB to recommend.")
            return

        first = recommendations[0]
        print(f"\nProperty: {first.get('title')}")
        
        # 2. Check id Restoration
        prop_id = first.get("id")
        if prop_id:
            print(f"SUCCESS: 'id' field found: {prop_id}")
        else:
            print(f"FAILURE: 'id' field is missing or null.")

        # 3. Check propertyId Alias
        p_id = first.get("propertyId")
        if p_id == prop_id:
            print(f"SUCCESS: 'propertyId' matches 'id': {p_id}")
        else:
            print(f"FAILURE: 'propertyId' ({p_id}) does not match 'id' ({prop_id})")
            
    except Exception as e:
        print(f"Logic Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    verify_recommendation_logic()
