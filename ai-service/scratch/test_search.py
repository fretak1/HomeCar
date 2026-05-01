import asyncio
import os
import sys
from dotenv import load_dotenv

# Add ai-service to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

from app.services.intent_parser import intent_parser
from app.services.assistant import _search_db

async def main():
    msg = "I want to buy a Hyundai under 1 million ETB."
    
    # 1. Parse intent
    print("Parsing intent...")
    intent_data = await intent_parser.parse(msg)
    print("Intent Output:", intent_data)
    
    filters = intent_data.get("filters", {})
    max_price = filters.get("price_max")
    min_price = filters.get("price_min")
    query_text = filters.get("query_text", "")
    
    # 2. Test assistant logic for cleaning query text
    clean_msg = msg.lower()
    for w in ['cheap', 'lowest', 'affordable', 'budget', 'cheapest', 'least', 'home', 'homes', 'house', 'houses', 'property', 'properties']:
        query_text = query_text.replace(w, "").strip()
        
    print(f"Cleaned query text: '{query_text}'")
    
    # 3. Search DB
    print("Searching DB...")
    results = _search_db(
        asset_type="CAR",
        max_price=max_price,
        min_price=min_price,
        query_text=query_text,
        brand=intent_data.get("filters", {}).get("entities", [{}])[0].get("brand"),
        listing_intent="BUY"
    )
    
    print("DB Results:")
    print(results)

if __name__ == "__main__":
    asyncio.run(main())
