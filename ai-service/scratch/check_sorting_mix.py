import asyncio
import sys
import os
from dotenv import load_dotenv
load_dotenv()
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.services.assistant import _search_db

def main():
    res = _search_db(asset_type='HOME', listing_intent=None, sort_mode='ASC')
    print("--- BROAD SEARCH (INTENT: NONE) ---")
    print(res)

if __name__ == '__main__':
    main()
