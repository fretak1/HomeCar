import os
import psycopg2
from dotenv import load_dotenv
load_dotenv()

def check():
    try:
        conn = psycopg2.connect(os.getenv("DATABASE_URL"))
        cur = conn.cursor()
        query = """
            SELECT p.title, p.price, p."propertyType", l.city, l.village 
            FROM "Property" p
            JOIN "Location" l ON p."locationId" = l.id
            WHERE p."assetType" = 'HOME' 
            AND p."propertyType" ILIKE '%%studio%%'
            AND 'BUY' = ANY(p."listingType")
            ORDER BY p.price ASC
            LIMIT 5;
        """
        cur.execute(query)
        rows = cur.fetchall()
        print("--- CHEAPEST STUDIOS FOR SALE IN DB ---")
        if not rows:
            print("No studios for sale found.")
        for r in rows:
            print(f"{r[0]} | {r[1]:,.0f} ETB | {r[3]}, {r[4]}")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    check()
