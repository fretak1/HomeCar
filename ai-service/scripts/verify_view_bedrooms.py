import sys
import os
import json
import uuid
from datetime import datetime

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import get_connection
from app.services.recommendation import recommendation_service

def generate_id():
    return f"vtest_{uuid.uuid4().hex[:8]}"

def verify_bedroom_view(user_id):
    conn = get_connection()
    cur = conn.cursor()
    
    print(f"\n--- VERIFYING BEDROOM-AWARE VIEW SCORING ---")

    try:
        # 1. Find a target property (e.g., 3 bedrooms)
        cur.execute("SELECT id, title, bedrooms FROM \"Property\" WHERE bedrooms = 3 LIMIT 1")
        target = cur.fetchone()
        if not target:
            print("No 3-bedroom property found in DB.")
            return
        
        target_id, target_title, target_beds = target
        print(f"User views: {target_title} ({target_beds} Bedrooms)")

        # 2. Log a View
        cur.execute("INSERT INTO \"PropertyView\" (id, \"userId\", \"propertyId\") VALUES (%s, %s, %s)", 
                   (generate_id(), user_id, target_id))
        conn.commit()

        # 3. Get Recommendations and Check Trace
        explanation = recommendation_service.explain_recommendations(user_id)
        
        # Look for other 3-bedroom properties in results
        matches = [r for r in explanation['results'] if r.get('bedrooms') == 3 and r['propertyId'] != target_id]
        
        if matches:
            first_match = matches[0]
            print(f"\nRecommended: {first_match['title']} ({first_match['bedrooms']} Bedrooms)")
            breakdown = first_match.get('score_breakdown', {})
            
            if 'bedroom_preference' in breakdown:
                print(f"SUCCESS: 'bedroom_preference' found in breakdown: +{breakdown['bedroom_preference']}")
            else:
                print(f"FAILURE: 'bedroom_preference' NOT found in breakdown. Available: {list(breakdown.keys())}")
        else:
            print("No other 3-bedroom properties found in top recommendations.")

    finally:
        cur.execute("DELETE FROM \"PropertyView\" WHERE \"userId\" = %s", (user_id,))
        conn.commit()
        cur.close()
        conn.close()

if __name__ == "__main__":
    verify_bedroom_view("cmmelsash0032w63gz7x448bf")
