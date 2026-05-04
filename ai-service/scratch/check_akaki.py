
import asyncio
import os
from app.database import get_connection

async def check_listings():
    conn = get_connection()
    cur = conn.cursor()
    
    # Check for anything in Akaki area regardless of spelling
    cur.execute("""
        SELECT p.title, p.price, l.city, l.subcity, l.village, p.bedrooms
        FROM "Property" p
        LEFT JOIN "Location" l ON p."locationId" = l.id
        WHERE (l.city ILIKE '%Akaki%' OR l.subcity ILIKE '%Akaki%' OR l.village ILIKE '%Akaki%')
        AND p."assetType" = 'HOME'
        AND p.status = 'AVAILABLE'
    """)
    rows = cur.fetchall()
    print(f"Found {len(rows)} listings in Akaki area.")
    for r in rows:
        print(f" - {r}")
    
    cur.close()
    conn.close()

if __name__ == "__main__":
    asyncio.run(check_listings())
