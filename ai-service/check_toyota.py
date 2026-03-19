from app.database import query_to_dataframe
q = 'SELECT l.subcity, COUNT(*) FROM "Property" p JOIN "Location" l ON p."locationId" = l.id WHERE p."assetType" = \'CAR\' AND p.brand = \'Toyota\' GROUP BY l.subcity'
print(query_to_dataframe(q).to_string())
