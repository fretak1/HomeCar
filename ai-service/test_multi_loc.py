import re
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def test_location_detection(msg):
    clean_msg = msg.lower()
    
    # Mocking AM_MAP
    AM_MAP = {
        'ቦሌ': 'bole', 'ቂርቆስ': 'kirkos'
    }
    
    # Mocking combined_locs
    combined_locs = ['bole', 'kirkos', 'yeka', 'addis']
    
    detected_locations = []
    taken_indices = set()
    
    # 1. Check Amharic Variations First
    for am, en in AM_MAP.items():
        if en in combined_locs or en == 'addis':
            # Use finditer to find all occurrences
            for match in re.finditer(re.escape(am), clean_msg):
                start, end = match.span()
                if not any(i in taken_indices for i in range(start, end)):
                    detected_locations.append((am, en))
                    for i in range(start, end): taken_indices.add(i)
                    
    # Standard check for English
    for s in combined_locs:
        for match in re.finditer(re.escape(s), clean_msg):
            start, end = match.span()
            if not any(i in taken_indices for i in range(start, end)):
                detected_locations.append((s, s))
                for i in range(start, end): taken_indices.add(i)

    # Normalize
    unique_locations = {}
    for match_str, search_val in detected_locations:
        if search_val not in unique_locations:
            unique_locations[search_val] = match_str
            
    return unique_locations

query = "በቦሌ እና በቂርቆስ መካከል"
results = test_location_detection(query)
print(f"Query: {query}")
print(f"Detected: {results}")

if 'bole' in results and 'kirkos' in results:
    print("SUCCESS: Both locations detected.")
else:
    print("FAILURE: Missing locations.")
