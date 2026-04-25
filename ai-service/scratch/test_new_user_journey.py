import sys
import os
import uuid
import pandas as pd
from datetime import datetime

# Add project root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.recommendation import recommendation_service
from app.database import get_connection

def test_journey():
    # 1. Generate a brand new User ID
    new_user_id = f"test_user_{uuid.uuid4().hex[:8]}"
    print(f"--- STARTING TEST FOR NEW USER: {new_user_id} ---")

    conn = get_connection()
    try:
        cur = conn.cursor()
        
        # 1.5 Create the dummy user record first (to satisfy Foreign Key)
        print("[Setup] Creating temporary test user...")
        cur.execute(
            'INSERT INTO "User" (id, email, name, role) VALUES (%s, %s, %s, %s)',
            (new_user_id, f"{new_user_id}@test.com", "Test User", "USER")
        )
        conn.commit()

        # 2. Phase 1: Pure Cold Start (No history/logs yet)
        print("\n[Phase 1] Cold Start: Requesting recommendations for a stranger...")
        results_p1 = recommendation_service.get_recommendations_for_user(new_user_id, limit=3)
        
        print("Top 3 Results (Should be newest properties):")
        for r in results_p1:
            print(f" - {r.get('assetType')}: {r.get('brand') or r.get('propertyType')} (Created: {r.get('createdAt')})")

        # 3. Phase 2: User performs a search
        print(f"\n[Phase 2] Simulating search intent: User searches for 'CAR' with 'Automatic' transmission...")
        
        # Insert a mock SearchFilterLog
        log_id = f"log_{uuid.uuid4().hex[:8]}"
        query_log = """
            INSERT INTO "SearchFilterLog" ("id", "userId", "searchType", "filters", "createdAt")
            VALUES (%s, %s, %s, %s, %s)
        """
        import json
        filters = json.dumps({"transmission": "Automatic", "assetType": "CAR"})
        cur.execute(query_log, (log_id, new_user_id, "VEHICLE", filters, datetime.now()))
        conn.commit()
        print("Fake search log inserted successfully.")

        # 4. Phase 3: Check for instant adaptivity
        print("\n[Phase 3] Instant Pivot: Requesting recommendations again...")
        results_p2 = recommendation_service.get_recommendations_for_user(new_user_id, limit=3)
        
        print("Top 3 Results (Should now be Automatic Cars):")
        for r in results_p2:
            score = r.get('score', 0)
            breakdown = r.get('score_breakdown', {})
            print(f" - {r.get('assetType')}: {r.get('brand')} {r.get('model')} | Score: {score:.2f} | Reasons: {list(breakdown.keys())}")

        # 5. Cleanup
        print("\n[Cleanup] Removing test user and logs...")
        cur.execute('DELETE FROM "SearchFilterLog" WHERE "userId" = %s', (new_user_id,))
        cur.execute('DELETE FROM "User" WHERE id = %s', (new_user_id,))
        conn.commit()
        print("Database cleaned.")

    except Exception as e:
        print(f"Error during test: {e}")
        conn.rollback()
    finally:
        conn.close()
    
    print("\n--- TEST COMPLETE ---")

if __name__ == "__main__":
    test_journey()
