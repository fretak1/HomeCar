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
            WHERE (p.title ILIKE '%homes%' OR p.description ILIKE '%homes%')
            AND p."assetType" = 'HOME'
            LIMIT 5;
        """
        cur.execute(query)
        rows = cur.fetchall()
        print("--- VERIFYING KEYWORD MATCHING FOR 'homes' ---")
        if not rows:
            print("No literal matches for 'homes'.")
        for r in rows:
            print(f"{r[0]} | {r[1]:,.0f} ETB | {r[2]}")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    check()
