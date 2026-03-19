import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

def get_counts():
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    
    # Addis Ababa counts (case-insensitive and handling both spellings if they exist)
    query = """
    SELECT p."assetType", COUNT(*) 
    FROM "Property" p 
    JOIN "Location" l ON p."locationId" = l.id 
    WHERE l.city ILIKE 'Addis%' 
    GROUP BY p."assetType"
    """
    cur.execute(query)
    rows = cur.fetchall()
    
    print("--- Addis Ababa Listing Statistics ---")
    for row in rows:
        print(f"{row[0]}: {row[1]} listings")
    
    cur.close()
    conn.close()

if __name__ == "__main__":
    get_counts()
