import os
import psycopg2
from dotenv import load_dotenv
load_dotenv()

def check():
    try:
        conn = psycopg2.connect(os.getenv("DATABASE_URL"))
        cur = conn.cursor()
        query = """
            SELECT p.title, p.price, p."propertyType", p."assetType"
            FROM "Property" p 
            WHERE (p."propertyType" ILIKE '%villa%' OR p."propertyType" ILIKE '%apartment%' OR p."propertyType" ILIKE '%condominium%' OR p."propertyType" ILIKE '%compound%' OR p."propertyType" ILIKE '%building%')
            AND p."assetType" = 'HOME'
            LIMIT 5;
        """
        cur.execute(query)
        rows = cur.fetchall()
        print("--- VERIFYING SQL MATCHING ---")
        for r in rows:
            print(f"{r[0]} | {r[1]:,.0f} ETB | {r[2]} | {r[3]}")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    check()
