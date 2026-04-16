import os
import psycopg2
import pandas as pd
from dotenv import load_dotenv

# Absolute path to be safe
load_dotenv('c:/Users/Fretak/Desktop/HomeCar/server/.env')
db_url = os.getenv('DATABASE_URL')
if db_url and db_url.startswith('"') and db_url.endswith('"'):
    db_url = db_url[1:-1]

def check_status_of_dimensional_types():
    if not db_url:
        print("ERROR: DATABASE_URL not found.")
        return
    
    try:
        conn = psycopg2.connect(db_url)
        query = "SELECT id, \"propertyType\", status FROM \"Property\" WHERE \"propertyType\" LIKE '%*%'"
        df = pd.read_sql_query(query, conn)
        conn.close()
        
        print("--- Dimensional Properties Status ---")
        if df.empty:
            print("No properties with '*' in propertyType found in the WHOLE database.")
        else:
            print(df)
            print("\nStatus Counts for Dimensional Properties:")
            print(df['status'].value_counts())
    except Exception as e:
        print(f"FAILED: {e}")

if __name__ == "__main__":
    check_status_of_dimensional_types()
