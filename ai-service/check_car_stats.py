from app.database import query_to_dataframe
import pandas as pd

print("Checking Car Price Distribution by Year...")
query = """
SELECT year, price FROM "Property" 
WHERE "assetType" = 'CAR' 
ORDER BY year ASC
"""
df = query_to_dataframe(query)
if df.empty:
    print("No cars found.")
else:
    stats = df.groupby('year')['price'].agg(['mean', 'min', 'max', 'count'])
    print(stats)
