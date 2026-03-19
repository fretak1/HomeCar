from app.database import query_to_dataframe
q = "SELECT brand, model, year, price FROM \"Property\" WHERE brand = 'Toyota'"
print(query_to_dataframe(q).to_string())
