from app.database import query_to_dataframe

print("--- HOUSE PRICES IN DB ---")
df = query_to_dataframe('SELECT price, "propertyType" FROM "Property" WHERE "assetType" = \'HOME\'')
if not df.empty:
    print(df.groupby('propertyType')['price'].describe())
else:
    print("No house data found.")

print("\n--- CAR PRICES IN DB ---")
df_cars = query_to_dataframe('SELECT price, brand FROM "Property" WHERE "assetType" = \'CAR\'')
if not df_cars.empty:
    print(df_cars.groupby('brand')['price'].describe())
else:
    print("No car data found.")
