import os
import psycopg2
import pandas as pd
from dotenv import load_dotenv

load_dotenv('server/.env')
db_url = os.getenv('DATABASE_URL').strip('"')

def check_status_of_dimensional_types():
    conn = psycopg2.connect(db_url)
    query = "SELECT id, \"propertyType\", status FROM \"Property\" WHERE \"propertyType\" LIKE '%*%'"
    df = pd.read_sql_query(query, conn)
    conn.close()
    
    print("--- Dimensional Properties Status ---")
    if df.empty:
        print("No properties with '*' in propertyType found.")
    else:
        print(df)
        print("\nStatusCounts:")
        print(df['status'].value_counts())

if __name__ == "__main__":
    check_status_of_dimensional_types()
