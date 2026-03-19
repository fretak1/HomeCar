import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

def check_counts():
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("DATABASE_URL not found in environment")
        return

    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        cur.execute("SELECT count(*) FROM \"Property\" WHERE \"assetType\" = 'HOME'")
        properties = cur.fetchone()[0]
        
        cur.execute("SELECT count(*) FROM \"Property\" WHERE \"assetType\" = 'CAR'")
        cars = cur.fetchone()[0]
        
        print(f"Properties in DB: {properties}")
        print(f"Cars in DB: {cars}")
        
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_counts()
