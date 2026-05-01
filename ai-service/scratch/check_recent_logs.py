
import sys
import os

# Fix path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.append(parent_dir)

import pandas as pd
from app.database import query_to_dataframe

def check_logs():
    query = 'SELECT "searchType", filters, "createdAt" FROM "SearchFilterLog" ORDER BY "createdAt" DESC LIMIT 10'
    df = query_to_dataframe(query)
    if df.empty:
        print("No logs found")
        return
    
    print("Recent Search Logs:")
    for i, row in df.iterrows():
        print(f"[{i}] Type: {row['searchType']}, Filters: {row['filters']}")

if __name__ == "__main__":
    check_logs()
