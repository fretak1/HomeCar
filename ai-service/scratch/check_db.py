import psycopg2
import os

db_url = "postgresql://neondb_owner:npg_Kg6cBIa1Nkrn@ep-frosty-poetry-aipab698-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

try:
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    
    cur.execute('SELECT DISTINCT "propertyType" FROM "Property"')
    types = [r[0] for r in cur.fetchall()]
    print(f"Prop Types in DB: {types}")

    cur.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
