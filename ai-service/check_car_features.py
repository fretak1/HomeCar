from app.database import query_to_dataframe
import pandas as pd

print("Checking Car Fuel & Transmission Counts...")
query = """
SELECT "fuelType", transmission, COUNT(*) 
FROM "Property" 
WHERE "assetType" = 'CAR' 
GROUP BY "fuelType", transmission
"""
df = query_to_dataframe(query)
if df.empty:
    print("No cars found.")
else:
    print(df)
