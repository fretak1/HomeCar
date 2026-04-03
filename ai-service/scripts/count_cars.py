from app.database import query_to_dataframe

query = """
SELECT COUNT(*) as exact_matches
FROM "Property" p
JOIN "Location" l ON p."locationId" = l.id
WHERE p."assetType" = 'CAR' 
AND p.brand = 'Suzuki' 
AND p.model = 'Alto' 
AND p.year = 2010 
AND p.transmission = 'Manual'
AND p."fuelType" = 'Petrol'
AND l.city = 'Addis Ababa'
"""

df = query_to_dataframe(query)
print(f"Number of exact matching cars in DB: {df.iloc[0]['exact_matches']}")
