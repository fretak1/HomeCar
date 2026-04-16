import pandas as pd
import sys

sys.path.append('c:/Users/Fretak/Desktop/HomeCar/ai-service')
from app.services.recommendation import RecommendationService

# Frontend stores state globally. When moving to the Car tab, it keeps propertyType="Apartment"
# but changes searchType="vehicle".
search_history = pd.DataFrame([
    {
        "searchType": "vehicle",
        "filters": {"brand": "Toyota", "propertyType": "Apartment"}, 
        "createdAt": pd.Timestamp.now()
    },
    {
        "searchType": "property",
        "filters": {"propertyType": "Apartment", "brand": "any"},
        "createdAt": pd.Timestamp.now()
    }
])

pool = pd.DataFrame([
    {"id": "h1", "propertyType": "Apartment", "subcity": "Bole", "assetType": "HOME", "brand": None, "listingType": ["RENT"], "price": 1000},
    {"id": "c1", "propertyType": None, "subcity": "Bole", "assetType": "CAR", "brand": "Toyota", "listingType": ["RENT"], "price": 1000},
])

service = RecommendationService()
results = service._compute_weighted_recommendations(pd.DataFrame(), pool.copy(), 10, search_history=search_history)

print("--- Mock Recommendation Results for Sticky Cross-Tab Intents ---")
for r in results:
    print(f"ID: {r['id']}, Asset: {r['assetType']}, Score: {r['score']}, Breakdown: {r['score_breakdown']}")

has_apartment = any('type_affinity' in r['score_breakdown'] and r['propertyType'] == 'Apartment' for r in results)
has_toyota = any('brand_intent' in r['score_breakdown'] and r['brand'] == 'Toyota' for r in results)

if has_apartment and has_toyota:
    print("\nSUCCESS: AI successfully remembered BOTH 'Apartment' and 'Toyota' across tabs!")
else:
    print("\nFAILURE: AI missed one of the intents across tabs!")
