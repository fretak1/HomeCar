import sys
import os
import pandas as pd

# Add project root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.recommendation import recommendation_service

user_id = "cmmcdcg490000w6msm1vqehq6"

print(f"Testing recommendations for user: {user_id}")
results = recommendation_service.get_recommendations_for_user(user_id, limit=5)

if not results:
    print("No recommendations found.")
else:
    for i, r in enumerate(results):
        print(f"\nResult {i+1}: {r.get('assetType')} - {r.get('propertyType') or r.get('brand')}")
        print(f"Total Score: {r.get('score')}")
        print(f"Breakdown: {r.get('score_breakdown')}")

print("\nVerifying Explanation API...")
explanation = recommendation_service.explain_recommendations(user_id)
print(f"Logic components: {[c['name'] for c in explanation['logic_components']]}")
