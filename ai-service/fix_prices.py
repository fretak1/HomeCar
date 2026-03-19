import psycopg2
import psycopg2.extras
import pandas as pd
from app.database import get_connection

def standardize_prices():
    conn = get_connection()
    cursor = conn.cursor()

    print("Fetching all properties...")
    df = pd.read_sql_query("""
        SELECT p.id, p."propertyType", p."listingType", p."assetType", p.area, p.bedrooms, p.bathrooms, l.village 
        FROM "Property" p
        JOIN "Location" l ON p."locationId" = l.id
        WHERE p."assetType" = 'HOME'
    """, conn)

    print(f"Applying logical math to {len(df)} homes...")

    updates = []
    for index, row in df.iterrows():
        l_type = str(row['listingType'])
        p_type = str(row['propertyType'])
        area = float(row['area']) if row['area'] else 100
        beds = int(row['bedrooms']) if row['bedrooms'] else 1
        baths = int(row['bathrooms']) if row['bathrooms'] else 1

        is_rent = "RENT" in l_type

        # Base SQM prices
        base_sqm_buy = {"apartment": 60000, "villa": 85000, "compound": 90000, "studio": 55000, "condominium": 45000, "building": 120000}
        base_sqm_rent = {"apartment": 110, "villa": 150, "compound": 180, "studio": 90, "condominium": 85, "building": 200}

        sqm_price = base_sqm_rent.get(p_type, 100) if is_rent else base_sqm_buy.get(p_type, 60000)

        # Baseline Price based purely on Area
        base_price = sqm_price * area

        import random
        # Inject noise into bathrooms so the AI can learn it as a meaningful feature
        # New randomized bathroom count: 1 to beds + 1 (min 1, max 6)
        new_baths = random.randint(1, min(6, beds + 1))
        
        # Add logical premiums: 
        # A bedroom adds a steady 15% value (not an exponential jump)
        bed_premium = base_price * (0.15 * beds)
        # A bathroom adds 5%
        bath_premium = base_price * (0.05 * baths)
        
        # We remove hardcoded village premiums to let the AI learn purely from 
        # listing distributions in the future.
        final_price = base_price + bed_premium + bath_premium

        # Add a tiny bit of random market variation (+- 5%) so it's not totally robotic
        variation = random.uniform(0.95, 1.05)
        final_price = final_price * variation
        
        # Update price in the DB
        updates.append((int(final_price), row['id']))
        
    print(f"Executing batch update of {len(updates)} records...")
    psycopg2.extras.execute_batch(
        cursor,
        'UPDATE "Property" SET price = %s WHERE id = %s',
        updates,
        page_size=100
    )

    conn.commit()
    cursor.close()
    conn.close()
    print("Database prices successfully standardized to logical real estate curves!")

if __name__ == "__main__":
    standardize_prices()
