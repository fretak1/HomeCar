import pandas as pd
import numpy as np

def simulate_boost(kids_val, pool):
    # This is EXACTLY the logic I added to recommendation.py
    profile = {'kids': kids_val}
    kids_str = str(profile.get('kids', 'none')).lower().replace('+', '')
    
    kids_count = 0
    if kids_str not in ['none', 'nan', 'null', '']:
        try:
            kids_count = int(kids_str)
        except: pass

    results = pool.copy()
    results['score'] = 0.0
    
    if kids_count > 0:
        # Rule: Boost properties with Bedroom Count >= Kid Count
        matches_beds = results[results['bedrooms'] >= kids_count].index
        results.loc[matches_beds, 'score'] += 0.6
        
    return results, kids_count

def run_tests():
    pool = pd.DataFrame([
        {'id': 'p1', 'bedrooms': 1},
        {'id': 'p2', 'bedrooms': 2},
        {'id': 'p3', 'bedrooms': 3},
    ])

    test_cases = [
        ('none', []),
        ('1', [1, 2, 3]),
        ('2', [2, 3]),
        ('3', [3]),
        ('4', []),
    ]

    for kids_val, expected_beds in test_cases:
        res, count = simulate_boost(kids_val, pool)
        boosted_beds = res[res['score'] > 0]['bedrooms'].tolist()
        
        status = "PASSED" if set(boosted_beds) == set(expected_beds) else "FAILED"
        print(f"Kids: {kids_val:<5} | Expected Beds: {str(expected_beds):<15} | Actual Boosted: {str(boosted_beds):<15} | {status}")

if __name__ == "__main__":
    run_tests()
