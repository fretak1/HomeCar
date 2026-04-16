import os
import pandas as pd
from app.database import get_all_properties
from dotenv import load_dotenv

load_dotenv('server/.env')

def check_real_pool_matches():
    print("Fetching real property pool from DB...")
    pool = get_all_properties(include_images=False)
    
    if pool.empty:
        print("ERROR: Property pool is empty.")
        return

    test_types = ["5*5", "3*4", "Apartment", "Villa"]
    
    print(f"\nScanning pool ({len(pool)} total properties)...")
    for t_type in test_types:
        target = t_type.lower().strip()
        matches = pool[pool['propertyType'].str.lower().str.strip() == target]
        print(f"Type: '{t_type}' -> Found {len(matches)} matches.")
        if not matches.empty:
            print(f"   Example match IDs: {matches['id'].head(3).tolist()}")

if __name__ == "__main__":
    check_real_pool_matches()
