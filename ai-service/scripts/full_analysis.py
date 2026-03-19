import sys
import os
import json
import uuid
import psycopg2
from datetime import datetime, timedelta

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import get_connection
from app.services.recommendation import recommendation_service

def generate_id():
    return f"test_{uuid.uuid4().hex[:8]}"

def run_full_analysis(user_id):
    conn = get_connection()
    cur = conn.cursor()
    
    print(f"\n{'='*60}")
    print(f"FULL SPECTRUM AI ANALYSIS FOR USER: {user_id}")
    print(f"{'='*60}")

    try:
        # 1. BASELINE
        print("\n[PHASE 1] BASELINE (FRESH USER)")
        explanation = recommendation_service.explain_recommendations(user_id)
        top = explanation['results'][0]
        print(f"Top Recommendation: {top['title']} | Score: {top['score']:.2f}")
        print(f"Primary breakdown: {list(top['score_breakdown'].keys())}")

        # 2. PASSIVE VIEW (MODERN APARTMENT IN BOLE)
        print("\n[PHASE 2] PASSIVE VIEW (BOLE HOUSE)")
        # Find a property in Bole
        cur.execute("SELECT p.id, p.title FROM \"Property\" p JOIN \"Location\" l ON p.\"locationId\" = l.id WHERE l.subcity = 'Bole' LIMIT 1")
        prop = cur.fetchone()
        if prop:
            cur.execute("INSERT INTO \"PropertyView\" (id, \"userId\", \"propertyId\") VALUES (%s, %s, %s)", (generate_id(), user_id, prop[0]))
            conn.commit()
            
        explanation = recommendation_service.explain_recommendations(user_id)
        # Find relative score of Bole items
        bole_items = [r for r in explanation['results'] if r.get('subcity') == 'Bole']
        if bole_items:
            print(f"Bole Items Analysis: Found {len(bole_items)} in top results.")
            print(f"Bole Item Score Breakdown: {bole_items[0]['score_breakdown']}")

        # 3. SEARCH FILTER (CAR INTENT: TOYOTA + MANUAL)
        print("\n[PHASE 3] SEARCH FILTER (TOYOTA + MANUAL)")
        filters = json.dumps({"brand": "Toyota", "transmission": "Manual"})
        cur.execute("INSERT INTO \"SearchFilterLog\" (id, \"userId\", \"searchType\", filters) VALUES (%s, %s, 'CAR', %s)", (generate_id(), user_id, filters))
        conn.commit()
        
        explanation = recommendation_service.explain_recommendations(user_id)
        toyota = next((r for r in explanation['results'] if r.get('brand') == 'Toyota'), None)
        if toyota:
            print(f"Matched Toyota Analysis: {toyota['title']}")
            print(f"Brand + Trans Score: {toyota['score_breakdown'].get('brand_intent', 0)} + {toyota['score_breakdown'].get('drive_experience', 0)}")

        # 4. SEARCH FILTER (PROPERTY INTENT: 3 BEDS + GUEST HOUSE)
        print("\n[PHASE 4] SEARCH FILTER (3 BED GUEST HOUSE)")
        filters = json.dumps({"beds": "3", "propertyType": "Guest House"})
        cur.execute("INSERT INTO \"SearchFilterLog\" (id, \"userId\", \"searchType\", filters) VALUES (%s, %s, 'PROPERTY', %s)", (generate_id(), user_id, filters))
        conn.commit()
        
        explanation = recommendation_service.explain_recommendations(user_id)
        guest_house = next((r for r in explanation['results'] if r.get('propertyType') == 'Guest House' and r.get('bedrooms') == 3), None)
        if guest_house:
            print(f"3-Bed Guest House Analysis: {guest_house['title']}")
            print(f"Combined Preference Score: {guest_house['score_breakdown'].get('bedroom_preference', 0) + guest_house['score_breakdown'].get('type_affinity', 0):.2f}")

        # 5. MAP INTERACTION (OLD AIRPORT)
        print("\n[PHASE 5] MAP INTERACTION (OLD AIRPORT)")
        # Old Airport coordinates roughly 8.99, 38.74
        cur.execute("INSERT INTO \"MapInteraction\" (id, \"userId\", lat, lng, zoom) VALUES (%s, %s, %s, %s, %s)", (generate_id(), user_id, 8.99, 38.74, 15))
        conn.commit()
        
        explanation = recommendation_service.explain_recommendations(user_id)
        map_match = next((r for r in explanation['results'] if r.get('score_breakdown', {}).get('map_region_affinity')), None)
        if map_match:
            print(f"Map Affinity Boost: +{map_match['score_breakdown']['map_region_affinity']} points for items in range.")

        # 6. HIGH INTENT (APPLICATION)
        print("\n[PHASE 6] HIGH INTENT (APPLICATION)")
        cur.execute("SELECT id, title FROM \"Property\" LIMIT 1 OFFSET 5")
        prop_app = cur.fetchone()
        if prop_app:
            # Generate ownerId for application (required by schema)
            cur.execute("SELECT id FROM \"User\" WHERE \"role\" = 'OWNER' LIMIT 1")
            owner = cur.fetchone()
            owner_id = owner[0] if owner else user_id
            cur.execute("INSERT INTO \"Application\" (id, \"customerId\", \"propertyId\", \"managerId\", status) VALUES (%s, %s, %s, %s, 'pending')", (generate_id(), user_id, prop_app[0], owner_id))
            conn.commit()
            print(f"Applied for: {prop_app[1]}")

        explanation = recommendation_service.explain_recommendations(user_id)
        print(f"\nFINAL TOP 3 RANKING:")
        for i, r in enumerate(explanation['results'][:3]):
            print(f"{i+1}. {r['title']} (Score: {r['score']:.2f})")
            print(f"   Key Factors: {list(r['score_breakdown'].keys())[:3]}...")

    finally:
        # CLEANUP
        print("\nCleaning up test data...")
        cur.execute("DELETE FROM \"PropertyView\" WHERE \"userId\" = %s", (user_id,))
        cur.execute("DELETE FROM \"SearchFilterLog\" WHERE \"userId\" = %s", (user_id,))
        cur.execute("DELETE FROM \"MapInteraction\" WHERE \"userId\" = %s", (user_id,))
        cur.execute("DELETE FROM \"Application\" WHERE \"customerId\" = %s", (user_id,))
        conn.commit()
        cur.close()
        conn.close()

if __name__ == "__main__":
    # Using the valid user ID from the user's history
    run_full_analysis("cmmelsash0032w63gz7x448bf")
