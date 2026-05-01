import os
import psycopg2
from dotenv import load_dotenv
load_dotenv()

def check():
    try:
        conn = psycopg2.connect(os.getenv("DATABASE_URL"))
        cur = conn.cursor()
        query = "SELECT DISTINCT \"propertyType\" FROM \"Property\" WHERE \"assetType\" = 'HOME' LIMIT 20;"
        cur.execute(query)
        rows = cur.fetchall()
        print("--- PROPERTY TYPES IN DB ---")
        for r in rows:
            print(f"Type: {r[0]}")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    check()
