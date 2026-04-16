import os
import json
import psycopg2
from dotenv import load_dotenv

# Neon DB URL often ends with quotes in .env
load_dotenv('server/.env')
db_url = os.getenv('DATABASE_URL')
if db_url and db_url.startswith('"') and db_url.endswith('"'):
    db_url = db_url[1:-1]

try:
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()

    # Find any search log with '*' in propertyType
    # This query checks if propertyType is a key in the filters JSON and contains an asterisk
    cur.execute("SELECT filters FROM \"SearchFilterLog\" WHERE filters->>\'propertyType\' LIKE \'%*%\' LIMIT 10")
    rows = cur.fetchall()

    if not rows:
        print("No dimensional filter logs found in the database. Checking all search logs for context...")
        cur.execute("SELECT filters FROM \"SearchFilterLog\" ORDER BY \"createdAt\" DESC LIMIT 5")
        rows = cur.fetchall()

    print(f"Found {len(rows)} logs to inspect:")
    for i, row in enumerate(rows):
        print(f"\n--- Log {i+1} ---")
        print(json.dumps(row[0], indent=2))

    cur.close()
    conn.close()
except Exception as e:
    print(f"FAILED to connect or query: {e}")
