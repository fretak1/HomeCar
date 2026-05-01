import asyncio
import sys
import os
from dotenv import load_dotenv
load_dotenv()
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.services.assistant import _search_db

def main():
    res = _search_db(asset_type='HOME', query_text='houses', sort_mode='ASC')
    print("--- SEARCH WITH KEYWORD 'houses' ---")
    print(res)
    
    res_no_text = _search_db(asset_type='HOME', query_text='', sort_mode='ASC')
    print("\n--- SEARCH WITHOUT KEYWORD (BROAD) ---")
    print(res_no_text)

if __name__ == '__main__':
    main()
