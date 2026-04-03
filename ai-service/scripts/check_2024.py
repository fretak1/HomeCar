from app.database import query_to_dataframe

query = """
SELECT p.id, p.year, p.transmission, p."fuelType", l.city
FROM "Property" p
JOIN "Location" l ON p."locationId" = l.id
WHERE p."assetType" = 'CAR' 
AND p.brand = 'Suzuki' 
AND p.model = 'Alto' 
AND p.year = 2024 
"""

df = query_to_dataframe(query)
print("ALL 2024 Altos in DB:")
print(df.to_string())
