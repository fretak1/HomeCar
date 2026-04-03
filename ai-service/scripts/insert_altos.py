import uuid
import psycopg2
from app.database import get_db

conn = get_db()
cursor = conn.cursor()

addis_location_id_query = "SELECT id FROM \"Location\" WHERE city = 'Addis Ababa' LIMIT 1"

insert_query = """
INSERT INTO "Property" (id, "createdAt", "updatedAt", "ownerId", title, description, price, "assetType", "listingType", "propertyStatus", "isVerified", "locationId", "bedrooms", "bathrooms", "area", "propertyType", brand, model, year, mileage, transmission, "fuelType", condition, views)
VALUES (%s, NOW(), NOW(), %s, '2010 Suzuki Alto (Manual)', 'Great Condition Alto', 905000, 'CAR', ARRAY['BUY']::"ListingType"[], 'AVAILABLE', true, %s, null, null, null, null, 'Suzuki', 'Alto', 2010, 50000, 'Manual', 'Petrol', 'Used', 0)
"""

owner_query = "SELECT id FROM \"User\" WHERE role = 'ADMIN' OR role = 'USER' LIMIT 1"

cursor.execute(addis_location_id_query)
loc_id = cursor.fetchone()[0]

cursor.execute(owner_query)
owner_id = cursor.fetchone()[0]

for _ in range(3):
    cursor.execute(insert_query, (str(uuid.uuid4()).replace('-','')[:25], owner_id, loc_id))

conn.commit()
cursor.close()
conn.close()

print("Injected 3 perfect MATCH 2010 Manual Altos into Addis Ababa!")
