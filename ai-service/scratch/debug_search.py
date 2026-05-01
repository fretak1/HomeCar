import asyncio
import sys
import os
from dotenv import load_dotenv
load_dotenv()
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.services.assistant import _search_db

def main():
    results = _search_db(
        asset_type='HOME',
        prop_type='STUDIO',
        listing_intent='BUY',
        sort_mode='ASC',
        query_text='cheapest'
    )
    print("--- RESULTS WITH QUERY_TEXT ---")
    print(results)
    
    results_no_text = _search_db(
        asset_type='HOME',
        prop_type='STUDIO',
        listing_intent='BUY',
        sort_mode='ASC',
        query_text=''
    )
    print("\n--- RESULTS WITHOUT QUERY_TEXT ---")
    print(results_no_text)

if __name__ == '__main__':
    main()
