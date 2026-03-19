import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

def fetch_10_samples():
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("DATABASE_URL not found")
        return

    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        query = """
        SELECT l.subcity, p."propertyType", p.area, p.bedrooms, p.bathrooms, p.price
        FROM "Property" p
        JOIN "Location" l ON p."locationId" = l.id
        WHERE p."assetType" = 'HOME'
        LIMIT 10
        """
        cur.execute(query)
        rows = cur.fetchall()
        
        print("| # | Sub-city | Type | Area | Beds | Baths | Real Price |")
        print("|---|---|---|---|---|---|---|")
        for i, row in enumerate(rows):
            print(f"| {i+1} | {row[0]} | {row[1]} | {row[2]} | {row[3]} | {row[4]} | ${row[5]:,.0f} |")
        
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    fetch_10_samples()
