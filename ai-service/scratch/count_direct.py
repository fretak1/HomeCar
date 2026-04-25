import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

conn = psycopg2.connect(os.getenv('DATABASE_URL'))
cur = conn.cursor()

def get_count(table):
    try:
        cur.execute(f'SELECT COUNT(*) FROM "{table}"')
        return cur.fetchone()[0]
    except:
        return 0

print(f"Favorites: {get_count('Favorite')}")
print(f"Applications: {get_count('Application')}")
print(f"Transactions: {get_count('Transaction')}")
print(f"Views: {get_count('PropertyView')}")

conn.close()
