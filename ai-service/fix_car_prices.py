import psycopg2
import psycopg2.extras
import pandas as pd
from app.database import get_connection

def standardize_car_prices():
    conn = get_connection()
    cursor = conn.cursor()

    print("Fetching all cars...")
    df = pd.read_sql_query('SELECT id, brand, model, year, "listingType", "transmission", "fuelType" FROM "Property" WHERE "assetType" = \'CAR\'', conn)

    print(f"Applying logical depreciation to {len(df)} cars...")

    brand_baselines = {
        "Toyota": {"Corolla": 3000000, "Hilux": 6000000, "Land Cruiser": 15000000, "Vitz": 1500000, "Unknown": 2000000},
        "Hyundai": {"Tucson": 4500000, "Elantra": 3000000, "Accent": 2000000, "Unknown": 2500000},
        "Kia": {"Sportage": 4000000, "Unknown": 3000000},
        "Nissan": {"Patrol": 12000000, "Sunny": 2200000, "Unknown": 4000000},
        "Suzuki": {"Alto": 1500000, "Unknown": 1500000},
        "Default": 2000000
    }

    updates = []
    current_year = 2025

    for index, row in df.iterrows():
        brand = str(row['brand'] if row['brand'] else "Default").strip().title()
        model = str(row['model'] if row['model'] else "Unknown").strip().title()
        year = int(row['year']) if row['year'] else 2015
        
        l_type = str(row['listingType']).upper()
        fuel = str(row['fuelType']).lower() if row['fuelType'] else "petrol"
        trans = str(row['transmission']).lower() if row['transmission'] else "manual"

        # Get Baseline
        brand_data = brand_baselines.get(brand, brand_baselines["Default"])
        if isinstance(brand_data, dict):
            base_price = brand_data.get(model, brand_data.get("Unknown", 2000000))
        else:
            base_price = brand_data

        page_age = current_year - year
        depreciation_factor = (0.93 ** max(0, page_age))
        market_price = base_price * depreciation_factor

        if "electric" in fuel or "hybrid" in fuel:
            market_price *= 1.30
        if "automatic" in trans:
            market_price *= 1.10
        if "RENT" in l_type:
            market_price = market_price / 100 
        
        import random
        market_price *= random.uniform(0.99, 1.01)

        updates.append((int(market_price), fuel, trans, row['id']))
        
    print(f"Executing batch update of {len(updates)} records...")
    psycopg2.extras.execute_batch(
        cursor,
        'UPDATE "Property" SET price = %s, "fuelType" = %s, transmission = %s WHERE id = %s',
        updates,
        page_size=200
    )

    conn.commit()
    cursor.close()
    conn.close()
    print("Car prices successfully standardized to logical depreciation curves!")

if __name__ == "__main__":
    standardize_car_prices()
