from app.database import query_to_dataframe
import pandas as pd

query = """
SELECT price, bedrooms, bathrooms, area, p."listingType", l.region, l.city, l.subcity, l.village 
FROM "Property" p 
JOIN "Location" l ON p."locationId" = l.id 
WHERE p."propertyType" = 'apartment' 
  AND p."listingType"::text LIKE '%RENT%' 
  AND l.subcity = 'Bole'
"""
df = query_to_dataframe(query)
print("--- BOLE APARTMENTS FOR RENT ---")
print(df.describe())
print("\n--- ALL RECORDS ---")
print(df.to_string())
