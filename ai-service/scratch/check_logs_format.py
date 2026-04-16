import os
import json
import psycopg2
from dotenv import load_dotenv

load_dotenv('server/.env')
conn = psycopg2.connect(os.getenv('DATABASE_URL'))
cur = conn.cursor()

# Find any search log with '*' in propertyType
cur.execute("SELECT filters FROM \"SearchFilterLog\" WHERE filters->>\'propertyType\' LIKE \'%*%\' LIMIT 5")
rows = cur.fetchall()

print("Dimensional Filter Logs found:")
for row in rows:
    print(json.dumps(row[0], indent=2))

cur.close()
conn.close()
