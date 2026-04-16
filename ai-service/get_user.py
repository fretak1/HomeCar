import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()
conn = psycopg2.connect(os.getenv('DATABASE_URL'))
cur = conn.cursor()
cur.execute('SELECT id FROM "User" LIMIT 1')
print(cur.fetchone()[0])
cur.close()
conn.close()
