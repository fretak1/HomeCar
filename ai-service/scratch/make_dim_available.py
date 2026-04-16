import os
import psycopg2
from dotenv import load_dotenv

# Absolute path to be safe
load_dotenv('c:/Users/Fretak/Desktop/HomeCar/server/.env')
db_url = os.getenv('DATABASE_URL')
if db_url and db_url.startswith('"') and db_url.endswith('"'):
    db_url = db_url[1:-1]

try:
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    cur.execute("UPDATE \"Property\" SET status = 'AVAILABLE' WHERE \"propertyType\" LIKE '%*%';")
    conn.commit()
    print(f"Updated {cur.rowcount} dimensional properties to AVAILABLE.")
    cur.close()
    conn.close()
except Exception as e:
    print(f"Failed to update properties: {e}")
