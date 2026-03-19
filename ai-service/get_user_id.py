import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

def get_id():
    try:
        conn = psycopg2.connect(os.getenv("DATABASE_URL"))
        cur = conn.cursor()
        cur.execute("SELECT \"ownerId\" FROM \"Property\" WHERE \"ownerId\" IS NOT NULL LIMIT 1")
        res = cur.fetchone()
        if res:
            with open("user_id.txt", "w") as f:
                f.write(res[0])
            print(f"Found user ID: {res[0]}")
        else:
            print("No user ID found in Property table.")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    get_id()
