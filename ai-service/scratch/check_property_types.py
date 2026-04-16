import os
import psycopg2
import pandas as pd
from dotenv import load_dotenv

# Use absolute path to shared .env if possible, otherwise relative
load_dotenv(dotenv_path="c:/Users/Fretak/Desktop/HomeCar/server/.env")

DATABASE_URL = os.getenv("DATABASE_URL")

def check_property_types():
    try:
        conn = psycopg2.connect(DATABASE_URL)
        query = "SELECT DISTINCT \"propertyType\" FROM \"Property\""
        df = pd.read_sql_query(query, conn)
        conn.close()
        
        print("--- DIMENSIONAL PROPERTY TYPES IN DB ---")
        # Look for types containing '*' or specifically matching the 5*5 pattern
        dimensional = df[df['propertyType'].str.contains(r'\*', na=False, regex=True)]
        if dimensional.empty:
            print("No dimensional property types (containing '*') found in DB.")
            print("\nAll distinct types currently in DB:")
            print(df['propertyType'].tolist())
        else:
            print(dimensional)
            
    except Exception as e:
        print(f"Error checking DB: {e}")

if __name__ == "__main__":
    check_property_types()
