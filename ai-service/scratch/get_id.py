import psycopg2
import os

def get_id():
    try:
        conn = psycopg2.connect(os.getenv("DATABASE_URL"))
        cur = conn.cursor()
        cur.execute('SELECT id FROM "Property" LIMIT 1')
        row = cur.fetchone()
        if row:
            print(row[0])
        else:
            print("No properties found")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    get_id()
