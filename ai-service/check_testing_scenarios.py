import pandas as pd
from app.database import query_to_dataframe
from app.services.prediction_service import prediction_service

print("=== SCENARIO 1: LUXURY VILLA FOR SALE (ADDIS ABABA) ===")
q1 = """
SELECT AVG(price) as avg_price, COUNT(*) as count 
FROM "Property" 
WHERE "propertyType" = 'villa' AND "listingType"::text LIKE '%BUY%' AND area BETWEEN 400 AND 600
"""
df1 = query_to_dataframe(q1)
print(df1.to_string())

test1 = {
    "region": "Addis Ababa", "city": "Addis Ababa", "subcity": "Bole",
    "propertyType": "villa", "listingType": "BUY",
    "bedrooms": 5, "bathrooms": 4, "area": 500
}
res1 = prediction_service.predict_house(test1)
print("AI Predicts:", res1)


print("\n=== SCENARIO 2: BUDGET CONDOMINIUM RENT ===")
q2 = """
SELECT AVG(price) as avg_price, COUNT(*) as count 
FROM "Property" 
WHERE "propertyType" = 'condominium' AND "listingType"::text LIKE '%RENT%' AND area < 100
"""
df2 = query_to_dataframe(q2)
print(df2.to_string())

test2 = {
    "region": "Afar", "city": "Semera", "subcity": "Semera Center",
    "propertyType": "condominium", "listingType": "RENT",
    "bedrooms": 1, "bathrooms": 1, "area": 60
}
res2 = prediction_service.predict_house(test2)
print("AI Predicts:", res2)


print("\n=== SCENARIO 3: CAR FOR SALE ===")
q3 = """
SELECT AVG(price) as avg_price, COUNT(*) as count 
FROM "Property" 
WHERE "assetType" = 'CAR' AND brand = 'Hyundai' AND model = 'Tucson' AND "listingType"::text LIKE '%BUY%'
"""
df3 = query_to_dataframe(q3)
print(df3.to_string())

test3 = {
    "brand": "Hyundai", "model": "Tucson", "year": 2021,
    "fuelType": "Petrol", "transmission": "Automatic",
    "listingType": "BUY", "city": "Addis Ababa"
}
res3 = prediction_service.predict_car(test3)
print("AI Predicts:", res3)
