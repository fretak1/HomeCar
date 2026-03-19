from app.database import query_to_dataframe
import pandas as pd

query = """
SELECT p.id, p.title, p.price, p.year, l.city, p."createdAt" 
FROM "Property" p 
JOIN "Location" l ON p."locationId" = l.id 
WHERE p."assetType" = 'CAR' 
  AND p.brand = 'Hyundai' 
  AND p.model = 'Tucson' 
  AND l.city = 'Addis Ababa'
ORDER BY p.year DESC
"""
df = query_to_dataframe(query)
if df.empty:
    print("No Hyundai Tucsons found in Addis Ababa database.")
else:
    print(df.to_string(index=False))
