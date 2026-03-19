import sys
import os
import pandas as pd
import numpy as np

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.recommendation import recommendation_service

def test_kids_logic():
    print("\n--- TESTING DYNAMIC KIDS BOOST LOGIC ---")
    
    # Mock data pool
    pool = pd.DataFrame([
        {'id': 'p1', 'title': '1 Bed Studio', 'bedrooms': 1, 'assetType': 'HOME', 'area': 50, 'price': 1000, 'subcity': 'Bole', 'listingType': ['RENT']},
        {'id': 'p2', 'title': '2 Bed Apt', 'bedrooms': 2, 'assetType': 'HOME', 'area': 100, 'price': 2000, 'subcity': 'Bole', 'listingType': ['RENT']},
        {'id': 'p3', 'title': '3 Bed House', 'bedrooms': 3, 'assetType': 'HOME', 'area': 200, 'price': 3000, 'subcity': 'Bole', 'listingType': ['RENT']},
        {'id': 'p4', 'title': '4 Bed Villa', 'bedrooms': 4, 'assetType': 'HOME', 'area': 300, 'price': 4000, 'subcity': 'Bole', 'listingType': ['RENT']},
    ])

    test_cases = [
        {'kids': 'none', 'expected_beds': None},
        {'kids': '1', 'expected_beds': 1},
        {'kids': '2+', 'expected_beds': 2},
        {'kids': '3', 'expected_beds': 3},
    ]

    for case in test_cases:
        print(f"\nScenario: User has {case['kids']} kids")
        user_profile = pd.DataFrame([{'kids': case['kids'], 'marriageStatus': 'single'}])
        
        # We need to mock _compute_weighted_recommendations internal call or just test the logic
        # For simplicity, let's call the service and see the trace
        # Since we use real DB usually, we might need a more controlled test
        
        # Let's just verify the parsing logic by running a quick trace if possible
        # Or I can just print the logic results if I were to run it
        
        # Test 1: Kids = 2 -> Should boost 2, 3, 4 bedrooms
        results = recommendation_service._compute_weighted_recommendations(
            pd.DataFrame(), # history
            pool.copy(),    # pool
            10,             # limit
            user_profile,
            pd.DataFrame()  # search_history
        )
        
        boosted = results[results['score'] > 0]
        if case['expected_beds'] is not None:
            min_beds = boosted['bedrooms'].min()
            print(f"Boosted Bedrooms start from: {min_beds}")
            if min_beds == case['expected_beds']:
                print(f"SUCCESS: Threshold is {case['expected_beds']}+ beds")
            else:
                print(f"FAILURE: Threshold is {min_beds}, expected {case['expected_beds']}")
        else:
            if boosted.empty:
                print("SUCCESS: No demographic boost for 'none'")
            else:
                print(f"FAILURE: Unexpected boost for 'none': {boosted['title'].tolist()}")

if __name__ == "__main__":
    test_kids_logic()
