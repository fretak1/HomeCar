import pandas as pd
import numpy as np
from app.services.recommendation import RecommendationService

# Mock search history with a 5*5 selection
search_history = pd.DataFrame([
    {
        "searchType": "property",
        "filters": {"propertyType": "5*5", "subCity": "Bole"},
        "createdAt": pd.Timestamp.now()
    }
])

# Mock property pool
pool = pd.DataFrame([
    {"id": "p1", "propertyType": "5*5", "subcity": "Bole", "assetType": "HOME", "listingType": ["RENT"], "price": 1000},
    {"id": "p2", "propertyType": "Apartment", "subcity": "Bole", "assetType": "HOME", "listingType": ["RENT"], "price": 1000},
    {"id": "p3", "propertyType": "5*5", "subcity": "Arada", "assetType": "HOME", "listingType": ["RENT"], "price": 1000},
])

service = RecommendationService()
limit = 10

# Run the weighted recommendations logic
results = service._compute_weighted_recommendations(
    pd.DataFrame(), # interaction history
    pool.copy(), 
    limit, 
    search_history=search_history
)

print("--- Mock Recommendation Results for '5*5' Search ---")
for r in results:
    print(f"ID: {r['id']}, Type: {r['propertyType']}, Score: {r['score']}, Breakdown: {r['score_breakdown']}")

has_boost = any('type_affinity' in r['score_breakdown'] for r in results)
if has_boost:
    print("\nSUCCESS: AI successfully 'caught' the 5*5 property type!")
else:
    print("\nFAILURE: AI missed the 5*5 property type boost.")
