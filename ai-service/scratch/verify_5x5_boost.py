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
# We bypass the DB fetch by mocking the _compute... method or just feeding it data
limit = 10
# Initialize scores
pool['score'] = 0.0
pool['score_breakdown'] = [{} for _ in range(len(pool))]

# Run the weighted recommendations logic manually (simulating the service method)
# This is a reduced version of the logic to test just the intent matching
history = pd.DataFrame() # No interaction history for this test

results = service._compute_weighted_recommendations(
    history, 
    pool.copy(), 
    limit, 
    search_history=search_history
)

print("--- Mock Recommendation Results for '5*5' Search ---")
print(results[['id', 'propertyType', 'score', 'score_breakdown']])

has_boost = any('type_affinity' in b for b in results['score_breakdown'])
if has_boost:
    print("\nSUCCESS: AI successfully 'caught' the 5*5 property type!")
else:
    print("\nFAILURE: AI missed the 5*5 property type boost.")
