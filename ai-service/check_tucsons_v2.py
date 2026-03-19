from app.database import query_to_dataframe
import pandas as pd

query = """
SELECT p.title, p.price, p.year, p."fuelType", p.transmission, l.city 
FROM "Property" p 
JOIN "Location" l ON p."locationId" = l.id 
WHERE p."assetType" = 'CAR' 
  AND p.brand = 'Hyundai' 
  AND p.model = 'Tucson' 
  AND p."listingType"::text LIKE '%BUY%' 
ORDER BY p.year DESC
LIMIT 20
"""
df = query_to_dataframe(query)
if df.empty:
    print("No similar cars found in database.")
else:
    print(df.to_string(index=False))
