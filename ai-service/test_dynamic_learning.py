import asyncio
import os
import psycopg2
from dotenv import load_dotenv
from app.services.assistant import assistant, DynamicLookup

load_dotenv()

async def test_dynamic_learning():
    conn = None
    try:
        conn = psycopg2.connect(os.getenv("DATABASE_URL"))
        cur = conn.cursor()
        
        # 1. Setup New Data
        print("--- Setting up new data in database ---")
        loc_id = "test_loc_gondar"
        prop_id = "test_prop_rivian"
        user_id = "cmmcdcg490000w6msm1vqehq6" # Verified existing user ID
        
        # Insert Location
        cur.execute(
            "INSERT INTO \"Location\" (id, city, subcity, village) VALUES (%s, %s, %s, %s) ON CONFLICT (id) DO NOTHING",
            (loc_id, "Gondar", "North Gondar", "Old Town")
        )
        
        # Insert Property (Rivian car)
        cur.execute(
            """INSERT INTO "Property" (id, title, description, "assetType", "listingType", price, status, brand, model, year, "ownerId", "listedById", "locationId", "updatedAt") 
               VALUES (%s, %s, %s, 'CAR', '{FOR_SALE,BUY}', 5000000, 'AVAILABLE', 'Rivian', 'R1S', 2024, %s, %s, %s, NOW())
               ON CONFLICT (id) DO NOTHING""",
            (prop_id, "New Rivian R1S", "Dynamic test car", user_id, user_id, loc_id)
        )
        conn.commit()

        # 2. Force Refresh
        print("--- Refreshing AI Dynamic Lookups ---")
        DynamicLookup.refresh()
        
        # 3. Test Lookup Logic
        print("\n--- Testing Lookup Logic (No API) ---")
        locs, types, brands = DynamicLookup.get_data()
        
        print(f"Sample Locations: {locs[:10]}...")
        print(f"All Brands: {brands}")
        
        if "gondar" in locs and "rivian" in brands:
            print("\nSUCCESS: DynamicLookup detected 'Gondar' and 'Rivian'!")
        else:
            print(f"\nFAILURE: Missing data. Gondar in locs: {'gondar' in locs}, Rivian in brands: {'rivian' in brands}")

        # 4. Cleanup
        print("\n--- Cleaning up test data ---")
        cur.execute("DELETE FROM \"Property\" WHERE id = %s", (prop_id,))
        cur.execute("DELETE FROM \"Location\" WHERE id = %s", (loc_id,))
        conn.commit()

    except Exception as e:
        print(f"Error during test: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    asyncio.run(test_dynamic_learning())
