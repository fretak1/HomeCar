import pandas as pd
import sys

sys.path.append('c:/Users/Fretak/Desktop/HomeCar/ai-service')
from app.services.recommendation import RecommendationService

# Index 0 is newest. Index 1 is oldest.
# User searched "Apartment", then changed to "any", then "5*5"!
search_history = pd.DataFrame([
    {
        "searchType": "property",
        "filters": {"propertyType": "5*5", "subCity": "any"},
        "createdAt": pd.Timestamp.now()
    },
    {
        "searchType": "property",
        "filters": {"propertyType": "any", "subCity": "any"},
        "createdAt": pd.Timestamp.now()
    },
    {
        "searchType": "property",
        "filters": {"propertyType": "Apartment", "subCity": "any"},
        "createdAt": pd.Timestamp.now()
    }
])

pool = pd.DataFrame([
    {"id": "p1", "propertyType": "5*5", "subcity": "Bole", "assetType": "HOME", "listingType": ["RENT"], "price": 1000},
    {"id": "p2", "propertyType": "Apartment", "subcity": "Bole", "assetType": "HOME", "listingType": ["RENT"], "price": 1000},
    {"id": "p3", "propertyType": "Villa", "subcity": "Arada", "assetType": "HOME", "listingType": ["RENT"], "price": 1000},
])

service = RecommendationService()
results = service._compute_weighted_recommendations(pd.DataFrame(), pool.copy(), 10, search_history=search_history)

print("--- Mock Recommendation Results for Multiple Intents ---")
for r in results:
    print(f"ID: {r['id']}, Type: {r['propertyType']}, Score: {r['score']}, Breakdown: {r['score_breakdown']}")

has_apartment = any('type_affinity' in r['score_breakdown'] and r['propertyType'] == 'Apartment' for r in results)
has_5x5 = any('type_affinity' in r['score_breakdown'] and r['propertyType'] == '5*5' for r in results)

if has_apartment and has_5x5:
    print("\nSUCCESS: AI successfully remembered BOTH '5*5' and 'Apartment'!")
else:
    print("\nFAILURE: AI missed one of the intents.")
