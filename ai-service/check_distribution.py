from app.database import query_to_dataframe

print("--- HOUSE DISTRIBUTION BY SUBCITY ---")
q_house = """
SELECT l.subcity, COUNT(*) as count
FROM "Property" p
JOIN "Location" l ON p."locationId" = l.id
WHERE p."assetType" = 'HOME'
GROUP BY l.subcity
ORDER BY count DESC
"""
print(query_to_dataframe(q_house).to_string())

print("\n--- CAR DISTRIBUTION BY SUBCITY ---")
q_car = """
SELECT l.subcity, COUNT(*) as count
FROM "Property" p
JOIN "Location" l ON p."locationId" = l.id
WHERE p."assetType" = 'CAR'
GROUP BY l.subcity
ORDER BY count DESC
"""
print(query_to_dataframe(q_car).to_string())
