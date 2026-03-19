import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

def check_suzuki_under_1_5m():
    try:
        conn = psycopg2.connect(os.getenv("DATABASE_URL"))
        cur = conn.cursor()
        
        print("--- Suzuki Cars Under 1.5 Million ETB ---")
        sql = '''
            SELECT p.title, p.price, p."listingType", p.status
            FROM "Property" p
            WHERE p."assetType" = 'CAR' 
            AND p.brand ILIKE '%%suzuki%%'
            AND p.price < 1500000
        '''
        cur.execute(sql)
        rows = cur.fetchall()
        
        if not rows:
            print("No Suzuki cars found under 1.5 million ETB.")
        else:
            for r in rows:
                print(r)
            
        print(f"\nTotal Found: {len(rows)}")
        
        # Also check all Suzukis to see what's available
        print("\n--- All Suzuki Cars ---")
        cur.execute('SELECT p.title, p.price, p."listingType", p.status FROM "Property" p WHERE p."assetType" = \'CAR\' AND p.brand ILIKE \'%%suzuki%%\'')
        all_rows = cur.fetchall()
        for r in all_rows:
            print(r)
            
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_suzuki_under_1_5m()
