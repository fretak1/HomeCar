import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

def check_price_distribution():
    conn = psycopg2.connect(os.getenv("DATABASE_URL"))
    cur = conn.cursor()
    
    query = """
    SELECT 
        COUNT(*) as total,
        MIN(price) as min_price,
        MAX(price) as max_price,
        AVG(price) as avg_price
    FROM "Property"
    WHERE "assetType" = 'CAR';
    """
    
    cur.execute(query)
    res = cur.fetchone()
    print(f"Total Cars: {res[0]}")
    print(f"Min Price: {res[1]:,.0f} ETB")
    print(f"Max Price: {res[2]:,.0f} ETB")
    print(f"Avg Price: {res[3]:,.0f} ETB")
    
    # Check count in buckets
    query_buckets = """
    SELECT 
        CASE 
            WHEN price < 500000 THEN 'Under 500k'
            WHEN price < 1000000 THEN '500k - 1M'
            WHEN price < 2000000 THEN '1M - 2M'
            ELSE 'Over 2M'
        END as bucket,
        COUNT(*)
    FROM "Property"
    WHERE "assetType" = 'CAR'
    GROUP BY bucket;
    """
    cur.execute(query_buckets)
    for r in cur.fetchall():
        print(f"{r[0]}: {r[1]}")
        
    cur.close()
    conn.close()

if __name__ == "__main__":
    check_price_distribution()
