import sys
import os
import json
import pandas as pd

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import get_connection, get_user_search_history, get_all_properties

def debug_mercedes(user_id):
    print(f"DEBUGGING MERCEDES FOR USER: {user_id}")
    
    # 1. Check Mercedes in Pool
    pool = get_all_properties()
    mercedes_count = len(pool[pool['brand'].str.contains('Mercedes', case=False, na=False)])
    print(f"Total Mercedes in Available Pool: {mercedes_count}")
    if mercedes_count > 0:
        print("Sample Mercedes:")
        print(pool[pool['brand'].str.contains('Mercedes', case=False, na=False)][['id', 'title', 'brand', 'price']].head())

    # 2. Check Search History
    search_history = get_user_search_history(user_id)
    print(f"\nUser Search History (Count: {len(search_history)}):")
    for _, row in search_history.iterrows():
        f = row['filters']
        print(f"Type: {type(f)} | Filters: {f}")
        if isinstance(f, str):
            try:
                parsed = json.loads(f)
                print(f"  -> Parsed Brand: {parsed.get('brand')}")
            except:
                print("  -> Could not parse JSON")

if __name__ == "__main__":
    user_id = sys.argv[1] if len(sys.argv) > 1 else "cmmelsash0032w63gz7x448bf"
    debug_mercedes(user_id)
