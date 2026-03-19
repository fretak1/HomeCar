import asyncio
import sys
import os
import json

# Add project root to sys.path
sys.path.append(r'c:\Users\Fretak\Desktop\HomeCar\ai-service')

from app.services.assistant import assistant
from app.database import query_to_dataframe

async def test_smart_prediction():
    print("\n--- TESTING SMART AI PREDICTION ---")
    
    # Target: 3 Bedroom Villa in Bole
    target = {
        "city": "Addis Abeba",
        "subcity": "Bole",
        "region": "Addis Abeba",
        "village": "Bole Bulbula",
        "listingType": "BUY",
        "propertyType": "villa",
        "area": 150,
        "bedrooms": 3,
        "bathrooms": 2
    }

    # Fetch references (logic from api.py)
    p_type = target['propertyType']
    city_match = "Addis %"
    subcity = target['subcity']
    bedrooms = target['bedrooms']

    query = """
    SELECT p.price, p."propertyType", p.bedrooms, p.bathrooms, p.area,
           l.city, l.subcity, l.village
    FROM "Property" p
    LEFT JOIN "Location" l ON p."locationId" = l.id
    WHERE p."assetType" = 'HOME'
    AND p."propertyType" ILIKE %s
    AND p.bedrooms = %s
    AND (l.subcity ILIKE %s OR l.city ILIKE %s)
    AND p.status = 'AVAILABLE'
    LIMIT 15
    """
    params = (p_type, bedrooms, subcity, city_match)
    df = query_to_dataframe(query, params)

    if df.empty or len(df) < 3:
        print("Error: Not enough data in DB for testing.")
        return

    references = df.to_dict('records')
    print(f"Found {len(references)} reference listings.")
    
    print("Calling Smart AI Appraiser...")
    result = await assistant.get_smart_prediction(
        asset_type="HOME",
        target=target,
        references=references
    )

    print("\n--- AI APPRAISAL RESULT ---")
    print(f"Predicted Price: ETB {result['predicted_price']:,}")
    print(f"Confidence: {result['confidence']}")
    print(f"Reasoning: {result['reasoning']}")

if __name__ == "__main__":
    asyncio.run(test_smart_prediction())
