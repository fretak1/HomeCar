import sys
import os

sys.path.append(r'c:\Users\Fretak\Desktop\HomeCar\ai-service')
from app.database import query_to_dataframe

print("\n--- DISTINCT PROPERTY TYPES ---")
print(query_to_dataframe('SELECT DISTINCT "propertyType" FROM "Property"'))

print("\n--- DISTINCT CITIES ---")
print(query_to_dataframe('SELECT DISTINCT city FROM "Location"'))

print("\n--- BOLE PROPERTIES COUNT (Strict Case) ---")
q = """
    SELECT COUNT(*) 
    FROM "Property" p 
    LEFT JOIN "Location" l ON p."locationId" = l.id 
    WHERE p."propertyType" = 'villa' 
    AND (l.city = 'Addis Abeba' OR l.subcity = 'Bole')
"""
print("villa (lowercase):", query_to_dataframe(q).iloc[0][0])

q2 = """
    SELECT COUNT(*) 
    FROM "Property" p 
    LEFT JOIN "Location" l ON p."locationId" = l.id 
    WHERE p."propertyType" = 'Villa' 
    AND (l.city = 'Addis Ababa' OR l.subcity = 'Bole')
"""
print("Villa (Capitalized):", query_to_dataframe(q2).iloc[0][0])
