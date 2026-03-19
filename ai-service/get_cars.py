from app.database import query_to_dataframe
df = query_to_dataframe('SELECT DISTINCT brand, model FROM "Property" WHERE "assetType" = \'CAR\' LIMIT 10')
print(df.to_string())
