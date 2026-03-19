import sys
import os
import pandas as pd
import numpy as np
import json
import uuid

def generate_id():
    # Simulate a CUID-like or just unique string
    return str(uuid.uuid4())

# Add parent directory to sys.path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.recommendation import recommendation_service
from app.database import get_connection

def test_user_scoring(user_id):
    print(f"\n{'='*60}")
    print(f"TRACING AI LOGIC FOR USER: {user_id}")
    print(f"{'='*60}")

    conn = get_connection()
    cur = conn.cursor()

    try:
        # 1. BASELINE: Clear existing interactions for this test user
        cur.execute("DELETE FROM \"PropertyView\" WHERE \"userId\" = %s", (user_id,))
        cur.execute("DELETE FROM \"SearchFilterLog\" WHERE \"userId\" = %s", (user_id,))
        cur.execute("DELETE FROM \"MapInteraction\" WHERE \"userId\" = %s", (user_id,))
        conn.commit()

        print("\n[STEP 1] BASELINE (NO HISTORY)")
        explanation = recommendation_service.explain_recommendations(user_id)
        results = explanation['results']
        if results:
            print(f"Top 1: {results[0]['title']} | Score: {results[0].get('score', 0)}")
            print(f"Breakdown: {results[0].get('score_breakdown', 'None')}")

        # 2. TEST PROPERTY VIEW (Implicit)
        print("\n[STEP 2] LOGGING PROPERTY VIEW (BOLE HOUSE)")
        # Get a Bole property ID by joining with Location
        cur.execute("""
            SELECT p.id, p.title 
            FROM "Property" p 
            JOIN "Location" l ON p."locationId" = l.id 
            WHERE l.subcity = 'Bole' 
            LIMIT 1
        """)
        prop = cur.fetchone()
        if prop:
            cur.execute("INSERT INTO \"PropertyView\" (id, \"userId\", \"propertyId\") VALUES (%s, %s, %s)", (generate_id(), user_id, prop[0]))
            conn.commit()
            
            explanation = recommendation_service.explain_recommendations(user_id)
            # Find a property in the same subcity (not the viewed one)
            other_bole = next((r for r in explanation['results'] if r['subcity'] == 'Bole' and r['propertyId'] != prop[0]), None)
            if other_bole:
                print(f"Matched Recommendation: {other_bole['title']}")
                print(f"New Score: {other_bole['score']}")
                print(f"Breakdown: {other_bole['score_breakdown']}")

        # 3. TEST MAP INTERACTION (Geographic Affinity)
        print("\n[STEP 3] LOGGING MAP INTERACTION (NEAR ADDIS ABABA CENTER)")
        cur.execute("INSERT INTO \"MapInteraction\" (id, \"userId\", lat, lng, zoom) VALUES (%s, %s, 9.01, 38.75, 12)", (generate_id(), user_id,))
        conn.commit()
        
        explanation = recommendation_service.explain_recommendations(user_id)
        results = explanation['results']
        if results:
            print(f"Top 1: {results[0]['title']} | Total Score: {results[0]['score']}")
            print(f"Breakdown includes 'map_region_affinity': {results[0]['score_breakdown'].get('map_region_affinity', 0)}")

        # 4. TEST SEARCH FILTER (Brand Intent + Transmission)
        print("\n[STEP 4] LOGGING SEARCH FILTER (MERCEDES + MANUAL)")
        filters = json.dumps({"brand": "Mercedes", "transmission": "Manual"})
        cur.execute("INSERT INTO \"SearchFilterLog\" (id, \"userId\", \"searchType\", filters) VALUES (%s, %s, 'CAR', %s)", (generate_id(), user_id, filters))
        conn.commit()
        
        explanation = recommendation_service.explain_recommendations(user_id)
        mercedes = next((r for r in explanation['results'] if r.get('brand') == 'Mercedes-Benz'), None)
        if mercedes:
            print(f"Matched Mercedes: {mercedes['title']}")
            print(f"Brand Intent Boost: {mercedes['score_breakdown'].get('brand_intent', 0)}")
            print(f"Drive Experience Boost: {mercedes['score_breakdown'].get('drive_experience', 0)}")

        # 5. TEST SEARCH FILTER (Bedrooms + Property Type)
        print("\n[STEP 5] LOGGING SEARCH FILTER (3 BEDS + GUEST HOUSE)")
        filters = json.dumps({"beds": "3", "propertyType": "Guest House"})
        cur.execute("INSERT INTO \"SearchFilterLog\" (id, \"userId\", \"searchType\", filters) VALUES (%s, %s, 'PROPERTY', %s)", (generate_id(), user_id, filters))
        conn.commit()
        
        explanation = recommendation_service.explain_recommendations(user_id)
        guest_house = next((r for r in explanation['results'] if r.get('propertyType') == 'Guest House' and r.get('bedrooms') == 3), None)
        if guest_house:
            print(f"Matched 3-Bed Guest House: {guest_house['title']}")
            print(f"Bedroom Preference: {guest_house['score_breakdown'].get('bedroom_preference', 0)}")
            print(f"Type Affinity: {guest_house['score_breakdown'].get('type_affinity', 0)}")

    finally:
        # CLEANUP
        cur.execute("DELETE FROM \"PropertyView\" WHERE \"userId\" = %s", (user_id,))
        cur.execute("DELETE FROM \"SearchFilterLog\" WHERE \"userId\" = %s", (user_id,))
        cur.execute("DELETE FROM \"MapInteraction\" WHERE \"userId\" = %s", (user_id,))
        conn.commit()
        cur.close()
        conn.close()

if __name__ == "__main__":
    user_id = sys.argv[1] if len(sys.argv) > 1 else "cmmelsash0032w63gz7x448bf"
    test_user_scoring(user_id)
