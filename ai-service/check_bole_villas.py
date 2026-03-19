import sys
import os

sys.path.append(r'c:\Users\Fretak\Desktop\HomeCar\ai-service')
from app.database import query_to_dataframe

print("\n--- BOLE VILLAS IN DB (ALL DETAILS) ---")
q = """
    SELECT p.id, p."propertyType", l.city, l.subcity, l.village
    FROM "Property" p
    LEFT JOIN "Location" l ON p."locationId" = l.id
    WHERE p."assetType" = 'HOME'
    AND p."propertyType" ILIKE 'villa'
    AND (l.subcity ILIKE 'Bole' OR l.city ILIKE 'Addis Ababa' OR l.city ILIKE 'Addis Abeba')
"""
print(query_to_dataframe(q).to_string())
