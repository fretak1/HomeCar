import os
import psycopg2
from dotenv import load_dotenv
load_dotenv()

def count_stats():
    try:
        conn = psycopg2.connect(os.getenv("DATABASE_URL"))
        cur = conn.cursor()
        
        # Total Properties
        cur.execute("SELECT COUNT(*) FROM \"Property\"")
        total = cur.fetchone()[0]
        
        # Breakdown by Asset Type
        cur.execute("SELECT \"assetType\", COUNT(*) FROM \"Property\" GROUP BY \"assetType\"")
        asset_counts = cur.fetchall()
        
        # Breakdown by Listing Type
        cur.execute("SELECT 'BUY' as type, COUNT(*) FROM \"Property\" WHERE 'BUY' = ANY(\"listingType\")")
        buy_count = cur.fetchone()[1]
        cur.execute("SELECT 'RENT' as type, COUNT(*) FROM \"Property\" WHERE 'RENT' = ANY(\"listingType\")")
        rent_count = cur.fetchone()[1]
        
        print(f"TOTAL_PROPERTIES: {total}")
        for asset, count in asset_counts:
            print(f"{asset}_COUNT: {count}")
        print(f"FOR_SALE: {buy_count}")
        print(f"FOR_RENT: {rent_count}")
        
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    count_stats()
