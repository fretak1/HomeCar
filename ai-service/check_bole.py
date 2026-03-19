from app.database import query_to_dataframe
q = 'SELECT "propertyType", bedrooms, COUNT(*) FROM "Property" p JOIN "Location" l ON p."locationId" = l.id WHERE l.subcity = \'Bole\' GROUP BY "propertyType", bedrooms'
print(query_to_dataframe(q).to_string())
