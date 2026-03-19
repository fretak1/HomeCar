import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

def check_buildings():
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    
    # Check building statistics in Addis
    query = """
    SELECT p.area, p.bedrooms, p.bathrooms, p.price, l.subcity 
    FROM "Property" p 
    JOIN "Location" l ON p."locationId" = l.id 
    WHERE p."propertyType" = 'building' AND l.city ILIKE 'Addis%'
    """
    cur.execute(query)
    rows = cur.fetchall()
    
    print(f"--- Addis Ababa Building Statistics ({len(rows)} found) ---")
    prices = [r[3] for r in rows]
    if prices:
        print(f"Min Price: {min(prices):,.2f} ETB")
        print(f"Max Price: {max(prices):,.2f} ETB")
        print(f"Avg Price: {sum(prices)/len(rows):,.2f} ETB")
        
        # Check a specific range around 90 rooms
        print("\nBuildings with high room counts (>50):")
        for r in rows:
            if r[1] > 50:
                print(f"Area: {r[0]}, Beds: {r[1]}, Baths: {r[2]}, Price: {r[3]:,.2f} ETB, Subcity: {r[4]}")
    else:
        print("No buildings found in Addis Ababa.")
    
    cur.close()
    conn.close()

if __name__ == "__main__":
    check_buildings()
