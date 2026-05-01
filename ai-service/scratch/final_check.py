import os
import psycopg2
from dotenv import load_dotenv
load_dotenv()

def check():
    try:
        conn = psycopg2.connect(os.getenv("DATABASE_URL"))
        cur = conn.cursor()
        query = """
            SELECT p.title, p.price, l.city, l.village 
            FROM "Property" p
            JOIN "Location" l ON p."locationId" = l.id
            WHERE p."propertyType" ILIKE '%%studio%%'
            AND 'BUY' = ANY(p."listingType")
            ORDER BY p.price ASC
            LIMIT 5;
        """
        cur.execute(query)
        rows = cur.fetchall()
        print("--- ACTUAL CHEAPEST STUDIOS FOR SALE ---")
        for r in rows:
            print(f"{r[0]} | {r[1]:,.0f} ETB | {r[2]}, {r[3]}")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    check()
