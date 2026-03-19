import pandas as pd
from app.database import query_to_dataframe
from app.services.prediction_service import prediction_service

def verify_valuation():
    # Exact test case the user provided
    test_case = {
        "region": "Addis Ababa",
        "city": "Addis Ababa",
        "subcity": "Bole",
        "village": "Atlas",
        "propertyType": "apartment",
        "listingType": "RENT",
        "bedrooms": 3,
        "bathrooms": 2,
        "area": 300 
    }
    
    # 1. Fetch exactly matching real DB evidence
    print(f"--- REAL DATABASE EVIDENCE FOR {test_case['subcity'].upper()} {test_case['propertyType'].upper()} {test_case['listingType'].upper()} ---")
    query = f"""
    SELECT p.title, p.price, p.area, l.subcity, p.bedrooms, p.price/p.area as "PricePerSQM"
    FROM "Property" p
    JOIN "Location" l ON p."locationId" = l.id
    WHERE l.city = '{test_case["city"]}' 
      AND l.subcity = '{test_case["subcity"]}'
      AND p."propertyType" = '{test_case["propertyType"]}' 
      AND p."listingType"::text LIKE '%{test_case["listingType"]}%'
    """
    evidence = query_to_dataframe(query)
    
    if evidence.empty:
        print("No exact matches found in the raw database for this subcity combination.")
    else:
        print(f"Found {len(evidence)} comparable listings.")
        print(evidence.to_string(index=False))
        print(f"\nAverage Price in DB: {evidence['price'].mean():,.2f} ETB")
        
        # logic check
        avg_sqm_price = evidence['PricePerSQM'].mean()
        print(f"Average Price per SQM: {avg_sqm_price:,.2f} ETB")
        print(f"Linear Math Check (Avg SQM * 300 area): {avg_sqm_price * 300:,.2f} ETB")

    # 2. Call the AI
    print("\n--- AI PREDICTION OVER THIS DATA ---")
    ai_result = prediction_service.predict_house(test_case)
    
    print(f"User Asked For: {test_case['area']} SQM {test_case['bedrooms']}-bed {test_case['propertyType']} in {test_case['subcity']}, {test_case['region']}")
    print(f"AI Valuation: {ai_result.get('predicted_price', 0):,.2f} ETB")
    print(f"AI Reasoning: {ai_result.get('reasoning', '')}")

if __name__ == "__main__":
    verify_valuation()
