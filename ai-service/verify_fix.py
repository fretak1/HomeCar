import sys
import os

sys.path.append(r'c:\Users\Fretak\Desktop\HomeCar\ai-service')
from app.database import query_to_dataframe

# User's exact failing test case:
city = "Addis Abeba"
subcity = "Bole"
p_type = "villa"
bedrooms = 3

# My new logic simulation:
if "addis" in city.lower():
    city_match = "Addis %"
else:
    city_match = city

query = """
    SELECT AVG(price) as avg_price, COUNT(*) as count
    FROM "Property" p
    LEFT JOIN "Location" l ON p."locationId" = l.id
    WHERE p."assetType" = 'HOME'
    AND p."propertyType" ILIKE %s
    AND p.bedrooms = %s
    AND (l.subcity ILIKE %s OR l.city ILIKE %s)
    AND p.status = 'AVAILABLE'
"""
params = (p_type, bedrooms, subcity, city_match)
df = query_to_dataframe(query, params)

print("\n--- FINAL VERIFICATION TEST ---")
print(f"Inputs: {city}, {subcity}, {p_type}, {bedrooms}")
print(df.to_string())
if not df.empty and df.iloc[0]['count'] >= 3:
    print(f"\nSUCCESS: AI Estimate would be ETB {round(df.iloc[0]['avg_price'], 2):,}")
else:
    print("\nFAILURE: Still not enough data.")
