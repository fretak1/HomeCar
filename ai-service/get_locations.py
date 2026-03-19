from app.database import query_to_dataframe
df = query_to_dataframe('SELECT DISTINCT city, subcity, village FROM "Location" LIMIT 10')
print(df.to_string())
