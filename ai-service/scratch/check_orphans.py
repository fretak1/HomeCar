import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

def check_orphans():
    conn = psycopg2.connect(os.getenv("DATABASE_URL"))
    cur = conn.cursor()
    
    cur.execute('SELECT COUNT(*) FROM "Property" WHERE "locationId" IS NULL')
    print(f"Properties with NULL locationId: {cur.fetchone()[0]}")
    
    cur.execute('SELECT COUNT(*) FROM "Property" WHERE "assetType" = \'CAR\' AND "locationId" IS NULL')
    print(f"Cars with NULL locationId: {cur.fetchone()[0]}")
    
    cur.close()
    conn.close()

if __name__ == "__main__":
    check_orphans()
