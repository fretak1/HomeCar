import psycopg2
import os

db_url = "postgresql://neondb_owner:npg_Kg6cBIa1Nkrn@ep-frosty-poetry-aipab698-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

try:
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    
    # 1. See raw location data for a few properties
    print("--- Sample Location Data ---")
    cur.execute('''
        SELECT l.city, l.subcity, l.village, COUNT(*)
        FROM "Location" l
        JOIN "Property" p ON p."locationId" = l.id
        GROUP BY l.city, l.subcity, l.village
        ORDER BY COUNT(*) DESC
        LIMIT 20
    ''')
    for row in cur.fetchall():
        print(row)
        
    # 2. Check specifically for 'Addis' or 'Addis Ababa'
    print("\n--- Addis Ababa Matches ---")
    cur.execute('''
        SELECT city, subcity, village, COUNT(*)
        FROM "Location" l
        JOIN "Property" p ON p."locationId" = l.id
        WHERE city ILIKE '%Addis%' OR subcity ILIKE '%Addis%' OR village ILIKE '%Addis%'
        GROUP BY city, subcity, village
    ''')
    for row in cur.fetchall():
        print(row)

    cur.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
