import os
import psycopg2
from dotenv import load_dotenv
load_dotenv()

def check():
    try:
        conn = psycopg2.connect(os.getenv("DATABASE_URL"))
        cur = conn.cursor()
        query = """
            (SELECT p.title, p.price, p."listingType" FROM "Property" p WHERE 'BUY' = ANY(p."listingType") ORDER BY p.price ASC LIMIT 2)
            UNION ALL
            (SELECT p.title, p.price, p."listingType" FROM "Property" p WHERE 'RENT' = ANY(p."listingType") ORDER BY p.price ASC LIMIT 2);
        """
        cur.execute(query)
        rows = cur.fetchall()
        print("--- DB SAMPLES (BUY & RENT) ---")
        for r in rows:
            print(f"{r[0]} | {r[1]:,.0f} ETB | {r[2]}")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    check()
