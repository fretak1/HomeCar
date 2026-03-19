from app.database import query_to_dataframe

print("--- TOP CARS IN DB ---")
print(query_to_dataframe("""
    SELECT brand, model, year, count(*) 
    FROM "Property" 
    WHERE "assetType" = 'CAR' 
    GROUP BY brand, model, year 
    HAVING count(*) >= 1
    LIMIT 5
"""))

print("\n--- TOP HOUSES IN DB ---")
print(query_to_dataframe("""
    SELECT "propertyType", bedrooms, count(*) 
    FROM "Property" 
    WHERE "assetType" = 'HOME' 
    GROUP BY "propertyType", bedrooms 
    HAVING count(*) >= 3
    LIMIT 5
"""))
