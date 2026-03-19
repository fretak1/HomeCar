from app.database import query_to_dataframe
import pandas as pd

ids = ['cmmut4vuz00eow6i4tehoug7m', 'cmmut502200fdw6i4jwfwtid0', 'cmmut4z7x00f8w6i4941kxyvu']
query = f"""
SELECT p.id, p.year, p."fuelType", p.transmission, p.mileage, l.city, l.subcity, p.price 
FROM "Property" p 
JOIN "Location" l ON p."locationId" = l.id 
WHERE p.id IN ({str(ids)[1:-1]})
"""
try:
    df = query_to_dataframe(query)
    if df.empty:
        print("No detailed car records found.")
    else:
        # Rename for cleaner table
        df.columns = ['ID', 'Year', 'Fuel', 'Trans', 'Mileage', 'City', 'Subcity', 'Price (ETB)']
        print(df.to_string(index=False))
except Exception as e:
    print(f"FAILED TO FETCH DATA: {e}")
