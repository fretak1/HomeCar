from app.database import get_connection

def check():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute('SELECT status, COUNT(*) FROM "Property" WHERE model ILIKE %s GROUP BY status', ('%Tucson%',))
    rows = cur.fetchall()
    print(f"Status for Tucsons:")
    for r in rows:
        print(r)
    cur.close()
    conn.close()

if __name__ == "__main__":
    check()
