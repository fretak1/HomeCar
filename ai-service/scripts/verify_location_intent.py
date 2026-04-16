import sys
import os
import pandas as pd
import numpy as np
import json
import uuid

def generate_id():
    return str(uuid.uuid4())

# Add parent directory to sys.path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.recommendation import recommendation_service
from app.database import get_connection

def test_location_intent(user_id):
    print(f"\n{'='*60}")
    print(f"TRACING AI LOCATION INTENT FOR USER: {user_id}")
    print(f"{'='*60}")

    conn = get_connection()
    cur = conn.cursor()

    try:
        # CLEANUP
        cur.execute("DELETE FROM \"SearchFilterLog\" WHERE \"userId\" = %s", (user_id,))
        conn.commit()

        # 1. TEST REGION INTENT
        print("\n[STEP 1] LOGGING SEARCH FILTER (REGION: Amhara)")
        filters = json.dumps({"region": "Amhara"})
        cur.execute("INSERT INTO \"SearchFilterLog\" (id, \"userId\", \"searchType\", filters) VALUES (%s, %s, 'PROPERTY', %s)", (generate_id(), user_id, filters))
        conn.commit()
        
        explanation = recommendation_service.explain_recommendations(user_id)
        amhara_props = [r for r in explanation['results'] if r['score_breakdown'].get('region_intent', 0) > 0]
        if amhara_props:
            print(f"Found {len(amhara_props)} properties with Region Intent Boost")
            print(f"Sample: {amhara_props[0]['title']} | Boost: {amhara_props[0]['score_breakdown']['region_intent']}")
        else:
            print("FAILED: No properties found with Region Intent Boost")

        # 2. TEST CITY INTENT
        print("\n[STEP 2] LOGGING SEARCH FILTER (CITY: Bahir Dar)")
        filters = json.dumps({"city": "Bahir Dar", "region": "Amhara"})
        cur.execute("INSERT INTO \"SearchFilterLog\" (id, \"userId\", \"searchType\", filters, \"createdAt\") VALUES (%s, %s, 'PROPERTY', %s, NOW() + interval '1 minute')", (generate_id(), user_id, filters))
        conn.commit()
        
        explanation = recommendation_service.explain_recommendations(user_id)
        city_props = [r for r in explanation['results'] if r['score_breakdown'].get('city_intent', 0) > 0]
        if city_props:
            print(f"Found {len(city_props)} properties with City Intent Boost")
            print(f"Sample: {city_props[0]['title']} | Boost: {city_props[0]['score_breakdown']['city_intent']}")
        else:
            print("FAILED: No properties found with City Intent Boost")

        # 3. TEST SUBCITY INTENT
        print("\n[STEP 3] LOGGING SEARCH FILTER (SUBCITY: Bole)")
        filters = json.dumps({"subCity": "Bole", "city": "Addis Ababa", "region": "Addis Ababa"})
        cur.execute("INSERT INTO \"SearchFilterLog\" (id, \"userId\", \"searchType\", filters, \"createdAt\") VALUES (%s, %s, 'PROPERTY', %s, NOW() + interval '2 minutes')", (generate_id(), user_id, filters))
        conn.commit()
        
        explanation = recommendation_service.explain_recommendations(user_id)
        subcity_props = [r for r in explanation['results'] if r['score_breakdown'].get('subcity_intent', 0) > 0]
        if subcity_props:
            print(f"Found {len(subcity_props)} properties with Subcity Intent Boost")
            print(f"Sample: {subcity_props[0]['title']} | Boost: {subcity_props[0]['score_breakdown']['subcity_intent']}")
        else:
            print("FAILED: No properties found with Subcity Intent Boost")

    finally:
        # CLEANUP
        cur.execute("DELETE FROM \"SearchFilterLog\" WHERE \"userId\" = %s", (user_id,))
        conn.commit()
        cur.close()
        conn.close()

if __name__ == "__main__":
    user_id = sys.argv[1] if len(sys.argv) > 1 else "test_user_geo_intent"
    test_location_intent(user_id)
