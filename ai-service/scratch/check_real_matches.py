import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

def list_all_cheap_cars():
    conn = psycopg2.connect(os.getenv("DATABASE_URL"))
    cur = conn.cursor()
    
    query = """
    SELECT p.id, p.title, p.price, p.brand, p.model, p.year, l.city, l.region
    FROM "Property" p
    LEFT JOIN "Location" l ON p."locationId" = l.id
    WHERE p."assetType" = 'CAR' AND p.price < 500000
    ORDER BY p.price ASC;
    """
    
    cur.execute(query)
    rows = cur.fetchall()
    
    print(f"Found {len(rows)} cars under 500,000 ETB:")
    for r in rows:
        loc = f"{r[6]}, {r[7]}" if r[6] else "NULL LOCATION"
        print(f"ID: {r[0]} | {r[1]} | {r[2]:,.0f} ETB | {loc}")
        
    cur.close()
    conn.close()

if __name__ == "__main__":
    list_all_cheap_cars()
